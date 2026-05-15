'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Key, Link as LinkIcon, Globe, X, UploadCloud, File as FileIcon, FileText, Trash2, Edit3, DollarSign, Unlink, CheckCircle2, Clock, AlertTriangle, ListTodo, Plus, User, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import UcoBotTab from './UcoBotTab';
import ContentManagerTab from './ContentManagerTab';

gsap.registerPlugin(useGSAP);

const formatARS = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);
};

export default function ProjectDetailView({ project, onBack }: { project: any, onBack: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const subParam = searchParams.get('sub') || 'vault';
  const activeTab = subParam as 'vault' | 'finances' | 'services' | 'tasks' | 'content';

  const setActiveTab = (tab: 'vault' | 'finances' | 'services' | 'tasks' | 'content') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sub', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  
  // Modal States
  const [isAddVaultModalOpen, setIsAddVaultModalOpen] = useState(false);
  const [isUpdateFinanceModalOpen, setIsUpdateFinanceModalOpen] = useState(false);
  const [isLinkServiceModalOpen, setIsLinkServiceModalOpen] = useState(false);
  
  // Drag & Drop State
  const [dragActive, setDragActive] = useState(false);

  // Forms State
  const [newVaultItem, setNewVaultItem] = useState({
    item_type: 'link', // 'link', 'nota', 'credencial', 'archivo'
    title: '',
    content: ''
  });

  const [financeForm, setFinanceForm] = useState({
    type: 'abono',
    amount: '',
    description: '',
    payment_method: 'transferencia'
  });

  const [serviceForm, setServiceForm] = useState({
    service_id: ''
  });

  const supabase = createClient();
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [newVaultItemIds, setNewVaultItemIds] = useState<Set<string>>(new Set());
  const [selectedVaultItem, setSelectedVaultItem] = useState<any | null>(null);
  const [isViewVaultModalOpen, setIsViewVaultModalOpen] = useState(false);
  const [isEditingVaultItem, setIsEditingVaultItem] = useState(false);

  // Finance State
  const [projectPrice, setProjectPrice] = useState<number>(project?.price || 0);
  const [projectPaymentType, setProjectPaymentType] = useState<string>(project?.payment_type || 'unico');
  const [financeHistory, setFinanceHistory] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState<number>(0);

  // Services State
  const [allServices, setAllServices] = useState<any[]>([]);
  const [linkedServices, setLinkedServices] = useState<any[]>([]);

  // Check if project has social media management service
  const hasSocialService = linkedServices.some(
    (s: any) => s.title?.toUpperCase().includes('GESTIÓN DE REDES') || s.title?.toUpperCase().includes('REDES SOCIALES')
  );

  // Tasks State
  const [tasks, setTasks] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isViewTaskModalOpen, setIsViewTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'media',
    start_date: new Date().toISOString().slice(0, 16),
    end_date: ''
  });

  useEffect(() => {
    if (!project?.id) return;

    const fetchAll = async () => {
      // Fetch vault items
      const { data: vault } = await supabase
        .from('project_vault')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
      if (vault) setVaultItems(vault);

      // Fetch all available services (catálogo)
      const { data: services } = await supabase
        .from('services')
        .select('*')
        .order('title', { ascending: true });
      if (services) setAllServices(services);

      // Fetch linked services for this project
      const { data: linked } = await supabase
        .from('project_services')
        .select('service_id, services(id, title, subtitle)')
        .eq('project_id', project.id);
      if (linked) setLinkedServices(linked.map((l: any) => l.services));

      // Fetch finance data from project itself
      setProjectPrice(project.price || 0);
      setProjectPaymentType(project.payment_type || 'unico');

      // Fetch payment history
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('project_id', project.id)
        .order('payment_date', { ascending: false });
      if (payments) {
        setFinanceHistory(payments);
        const paid = payments
          .filter(p => p.status === 'recibido')
          .reduce((sum, p) => sum + Number(p.amount), 0);
        setTotalPaid(paid);
      }

      // Fetch tasks for this project
      const { data: taskData } = await supabase
        .from('project_tasks')
        .select('*, assigned:assigned_to(id, full_name), creator:created_by(id, full_name)')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
      if (taskData) setTasks(taskData);

      // Fetch all profiles (employees)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name', { ascending: true });
      if (profiles) setAllProfiles(profiles);
    };

    fetchAll();
  }, [project]);

  // Realtime: escuchar nuevos items en el vault (desde UcoBot u otra fuente)
  useEffect(() => {
    if (!project?.id) return;

    const channel = supabase
      .channel(`vault-realtime-${project.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_vault', filter: `project_id=eq.${project.id}` },
        (payload) => {
          const newItem = payload.new as any;
          setVaultItems(prev => {
            if (prev.some(item => item.id === newItem.id)) return prev;
            return [newItem, ...prev];
          });
          // Marcar como nuevo para la animación
          setNewVaultItemIds(prev => new Set([...prev, newItem.id]));
          // Animar con GSAP después de que React renderice
          setTimeout(() => {
            gsap.fromTo(
              `.vault-item-${newItem.id}`,
              { opacity: 0, x: -60, scale: 0.92 },
              { opacity: 1, x: 0, scale: 1, duration: 0.55, ease: 'back.out(1.4)', clearProps: 'all' }
            );
            // Limpiar el estado de "nuevo" después de la animación
            setTimeout(() => {
              setNewVaultItemIds(prev => {
                const next = new Set(prev);
                next.delete(newItem.id);
                return next;
              });
            }, 800);
          }, 30);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [project?.id]);

  // Dynamic Icon Helper
  const getVaultIcon = (type: string) => {
    switch(type) {
        case 'link': return { icon: <LinkIcon size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/20' };
        case 'credencial': return { icon: <Key size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
        case 'archivo': return { icon: <FileIcon size={18} />, color: 'text-orange-400', bg: 'bg-orange-500/20' };
        case 'nota': return { icon: <FileText size={18} />, color: 'text-purple-400', bg: 'bg-purple-500/20' };
        default: return { icon: <FileIcon size={18} />, color: 'text-white/50', bg: 'bg-white/10' };
    }
  }

  // Handlers
  const handleAddVaultItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) return;

    const payload = {
      project_id: project.id,
      item_type: newVaultItem.item_type,
      title: newVaultItem.title,
      content: newVaultItem.item_type === 'archivo' ? newVaultItem.content : (newVaultItem.content || 'Sin contenido detallado'),
    };

    const { data, error } = await supabase
      .from('project_vault')
      .insert([payload])
      .select()
      .single();

    if (data && !error) {
      setVaultItems([data, ...vaultItems]);
      setIsAddVaultModalOpen(false);
      setNewVaultItem({ item_type: 'link', title: '', content: '' });

      setTimeout(() => {
        gsap.fromTo(`.vault-item-${data.id}`,
          { opacity: 0, scale: 0.8, y: 50 },
          { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.5)", clearProps: 'all' }
        );
      }, 50);
    }
  };

  const handleUpdateVaultItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVaultItem?.id) return;
    
    const { data: updated, error } = await supabase
      .from('project_vault')
      .update({
        title: selectedVaultItem.title,
        content: selectedVaultItem.content,
        item_type: selectedVaultItem.item_type
      })
      .eq('id', selectedVaultItem.id)
      .select()
      .single();

    if (updated && !error) {
      setVaultItems(vaultItems.map(item => item.id === selectedVaultItem.id ? updated : item));
      setIsViewVaultModalOpen(false);
      setSelectedVaultItem(null);
    }
  };

  const handleDeleteVaultItem = async (itemId: string) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;
    const { error } = await supabase.from('project_vault').delete().eq('id', itemId);
    if (!error) {
      setVaultItems(vaultItems.filter(item => item.id !== itemId));
      setIsViewVaultModalOpen(false);
      setSelectedVaultItem(null);
    }
  };

  const handleFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) return;

    const amount = parseFloat(financeForm.amount);
    if (isNaN(amount) || amount <= 0) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (financeForm.type === 'modificar_total') {
      const { error } = await supabase
        .from('projects')
        .update({ price: amount })
        .eq('id', project.id);
      if (!error) setProjectPrice(amount);
    } else {
      const paymentData = {
        project_id: project.id,
        amount,
        currency: 'USD',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: financeForm.payment_method,
        status: 'recibido',
        notes: financeForm.description || '',
        created_by: user?.id
      };

      const { data: newPayment, error } = await supabase
        .from('payments')
        .insert([paymentData])
        .select()
        .single();

      if (newPayment && !error) {
        setFinanceHistory([newPayment, ...financeHistory]);
        setTotalPaid(totalPaid + amount);

        await supabase.rpc('create_activity', {
          p_title: 'Pago Registrado',
          p_subtitle: `${project.name} - $${amount}`,
          p_activity_type: 'payment_received',
          p_related_id: project.id
        });
      }
    }

    setIsUpdateFinanceModalOpen(false);
    setFinanceForm({ type: 'abono', amount: '', description: '', payment_method: 'transferencia' });
  };

  const handleUpdatePaymentType = async (newType: string) => {
    if (!project?.id) return;
    const { error } = await supabase
      .from('projects')
      .update({ payment_type: newType })
      .eq('id', project.id);
    if (!error) setProjectPaymentType(newType);
  };

  const handleLinkServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id || !serviceForm.service_id) return;

    const { error } = await supabase
      .from('project_services')
      .insert([{ project_id: project.id, service_id: serviceForm.service_id }]);

    if (!error) {
      // Re-fetch linked services
      const { data: linked } = await supabase
        .from('project_services')
        .select('service_id, services(id, title, subtitle)')
        .eq('project_id', project.id);
      if (linked) setLinkedServices(linked.map((l: any) => l.services));
      setIsLinkServiceModalOpen(false);
      setServiceForm({ service_id: '' });
    }
  };

  const handleUnlinkService = async (serviceId: string) => {
    if (!project?.id) return;
    if (!confirm('¿Desvincular este servicio del proyecto?')) return;
    const { error } = await supabase
      .from('project_services')
      .delete()
      .eq('project_id', project.id)
      .eq('service_id', serviceId);
    if (!error) {
      setLinkedServices(linkedServices.filter(s => s.id !== serviceId));
    }
  };

  // ====== TASK HANDLERS ======
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) return;

    const { data: { user } } = await supabase.auth.getUser();

    const payload: any = {
      project_id: project.id,
      title: taskForm.title,
      description: taskForm.description || '',
      priority: taskForm.priority,
      created_by: user?.id || null,
      assigned_to: taskForm.assigned_to || null,
      start_date: taskForm.start_date || new Date().toISOString(),
      end_date: taskForm.end_date || null,
    };

    const { data, error } = await supabase
      .from('project_tasks')
      .insert([payload])
      .select('*, assigned:assigned_to(id, full_name), creator:created_by(id, full_name)')
      .single();

    if (data && !error) {
      setTasks([data, ...tasks]);
      setIsAddTaskModalOpen(false);
      setTaskForm({ title: '', description: '', assigned_to: '', priority: 'media', start_date: new Date().toISOString().slice(0, 16), end_date: '' });
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'completada') updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;

    const { data, error } = await supabase
      .from('project_tasks')
      .update(updates)
      .eq('id', taskId)
      .select('*, assigned:assigned_to(id, full_name), creator:created_by(id, full_name)')
      .single();

    if (data && !error) {
      setTasks(tasks.map(t => t.id === taskId ? data : t));
      if (selectedTask?.id === taskId) setSelectedTask(data);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('¿Eliminar esta tarea permanentemente?')) return;
    const { error } = await supabase.from('project_tasks').delete().eq('id', taskId);
    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId));
      setIsViewTaskModalOpen(false);
      setSelectedTask(null);
    }
  };

  const getTaskPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgente': return { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
      case 'alta': return { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
      case 'media': return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
      case 'baja': return { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' };
      default: return { color: 'text-white/50', bg: 'bg-white/10', border: 'border-white/10' };
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completada': return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'en_progreso': return <Clock size={16} className="text-yellow-400" />;
      default: return <ListTodo size={16} className="text-white/40" />;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setNewVaultItem({ ...newVaultItem, content: `Archivo: ${file.name}` });
    }
  };

  const handleFileClickSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files[0]) {
      setNewVaultItem({ ...newVaultItem, content: `Archivo: ${e.target.files[0].name}` });
    }
  };

  useGSAP(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    );
  }, []);

  return (
    <>
    <div ref={containerRef} className="space-y-8">
      {/* HEADER DEL PROYECTO */}
      <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-4 lg:p-8">
        <div className="w-full">
          <button
            onClick={onBack}
            className="text-white/50 hover:text-white text-xs mb-2 transition-colors flex items-center gap-2 uppercase tracking-widest"
          >
            ← Volver a Proyectos
          </button>
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold uppercase tracking-tighter leading-tight">
            {project.name}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-medium uppercase tracking-wider backdrop-blur-md">
              {project.status || 'En Desarrollo'}
            </span>
            <span className="text-white/50 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {project.client_name || 'Sin Asignar'}
            </span>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN INTERNA DEL PROYECTO */}
      <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex gap-1.5 p-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full w-max min-w-full sm:min-w-0 sm:w-fit">
          {[
            { id: 'vault', label: 'El Baúl' },
            { id: 'tasks', label: 'Tareas' },
            { id: 'finances', label: 'Finanzas' },
            { id: 'services', label: 'Servicios' },
            ...(hasSocialService ? [{ id: 'content', label: 'Contenido' }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all uppercase tracking-widest outline-none whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO DE LAS PESTAÑAS */}
      <div className="mt-8 relative">
        {/* EL BAÚL */}
        {activeTab === 'vault' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl sm:text-2xl font-semibold uppercase tracking-tight text-white/90">Archivos y Accesos</h3>
              <button
                onClick={() => setIsAddVaultModalOpen(true)}
                className="flex-shrink-0 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs sm:text-sm uppercase tracking-wider transition-colors border border-white/10"
              >
                + Agregar
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max gap-4" style={{ gridAutoFlow: 'dense' }}>
              {vaultItems.map((item) => {
                const design = getVaultIcon(item.item_type);
                
                // Parse image if exists
                const imgMatch = item.content.match(/!\[.*?\]\((data:image\/[^;]+;base64,[^)]+)\)/) || item.content.match(/!\[.*?\]\((https:\/\/[^)]+)\)/);
                const hasImage = !!imgMatch;
                const imageUrl = imgMatch ? imgMatch[1] : null;
                
                // Detect script or long note
                const isScript = item.item_type === 'note' && item.content.length > 150;
                
                // Dynamic sizing for Bento Grid
                let spanClasses = 'col-span-1 row-span-1';
                if (hasImage) {
                  spanClasses = 'col-span-1 row-span-1 aspect-square';
                } else if (isScript) {
                  spanClasses = 'col-span-1 sm:col-span-2 row-span-2 min-h-[200px]';
                }

                // Dynamic tags based on title/type
                const tags = [];
                const lowerTitle = item.title.toLowerCase();
                if (lowerTitle.includes('carrusel') || lowerTitle.includes('carousel')) tags.push('CARRUSEL');
                if (lowerTitle.includes('reel') || lowerTitle.includes('video') || lowerTitle.includes('vlog')) tags.push('VIDEO');
                if (lowerTitle.includes('idea')) tags.push('IDEA');
                if (tags.length === 0 && item.item_type === 'note') tags.push('NOTA');

                return (
                  <div 
                    key={item.id}
                    className={`vault-item-${item.id} ${spanClasses} flex flex-col cursor-pointer overflow-hidden group bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md border transition-all rounded-3xl relative ${
                      newVaultItemIds.has(item.id)
                        ? 'border-[hsl(76,85%,67%)]/50 shadow-[0_0_20px_rgba(194,242,84,0.15)]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => { setSelectedVaultItem(item); setIsViewVaultModalOpen(true); }}
                  >
                    {hasImage ? (
                      <div className="relative w-full h-full flex-1">
                        <img src={imageUrl!} alt={item.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                          <h4 className="font-bold text-lg text-white mb-1 drop-shadow-lg">{item.title}</h4>
                          <p className="text-white/60 text-xs line-clamp-2 drop-shadow-md font-medium">{item.content.replace(/!\[.*?\]\(.*?\)/, '').trim() || 'Ver imagen generada'}</p>
                        </div>
                      </div>
                    ) : isScript ? (
                      <div className="p-6 flex flex-col h-full relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(76,85%,67%)]/5 to-transparent pointer-events-none" />
                        <div className="flex flex-wrap gap-2 mb-4 relative z-10">
                           {tags.map(t => (
                             <span key={t} className="text-[9px] font-bold uppercase tracking-widest bg-[hsl(76,85%,67%)]/10 text-[hsl(76,85%,67%)] px-2.5 py-1 rounded-full border border-[hsl(76,85%,67%)]/20">{t}</span>
                           ))}
                        </div>
                        <h4 className="font-bold text-lg mb-3 text-white/90 relative z-10">{item.title}</h4>
                        <div className="text-[11px] text-white/50 line-clamp-[8] leading-relaxed whitespace-pre-wrap flex-1 relative z-10 font-medium">
                          {item.content}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#111] to-transparent pointer-events-none" />
                      </div>
                    ) : (
                      <div className="p-6 flex flex-col h-full justify-between">
                        <div>
                          <div className={`w-10 h-10 rounded-2xl ${design.bg} ${design.color} flex items-center justify-center mb-4 shadow-lg`}>
                            {design.icon}
                          </div>
                          <h4 className="font-semibold text-sm mb-2">{item.title}</h4>
                          <p className="text-white/40 text-[11px] line-clamp-3 leading-relaxed font-medium">
                            {item.content}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {vaultItems.length === 0 && (
                <div className="col-span-full py-16 text-center text-white/40 text-sm uppercase tracking-widest">
                  El Baúl está vacío. Generá contenido con UcoBot o agregá archivos.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAREAS */}
        {activeTab === 'tasks' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl sm:text-2xl font-semibold uppercase tracking-tight text-white/90">Tareas del Proyecto</h3>
              <button
                onClick={() => setIsAddTaskModalOpen(true)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[hsl(76,85%,67%)] text-black rounded-full text-xs sm:text-sm uppercase tracking-wider font-bold hover:scale-[1.03] transition-transform shadow-[0_0_20px_rgba(194,242,84,0.2)]"
              >
                <Plus size={14} /> <span className="hidden sm:inline">Nueva</span> Tarea
              </button>
            </div>

            {/* Kanban Board */}
            <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {([
                { id: 'pendiente', label: 'Pendiente', icon: <ListTodo size={16} className="text-white/40" />, accent: 'border-white/20', headerBg: 'bg-white/5', countBg: 'bg-white/10 text-white/50' },
                { id: 'en_progreso', label: 'En Progreso', icon: <Clock size={16} className="text-yellow-400" />, accent: 'border-yellow-500/30', headerBg: 'bg-yellow-500/5', countBg: 'bg-yellow-500/20 text-yellow-400' },
                { id: 'completada', label: 'Completada', icon: <CheckCircle2 size={16} className="text-emerald-400" />, accent: 'border-emerald-500/30', headerBg: 'bg-emerald-500/5', countBg: 'bg-emerald-500/20 text-emerald-400' },
              ] as const).map((column) => {
                const columnTasks = tasks.filter(t => t.status === column.id);
                const isOver = dragOverColumn === column.id;

                return (
                  <div
                    key={column.id}
                    onDragOver={(e) => { e.preventDefault(); setDragOverColumn(column.id); }}
                    onDragLeave={() => setDragOverColumn(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverColumn(null);
                      if (draggedTaskId) {
                        handleUpdateTaskStatus(draggedTaskId, column.id);
                        setDraggedTaskId(null);
                      }
                    }}
                    className={`flex flex-col rounded-2xl border transition-all duration-200 min-w-[280px] md:min-w-0 snap-center flex-shrink-0 md:flex-shrink ${
                      isOver
                        ? `${column.accent} bg-white/[0.03] shadow-[0_0_30px_rgba(255,255,255,0.05)] scale-[1.01]`
                        : 'border-white/10 bg-white/[0.02]'
                    }`}
                  >
                    {/* Column Header */}
                    <div className={`flex items-center justify-between px-5 py-4 border-b border-white/10 rounded-t-2xl ${column.headerBg}`}>
                      <div className="flex items-center gap-2">
                        {column.icon}
                        <span className="text-xs font-bold uppercase tracking-widest text-white/70">{column.label}</span>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${column.countBg}`}>
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Column Body */}
                    <div className={`flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[60vh] transition-colors ${isOver ? 'bg-white/[0.02]' : ''}`}>
                      {columnTasks.map((task: any) => {
                        const pStyle = getTaskPriorityStyle(task.priority);
                        const isOverdue = task.end_date && new Date(task.end_date) < new Date() && task.status !== 'completada';
                        const isDragging = draggedTaskId === task.id;

                        return (
                          <div
                            key={task.id}
                            className={`grid transition-all duration-300 ease-out ${
                              isDragging
                                ? 'grid-rows-[0fr] opacity-0 !mt-0'
                                : 'grid-rows-[1fr] opacity-100'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.effectAllowed = 'move';
                                  setDraggedTaskId(task.id);
                                }}
                                onDragEnd={() => { setDraggedTaskId(null); setDragOverColumn(null); }}
                                onClick={() => { setSelectedTask(task); setIsViewTaskModalOpen(true); }}
                                className={`p-4 rounded-xl border cursor-grab active:cursor-grabbing transition-all group mb-0.5 ${
                                  isOverdue
                                    ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                                }`}
                              >
                                {/* Priority + Overdue */}
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${pStyle.bg} ${pStyle.color} border ${pStyle.border}`}>
                                    {task.priority}
                                  </span>
                                  {isOverdue && (
                                    <span className="flex items-center gap-1 text-[9px] text-red-400 font-bold uppercase tracking-widest">
                                      <AlertTriangle size={10} /> Vencida
                                    </span>
                                  )}
                                </div>

                                {/* Title */}
                                <p className={`text-sm font-semibold leading-snug mb-2 ${task.status === 'completada' ? 'line-through text-white/30' : 'text-white'}`}>
                                  {task.title}
                                </p>

                                {/* Description preview */}
                                {task.description && (
                                  <p className="text-[11px] text-white/30 line-clamp-2 mb-3">{task.description}</p>
                                )}

                                {/* Footer: assignee + dates */}
                                <div className="flex items-center justify-between text-[10px] text-white/25 uppercase tracking-widest">
                                  <div className="flex items-center gap-1">
                                    {task.assigned?.full_name ? (
                                      <>
                                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center border border-white/10 text-[8px] font-bold text-[hsl(76,85%,67%)]">
                                          {task.assigned.full_name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="ml-1">{task.assigned.full_name.split(' ')[0]}</span>
                                      </>
                                    ) : (
                                      <span className="text-white/15">Sin asignar</span>
                                    )}
                                  </div>
                                  {task.start_date && (
                                    <span className="flex items-center gap-1">
                                      <Clock size={9} />
                                      {new Date(task.start_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                                      {task.end_date && <> → {new Date(task.end_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</>}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {columnTasks.length === 0 && (
                        <div className={`py-8 text-center border-2 border-dashed rounded-xl transition-colors ${isOver ? 'border-[hsl(76,85%,67%)]/30 bg-[hsl(76,85%,67%)]/5' : 'border-white/5'}`}>
                          <p className="text-white/20 text-[10px] uppercase tracking-widest">
                            {isOver ? 'Soltar aquí' : 'Vacío'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {tasks.length === 0 && (
              <div className="py-16 text-center">
                <ListTodo size={48} className="text-white/10 mx-auto mb-4" />
                <p className="text-white/40 text-sm uppercase tracking-widest">
                  No hay tareas todavía. Crea la primera tarea del proyecto.
                </p>
              </div>
            )}
          </div>
        )}

        {/* FINANZAS */}
        {activeTab === 'finances' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 flex flex-col justify-center items-start relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(76,85%,67%)]/5 to-transparent z-0 pointer-events-none"></div>
                <div className="relative z-10 w-full">
                  <h3 className="text-white/50 text-sm uppercase tracking-widest mb-2">Modelo de Pago</h3>
                  <div className="flex flex-wrap items-center gap-2 mb-8">
                    {[
                      { value: 'unico', label: 'Pago Único' },
                      { value: 'mensual', label: 'Mensual' },
                      { value: 'quincenal', label: 'Quincenal' },
                      { value: 'trimestral', label: 'Trimestral' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => handleUpdatePaymentType(value)}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${projectPaymentType === value ? 'bg-white text-black border-white' : 'bg-white/5 text-white/50 border-white/10 hover:border-white/30'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <h3 className="text-white/50 text-sm uppercase tracking-widest mb-2">Precio del Proyecto</h3>
                  <div className="text-4xl font-light mb-2">${projectPrice.toLocaleString()} <span className="text-xl text-white/30">USD</span></div>

                  <div className="flex items-center justify-between mb-8">
                    <div className="text-sm text-white/70">
                      Pagado: <span className="text-[hsl(76,85%,67%)] font-bold">${totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-white/70">
                      Pendiente: <span className="text-orange-400 font-bold">${(projectPrice - totalPaid).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-white/10 rounded-full h-2 mb-6">
                    <div
                      className="bg-[hsl(76,85%,67%)] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((totalPaid / projectPrice) * 100, 100)}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setFinanceForm({ ...financeForm, type: 'abono' });
                        setIsUpdateFinanceModalOpen(true);
                      }}
                      className="py-3 bg-[hsl(76,85%,67%)] text-black font-bold rounded-xl uppercase tracking-widest hover:scale-[1.02] transition-transform text-xs"
                    >
                      + Registrar Pago
                    </button>
                    <button
                      onClick={() => {
                        setFinanceForm({ ...financeForm, type: 'modificar_total' });
                        setIsUpdateFinanceModalOpen(true);
                      }}
                      className="py-3 bg-white/10 text-white font-bold rounded-xl uppercase tracking-widest hover:bg-white/20 transition-colors text-xs border border-white/20"
                    >
                      Editar Precio
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                <h3 className="text-lg font-semibold uppercase tracking-tight text-white mb-6 flex justify-between items-center">
                  Historial de Pagos
                  <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full font-bold">{financeHistory.length} movimientos</span>
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {financeHistory.map((payment, idx) => (
                    <div key={payment.id || idx} className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${payment.amount > 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                          <DollarSign size={14} className={payment.amount > 0 ? 'text-emerald-400' : 'text-red-400'} />
                        </div>
                        <div>
                          <div className={`font-medium text-sm ${payment.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {payment.amount > 0 ? '+' : ''}${Math.abs(payment.amount).toLocaleString()}
                          </div>
                          <div className="text-xs text-white/50">
                            {payment.payment_method} · {new Date(payment.payment_date).toLocaleDateString('es-AR')}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                        payment.status === 'recibido' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  ))}
                  {financeHistory.length === 0 && (
                    <div className="text-center py-8 text-white/40 text-sm">
                      No hay pagos registrados todavía.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SERVICIOS */}
        {activeTab === 'services' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl sm:text-2xl font-semibold uppercase tracking-tight text-white/90">Servicios</h3>
              <button
                onClick={() => setIsLinkServiceModalOpen(true)}
                className="flex-shrink-0 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs sm:text-sm uppercase tracking-wider transition-colors border border-white/10"
              >
                + Vincular
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {linkedServices.map((service: any) => (
               <div key={service.id} className="flex items-center gap-6 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] group hover:border-white/20 transition-all relative overflow-hidden">
                 <div className="absolute inset-0 bg-[hsl(76,85%,67%)]/5 opacity-0 group-hover:opacity-100 transition-opacity z-0 pointer-events-none"></div>
                 <div className="w-14 h-14 rounded-full border border-white/10 bg-black/50 flex flex-shrink-0 items-center justify-center text-white/90 relative z-10">
                   <Globe size={26} />
                 </div>
                 <div className="relative z-10 w-full">
                   <div className="flex justify-between items-start w-full">
                     <h4 className="text-lg font-bold text-white tracking-widest uppercase mb-1">{service.title}</h4>
                     <button 
                       onClick={() => handleUnlinkService(service.id)}
                       className="flex items-center gap-1 text-xs text-white/30 hover:text-red-400 transition-colors uppercase font-bold tracking-widest"
                     >
                       <Unlink size={14} /> Desvincular
                     </button>
                   </div>
                   <p className="text-sm text-white/50 line-clamp-2">{service.subtitle}</p>
                 </div>
               </div>
              ))}

              {linkedServices.length === 0 && (
                <div className="col-span-full py-12 text-center text-white/40 text-sm uppercase tracking-widest">
                  No hay servicios vinculados. Vincula servicios del catálogo de Codea.
                </div>
              )}
            </div>
          </div>
        )}

        {/* GESTOR DE CONTENIDO */}
        {activeTab === 'content' && hasSocialService && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ContentManagerTab projectId={project.id} />
          </div>
        )}

        {/* MODALES GLOBALES */}

        {/* MODAL DEL BAÚL */}
        {isAddVaultModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 lg:p-10 w-full max-w-xl shadow-2xl relative">
              <button 
                onClick={() => setIsAddVaultModalOpen(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold uppercase tracking-tighter mb-8 text-white">
                Guardar en El Baúl
              </h2>
              
              <form onSubmit={handleAddVaultItem} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">¿Qué vas a guardar?</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 appearance-none"
                    value={newVaultItem.item_type}
                    onChange={(e) => setNewVaultItem({ ...newVaultItem, item_type: e.target.value })}
                  >
                    <option value="link" className="text-black">Enlace Externo (Figma, Drive, Notion)</option>
                    <option value="credencial" className="text-black">Credenciales (Usuario/Contraseña)</option>
                    <option value="nota" className="text-black">Nota Privada (Texto Largo)</option>
                    <option value="archivo" className="text-black">Subir Archivo (.zip, .pdf, imágenes)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Título Identificador</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                    placeholder={
                      newVaultItem.item_type === 'link' ? "Ej: Archivo de Figma UI" : 
                      newVaultItem.item_type === 'archivo' ? "Ej: Logo en Vectores (.zip)" :
                      newVaultItem.item_type === 'credencial' ? "Ej: Accesos de Hostinger" : "Ej: Requerimientos del Cliente"
                    }
                    value={newVaultItem.title}
                    onChange={(e) => setNewVaultItem({ ...newVaultItem, title: e.target.value })}
                  />
                </div>

                {newVaultItem.item_type === 'archivo' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Sube tu Archivo</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={handleDrop}
                      className={`w-full min-h-[140px] border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                        dragActive ? 'border-[hsl(76,85%,67%)] bg-[hsl(76,85%,67%)]/10' : 'border-white/20 hover:border-white/40 hover:bg-white/10 bg-white/5'
                      }`}
                    >
                      <UploadCloud className={`${newVaultItem.content ? 'text-[hsl(76,85%,67%)]' : 'text-white/50'} mb-3 transition-colors`} size={32} />
                      <p className={`text-sm text-center font-medium ${newVaultItem.content ? 'text-[hsl(76,85%,67%)]' : 'text-white/70'}`}>
                        {newVaultItem.content || "Arrastra tu archivo aquí o haz clic para subir"}
                      </p>
                      {!newVaultItem.content && <p className="text-xs text-white/40 text-center mt-1">Soporta PDF, JPG, PNG, ZIP (Max 50MB)</p>}
                      
                      {/* Hidden Input File */}
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        className="hidden" 
                        onChange={handleFileClickSelect} 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                      {newVaultItem.item_type === 'link' ? 'URL a guardar' : 'Contenido'}
                    </label>
                    <textarea 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 min-h-[120px] resize-none"
                      placeholder={
                        newVaultItem.item_type === 'credencial' ? "Usuario: admin\nPass: 123456" : 
                        newVaultItem.item_type === 'link' ? "https://figma.com/..." : 
                        "Escribe el contenido secreto aquí..."
                      }
                      value={newVaultItem.content}
                      onChange={(e) => setNewVaultItem({ ...newVaultItem, content: e.target.value })}
                    />
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors mt-4 text-xs"
                >
                  Asegurar en el Baúl
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL ACTUALIZAR FINANZAS */}
        {isUpdateFinanceModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 lg:p-10 w-full max-w-xl shadow-2xl relative">
              <button 
                onClick={() => setIsUpdateFinanceModalOpen(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold uppercase tracking-tighter mb-8 text-white">
                Finanzas del Proyecto
              </h2>
              
              <form onSubmit={handleFinanceSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Acción</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 appearance-none"
                    value={financeForm.type}
                    onChange={(e) => setFinanceForm({ ...financeForm, type: e.target.value })}
                  >
                    <option value="abono" className="text-black">Registrar Pago Recibido</option>
                    <option value="modificar_total" className="text-black">Modificar Precio Total del Proyecto</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    {financeForm.type === 'modificar_total' ? 'Nuevo Precio Total (USD)' : 'Monto (USD)'}
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                    placeholder={financeForm.type === 'modificar_total' ? '5000' : '2500'}
                    value={financeForm.amount}
                    onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })}
                  />
                </div>

                {financeForm.type !== 'modificar_total' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Método de Pago</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 appearance-none"
                      value={financeForm.payment_method}
                      onChange={(e) => setFinanceForm({ ...financeForm, payment_method: e.target.value })}
                    >
                      <option value="transferencia" className="text-black">Transferencia Bancaria</option>
                      <option value="efectivo" className="text-black">Efectivo</option>
                      <option value="tarjeta" className="text-black">Tarjeta de Crédito</option>
                      <option value="crypto" className="text-black">Criptomonedas</option>
                      <option value="otro" className="text-black">Otro</option>
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    {financeForm.type === 'modificar_total' ? 'Motivo del cambio' : 'Descripción'} (Opcional)
                  </label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 min-h-[80px] resize-none"
                    placeholder={
                      financeForm.type === 'modificar_total'
                        ? 'Ej: Reajuste por cambio de requerimientos'
                        : financeForm.type === 'abono'
                        ? 'Ej: Pago del 50% inicial según contrato'
                        : 'Ej: Gastos de dominio y hosting'
                    }
                    value={financeForm.description}
                    onChange={(e) => setFinanceForm({ ...financeForm, description: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[hsl(76,85%,67%)] text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform mt-4 text-xs shadow-[0_0_20px_rgba(194,242,84,0.3)]"
                >
                  {financeForm.type === 'modificar_total' ? 'Actualizar Precio' : 'Registrar Pago'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL VINCULAR SERVICIO */}
        {isLinkServiceModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 lg:p-10 w-full max-w-xl shadow-2xl relative">
              <button 
                onClick={() => setIsLinkServiceModalOpen(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold uppercase tracking-tighter mb-8 text-white">
                Vincular Servicio
              </h2>
              
              {(() => {
                const linkedIds = linkedServices.map((s: any) => s.id);
                const availableServices = allServices.filter((s: any) => !linkedIds.includes(s.id));

                if (availableServices.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-white/50 text-sm uppercase tracking-widest">Todos los servicios ya están vinculados a este proyecto.</p>
                    </div>
                  );
                }

                return (
                  <form onSubmit={handleLinkServiceSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Seleccionar Servicio del Catálogo Codea</label>
                      <select 
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 appearance-none"
                        value={serviceForm.service_id}
                        onChange={(e) => setServiceForm({ ...serviceForm, service_id: e.target.value })}
                      >
                        <option value="" disabled className="text-gray-500">Selecciona un servicio...</option>
                        {availableServices.map((s: any) => (
                          <option key={s.id} value={s.id} className="text-black">{s.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-6">
                      <p className="text-xs text-blue-400">
                        Al vincular este servicio, quedará asociado permanentemente al proyecto. Puedes desvincularlo desde la pestaña de Servicios.
                      </p>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors mt-4 text-xs shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                      Confirmar Vinculación
                    </button>
                  </form>
                );
              })()}
            </div>
          </div>
        )}

        {/* MODAL VIEW / UPDATE / DELETE VAULT ITEM */}
        {isViewVaultModalOpen && selectedVaultItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => { setIsViewVaultModalOpen(false); setIsEditingVaultItem(false); }}></div>
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2rem] w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[hsl(76,85%,67%)]/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[hsl(76,85%,67%)]/70 flex flex-col">
              
              <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 p-4 md:p-6 flex items-center justify-between z-10">
                <div className="flex gap-2">
                  <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${getVaultIcon(selectedVaultItem.item_type).bg} ${getVaultIcon(selectedVaultItem.item_type).color}`}>
                    {selectedVaultItem.item_type}
                  </span>
                  {selectedVaultItem.item_type === 'nota' && (
                    <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-[hsl(76,85%,67%)]/20 text-[hsl(76,85%,67%)]">
                      IDEA
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {(selectedVaultItem.content?.includes('![') || selectedVaultItem.content?.includes('data:image')) && (
                    <button 
                      onClick={() => {
                        setIsViewVaultModalOpen(false);
                        window.dispatchEvent(new CustomEvent('ucobot:edit', { detail: { item: selectedVaultItem } }));
                      }}
                      className="px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest bg-[hsl(76,85%,67%)]/10 text-[hsl(76,85%,67%)] border border-[hsl(76,85%,67%)]/20 rounded-full hover:bg-[hsl(76,85%,67%)]/20 transition-colors flex items-center gap-2"
                    >
                      <Sparkles size={12} className="md:w-3.5 md:h-3.5" />
                      Editar con IA
                    </button>
                  )}
                  <button onClick={() => setIsEditingVaultItem(!isEditingVaultItem)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors border border-white/10">
                    <Edit3 size={14} className="md:w-4 md:h-4" />
                  </button>
                  <button onClick={() => handleDeleteVaultItem(selectedVaultItem.id)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20">
                    <Trash2 size={14} className="md:w-4 md:h-4" />
                  </button>
                  <button onClick={() => { setIsViewVaultModalOpen(false); setIsEditingVaultItem(false); }} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors border border-white/10 ml-1 md:ml-2">
                    <X size={14} className="md:w-4 md:h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8 flex-grow">
                {!isEditingVaultItem ? (
                  <div className="max-w-full mx-auto space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">
                      {selectedVaultItem.title}
                    </h2>
                    
                    <p className="text-xs text-white/40 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} /> 
                      Creado el {new Date(selectedVaultItem.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>

                    <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent"></div>

                    <div className="prose prose-invert max-w-none">
                      {selectedVaultItem.content?.includes('![') || selectedVaultItem.content?.includes('<img') || selectedVaultItem.content?.includes('data:image') ? (
                        <div className="w-full relative">
                          {(() => {
                            const base64Images = Array.from(selectedVaultItem.content.matchAll(/data:image\/[^;]+;base64,[a-zA-Z0-9+/=]+/g)).map((m: any) => m[0]);
                            
                            if (base64Images.length > 0) {
                              return (
                                <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:bg-[hsl(76,85%,67%)]/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[hsl(76,85%,67%)]/80">
                                  {base64Images.map((src, index) => (
                                    <div key={index} className="relative flex-shrink-0 snap-center w-[85%] md:w-[60%] lg:w-[45%] max-w-[400px] group">
                                      <img src={src} className="w-full aspect-square object-cover rounded-2xl border border-white/10 shadow-xl" />
                                      <button 
                                        onClick={() => {
                                          setIsViewVaultModalOpen(false);
                                          window.dispatchEvent(new CustomEvent('ucobot:edit', { detail: { item: selectedVaultItem, index: index + 1 } }));
                                        }}
                                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-black/60 backdrop-blur-md text-[hsl(76,85%,67%)] border border-[hsl(76,85%,67%)]/30 rounded-full hover:bg-black/80 transition-all flex items-center gap-2"
                                      >
                                        <Sparkles size={12} />
                                        Editar Slide {index + 1}
                                      </button>
                                      <div className="absolute bottom-4 left-4 px-2 py-1 bg-black/60 backdrop-blur-md text-white/80 text-[10px] rounded-md font-medium border border-white/10 pointer-events-none">
                                        Slide {index + 1}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            }

                            return (
                              <div 
                                className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:bg-[hsl(76,85%,67%)]/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[hsl(76,85%,67%)]/80"
                                dangerouslySetInnerHTML={{
                                  __html: selectedVaultItem.content
                                    .replace(/> \*\*Prompt Original:\*\*.*?\n\n/g, '')
                                    .replace(/<div class="image-carousel">/g, '')
                                    .replace(/<\/div>/g, '')
                                    .replace(/!\[.*?\]\((.*?)\)/g, '<img src="$1" class="w-[85%] md:w-[60%] lg:w-[45%] max-w-[400px] aspect-square object-cover rounded-2xl flex-shrink-0 snap-center border border-white/10 shadow-xl" />')
                                    .replace(/<img(?!.*class=)(.*?)>/g, '<img class="w-[85%] md:w-[60%] lg:w-[45%] max-w-[400px] aspect-square object-cover rounded-2xl flex-shrink-0 snap-center border border-white/10 shadow-xl" $1>')
                                }}
                              />
                            );
                          })()}
                        </div>
                      ) : (
                        <div 
                          className="text-white/80 text-lg leading-relaxed font-light whitespace-pre-wrap custom-markdown"
                          dangerouslySetInnerHTML={{ 
                            __html: selectedVaultItem.content
                              // Custom Tips
                              .replace(/^Tip:\s*(.*?)(?:\n|$)/gim, '<div class="bg-[hsl(76,85%,67%)]/10 border-l-4 border-[hsl(76,85%,67%)] p-6 rounded-r-2xl my-6"><p class="text-[hsl(76,85%,67%)] font-semibold text-sm m-0">$1</p></div>')
                              // Slides / Sections
                              .replace(/^#### (.*?)$/gim, '<h4 class="text-xl font-bold text-[hsl(76,85%,67%)] mt-8 mb-4 tracking-tight">$1</h4>')
                              .replace(/^### (.*?)$/gim, '<h3 class="text-2xl font-bold text-white mt-10 mb-6 tracking-tighter">$1</h3>')
                              .replace(/^## (.*?)$/gim, '<h2 class="text-3xl font-black text-white mt-12 mb-6 tracking-tighter">$1</h2>')
                              .replace(/^# (.*?)$/gim, '<h1 class="text-4xl font-black text-[hsl(76,85%,67%)] mt-12 mb-8 uppercase tracking-tighter">$1</h1>')
                              // Bold
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                              // Lists
                              .replace(/^\s*[-*]\s(.*)$/gim, '<li class="ml-6 mb-2 list-disc marker:text-[hsl(76,85%,67%)]">$1</li>')
                              // Italic (after lists so it doesn't match list bullets)
                              .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em class="italic text-white/80">$1</em>')
                              // Dividers
                              .replace(/^---/gim, '<hr class="border-t border-white/10 my-8" />')
                          }} 
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateVaultItem} className="space-y-6 max-w-3xl mx-auto">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Tipo</label>
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 appearance-none"
                        value={selectedVaultItem.item_type}
                        onChange={(e) => setSelectedVaultItem({ ...selectedVaultItem, item_type: e.target.value })}
                      >
                        <option value="link" className="text-black">Enlace Externo</option>
                        <option value="credencial" className="text-black">Credenciales</option>
                        <option value="nota" className="text-black">Nota Privada / Idea</option>
                        <option value="archivo" className="text-black">Archivo</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Título Identificador</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                        value={selectedVaultItem.title}
                        onChange={(e) => setSelectedVaultItem({ ...selectedVaultItem, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Contenido</label>
                      <textarea 
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white min-h-[300px] resize-none focus:bg-black/50 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[hsl(76,85%,67%)]/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[hsl(76,85%,67%)]/70"
                        value={selectedVaultItem.content}
                        onChange={(e) => setSelectedVaultItem({ ...selectedVaultItem, content: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        type="button"
                        onClick={() => setIsEditingVaultItem(false)}
                        className="flex-grow bg-white/5 text-white/50 hover:bg-white/10 py-4 rounded-xl font-bold uppercase tracking-widest transition-colors text-xs border border-white/10"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex items-center justify-center gap-2 flex-grow bg-[hsl(76,85%,67%)] text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform text-xs shadow-[0_0_20px_rgba(194,242,84,0.3)]"
                      >
                        <Edit3 size={16} /> Guardar Cambios
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL CREAR TAREA */}
        {isAddTaskModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 lg:p-10 w-full max-w-xl shadow-2xl relative">
              <button 
                onClick={() => setIsAddTaskModalOpen(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold uppercase tracking-tighter mb-8 text-white">
                Nueva Tarea
              </h2>
              
              <form onSubmit={handleAddTask} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Título de la tarea</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                    placeholder="Ej: Diseñar landing page"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Descripción (Opcional)</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 min-h-[80px] resize-none"
                    placeholder="Detalles adicionales de la tarea..."
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Asignar a</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 appearance-none"
                      value={taskForm.assigned_to}
                      onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                    >
                      <option value="" className="text-black">Sin asignar</option>
                      {allProfiles.map((p: any) => (
                        <option key={p.id} value={p.id} className="text-black">{p.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Prioridad</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 appearance-none"
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    >
                      <option value="baja" className="text-black">Baja</option>
                      <option value="media" className="text-black">Media</option>
                      <option value="alta" className="text-black">Alta</option>
                      <option value="urgente" className="text-black">Urgente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Fecha de inicio</label>
                    <input 
                      type="datetime-local"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                      value={taskForm.start_date}
                      onChange={(e) => setTaskForm({ ...taskForm, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Fecha fin (Opcional)</label>
                    <input 
                      type="datetime-local"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                      value={taskForm.end_date}
                      onChange={(e) => setTaskForm({ ...taskForm, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[hsl(76,85%,67%)] text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform mt-4 text-xs shadow-[0_0_20px_rgba(194,242,84,0.3)]"
                >
                  Crear Tarea
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL VER / EDITAR TAREA */}
        {isViewTaskModalOpen && selectedTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 lg:p-10 w-full max-w-xl shadow-2xl relative">
              <button 
                onClick={() => { setIsViewTaskModalOpen(false); setSelectedTask(null); }}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold uppercase tracking-tighter mb-2 text-white">
                Detalle de Tarea
              </h2>
              <p className="text-xs text-white/30 uppercase tracking-widest mb-8">
                Creada por {selectedTask.creator?.full_name || 'Sistema'} · {new Date(selectedTask.created_at).toLocaleDateString('es-AR')}
              </p>
              
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase block mb-2">Título</label>
                  <p className="text-white font-semibold text-lg">{selectedTask.title}</p>
                </div>

                {selectedTask.description && (
                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase block mb-2">Descripción</label>
                    <p className="text-white/70 text-sm whitespace-pre-wrap">{selectedTask.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase block mb-2">Asignado a</label>
                    <p className="text-white text-sm flex items-center gap-2">
                      <User size={14} className="text-[hsl(76,85%,67%)]" />
                      {selectedTask.assigned?.full_name || 'Sin asignar'}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase block mb-2">Prioridad</label>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest ${getTaskPriorityStyle(selectedTask.priority).bg} ${getTaskPriorityStyle(selectedTask.priority).color}`}>
                      {selectedTask.priority}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedTask.start_date && (
                    <div>
                      <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase block mb-2">Fecha inicio</label>
                      <p className="text-sm text-white/70 flex items-center gap-2">
                        <Clock size={14} />
                        {new Date(selectedTask.start_date).toLocaleString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                  {selectedTask.end_date && (
                    <div>
                      <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase block mb-2">Fecha fin</label>
                      <p className={`text-sm flex items-center gap-2 ${new Date(selectedTask.end_date) < new Date() && selectedTask.status !== 'completada' ? 'text-red-400' : 'text-white/70'}`}>
                        <Clock size={14} />
                        {new Date(selectedTask.end_date).toLocaleString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Status Changer */}
                <div>
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase block mb-3">Estado</label>
                  <div className="flex gap-2">
                    {(['pendiente', 'en_progreso', 'completada'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateTaskStatus(selectedTask.id, st)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                          selectedTask.status === st
                            ? st === 'completada' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                              : st === 'en_progreso' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              : 'bg-white/10 text-white border-white/20'
                            : 'bg-white/5 text-white/30 border-white/10 hover:bg-white/10 hover:text-white/60'
                        }`}
                      >
                        {st === 'pendiente' ? 'Pendiente' : st === 'en_progreso' ? 'En Progreso' : 'Completada'}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTask.completed_at && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-xs text-emerald-400">
                      Completada el {new Date(selectedTask.completed_at).toLocaleString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}

                <button 
                  type="button"
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 py-4 rounded-xl font-bold uppercase tracking-widest transition-colors text-xs border border-red-500/20 mt-2"
                >
                  <Trash2 size={16} /> Eliminar Tarea
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Floating UcoBot Bubble */}
    <UcoBotTab projectId={project.id} projectName={project.name} />
    </>
  );
}