'use client';

import { useState, useRef, useEffect } from 'react';
import {
  User, Loader2, Sparkles, MapPin, Globe, Phone, AtSign, X,
  Search, Building2, Plus, Trash2, MessagesSquare, MessageCircle,
  ExternalLink, Users,
} from 'lucide-react';

interface BusinessCard {
  id: string;
  name: string;
  description: string;
  industry: string;
  address?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  whatsapp?: string;
  googleMaps?: string;
  potential: 'alto' | 'medio' | 'bajo';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  businesses?: BusinessCard[];
  mention?: { id: string; name: string };
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
}

const CONVS_KEY = 'client-finder-convs';
const ACTIVE_KEY = 'client-finder-active';

const getWelcomeMessage = (): Message => ({
  id: 'welcome',
  role: 'assistant',
  content: `¡Hola! Soy tu asistente de prospección de clientes.\n\nPuedo buscar negocios en cualquier zona o rubro que podrían necesitar servicios de software: web, apps, sistemas de gestión, ecommerce, automatización y más.\n\nContame qué tipo de clientes estás buscando y te armo las fichas con toda la info de contacto.`,
  timestamp: new Date(),
});

const makeConversation = (): Conversation => ({
  id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: 'Nueva búsqueda',
  messages: [getWelcomeMessage()],
  updatedAt: new Date(),
});

const categories = [
  {
    label: 'Buscar en Mendoza',
    desc: 'Negocios locales por rubro',
    prompt: 'Buscá negocios en Mendoza que podrían necesitar servicios de software o presencia digital. Dame una variedad de rubros interesantes.',
  },
  {
    label: 'Gastronomía',
    desc: 'Restaurantes, bares, cafeterías',
    prompt: 'Buscá restaurantes, bares y negocios gastronómicos en Mendoza que no tienen presencia digital o podrían mejorarla con una web o app de reservas.',
  },
  {
    label: 'Comercios y retail',
    desc: 'Tiendas, locales, ecommerce',
    prompt: 'Buscá comercios y tiendas locales en Mendoza que podrían beneficiarse de una tienda online o sistema de gestión de ventas.',
  },
  {
    label: 'Profesionales',
    desc: 'Médicos, abogados, consultores',
    prompt: 'Buscá profesionales independientes (médicos, abogados, contadores, arquitectos) en Mendoza que necesiten un sitio web profesional o sistema de turnos.',
  },
  {
    label: 'PyMEs y empresas',
    desc: 'Manufactura, servicios, logística',
    prompt: 'Buscá PyMEs industriales o de servicios en Mendoza que necesiten sistemas de gestión, automatización o digitalización de procesos internos.',
  },
  {
    label: 'Turismo y hotelería',
    desc: 'Hoteles, bodegas, tours',
    prompt: 'Buscá negocios del sector turístico y hotelero en Mendoza que podrían mejorar su presencia digital, sistema de reservas o experiencia del cliente.',
  },
];

const THINKING_STEPS = [
  'Iniciando búsqueda de clientes...',
  'Analizando rubros y segmentos...',
  'Consultando directorio de negocios...',
  'Evaluando potencial de digitalización...',
  'Recopilando información de contacto...',
  'Generando fichas de clientes...',
];

const potentialStyles = {
  alto: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  medio: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  bajo: { bg: 'bg-white/5', text: 'text-white/35', border: 'border-white/10', dot: 'bg-white/25' },
};

function BizCard({ biz, onMention }: { biz: BusinessCard; onMention: (b: BusinessCard) => void }) {
  const p = potentialStyles[biz.potential] ?? potentialStyles.medio;

  return (
    <div className="group relative flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(76,85%,67%)]/40 to-transparent rounded-t-2xl" />

      {/* header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[hsl(76,85%,67%)]/10 border border-[hsl(76,85%,67%)]/20 flex items-center justify-center flex-shrink-0">
          <Building2 size={16} className="text-[hsl(76,85%,67%)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white leading-tight">{biz.name}</h3>
          <span className="text-[10px] text-white/35 uppercase tracking-widest font-medium">{biz.industry}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border flex-shrink-0 ${p.bg} ${p.border}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
          <span className={`text-[9px] font-black uppercase tracking-widest ${p.text}`}>{biz.potential}</span>
        </div>
      </div>

      {/* description */}
      <p className="text-xs text-white/50 leading-relaxed line-clamp-3">{biz.description}</p>

      {/* contact details */}
      <div className="flex flex-col gap-1.5">
        {biz.address && (
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <MapPin size={11} className="flex-shrink-0 text-white/25" />
            <span className="truncate">{biz.address}</span>
          </div>
        )}
        {biz.phone && (
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <Phone size={11} className="flex-shrink-0 text-white/25" />
            <a href={`tel:${biz.phone}`} className="truncate hover:text-white transition-colors">{biz.phone}</a>
          </div>
        )}
        {biz.website && (
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <Globe size={11} className="flex-shrink-0 text-white/25" />
            <a href={biz.website} target="_blank" rel="noopener noreferrer" className="truncate hover:text-[hsl(76,85%,67%)] transition-colors">
              {biz.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {/* contact buttons */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/5">
        {biz.whatsapp && (
          <a
            href={`https://wa.me/${biz.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-colors"
          >
            <MessageCircle size={10} /> WhatsApp
          </a>
        )}
        {biz.instagram && (
          <a
            href={`https://instagram.com/${biz.instagram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-widest hover:bg-purple-500/20 transition-colors"
          >
            <AtSign size={10} /> Instagram
          </a>
        )}
        {biz.googleMaps && (
          <a
            href={biz.googleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-colors"
          >
            <MapPin size={10} /> Maps
          </a>
        )}
        {biz.website && !biz.whatsapp && !biz.instagram && !biz.googleMaps && (
          <a
            href={biz.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-colors"
          >
            <ExternalLink size={10} /> Ver sitio
          </a>
        )}
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(`${biz.name} ${biz.address || ''}`.trim())}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/35 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-colors"
        >
          <Search size={10} /> Google
        </a>
      </div>

      {/* mention button — visually separated */}
      <button
        onClick={() => onMention(biz)}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-[hsl(76,85%,67%)]/30 text-[hsl(76,85%,67%)]/70 text-[10px] font-bold uppercase tracking-widest hover:border-[hsl(76,85%,67%)]/60 hover:text-[hsl(76,85%,67%)] hover:bg-[hsl(76,85%,67%)]/5 transition-all"
      >
        <AtSign size={11} /> Mencionar en el chat
      </button>
    </div>
  );
}

export default function ClientFinderTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingSteps] = useState<string[]>(THINKING_STEPS);
  const [visibleStepCount, setVisibleStepCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [isInit, setIsInit] = useState(false);
  const [userName, setUserName] = useState('');
  const [mentionedBiz, setMentionedBiz] = useState<BusinessCard | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cardsEndRef = useRef<HTMLDivElement>(null);

  // ── Init from localStorage ────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
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
          const aid = activeSaved && parsed.find(c => c.id === activeSaved) ? activeSaved : parsed[0].id;
          setConversations(parsed);
          setActiveId(aid);
          // Reveal all persisted card IDs immediately
          const ids = new Set<string>();
          parsed.forEach(conv => conv.messages.forEach(msg => msg.businesses?.forEach(b => ids.add(b.id))));
          setRevealedIds(ids);
          setIsInit(true);
          return;
        }
      }
    } catch {}
    const c = makeConversation();
    setConversations([c]);
    setActiveId(c.id);
    setIsInit(true);
  }, []);

  // ── Load user name ────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        const name = profile?.full_name || user.email?.split('@')[0] || 'Usuario';
        setUserName(name.split(' ')[0]);
      } catch {}
    };
    load();
  }, []);

  // ── Persist conversations ─────────────────────────────────
  useEffect(() => {
    if (!isInit) return;
    try { localStorage.setItem(CONVS_KEY, JSON.stringify(conversations)); } catch {}
  }, [conversations, isInit]);

  useEffect(() => {
    if (!isInit || !activeId) return;
    localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId, isInit]);

  // ── Scroll chat to bottom ─────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeId, isLoading]);

  // ── Auto-resize textarea ──────────────────────────────────
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  // ── Thinking steps timer ──────────────────────────────────
  useEffect(() => {
    if (!isLoading) { setVisibleStepCount(0); return; }
    let count = 0;
    const iv = setInterval(() => {
      count += 1;
      setVisibleStepCount(count);
      if (count >= THINKING_STEPS.length) clearInterval(iv);
    }, 650);
    return () => clearInterval(iv);
  }, [isLoading]);

  const activeConv = conversations.find(c => c.id === activeId) ?? conversations[0];
  const messages = activeConv?.messages ?? [];
  const hasUserMessages = messages.some(m => m.role === 'user');

  const activeBusinesses = messages
    .filter(m => m.role === 'assistant' && m.businesses?.length)
    .flatMap(m => m.businesses!);

  const hasCards = activeBusinesses.length > 0;

  const updateActive = (updater: (c: Conversation) => Conversation) =>
    setConversations(prev => prev.map(c => (c.id === activeId ? updater(c) : c)));

  // ── Send message ──────────────────────────────────────────
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
      mention: mentionedBiz ? { id: mentionedBiz.id, name: mentionedBiz.name } : undefined,
    };
    const isFirst = messages.filter(m => m.role === 'user').length === 0;

    updateActive(c => ({
      ...c,
      title: isFirst ? trimmed.slice(0, 45) + (trimmed.length > 45 ? '…' : '') : c.title,
      messages: [...c.messages, userMsg],
      updatedAt: new Date(),
    }));

    setInput('');
    setMentionedBiz(null);
    setVisibleStepCount(1);
    setIsLoading(true);

    try {
      // Build API messages — inject mention context and already-found list
      const apiMessages = [...messages.filter(m => m.id !== 'welcome'), userMsg].map((m, idx, arr) => {
        let content = m.content;
        // For the last message (the one we just added), inject context
        if (idx === arr.length - 1) {
          if (mentionedBiz) {
            content = `[@${mentionedBiz.name}] Estoy preguntando sobre el siguiente negocio:\n- Nombre: ${mentionedBiz.name}\n- Industria: ${mentionedBiz.industry}\n- Descripción: ${mentionedBiz.description}${mentionedBiz.address ? `\n- Dirección: ${mentionedBiz.address}` : ''}${mentionedBiz.website ? `\n- Web: ${mentionedBiz.website}` : ''}\n\nPregunta: ${content}`;
          }
          // Collect ALL businesses across ALL conversations to avoid global repeats
          const alreadyFound = conversations
            .flatMap(c => c.messages)
            .filter(m => m.role === 'assistant' && m.businesses?.length)
            .flatMap(m => m.businesses!)
            .map(b => b.name)
            .filter(Boolean);
          if (alreadyFound.length > 0) {
            content += `\n\n[Sistema: Los siguientes negocios ya fueron sugeridos anteriormente (en cualquier conversación) y NO deben repetirse bajo ningún concepto: ${alreadyFound.join(', ')}]`;
          }
        }
        return { role: m.role, content };
      });

      const res = await fetch('/api/client-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error del servidor');

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || '',
        timestamp: new Date(),
        businesses: data.businesses?.length > 0 ? data.businesses : undefined,
      };

      updateActive(c => ({ ...c, messages: [...c.messages, botMsg], updatedAt: new Date() }));

      // Reveal cards one by one with staggered delay
      if (data.businesses?.length > 0) {
        data.businesses.forEach((biz: BusinessCard, idx: number) => {
          setTimeout(() => {
            setRevealedIds(prev => new Set([...prev, biz.id]));
            setTimeout(() => cardsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
          }, idx * 550 + 200);
        });
      }
    } catch (err: any) {
      updateActive(c => ({
        ...c,
        messages: [...c.messages, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ ${err.message}. Intentá de nuevo.`,
          timestamp: new Date(),
        }],
        updatedAt: new Date(),
      }));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const startNew = () => {
    const c = makeConversation();
    setConversations(prev => [c, ...prev]);
    setActiveId(c.id);
    setShowHistory(false);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const deletConv = (id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        const c = makeConversation();
        setActiveId(c.id);
        return [c];
      }
      if (id === activeId) setActiveId(filtered[0].id);
      return filtered;
    });
  };

  const sortedConvs = [...conversations].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="flex h-full bg-[#080808] text-white overflow-hidden" style={{ minHeight: 0 }}>

      {/* ── HISTORY SIDEBAR ───────────────────────────────── */}
      <div className={`flex-shrink-0 h-full bg-[#0f0f0f] border-r border-white/10 flex flex-col transition-all duration-300 ease-out overflow-hidden ${showHistory ? 'w-72' : 'w-0'}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
          <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Búsquedas</span>
          <button
            onClick={startNew}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[hsl(76,85%,67%)]/10 hover:bg-[hsl(76,85%,67%)]/20 border border-[hsl(76,85%,67%)]/30 text-[10px] uppercase tracking-widest font-bold text-[hsl(76,85%,67%)] transition-colors whitespace-nowrap"
          >
            <Plus size={10} /> Nueva
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sortedConvs.map(conv => {
            const clientCount = conv.messages
              .filter(m => m.businesses?.length)
              .reduce((acc, m) => acc + (m.businesses?.length ?? 0), 0);
            return (
              <div
                key={conv.id}
                onClick={() => { setActiveId(conv.id); setShowHistory(false); }}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${conv.id === activeId ? 'bg-[hsl(76,85%,67%)]/10 border border-[hsl(76,85%,67%)]/30' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${conv.id === activeId ? 'text-white' : 'text-white/60'}`}>{conv.title}</p>
                  <p className="text-[9px] text-white/25 mt-0.5 uppercase tracking-widest">
                    {conv.updatedAt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} · {clientCount} cliente{clientCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deletConv(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all flex-shrink-0"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MAIN AREA ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex-shrink-0 bg-[#080808]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setShowHistory(v => !v)}
              className={`p-2 rounded-xl transition-colors flex-shrink-0 ${showHistory ? 'bg-[hsl(76,85%,67%)]/10 text-[hsl(76,85%,67%)]' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
            >
              <MessagesSquare size={18} />
            </button>
            <div className="w-px h-6 bg-white/10 flex-shrink-0" />
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(76,85%,67%)] to-[hsl(76,85%,47%)] flex items-center justify-center flex-shrink-0">
              <Search size={16} className="text-black" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black tracking-tighter uppercase text-white leading-none">BUSCADOR DE CLIENTES</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold truncate">
                  {hasCards ? `${activeBusinesses.length} cliente${activeBusinesses.length !== 1 ? 's' : ''} encontrado${activeBusinesses.length !== 1 ? 's' : ''}` : 'Listo para buscar'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={startNew}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
          >
            <Plus size={14} /> <span className="hidden sm:inline">Nueva búsqueda</span>
          </button>
        </div>

        {/* Content: chat + cards panel */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-row">

          {/* Chat column — shrinks smoothly as cards panel expands */}
          <div className={`flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${hasCards ? 'border-r border-white/10' : ''}`}>

            {/* Welcome screen */}
            {!hasUserMessages ? (
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="max-w-2xl w-full mx-auto">
                  <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(76,85%,67%)] to-[hsl(76,85%,47%)] flex items-center justify-center shadow-2xl shadow-[hsl(76,85%,67%)]/20">
                      <Search size={30} className="text-black" />
                    </div>
                  </div>
                  <div className="text-center mb-10">
                    <h1 className="text-2xl sm:text-4xl font-light text-white mb-3 tracking-tight">
                      {greeting}{userName ? <>, <span className="font-semibold">{userName}</span></> : null}
                    </h1>
                    <p className="text-white/35 text-base">
                      ¿Qué tipo de <span className="text-white/60 font-medium">clientes</span> estás buscando hoy?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat, i) => (
                      <button
                        key={i}
                        onClick={() => { setInput(cat.prompt); inputRef.current?.focus(); }}
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
              /* Messages */
              <div className="flex-1 overflow-y-auto min-h-0 py-6 px-4 [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="max-w-xl mx-auto space-y-5">
                  {messages.filter(m => m.id !== 'welcome').map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${msg.role === 'assistant' ? 'bg-[hsl(76,85%,67%)]/10 border-[hsl(76,85%,67%)]/30' : 'bg-white/10 border-white/20'}`}>
                        {msg.role === 'assistant'
                          ? <Sparkles size={14} className="text-[hsl(76,85%,67%)]" />
                          : <User size={14} className="text-white/60" />
                        }
                      </div>
                      <div className={`max-w-[85%] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                        <div className={`px-4 py-3 rounded-2xl ${msg.role === 'assistant' ? 'bg-white/[0.04] border border-white/10 rounded-tl-md' : 'bg-[hsl(76,85%,67%)]/10 border border-[hsl(76,85%,67%)]/20 rounded-tr-md'}`}>
                          {msg.mention && (
                            <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-1 bg-[hsl(76,85%,67%)]/20 text-[hsl(76,85%,67%)] border border-[hsl(76,85%,67%)]/30 rounded-md text-[10px] font-bold uppercase tracking-widest">
                              <AtSign size={10} /> {msg.mention.name}
                            </div>
                          )}
                          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                          {msg.businesses && msg.businesses.length > 0 && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[hsl(76,85%,67%)] font-bold uppercase tracking-widest">
                              <Users size={11} />
                              {msg.businesses.length} ficha{msg.businesses.length !== 1 ? 's' : ''} generada{msg.businesses.length !== 1 ? 's' : ''} →
                            </div>
                          )}
                        </div>
                        <p className={`text-[9px] text-white/20 mt-1.5 uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : ''}`}>
                          {msg.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Thinking steps */}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border bg-[hsl(76,85%,67%)]/10 border-[hsl(76,85%,67%)]/30 animate-pulse">
                        <Sparkles size={14} className="text-[hsl(76,85%,67%)]" />
                      </div>
                      <div className="flex flex-col gap-0 pt-1">
                        {thinkingSteps.slice(0, visibleStepCount).map((step, i) => {
                          const isLast = i === visibleStepCount - 1;
                          const isDone = i < visibleStepCount - 1;
                          return (
                            <div key={i} className="flex items-stretch gap-3 animate-in fade-in slide-in-from-left-3 duration-400">
                              <div className="flex flex-col items-center w-5 flex-shrink-0">
                                {isLast ? (
                                  <div className="mt-[5px] flex-shrink-0">
                                    <Loader2 size={10} className="text-[hsl(76,85%,67%)] animate-spin" style={{ filter: 'drop-shadow(0 0 4px rgba(194,242,84,0.8))' }} />
                                  </div>
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full mt-[7px] flex-shrink-0 bg-white/25" />
                                )}
                                {!isLast && <div className="w-px flex-1 bg-gradient-to-b from-white/15 to-white/5 mt-1" />}
                              </div>
                              <div className="pb-2">
                                <span className={`text-xs leading-relaxed transition-colors duration-500 ${isLast ? 'text-white/55' : 'text-white/20'}`}>
                                  {isDone && <span className="inline-block w-3 mr-1.5 text-center text-[9px] text-white/20">✓</span>}
                                  {step}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {visibleStepCount >= thinkingSteps.length && (
                          <div className="ml-8 mt-1 h-1 w-24 rounded-full overflow-hidden bg-white/5 animate-in fade-in duration-500">
                            <div className="h-full w-1/2 rounded-full bg-[hsl(76,85%,67%)]/30" style={{ animation: 'shimmer 1.5s ease-in-out infinite' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Cards column — siempre renderizado, anima width de 0 → 58% */}
          <div className={`flex-shrink-0 flex flex-col h-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${hasCards ? 'w-[58%]' : 'w-0'}`}>
            <div className={`flex-1 h-full overflow-y-auto p-4 transition-opacity duration-300 delay-150 [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full ${hasCards ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Users size={14} className="text-[hsl(76,85%,67%)]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  {activeBusinesses.length} cliente{activeBusinesses.length !== 1 ? 's' : ''} encontrado{activeBusinesses.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {activeBusinesses.map(biz =>
                  revealedIds.has(biz.id) ? (
                    <BizCard
                      key={biz.id}
                      biz={biz}
                      onMention={b => {
                        setMentionedBiz(b);
                        setTimeout(() => {
                          inputRef.current?.focus();
                          inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 50);
                      }}
                    />
                  ) : null
                )}
              </div>
              <div ref={cardsEndRef} />
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-2 sm:px-4 pb-4 sm:pb-5 pt-2 border-t border-white/5">
          <div className={`mx-auto ${hasCards ? 'max-w-none' : 'max-w-2xl'}`}>
            <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-[hsl(76,85%,67%)]/30 transition-colors">
              {mentionedBiz && (
                <div className="flex items-center gap-1.5 bg-[hsl(76,85%,67%)]/10 border border-[hsl(76,85%,67%)]/30 text-[hsl(76,85%,67%)] px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest w-max">
                  <AtSign size={11} /> {mentionedBiz.name}
                  <button onClick={() => setMentionedBiz(null)} className="hover:text-white transition-colors ml-1">
                    <X size={11} />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <Search size={16} className="flex-shrink-0 text-white/20 mb-2.5" />
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={mentionedBiz ? `Preguntá algo sobre ${mentionedBiz.name}...` : 'Buscá clientes por rubro, zona o industria... (Enter para buscar)'}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/20 resize-none outline-none max-h-[160px] py-2 px-1 leading-relaxed"
                />
                <button
                  onClick={sendMessage}
                  disabled={(!input.trim() && !mentionedBiz) || isLoading}
                  className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all mb-0.5 ${(input.trim() || mentionedBiz) && !isLoading ? 'bg-[hsl(76,85%,67%)] text-black hover:scale-105 shadow-lg shadow-[hsl(76,85%,67%)]/20' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </div>
            </div>
            <p className="text-[9px] text-white/15 text-center mt-2 uppercase tracking-widest">
              Potenciado por Gemini · Los resultados son aproximados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
