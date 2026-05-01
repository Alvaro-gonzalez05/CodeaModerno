'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, X, MessageCircle, Plus, MessagesSquare, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
    // Migrate from old single-chat key if exists
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

  const initial = typeof window !== 'undefined' ? loadInitialState() : { convs: [newConversation()], activeId: '' };
  const [conversations, setConversations] = useState<Conversation[]>(initial.convs);
  const [activeId, setActiveId] = useState<string>(initial.activeId || initial.convs[0].id);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find(c => c.id === activeId) || conversations[0];
  const messages = activeConv?.messages || [];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CONVS_KEY, JSON.stringify(conversations));
  }, [conversations, CONVS_KEY]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId, ACTIVE_KEY]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const updateActiveConv = (updater: (c: Conversation) => Conversation) => {
    setConversations(prev => prev.map(c => (c.id === activeId ? updater(c) : c)));
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
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
    setIsLoading(true);

    try {
      const apiMessages = [...messages.filter(m => m.id !== 'welcome'), userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

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
      };

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
      if (id === activeId) {
        setActiveId(filtered[0].id);
      }
      return filtered;
    });
  };

  const switchConversation = (id: string) => {
    setActiveId(id);
    setShowHistory(false);
  };

  const suggestions = [
    '¿Cuáles son las tareas pendientes de este proyecto?',
    'Dame un resumen completo del proyecto',
    '¿Qué hay en el vault?',
    '¿Quién tiene tareas asignadas?',
  ];

  const sortedConvs = [...conversations].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(76,85%,67%)] to-[hsl(76,85%,47%)] flex items-center justify-center shadow-lg shadow-[hsl(76,85%,67%)]/30 hover:scale-110 transition-all duration-300 group"
        >
          <MessageCircle size={24} className="text-black" />
          <span className="absolute inset-0 rounded-full bg-[hsl(76,85%,67%)]/40 animate-ping opacity-30" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[95] w-[420px] h-[600px] max-h-[calc(100vh-100px)] flex flex-col bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(76,85%,67%)] to-[hsl(76,85%,47%)] flex items-center justify-center flex-shrink-0">
                <Bot size={18} className="text-black" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black tracking-tighter uppercase">UCOBOT</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold truncate">
                    {projectName}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={startNewConversation}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-white/30 hover:text-[hsl(76,85%,67%)]"
                title="Nuevo chat"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => setShowHistory(v => !v)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors ${showHistory ? 'text-[hsl(76,85%,67%)] bg-white/5' : 'text-white/30 hover:text-white/60'}`}
                title="Historial de chats"
              >
                <MessagesSquare size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-white/30 hover:text-white/60"
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {showHistory && (
            <div className="absolute top-[73px] left-0 right-0 bottom-0 z-[5] bg-[#0a0a0a] flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Historial</span>
                <button
                  onClick={startNewConversation}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[hsl(76,85%,67%)]/10 hover:bg-[hsl(76,85%,67%)]/20 border border-[hsl(76,85%,67%)]/30 text-[10px] uppercase tracking-widest font-bold text-[hsl(76,85%,67%)] transition-colors"
                >
                  <Plus size={10} /> Nuevo
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                {sortedConvs.length === 0 ? (
                  <p className="text-center text-white/30 text-xs py-8">No hay conversaciones</p>
                ) : (
                  sortedConvs.map(conv => (
                    <div
                      key={conv.id}
                      className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                        conv.id === activeId
                          ? 'bg-[hsl(76,85%,67%)]/10 border border-[hsl(76,85%,67%)]/30'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                      onClick={() => switchConversation(conv.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12px] truncate ${conv.id === activeId ? 'text-white' : 'text-white/70'}`}>
                          {conv.title}
                        </p>
                        <p className="text-[9px] text-white/30 mt-0.5 uppercase tracking-widest">
                          {conv.updatedAt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} · {conv.messages.filter(m => m.id !== 'welcome').length} msgs
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all flex-shrink-0"
                        title="Eliminar conversación"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 p-4 min-h-0 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border ${
                  msg.role === 'assistant'
                    ? 'bg-[hsl(76,85%,67%)]/10 border-[hsl(76,85%,67%)]/30'
                    : 'bg-white/10 border-white/20'
                }`}>
                  {msg.role === 'assistant' ? (
                    <Sparkles size={12} className="text-[hsl(76,85%,67%)]" />
                  ) : (
                    <User size={12} className="text-white/60" />
                  )}
                </div>

                <div className={`max-w-[82%] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                  <div className={`px-4 py-3 rounded-2xl ${
                    msg.role === 'assistant'
                      ? 'bg-white/[0.03] border border-white/10 rounded-tl-md'
                      : 'bg-[hsl(76,85%,67%)]/10 border border-[hsl(76,85%,67%)]/20 rounded-tr-md'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div
                        className="text-[13px] text-white/70 leading-relaxed [&_strong]:text-white [&_a]:text-[hsl(76,85%,67%)] [&_a]:underline"
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                      />
                    ) : (
                      <p className="text-[13px] text-white/90 leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                  </div>
                  <p className={`text-[8px] text-white/20 mt-1 uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {msg.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5">
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border bg-[hsl(76,85%,67%)]/10 border-[hsl(76,85%,67%)]/30">
                  <Sparkles size={12} className="text-[hsl(76,85%,67%)]" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white/[0.03] border border-white/10">
                  <div className="flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-[hsl(76,85%,67%)]" />
                    <span className="text-[10px] text-white/30 uppercase tracking-widest">Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2 flex-shrink-0">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[hsl(76,85%,67%)]/30 text-[11px] text-white/50 hover:text-white/80 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-white/5">
            <div className="flex items-end gap-2 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-[hsl(76,85%,67%)]/30 transition-colors">
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
                placeholder="Escribí tu mensaje..."
                rows={1}
                className="flex-1 bg-transparent text-[13px] text-white placeholder-white/20 resize-none outline-none max-h-[100px] py-1.5 px-2"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  input.trim() && !isLoading
                    ? 'bg-[hsl(76,85%,67%)] text-black hover:scale-105 shadow-lg shadow-[hsl(76,85%,67%)]/20'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
