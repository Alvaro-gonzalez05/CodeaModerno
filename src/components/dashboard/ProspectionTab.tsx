'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Lead {
  id: string;
  name: string;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  instagram?: string | null;
  digitalPresence: string;
  servicesNeeded: string[];
  opportunityScore: number;
}

interface ProspectMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  leadCount?: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: ProspectMessage[];
  updatedAt: number;
}

// ── Stored separately from conversations so leads never disappear when switching/clearing chats
const CONVS_KEY     = 'procobot-convs';
const ACTIVE_KEY    = 'procobot-active';
const LEADS_KEY     = 'procobot-leads';
const NAMES_KEY     = 'procobot-found-names';
const CONTACTED_KEY = 'procobot-contacted';

const CATEGORIES = [
  { label: 'Buscar en Mendoza',    desc: 'Negocios locales con poca presencia digital',  query: 'Busca 5 negocios en Mendoza, Argentina que necesiten marketing digital o desarrollo web. Variedad de rubros, priorizá los de poca presencia digital.' },
  { label: 'Buscar en Argentina',  desc: 'Prospectos en todo el país',                   query: 'Busca 5 negocios en distintas provincias de Argentina que necesiten servicios de marketing digital o desarrollo web.' },
  { label: 'Inmobiliarias',        desc: 'Sin web o redes desactualizadas',               query: 'Busca inmobiliarias en Mendoza y Argentina que no tengan sitio web actualizado o que carezcan de presencia en redes sociales.' },
  { label: 'Restaurantes',         desc: 'Gastronomía sin presencia online',              query: 'Busca restaurantes, bares o cafeterías en Mendoza y Argentina que no tengan web propia o que sus redes sociales estén inactivas.' },
  { label: '¿Qué ofrecerles?',    desc: 'Estrategia para los prospectos actuales',       query: 'Mirá los prospectos que ya encontraste y decime qué servicios de Codea le puedo ofrecer a cada uno y cómo los abordo.' },
  { label: 'Redactar mensajes',    desc: 'Mensajes de contacto por WhatsApp',             query: 'Escribime mensajes de contacto por WhatsApp para los prospectos encontrados. Que sean profesionales y naturales, no spam.' },
];

function formatMarkdown(text: string): string {
  let html = text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-white/5 border border-white/10 rounded-xl p-4 my-2 overflow-x-auto text-xs font-mono text-white/80"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[hsl(76,85%,67%)] text-xs font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[hsl(76,85%,67%)] underline underline-offset-2">$1</a>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-white mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-white mt-3 mb-1">$1</h2>')
    .replace(/^---$/gm, '<hr class="border-white/10 my-3" />')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc list-outside text-white/70 text-sm leading-relaxed">$1</li>')
    .replace(/\n/g, '<br />');
  html = html.replace(/((?:<li[^>]*>.*?<\/li><br \/>)+)/g, (m) =>
    '<ul class="my-2 space-y-0.5">' + m.replace(/<br \/>/g, '') + '</ul>'
  );
  return html;
}

function getThinkingSteps(text: string): string[] {
  const t = text.toLowerCase();
  const isSearch = t.includes('busca') || t.includes('buscá') || t.includes('encontrá') || t.includes('negocios') || t.includes('empresas') || t.includes('inmobiliaria') || t.includes('restaurante') || t.includes('gimnasio') || t.includes('clínica') || t.includes('tienda');
  if (isSearch) {
    return ['Analizando la solicitud...', 'Preparando parámetros...', 'GOOGLE_SEARCH', 'Evaluando resultados...'];
  }
  if (t.includes('mensaje') || t.includes('whatsapp') || t.includes('redact') || t.includes('escrib') || t.includes('contacto')) {
    return ['Analizando los prospectos...', 'Adaptando el tono...', 'Redactando el mensaje...'];
  }
  if (t.includes('ofrecerle') || t.includes('venderle') || t.includes('ofrec') || t.includes('vend') || t.includes('pitch') || t.includes('estrategia')) {
    return ['Revisando los prospectos encontrados...', 'Evaluando oportunidades...', 'Preparando recomendaciones...'];
  }
  return ['Procesando solicitud...', 'GOOGLE_SEARCH', 'Preparando respuesta...'];
}

export default function ProspectionTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId]           = useState('');
  const [leads, setLeads]                 = useState<Lead[]>([]);
  const [foundNames, setFoundNames]       = useState<string[]>([]);
  const [contactedIds, setContactedIds]   = useState<Set<string>>(new Set());
  const [newLeadIds, setNewLeadIds]       = useState<Set<string>>(new Set());
  const [exitingLeadIds, setExitingLeadIds]   = useState<Set<string>>(new Set());
  const [reenteringIds, setReenteringIds] = useState<Set<string>>(new Set());
  const [input, setInput]                 = useState('');
  const [isLoading, setIsLoading]         = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showHistory, setShowHistory]     = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [visibleStepCount, setVisibleStepCount] = useState(0);
  const [userName, setUserName]           = useState('');
  const [mentionedLead, setMentionedLead] = useState<Lead | null>(null);

  const messagesEndRef    = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef           = useRef<HTMLInputElement>(null);

  // Inject animation styles into <head> so they don't interfere with flex layout
  useEffect(() => {
    const id = 'procobot-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @keyframes leadEnter {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0)    scale(1);    }
      }
      @keyframes leadSlideOut {
        0%   { opacity: 1; transform: translateX(0); }
        100% { opacity: 0; transform: translateX(85%); }
      }
      @keyframes wrapperCollapse {
        0%   { max-height: 600px; margin-bottom: 10px; }
        45%  { max-height: 0;     margin-bottom: 3px;  }
        62%  { max-height: 22px;  margin-bottom: 5px;  }
        80%  { max-height: 0;     margin-bottom: 1px;  }
        92%  { max-height: 6px;   margin-bottom: 1px;  }
        100% { max-height: 0;     margin-bottom: 0;    }
      }
      .lead-enter       { animation: leadEnter 0.4s cubic-bezier(0.34,1.5,0.5,1) both; }
      .lead-slide-out   { animation: leadSlideOut 0.32s cubic-bezier(0.5, 0, 0.75, 0) forwards; }
      .wrapper-collapse { animation: wrapperCollapse 0.55s cubic-bezier(0.4, 0, 0.2, 1) forwards; overflow: hidden; }
    `;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  // ── helpers ────────────────────────────────────────────────────
  const getWelcomeMessage = (): ProspectMessage => ({
    id: 'welcome',
    role: 'assistant',
    content: '¡Hola! Soy **Procobot**, tu buscador de clientes potenciales para Codea Desarrollos. Seleccioná una opción o escribí lo que necesitás.',
    timestamp: Date.now(),
  });

  const newConversation = (): Conversation => ({
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: 'Nueva búsqueda',
    messages: [getWelcomeMessage()],
    updatedAt: Date.now(),
  });

  // ── load on mount ───────────────────────────────────────────────
  useEffect(() => {
    // leads are global — load independently of conversations
    try {
      const sl = localStorage.getItem(LEADS_KEY);
      const sn = localStorage.getItem(NAMES_KEY);
      const sc = localStorage.getItem(CONTACTED_KEY);
      if (sl) setLeads(JSON.parse(sl));
      if (sn) setFoundNames(JSON.parse(sn));
      if (sc) setContactedIds(new Set(JSON.parse(sc)));
    } catch {}

    // conversations
    try {
      const saved   = localStorage.getItem(CONVS_KEY);
      const savedId = localStorage.getItem(ACTIVE_KEY);
      if (saved) {
        const parsed: Conversation[] = JSON.parse(saved);
        if (parsed.length > 0) {
          const aid = savedId && parsed.find(c => c.id === savedId) ? savedId : parsed[0].id;
          setConversations(parsed);
          setActiveId(aid);
          setIsInitialized(true);
          return;
        }
      }
    } catch {}

    const c = newConversation();
    setConversations([c]);
    setActiveId(c.id);
    setIsInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch user name
  useEffect(() => {
    const fetchName = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      const name = profile?.full_name || user.email?.split('@')[0] || 'Usuario';
      setUserName(name.split(' ')[0]);
    };
    fetchName();
  }, []);

  // ── save conversations ──────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return;
    try { localStorage.setItem(CONVS_KEY, JSON.stringify(conversations)); } catch {}
  }, [isInitialized, conversations]);

  useEffect(() => {
    if (!isInitialized) return;
    try { localStorage.setItem(ACTIVE_KEY, activeId); } catch {}
  }, [isInitialized, activeId]);

  // ── save leads (global) ─────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return;
    try { localStorage.setItem(LEADS_KEY,  JSON.stringify(leads)); } catch {}
  }, [isInitialized, leads]);

  useEffect(() => {
    if (!isInitialized) return;
    try { localStorage.setItem(NAMES_KEY,  JSON.stringify(foundNames)); } catch {}
  }, [isInitialized, foundNames]);

  useEffect(() => {
    if (!isInitialized) return;
    try { localStorage.setItem(CONTACTED_KEY, JSON.stringify([...contactedIds])); } catch {}
  }, [isInitialized, contactedIds]);

  // ── thinking steps animation ────────────────────────────────────
  useEffect(() => {
    if (!isLoading) { setVisibleStepCount(0); setThinkingSteps([]); return; }
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setVisibleStepCount(count);
      if (count >= thinkingSteps.length) clearInterval(interval);
    }, 600);
    return () => clearInterval(interval);
  }, [isLoading, thinkingSteps.length]);

  // ── scroll — usa scrollTo directo para evitar scroll chaining en overflow:hidden ──
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const conv = conversations.find(c => c.id === activeId) || conversations[0];
    const hasUser = conv?.messages?.some(m => m.role === 'user');
    if (!hasUser) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [conversations, activeId]);

  // ── computed ────────────────────────────────────────────────────
  const activeConv     = conversations.find(c => c.id === activeId) || conversations[0];
  const messages       = activeConv?.messages || [];
  const hasUserMsgs    = messages.some(m => m.role === 'user');
  const sortedConvs    = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  const hour           = new Date().getHours();
  const greeting       = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  // ── helpers ─────────────────────────────────────────────────────
  const updateActiveConv = (updater: (c: Conversation) => Conversation) => {
    setConversations(prev => prev.map(c => (c.id === activeId ? updater(c) : c)));
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

  const removeLead = (leadId: string) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
    setContactedIds(prev => { const next = new Set(prev); next.delete(leadId); return next; });
    setExitingLeadIds(prev => { const next = new Set(prev); next.delete(leadId); return next; });
  };

  const toggleContacted = (leadId: string) => {
    if (contactedIds.has(leadId)) {
      // Uncheck: remove from contacted, animate back in at top
      setContactedIds(prev => { const next = new Set(prev); next.delete(leadId); return next; });
      setNewLeadIds(prev => new Set([...prev, leadId]));
      setTimeout(() => setNewLeadIds(prev => { const next = new Set(prev); next.delete(leadId); return next; }), 700);
    } else {
      // Check: slide card right + collapse wrapper with bounce, then move to contacted
      setExitingLeadIds(prev => new Set([...prev, leadId]));
      setTimeout(() => {
        setExitingLeadIds(prev => { const next = new Set(prev); next.delete(leadId); return next; });
        setContactedIds(prev => new Set([...prev, leadId]));
        setReenteringIds(prev => new Set([...prev, leadId]));
        setTimeout(() => setReenteringIds(prev => { const next = new Set(prev); next.delete(leadId); return next; }), 500);
      }, 540);
    }
  };

  // ── main send ───────────────────────────────────────────────────
  const fireSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;

    const currentMention = mentionedLead;
    const enrichedQuery = currentMention
      ? `Sobre el prospecto **${currentMention.name}** (${currentMention.location || 'sin ubicación'}, score ${currentMention.opportunityScore}/10, servicios: ${currentMention.servicesNeeded.slice(0, 3).join(', ')}): ${trimmed}`
      : trimmed;

    const isFirstUser = !messages.some(m => m.role === 'user');
    const newTitle    = isFirstUser ? trimmed.slice(0, 48) + (trimmed.length > 48 ? '…' : '') : (activeConv?.title || 'Búsqueda');

    const userMsg: ProspectMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: currentMention ? `[@${currentMention.name}] ${trimmed}` : trimmed,
      timestamp: Date.now(),
    };

    updateActiveConv(c => ({
      ...c,
      title: newTitle,
      messages: [...c.messages, userMsg],
      updatedAt: Date.now(),
    }));
    setInput('');
    setMentionedLead(null);
    setThinkingSteps(getThinkingSteps(enrichedQuery));
    setVisibleStepCount(1);
    setIsLoading(true);

    const history = [...messages.filter(m => m.id !== 'welcome'), userMsg]
      .slice(-8)
      .map(m => ({
        role: m.role,
        // Quitar el prefijo [@Lead] del historial para que no contamine búsquedas nuevas
        content: m.role === 'user'
          ? m.content.replace(/^\[@[^\]]+\]\s*/, '')
          : m.content,
      }));

    try {
      const res  = await fetch('/api/prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: enrichedQuery, foundNames, leads, messages: history.slice(0, -1) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error del servidor');

      const newLeads: Lead[] = data.leads || [];
      if (newLeads.length > 0) {
        setLeads(prev => [...newLeads, ...prev]);
        setFoundNames(prev => [...prev, ...newLeads.map(l => l.name)]);
        const ids = new Set(newLeads.map(l => l.id));
        setNewLeadIds(ids);
        setTimeout(() => setNewLeadIds(new Set()), 900);
      }

      const botMsg: ProspectMessage = {
        id: `b-${Date.now()}`,
        role: 'assistant',
        content: data.message || 'Completado.',
        timestamp: Date.now(),
        leadCount: newLeads.length,
      };
      updateActiveConv(c => ({ ...c, messages: [...c.messages, botMsg], updatedAt: Date.now() }));
    } catch (err: any) {
      updateActiveConv(c => ({
        ...c,
        messages: [...c.messages, { id: `e-${Date.now()}`, role: 'assistant', content: `⚠️ Error: ${err.message}. Intentá de nuevo.`, timestamp: Date.now() }],
        updatedAt: Date.now(),
      }));
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSend = () => {
    if (input.trim()) fireSearch(input);
  };

  // ── score style ─────────────────────────────────────────────────
  const scoreStyle = (s: number) =>
    s >= 8 ? 'text-green-400 border-green-400/30 bg-green-400/10' :
    s >= 5 ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' :
             'text-red-400 border-red-400/30 bg-red-400/10';

  const titleCase = (s: string) =>
    s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  const validWaUrl = (phone: string | null | undefined): string | null => {
    if (!phone || phone === 'null' || phone === 'undefined') return null;
    const clean = phone.replace(/[\s\-\(\)\+]/g, '');
    return clean.length >= 10 ? `https://wa.me/${clean}` : null;
  };

  const googleUrl = (name: string, location: string | null | undefined) =>
    `https://www.google.com/search?q=${encodeURIComponent(`${name} ${location || 'Argentina'} contacto`)}`;

  const validWebUrl = (url: string | null | undefined): string | null => {
    if (!url || url === 'null' || url === 'undefined') return null;
    try { new URL(url.startsWith('http') ? url : `https://${url}`); return url.startsWith('http') ? url : `https://${url}`; }
    catch { return null; }
  };

  const igUrl = (handle: string | null | undefined): string | null => {
    if (!handle || handle === 'null' || handle === 'undefined') return null;
    // Si ya es una URL completa, extrae el username
    const fromUrl = handle.match(/instagram\.com\/([^/?#\s]+)/);
    if (fromUrl) return `https://instagram.com/${fromUrl[1]}`;
    // Si es @usuario o usuario solo
    const username = handle.replace('@', '').trim();
    return username ? `https://instagram.com/${username}` : null;
  };

  // ── render ──────────────────────────────────────────────────────
  const newLeadsArr = leads.filter(l => newLeadIds.has(l.id));

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 overflow-hidden">

      {/* ════════════════════ CHAT PANEL ════════════════════ */}
      <div className="flex flex-1 min-h-0 rounded-2xl border border-white/10 overflow-hidden bg-[#0a0a0a]">

        {/* History sidebar */}
        <div className={`flex-shrink-0 bg-[#0f0f0f] border-r border-white/10 flex flex-col transition-all duration-300 ease-out overflow-hidden ${showHistory ? 'w-64' : 'w-0'}`}>
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Conversaciones</span>
            <button
              onClick={startNewConversation}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[hsl(76,85%,67%)]/10 hover:bg-[hsl(76,85%,67%)]/20 border border-[hsl(76,85%,67%)]/30 text-[10px] uppercase tracking-widest font-bold text-[hsl(76,85%,67%)] transition-colors whitespace-nowrap"
            >
              + Nuevo
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sortedConvs.map(conv => (
              <div
                key={conv.id}
                onClick={() => { setActiveId(conv.id); setShowHistory(false); }}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  conv.id === activeId
                    ? 'bg-[hsl(76,85%,67%)]/10 border border-[hsl(76,85%,67%)]/30'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${conv.id === activeId ? 'text-white' : 'text-white/60'}`}>{conv.title}</p>
                  <p className="text-[9px] text-white/25 mt-0.5 uppercase tracking-widest">
                    {new Date(conv.updatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} · {conv.messages.filter(m => m.id !== 'welcome').length} msgs
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all flex-shrink-0"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setShowHistory(v => !v)}
                className={`p-2 rounded-xl transition-colors flex-shrink-0 ${showHistory ? 'bg-[hsl(76,85%,67%)]/10 text-[hsl(76,85%,67%)]' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
              >
                <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <div className="w-px h-5 bg-white/10 flex-shrink-0" />
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(76,85%,67%)] to-[hsl(76,85%,47%)] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black tracking-tighter uppercase text-white leading-none">PROCOBOT</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Buscador de clientes · IA</p>
                </div>
              </div>
            </div>
            <button
              onClick={startNewConversation}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Nuevo chat</span>
            </button>
          </div>

          {/* Welcome screen OR Messages — single persistent container so flex-1 never mutates */}
          <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
          {!hasUserMsgs ? (
              <div className="min-h-full flex flex-col items-center justify-center px-4 py-8">
               <div className="w-full max-w-2xl">
                <div className="flex justify-center mb-7">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(76,85%,67%)] to-[hsl(76,85%,47%)] flex items-center justify-center shadow-2xl shadow-[hsl(76,85%,67%)]/20">
                    <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-center mb-9">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-light text-white mb-3 tracking-tight">
                    {greeting}{userName ? <>, <span className="font-semibold">{userName}</span></> : null}
                  </h1>
                  <p className="text-white/35 text-base">
                    ¿A quién <span className="text-white/60 font-medium">buscamos hoy</span>?
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(cat.query); setTimeout(() => inputRef.current?.focus(), 0); }}
                      className="group flex flex-col items-start gap-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[hsl(76,85%,67%)]/40 hover:bg-white/[0.07] transition-all text-left"
                    >
                      <p className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors leading-tight">{cat.label}</p>
                      <p className="text-[10px] text-white/25 leading-snug">{cat.desc}</p>
                    </button>
                  ))}
                </div>
               </div>
              </div>
          ) : (
            <div className="py-6 px-4 sm:px-5">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.filter(m => m.id !== 'welcome').map(msg => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border ${
                      msg.role === 'assistant'
                        ? 'bg-[hsl(76,85%,67%)]/10 border-[hsl(76,85%,67%)]/30'
                        : 'bg-white/10 border-white/20'
                    }`}>
                      {msg.role === 'assistant'
                        ? <svg className="w-3.5 h-3.5 text-[hsl(76,85%,67%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        : <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      }
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-white/10 text-white rounded-tr-sm'
                        : 'bg-white/[0.04] border border-white/[0.06] text-gray-300 rounded-tl-sm'
                    }`}>
                      <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                      {msg.leadCount != null && msg.leadCount > 0 && (
                        <p className="text-[10px] text-[hsl(76,85%,67%)] mt-2 font-bold tracking-widest uppercase border-t border-white/10 pt-2">
                          +{msg.leadCount} prospecto{msg.leadCount !== 1 ? 's' : ''} → columna derecha
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Thinking steps — same style as UcoBotTab */}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border bg-[hsl(76,85%,67%)]/10 border-[hsl(76,85%,67%)]/30 animate-pulse">
                      <svg className="w-3.5 h-3.5 text-[hsl(76,85%,67%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="flex flex-col gap-0 pt-1">
                      {thinkingSteps.slice(0, visibleStepCount).map((step, i) => {
                        const isLast       = i === visibleStepCount - 1;
                        const isDone       = i < visibleStepCount - 1;
                        const isGoogleStep = step === 'GOOGLE_SEARCH';
                        return (
                          <div key={i} className="flex items-stretch gap-3">
                            {/* Track column */}
                            <div className="flex flex-col items-center w-5 flex-shrink-0">
                              {isLast ? (
                                <div className="mt-[5px] flex-shrink-0">
                                  <svg
                                    className="w-2.5 h-2.5 text-[hsl(76,85%,67%)] animate-spin"
                                    style={{ filter: 'drop-shadow(0 0 4px rgba(194,242,84,0.8))' }}
                                    fill="none" viewBox="0 0 24 24"
                                  >
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full mt-[7px] flex-shrink-0 bg-white/25" />
                              )}
                              {!isLast && <div className="w-px flex-1 bg-gradient-to-b from-white/15 to-white/5 mt-1" />}
                            </div>
                            {/* Step text / special animation */}
                            <div className="pb-2">
                              {isGoogleStep ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-base leading-none animate-bounce" style={{ filter: 'grayscale(1) opacity(0.5)' }}>🔍</span>
                                  <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40 animate-pulse">
                                    Consultando Google Search
                                  </span>
                                  <span className="flex gap-0.5 items-center">
                                    {[0, 1, 2].map(j => (
                                      <span key={j} className="w-1 h-1 rounded-full bg-white/25 animate-bounce" style={{ animationDelay: `${j * 150}ms` }} />
                                    ))}
                                  </span>
                                </div>
                              ) : (
                                <span className={`text-xs leading-relaxed transition-colors duration-500 ${isLast ? 'text-white/55' : 'text-white/20'}`}>
                                  {isDone && <span className="inline-block w-3 mr-1.5 text-center text-[9px] text-white/20">✓</span>}
                                  {step}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {/* Shimmer bar — aparece cuando todos los steps ya se mostraron */}
                      {visibleStepCount >= thinkingSteps.length && thinkingSteps.length > 0 && (
                        <div className="ml-8 mt-1 h-1 w-24 rounded-full overflow-hidden bg-white/5">
                          <div
                            className="h-full w-1/2 rounded-full bg-[hsl(76,85%,67%)]/30"
                            style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
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
          </div>{/* end persistent scroll container */}

          {/* Input bar */}
          <div className="flex-shrink-0 px-4 sm:px-5 py-3 border-t border-white/10">
            <div className="flex flex-col gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-white/20 transition-colors max-w-3xl mx-auto">
              {mentionedLead && (
                <div className="flex items-center gap-1.5 w-max bg-[hsl(76,85%,67%)]/10 border border-[hsl(76,85%,67%)]/30 text-[hsl(76,85%,67%)] px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  {mentionedLead.name.slice(0, 24)}{mentionedLead.name.length > 24 ? '…' : ''}
                  <button onClick={() => setMentionedLead(null)} className="ml-1 hover:text-white transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                  placeholder={mentionedLead ? `Preguntá sobre ${mentionedLead.name}...` : 'Escribí qué buscar o consultá sobre los prospectos...'}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none disabled:opacity-40"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="w-8 h-8 rounded-lg bg-[hsl(76,85%,67%)] flex items-center justify-center hover:bg-[hsl(76,85%,77%)] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
                >
                  {isLoading
                    ? <svg className="w-3.5 h-3.5 text-black animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    : <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  }
                </button>
              </div>
            </div>
            <p className="text-[10px] text-white/15 text-center mt-2 tracking-wider max-w-3xl mx-auto">
              PROCOBOT PUEDE COMETER ERRORES · VERIFICÁ LA INFORMACIÓN ANTES DE CONTACTAR
            </p>
          </div>
        </div>
      </div>

      {/* ════════════════════ LEADS PANEL ════════════════════ */}
      <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-3 flex-shrink-0 min-h-0 overflow-hidden">

        <div className="flex items-center justify-between flex-shrink-0">
          <h3 className="text-xs font-black tracking-widest text-white uppercase">Prospectos</h3>
          {leads.length > 0 && (
            <span className="text-xs bg-[hsl(76,85%,67%)]/15 text-[hsl(76,85%,67%)] px-2.5 py-1 rounded-full font-bold border border-[hsl(76,85%,67%)]/20 tracking-wider">
              {leads.length - contactedIds.size}/{leads.length}
            </span>
          )}
        </div>

        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-white/10 rounded-2xl flex-1">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">Los prospectos aparecerán<br />aquí mientras se buscan</p>
          </div>
        ) : (
          <div className="overflow-y-auto overflow-x-hidden flex flex-col flex-1 min-h-0 pr-0.5 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {[...leads.filter(l => !contactedIds.has(l.id)), ...leads.filter(l => contactedIds.has(l.id))].map(lead => {
              const isContacted   = contactedIds.has(lead.id);
              const isExiting     = exitingLeadIds.has(lead.id);
              const isNew         = newLeadIds.has(lead.id);
              const isReentering  = reenteringIds.has(lead.id);
              const staggerIndex  = newLeadsArr.findIndex(l => l.id === lead.id);
              const waLink  = validWaUrl(lead.whatsapp);
              const webLink = validWebUrl(lead.website);
              const igLink  = igUrl(lead.instagram);
              const visibleTags = lead.servicesNeeded.slice(0, 2);
              const extraTags   = lead.servicesNeeded.length - 2;

              return (
                // Wrapper: collapses with bouncy animation so cards below "rebound" up
                <div
                  key={lead.id}
                  className={isExiting ? 'wrapper-collapse' : ''}
                  style={isExiting ? undefined : { marginBottom: '10px' }}
                >
                <div
                  className={`lead-card border rounded-2xl p-3.5 transition-colors ${isExiting ? 'lead-slide-out' : ''} ${((isNew && staggerIndex >= 0) || isReentering) && !isExiting ? 'lead-enter' : ''} ${isContacted ? 'bg-white/[0.01] border-white/[0.04] opacity-50' : 'bg-white/[0.03] border-white/[0.08] hover:border-white/15'}`}
                  style={(isNew && staggerIndex >= 0) && !isExiting ? { animationDelay: `${staggerIndex * 60}ms` } : undefined}
                >

                  {/* Header: nombre + score + acciones */}
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold leading-tight ${isContacted ? 'text-white/40 line-through' : 'text-white'}`}>{lead.name}</p>
                      {lead.location && (
                        <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                          <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {lead.location}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!isContacted && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${scoreStyle(lead.opportunityScore)}`}>
                          {lead.opportunityScore}/10
                        </span>
                      )}
                      {/* Contactado */}
                      <button
                        onClick={() => toggleContacted(lead.id)}
                        title={isContacted ? 'Marcar como no contactado' : 'Marcar como contactado'}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isContacted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-white/20 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      {/* Mencionar en chat */}
                      {!isContacted && (
                        <button
                          onClick={() => { setMentionedLead(lead); setTimeout(() => inputRef.current?.focus(), 0); }}
                          title="Mencionar en el chat"
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white/20 hover:text-[hsl(76,85%,67%)] hover:bg-[hsl(76,85%,67%)]/10 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>
                      )}
                      {/* Eliminar */}
                      <button
                        onClick={() => removeLead(lead.id)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Contenido — solo si no está contactado */}
                  {!isContacted && (
                    <>
                      {/* Presencia digital — máx 2 líneas */}
                      {lead.digitalPresence && (
                        <p className="text-[10px] text-gray-500 leading-relaxed mb-2.5 border-l-2 border-white/10 pl-2 line-clamp-2">
                          {lead.digitalPresence}
                        </p>
                      )}

                      {/* Tags — title case, máx 2 + desborde */}
                      {lead.servicesNeeded.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {visibleTags.map((s, i) => (
                            <span key={i} className="text-[9px] font-medium bg-[hsl(76,85%,67%)]/10 text-[hsl(76,85%,67%)] px-1.5 py-0.5 rounded-md border border-[hsl(76,85%,67%)]/20 leading-none">
                              {titleCase(s)}
                            </span>
                          ))}
                          {extraTags > 0 && (
                            <span className="text-[9px] text-white/25 px-1 py-0.5 leading-none self-center">+{extraTags} más</span>
                          )}
                        </div>
                      )}

                      {/* Botones de contacto */}
                      <div className="flex flex-wrap gap-1">
                        {waLink && (
                          <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors">
                            <svg className="w-2.5 h-2.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            WA
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors">
                            <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            Email
                          </a>
                        )}
                        {webLink && (
                          <a href={webLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-white/5 text-gray-400 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-colors">
                            <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                            Web
                          </a>
                        )}
                        {igLink && (
                          <a href={igLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-lg hover:bg-pink-500/20 transition-colors">
                            <svg className="w-2.5 h-2.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            IG
                          </a>
                        )}
                        {lead.phone && !waLink && (
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-white/5 text-gray-400 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-colors">
                            <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z"/></svg>
                            Tel
                          </a>
                        )}
                        <a
                          href={googleUrl(lead.name, lead.location)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Buscar en Google"
                          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-white/[0.04] text-white/25 border border-white/[0.08] rounded-lg hover:bg-white/10 hover:text-white/60 transition-colors"
                        >
                          <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                          Google
                        </a>
                      </div>
                    </>
                  )}
                </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
