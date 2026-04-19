'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, RotateCcw, X, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function formatMarkdown(text: string): string {
  let html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-white/5 border border-white/10 rounded-xl p-4 my-2 overflow-x-auto text-xs font-mono text-white/80"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[hsl(76,85%,67%)] text-xs font-mono">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-white mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-white mt-3 mb-1">$1</h2>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-white/10 my-3" />')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc list-outside text-white/70 text-sm leading-relaxed">$1</li>')
    // Table rows (basic)
    .replace(/\|([^|]+)\|/g, (match) => {
      const cells = match.split('|').filter(Boolean).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) return '';
      const tag = cells.length > 0 ? 'td' : 'td';
      return '<tr>' + cells.map(c => `<${tag} class="px-3 py-1.5 border border-white/10 text-sm">${c}</${tag}>`).join('') + '</tr>';
    })
    // Newlines
    .replace(/\n/g, '<br />');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*?<\/li><br \/>)+)/g, (match) => {
    return '<ul class="my-2 space-y-0.5">' + match.replace(/<br \/>/g, '') + '</ul>';
  });

  // Wrap consecutive <tr> in <table>
  html = html.replace(/((?:<tr>.*?<\/tr>(?:<br \/>)?)+)/g, (match) => {
    return '<table class="border-collapse border border-white/10 rounded-lg my-2 w-full">' + match.replace(/<br \/>/g, '') + '</table>';
  });

  return html;
}

export default function UcoBotTab({ projectId, projectName }: { projectId: string; projectName: string }) {
  const STORAGE_KEY = `ucobot-chat-${projectId}`;
  const [isOpen, setIsOpen] = useState(false);

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

Preguntame lo que necesites sobre este proyecto.`,
    timestamp: new Date(),
  });

  // Load from localStorage
  const loadMessages = (): Message[] => {
    if (typeof window === 'undefined') return [getWelcomeMessage()];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch {}
    return [getWelcomeMessage()];
  };

  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persist to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, STORAGE_KEY]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build history for API (skip welcome)
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

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Error: ${error.message}. Intentá de nuevo.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([getWelcomeMessage()]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const suggestions = [
    '¿Cuáles son las tareas pendientes de este proyecto?',
    'Dame un resumen completo del proyecto',
    '¿Qué hay en el vault?',
    '¿Quién tiene tareas asignadas?',
  ];

  return (
    <>
      {/* Floating Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(76,85%,67%)] to-[hsl(76,85%,47%)] flex items-center justify-center shadow-lg shadow-[hsl(76,85%,67%)]/30 hover:scale-110 transition-all duration-300 group"
        >
          <MessageCircle size={24} className="text-black" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-[hsl(76,85%,67%)]/40 animate-ping opacity-30" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[95] w-[420px] h-[600px] max-h-[calc(100vh-100px)] flex flex-col bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(76,85%,67%)] to-[hsl(76,85%,47%)] flex items-center justify-center">
                <Bot size={18} className="text-black" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tighter uppercase">UCOBOT</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold truncate max-w-[180px]">
                    {projectName}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-white/30 hover:text-white/60"
                title="Nuevo chat"
              >
                <RotateCcw size={14} />
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

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-3 p-4 min-h-0 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
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

                {/* Bubble */}
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
                      <p className="text-[13px] text-white/90 leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                  <p className={`text-[8px] text-white/20 mt-1 uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {msg.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
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

          {/* Suggestions (only show when just welcome message) */}
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

          {/* Input Area */}
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
