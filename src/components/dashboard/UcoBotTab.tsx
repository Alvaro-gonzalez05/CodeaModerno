'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, X, MessageCircle, Plus, MessagesSquare, Trash2, Paperclip, Minimize2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[];  // base64 — solo en memoria, se guarda en IndexedDB
  reference?: { id: string; prompt: string; index?: number };
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
}

function formatMarkdown(text: string): string {
  let html = text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-white/5 border border-white/10 rounded-xl p-4 my-2 overflow-x-auto text-xs font-mono text-white/80"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[hsl(76,85%,67%)] text-xs font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/!\[([^\]]*)\]\((data:[^)]+)\)/g, '<div class="my-3"><img src="$2" alt="$1" class="rounded-xl max-w-full border border-white/10 shadow-lg" /><p class="text-[9px] text-white/30 mt-1 uppercase tracking-widest">$1</p></div>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="my-3"><img src="$2" alt="$1" class="rounded-xl max-w-full border border-white/10" /><p class="text-[9px] text-white/30 mt-1">$1</p></div>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-white mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-white mt-3 mb-1">$1</h2>')
    .replace(/^---$/gm, '<hr class="border-white/10 my-3" />')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc list-outside text-white/70 text-sm leading-relaxed">$1</li>')
    .replace(/\|([^|]+)\|/g, (match) => {
      const cells = match.split('|').filter(Boolean).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) return '';
      return '<tr>' + cells.map(c => `<td class="px-3 py-1.5 border border-white/10 text-sm">${c}</td>`).join('') + '</tr>';
    })
    .replace(/\n/g, '<br />');

  html = html.replace(/((?:<li[^>]*>.*?<\/li><br \/>)+)/g, (match) => {
    return '<ul class="my-2 space-y-0.5">' + match.replace(/<br \/>/g, '') + '</ul>';
  });
  html = html.replace(/((?:<tr>.*?<\/tr>(?:<br \/>)?)+)/g, (match) => {
    return '<table class="border-collapse border border-white/10 rounded-lg my-2 w-full">' + match.replace(/<br \/>/g, '') + '</table>';
  });

  return html;
}

export default function UcoBotTab({ projectId, projectName }: { projectId: string; projectName: string }) {
  const CONVS_KEY = `ucobot-convs-${projectId}`;
  const ACTIVE_KEY = `ucobot-active-${projectId}`;

  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const getWelcomeMessage = (): Message => ({
    id: 'welcome',
    role: 'assistant',
    content: `¡Hola! 👋 Soy **UcoBot**, tu asistente para el proyecto **${projectName}**.

Puedo ayudarte con todo lo relacionado a este proyecto:
- ✅ **Tareas** — crear, asignar, cambiar estado o eliminar
- 🔒 **Vault** — consultar o agregar items a la bóveda
- 💰 **Facturación** — ver y actualizar precios y pagos
- 🔧 **Servicios** — ver servicios vinculados
- 👥 **Equipo** — consultar empleados y asignaciones
- 📱 **Instagram & Meta Ads** — analizar performance, gestionar campañas

Preguntame lo que necesites sobre este proyecto.`,
    timestamp: new Date(),
  });

  const newConversation = (): Conversation => ({
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: 'Nueva conversación',
    messages: [getWelcomeMessage()],
    updatedAt: new Date(),
  });

  const loadInitialState = (): { convs: Conversation[]; activeId: string } => {
    if (typeof window === 'undefined') {
      const c = newConversation();
      return { convs: [c], activeId: c.id };
    }
    try {
      const saved = localStorage.getItem(CONVS_KEY);
      const activeSaved = localStorage.getItem(ACTIVE_KEY);
      if (saved) {
        const parsed: Conversation[] = JSON.parse(saved).map((c: any) => ({
          ...c,
          updatedAt: new Date(c.updatedAt),
          messages: c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
        }));
        if (parsed.length > 0) {
          const activeId = activeSaved && parsed.find(c => c.id === activeSaved) ? activeSaved : parsed[0].id;
          return { convs: parsed, activeId };
        }
      }
    } catch {}
    try {
      const oldKey = `ucobot-chat-${projectId}`;
      const oldSaved = localStorage.getItem(oldKey);
      if (oldSaved) {
        const oldMessages: Message[] = JSON.parse(oldSaved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
        const firstUser = oldMessages.find(m => m.role === 'user');
        const title = firstUser ? firstUser.content.slice(0, 40) + (firstUser.content.length > 40 ? '…' : '') : 'Chat anterior';
        const c: Conversation = { id: `conv-${Date.now()}`, title, messages: oldMessages, updatedAt: new Date() };
        localStorage.removeItem(oldKey);
        return { convs: [c], activeId: c.id };
      }
    } catch {}
    const c = newConversation();
    return { convs: [c], activeId: c.id };
  };

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  const [input, setInput] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [editingReference, setEditingReference] = useState<{ id: string; prompt: string; index?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [idbImages, setIdbImages] = useState<Record<string, string[]>>({});
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [visibleStepCount, setVisibleStepCount] = useState(0);
  const [userName, setUserName] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar conversaciones desde localStorage solo en el cliente (evita hydration mismatch)
  useEffect(() => {
    const { convs, activeId: aid } = loadInitialState();
    setConversations(convs);
    setActiveId(aid);
    setIsInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchUserName = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      const name = profile?.full_name || user.email?.split('@')[0] || 'Usuario';
      setUserName(name.split(' ')[0]);
    };
    fetchUserName();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setAttachedImages(prev => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const activeConv = conversations.find(c => c.id === activeId) || conversations[0];
  const messages = activeConv?.messages || [];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isInitialized) return;
    // Strip base64 images — persisten en IndexedDB por message ID
    const safeConvs = conversations.map(conv => ({
      ...conv,
      messages: conv.messages.map(msg => {
        if (!msg.images) return msg;
        const { images, ...safeMsg } = msg;
        return safeMsg;
      })
    }));
    try {
      localStorage.setItem(CONVS_KEY, JSON.stringify(safeConvs));
    } catch {
      try {
        const minimalConvs = [safeConvs.find(c => c.id === activeId) || safeConvs[0]];
        localStorage.setItem(CONVS_KEY, JSON.stringify(minimalConvs));
      } catch {}
    }
  }, [isInitialized, conversations, CONVS_KEY, activeId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId, ACTIVE_KEY]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadAllIDBImages = async () => {
      const results: Record<string, string[]> = {};
      for (const conv of conversations) {
        for (const msg of conv.messages) {
          if (msg.role === 'assistant' && !msg.images) {
            const imgs = await loadImagesFromIDB(msg.id);
            if (imgs) results[msg.id] = imgs;
          }
        }
      }
      setIdbImages(results);
    };
    loadAllIDBImages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.map(c => c.id).join(',')]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  useEffect(() => {
    const handleEdit = (e: any) => {
      const item = e.detail?.item;
      if (item) {
        if (!isOpen) setIsOpen(true);
        const originalPromptMatch = item.content.match(/\*\*Prompt Original:\*\*\s*(.+?)(\n|$)/i);
        const promptRef = originalPromptMatch ? originalPromptMatch[1].trim() : item.title;
        const index = e.detail?.index;
        setEditingReference({ id: item.id, prompt: promptRef, index });
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    window.addEventListener('ucobot:edit', handleEdit);
    return () => window.removeEventListener('ucobot:edit', handleEdit);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 350);
  }, [isOpen]);

  const updateActiveConv = (updater: (c: Conversation) => Conversation) => {
    setConversations(prev => prev.map(c => (c.id === activeId ? updater(c) : c)));
  };

  const isImageRequest = (text: string) => {
    const t = text.toLowerCase();
    return t.includes('imagen') || t.includes('foto') || t.includes('diseño') || t.includes('visual') || t.includes('generar') || t.includes('genera') || t.includes('crea una imagen');
  };

  const getThinkingSteps = (text: string): string[] => {
    const t = text.toLowerCase();
    if (isImageRequest(text)) {
      return ['Interpretando la solicitud...', 'Diseñando composición visual...', 'Generando imagen con IA...', 'Aplicando detalles y estilos...', 'NANO_BANANA'];
    }
    if (t.includes('instagram') || t.includes('redes') || t.includes('métrica') || t.includes('performance')) {
      return ['Consultando datos de Instagram...', 'Analizando métricas de alcance...', 'Calculando engagement...', 'Generando recomendaciones...'];
    }
    if (t.includes('tarea') || t.includes('task') || t.includes('pendiente')) {
      return ['Consultando tareas del proyecto...', 'Organizando por prioridad...', 'Preparando resumen...'];
    }
    if (t.includes('vault') || t.includes('baúl') || t.includes('archivo') || t.includes('acceso')) {
      return ['Accediendo al vault del proyecto...', 'Leyendo elementos guardados...', 'Organizando información...'];
    }
    if (t.includes('pago') || t.includes('precio') || t.includes('finanz') || t.includes('factur')) {
      return ['Consultando datos financieros...', 'Calculando balances...', 'Preparando reporte...'];
    }
    if (t.includes('estrategia') || t.includes('contenido') || t.includes('plan')) {
      return ['Analizando el contexto del proyecto...', 'Investigando mejores prácticas...', 'Estructurando la estrategia...', 'Redactando el plan...'];
    }
    return ['Procesando tu solicitud...', 'Consultando datos del proyecto...', 'Analizando información...', 'Preparando respuesta...'];
  };

  useEffect(() => {
    if (!isLoading) {
      setVisibleStepCount(0);
      setThinkingSteps([]);
      return;
    }
    let count = 0;
    const total = thinkingSteps.length;
    const interval = setInterval(() => {
      count += 1;
      setVisibleStepCount(count);
      if (count >= total) clearInterval(interval);
    }, 600);
    return () => clearInterval(interval);
  }, [isLoading, thinkingSteps.length]);

  const IDB_NAME = `ucobot-images-${projectId}`;
  const IDB_STORE = 'images';

  const openIDB = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  const saveImagesToIDB = async (messageId: string, images: string[]) => {
    try {
      const db = await openIDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(images, messageId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {}
  };

  const loadImagesFromIDB = async (messageId: string): Promise<string[] | null> => {
    try {
      const db = await openIDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(messageId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch { return null; }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
      reference: editingReference ? { id: editingReference.id, prompt: editingReference.prompt, index: editingReference.index } : undefined,
      images: attachedImages.length > 0 ? attachedImages : undefined,
    };

    const isFirstUserMsg = messages.filter(m => m.role === 'user').length === 0;
    const newTitle = isFirstUserMsg ? trimmed.slice(0, 40) + (trimmed.length > 40 ? '…' : '') : activeConv.title;

    updateActiveConv(c => ({
      ...c,
      title: newTitle,
      messages: [...c.messages, userMessage],
      updatedAt: new Date(),
    }));
    setInput('');
    setAttachedImages([]);
    setEditingReference(null);
    const steps = (editingReference || isImageRequest(trimmed))
      ? ['Interpretando la solicitud...', 'Diseñando composición visual...', 'Generando imagen con IA...', 'Aplicando detalles y estilos...', 'NANO_BANANA']
      : getThinkingSteps(trimmed);
    setThinkingSteps(steps);
    setVisibleStepCount(1);
    setIsLoading(true);

    try {
      const apiMessages = [...messages.filter(m => m.id !== 'welcome'), userMessage].map(m => {
        let content = m.content;
        if (m.reference) {
          const slideInfo = m.reference.index ? ` (slide ${m.reference.index})` : '';
          content = `[@imagen_${m.reference.id}${slideInfo}]\nQuiero editar ÚNICAMENTE el slide${slideInfo} de esa imagen. El prompt original era:\n"${m.reference.prompt}"\n\nMis cambios: ${content}\n\nREGLA CRÍTICA: Genera SOLO UNA imagen editando ese slide específico. NO generes múltiples slides ni un carrusel nuevo.`;
        }
        return { role: m.role, content, images: m.images };
      });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, projectId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error del servidor');

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        images: data.generatedImages?.length > 0 ? data.generatedImages : undefined,
      };

      if (data.generatedImages?.length > 0) {
        saveImagesToIDB(botMessage.id, data.generatedImages);
      }

      updateActiveConv(c => ({ ...c, messages: [...c.messages, botMessage], updatedAt: new Date() }));
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Error: ${error.message}. Intentá de nuevo.`,
        timestamp: new Date(),
      };
      updateActiveConv(c => ({ ...c, messages: [...c.messages, errorMessage], updatedAt: new Date() }));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const startNewConversation = () => {
    const c = newConversation();
    setConversations(prev => [c, ...prev]);
    setActiveId(c.id);
    setShowHistory(false);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        const c = newConversation();
        setActiveId(c.id);
        return [c];
      }
      if (id === activeId) setActiveId(filtered[0].id);
      return filtered;
    });
  };

  const switchConversation = (id: string) => {
    setActiveId(id);
    setShowHistory(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const hasUserMessages = messages.some(m => m.role === 'user');

  const categories = [
    {
      emoji: '📊',
      label: 'Analizar Instagram',
      desc: 'Métricas, alcance y performance',
      prompt: 'Analiza el rendimiento de Instagram de este proyecto. Dame las métricas más importantes y recomendaciones para mejorar.',
    },
    {
      emoji: '🎯',
      label: 'Estrategia de contenido',
      desc: 'Planificación y calendarios',
      prompt: 'Ayúdame a crear una estrategia de contenido para este proyecto. Quiero un plan para el próximo mes.',
    },
    {
      emoji: '🎨',
      label: 'Generar imagen',
      desc: 'Visuales para redes sociales',
      prompt: 'Genera una imagen profesional para este proyecto. La imagen debe transmitir: ',
    },
    {
      emoji: '✅',
      label: 'Gestionar tareas',
      desc: 'Ver, crear y asignar tareas',
      prompt: '¿Cuáles son las tareas pendientes de este proyecto? Dame un resumen por prioridad.',
    },
    {
      emoji: '💰',
      label: 'Ver finanzas',
      desc: 'Pagos y estado de facturación',
      prompt: '¿Cuál es el estado financiero de este proyecto? Muéstrame el precio total, lo pagado y lo pendiente.',
    },
    {
      emoji: '🔒',
      label: 'Explorar el Baúl',
      desc: 'Archivos, accesos y notas',
      prompt: '¿Qué hay guardado en el vault de este proyecto? Dame un resumen de los elementos más importantes.',
    },
  ];

  const sortedConvs = [...conversations].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return (
    <>
      {/* ── BUBBLE ─────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(76,85%,67%)] to-[hsl(76,85%,47%)] flex items-center justify-center shadow-xl shadow-[hsl(76,85%,67%)]/30 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100 hover:scale-110'
        }`}
      >
        <MessageCircle size={24} className="text-black" />
        <span className="absolute inset-0 rounded-full bg-[hsl(76,85%,67%)]/40 animate-ping opacity-40" />
      </button>

      {/* ── FULL-SCREEN CHAT ────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[95] flex bg-[#080808] transition-all duration-350 ease-[cubic-bezier(0.34,1.2,0.64,1)] origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* History sidebar */}
        <div
          className={`flex-shrink-0 h-full bg-[#0f0f0f] border-r border-white/10 flex flex-col transition-all duration-300 ease-out overflow-hidden ${
            showHistory ? 'w-72' : 'w-0'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Conversaciones</span>
            <button
              onClick={startNewConversation}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[hsl(76,85%,67%)]/10 hover:bg-[hsl(76,85%,67%)]/20 border border-[hsl(76,85%,67%)]/30 text-[10px] uppercase tracking-widest font-bold text-[hsl(76,85%,67%)] transition-colors whitespace-nowrap"
            >
              <Plus size={10} /> Nuevo
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sortedConvs.map(conv => (
              <div
                key={conv.id}
                onClick={() => switchConversation(conv.id)}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  conv.id === activeId
                    ? 'bg-[hsl(76,85%,67%)]/10 border border-[hsl(76,85%,67%)]/30'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${conv.id === activeId ? 'text-white' : 'text-white/60'}`}>
                    {conv.title}
                  </p>
                  <p className="text-[9px] text-white/25 mt-0.5 uppercase tracking-widest">
                    {conv.updatedAt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} · {conv.messages.filter(m => m.id !== 'welcome').length} msgs
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all flex-shrink-0"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0 h-full">

          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex-shrink-0 bg-[#080808]">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setShowHistory(v => !v)}
                className={`p-2 rounded-xl transition-colors flex-shrink-0 ${showHistory ? 'bg-[hsl(76,85%,67%)]/10 text-[hsl(76,85%,67%)]' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
                title="Historial"
              >
                <MessagesSquare size={18} />
              </button>
              <div className="w-px h-6 bg-white/10 flex-shrink-0" />
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(76,85%,67%)] to-[hsl(76,85%,47%)] flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-black" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black tracking-tighter uppercase text-white leading-none">UCOBOT</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold truncate">{projectName}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={startNewConversation}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                title="Nuevo chat"
              >
                <Plus size={14} /> <span className="hidden sm:inline">Nuevo chat</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white transition-colors"
                title="Minimizar"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* Welcome screen OR Messages */}
          {!hasUserMessages ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="max-w-3xl w-full mx-auto">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(76,85%,67%)] to-[hsl(76,85%,47%)] flex items-center justify-center shadow-2xl shadow-[hsl(76,85%,67%)]/20">
                    <Bot size={30} className="text-black" />
                  </div>
                </div>

                {/* Greeting */}
                <div className="text-center mb-10">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-light text-white mb-3 tracking-tight">
                    {greeting}{userName ? (
                      <>, <span className="font-semibold">{userName}</span></>
                    ) : null}
                  </h1>
                  <p className="text-white/35 text-base">
                    ¿En qué puedo ayudarte con <span className="text-white/60 font-medium">{projectName}</span>?
                  </p>
                </div>

                {/* Category cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {categories.map((cat, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(cat.prompt);
                        inputRef.current?.focus();
                      }}
                      className="group flex flex-col items-start gap-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[hsl(76,85%,67%)]/40 hover:bg-white/[0.07] transition-all text-left"
                    >
                      <p className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors leading-tight">
                        {cat.label}
                      </p>
                      <p className="text-[10px] text-white/25 leading-snug">{cat.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0 py-8 px-4 [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.filter(m => m.id !== 'welcome').map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
                      msg.role === 'assistant'
                        ? 'bg-[hsl(76,85%,67%)]/10 border-[hsl(76,85%,67%)]/30'
                        : 'bg-white/10 border-white/20'
                    }`}>
                      {msg.role === 'assistant'
                        ? <Sparkles size={14} className="text-[hsl(76,85%,67%)]" />
                        : <User size={14} className="text-white/60" />
                      }
                    </div>

                    <div className={`max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                      <div className={`px-5 py-4 rounded-2xl ${
                        msg.role === 'assistant'
                          ? 'bg-white/[0.04] border border-white/10 rounded-tl-md'
                          : 'bg-[hsl(76,85%,67%)]/10 border border-[hsl(76,85%,67%)]/20 rounded-tr-md'
                      }`}>
                        {msg.reference && (
                          <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(76,85%,67%)]/20 text-[hsl(76,85%,67%)] border border-[hsl(76,85%,67%)]/30 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                            <Sparkles size={12} /> Editando @imagen_{msg.reference.id.substring(0, 6)}
                          </div>
                        )}
                        {msg.role === 'assistant' ? (
                          <>
                            <div
                              className="text-sm text-white/75 leading-relaxed [&_strong]:text-white [&_a]:text-[hsl(76,85%,67%)] [&_a]:underline"
                              dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                            />
                            {(msg.images || idbImages[msg.id]) && (
                              <div className="mt-3 space-y-2">
                                {(msg.images || idbImages[msg.id])!.map((imgSrc, idx) => (
                                  <div key={idx} className="flex justify-center">
                                    <div className="rounded-xl overflow-hidden border border-white/10 max-w-sm w-full aspect-square bg-black shadow-lg">
                                      <img src={imgSrc} alt="Imagen generada" className="w-full h-full object-cover" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        )}
                      </div>
                      <p className={`text-[9px] text-white/20 mt-1.5 uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : ''}`}>
                        {msg.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    {/* Bot avatar - pulsa mientras carga */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border bg-[hsl(76,85%,67%)]/10 border-[hsl(76,85%,67%)]/30 animate-pulse">
                      <Sparkles size={14} className="text-[hsl(76,85%,67%)]" />
                    </div>

                    <div className="flex flex-col gap-0 pt-1">
                      {thinkingSteps.slice(0, visibleStepCount).map((step, i) => {
                        const isLast = i === visibleStepCount - 1;
                        const isDone = i < visibleStepCount - 1;
                        const isNanoBanana = step === 'NANO_BANANA';

                        return (
                          <div key={i} className="flex items-stretch gap-3 animate-in fade-in slide-in-from-left-3 duration-400">
                            {/* Track column */}
                            <div className="flex flex-col items-center w-5 flex-shrink-0">
                              {/* Node */}
                              {isLast ? (
                                <div className="mt-[5px] flex-shrink-0">
                                  <Loader2
                                    size={10}
                                    className="text-[hsl(76,85%,67%)] animate-spin"
                                    style={{ filter: 'drop-shadow(0 0 4px rgba(194,242,84,0.8))' }}
                                  />
                                </div>
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full mt-[7px] flex-shrink-0 bg-white/25" />
                              )}
                              {/* Connector line */}
                              {!isLast && (
                                <div className="w-px flex-1 bg-gradient-to-b from-white/15 to-white/5 mt-1" />
                              )}
                            </div>

                            {/* Step content */}
                            <div className="pb-2">
                              {isNanoBanana ? (
                                <div className="flex items-center gap-2">
                                  {/* Banana icon - grayscale, no bg */}
                                  <span
                                    className="text-base leading-none animate-bounce"
                                    style={{ filter: 'grayscale(1) opacity(0.5)' }}
                                  >
                                    🍌
                                  </span>
                                  <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40 animate-pulse">
                                    Cargando Nano Banana
                                  </span>
                                  {/* Puntos animados */}
                                  <span className="flex gap-0.5 items-center">
                                    {[0, 1, 2].map(j => (
                                      <span
                                        key={j}
                                        className="w-1 h-1 rounded-full bg-white/25 animate-bounce"
                                        style={{ animationDelay: `${j * 150}ms` }}
                                      />
                                    ))}
                                  </span>
                                </div>
                              ) : (
                                <span className={`text-xs leading-relaxed transition-colors duration-500 ${
                                  isLast
                                    ? 'text-white/55'
                                    : 'text-white/20'
                                }`}>
                                  {isDone && (
                                    <span className="inline-block w-3 mr-1.5 text-center text-[9px] text-white/20">✓</span>
                                  )}
                                  {step}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Shimmer bar al final mientras espera */}
                      {visibleStepCount >= thinkingSteps.length && (
                        <div className="ml-8 mt-1 h-1 w-24 rounded-full overflow-hidden bg-white/5 animate-in fade-in duration-500">
                          <div
                            className="h-full w-1/2 rounded-full bg-[hsl(76,85%,67%)]/30"
                            style={{
                              animation: 'shimmer 1.5s ease-in-out infinite',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex-shrink-0 px-2 sm:px-4 pb-4 sm:pb-6 pt-2 border-t border-white/5">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-[hsl(76,85%,67%)]/30 transition-colors">
                {editingReference && (
                  <div className="flex items-center gap-1.5 bg-[hsl(76,85%,67%)]/10 border border-[hsl(76,85%,67%)]/30 text-[hsl(76,85%,67%)] px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest w-max ml-1">
                    @imagen_{editingReference.id.substring(0, 6)}{editingReference.index ? `_slide_${editingReference.index}` : ''}
                    <button onClick={() => setEditingReference(null)} className="hover:text-white transition-colors ml-1">
                      <X size={12} />
                    </button>
                  </div>
                )}
                {attachedImages.length > 0 && (
                  <div className="flex items-center gap-2 px-1 overflow-x-auto">
                    {attachedImages.map((src, i) => (
                      <div key={i} className="relative w-14 h-14 flex-shrink-0">
                        <img src={src} className="w-full h-full object-cover rounded-lg border border-white/10" />
                        <button
                          onClick={() => setAttachedImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                        >
                          <X size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors mb-0.5"
                  >
                    <Paperclip size={16} />
                  </button>
                  <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Escribí tu mensaje... (Enter para enviar, Shift+Enter nueva línea)"
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/20 resize-none outline-none max-h-[160px] py-2 px-1 leading-relaxed"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={(!input.trim() && attachedImages.length === 0) || isLoading}
                    className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all mb-0.5 ${
                      (input.trim() || attachedImages.length > 0) && !isLoading
                        ? 'bg-[hsl(76,85%,67%)] text-black hover:scale-105 shadow-lg shadow-[hsl(76,85%,67%)]/20'
                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                    }`}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
              <p className="text-center text-[10px] text-white/15 mt-3 uppercase tracking-widest">
                UcoBot puede cometer errores. Verificá información importante.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
