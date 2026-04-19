'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Key, Link as LinkIcon, Globe, X, UploadCloud, File as FileIcon, FileText, Trash2, Edit3, DollarSign, Unlink, CheckCircle2, Clock, AlertTriangle, ListTodo, Plus, User } from 'lucide-react';
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
    description: ''
  });

  const [serviceForm, setServiceForm] = useState({
    service_id: ''
  });

  const supabase = createClient();
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [selectedVaultItem, setSelectedVaultItem] = useState<any | null>(null);
  const [isViewVaultModalOpen, setIsViewVaultModalOpen] = useState(false);

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

    if (financeForm.type === 'modificar_total') {
      // Update project price directly
      const { error } = await supabase
        .from('projects')
        .update({ price: amount })
        .eq('id', project.id);
      if (!error) {
        setProjectPrice(amount);
      }
    }
    // For abono / cargo we just update the price field as a simplified model
    // In a real app you'd have a transactions table

    setIsUpdateFinanceModalOpen(false);
    setFinanceForm({ type: 'abono', amount: '', description: '' });
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
      <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-6 lg:p-8">
        <div>
          <button 
            onClick={onBack}
            className="text-white/50 hover:text-white text-sm mb-2 transition-colors flex items-center gap-2 uppercase tracking-widest"
          >
            ← Volver a Proyectos
          </button>
          <h2 className="text-3xl lg:text-5xl font-bold uppercase tracking-tighter">
            {project.name}
          </h2>
          <div className="flex items-center gap-4 mt-4">
            <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-medium uppercase tracking-wider backdrop-blur-md">
              {project.status || 'En Desarrollo'}
            </span>
            <span className="text-white/50 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Cliente: {project.client_name || 'Sin Asignar'}
            </span>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN INTERNA DEL PROYECTO */}
      <div className="flex flex-wrap gap-2 lg:gap-4 p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full w-fit">
        {[
          { id: 'vault', label: 'El Baúl' },
          { id: 'tasks', label: 'Tareas' },
          { id: 'finances', label: 'Finanzas & Pagos' },
          { id: 'services', label: 'Servicios Asignados' },
          ...(hasSocialService ? [{ id: 'content', label: '📱 Gestor de Contenido' }] : [])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all uppercase tracking-widest outline-none ${
              activeTab === tab.id
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO DE LAS PESTAÑAS */}
      <div className="mt-8 relative">
        {/* EL BAÚL */}
        {activeTab === 'vault' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold uppercase tracking-tight text-white/90">Archivos y Accesos</h3>
              <button 
                onClick={() => setIsAddVaultModalOpen(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm uppercase tracking-wider transition-colors border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                + Agregar al Baúl
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vaultItems.map((item) => {
                const design = getVaultIcon(item.item_type);
                return (
                  <div key={item.id} className={`vault-item-${item.id} bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 group hover:bg-white/10 transition-colors`}>
                    <div className={`w-10 h-10 rounded-full ${design.bg} ${design.color} flex flex-shrink-0 items-center justify-center mb-4`}>
                      {design.icon}
                    </div>
                    <h4 className="font-medium text-lg mb-2">{item.title}</h4>
                    <p className="text-white/50 text-sm mb-4 line-clamp-2">
                      {item.content}
                    </p>
                      <button 
                        onClick={() => {
                          setSelectedVaultItem(item);
                          setIsViewVaultModalOpen(true);
                        }}
                        className={`text-sm ${design.color} opacity-80 hover:opacity-100 transition-opacity uppercase tracking-widest font-semibold`}
                      >
                      Ver Detalles →
                    </button>
                  </div>
                );
              })}
              
              {vaultItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-white/40 text-sm uppercase tracking-widest">
                  El Baúl está vacío. Agrega enlaces, credeciales o archivos.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAREAS */}
        {activeTab === 'tasks' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold uppercase tracking-tight text-white/90">Tareas del Proyecto</h3>
              <button 
                onClick={() => setIsAddTaskModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[hsl(76,85%,67%)] text-black rounded-full text-sm uppercase tracking-wider font-bold hover:scale-[1.03] transition-transform shadow-[0_0_20px_rgba(194,242,84,0.2)]"
              >
                <Plus size={16} /> Nueva Tarea
              </button>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
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
                    className={`flex flex-col rounded-2xl border transition-all duration-200 ${
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
                  <div className="flex items-center gap-3 mb-8">
                    <button 
                      onClick={() => handleUpdatePaymentType('unico')}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${projectPaymentType === 'unico' ? 'bg-white text-black border-white' : 'bg-white/5 text-white/50 border-white/10 hover:border-white/30'}`}
                    >
                      Pago Único
                    </button>
                    <button 
                      onClick={() => handleUpdatePaymentType('mensual')}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${projectPaymentType === 'mensual' ? 'bg-white text-black border-white' : 'bg-white/5 text-white/50 border-white/10 hover:border-white/30'}`}
                    >
                      Mensual
                    </button>
                  </div>

                  <h3 className="text-white/50 text-sm uppercase tracking-widest mb-2">Monto Total</h3>
                  <div className="text-5xl font-light mb-8">{formatARS(projectPrice)} <span className="text-2xl text-white/30">ARS</span></div>

                  <button 
                    onClick={() => setIsUpdateFinanceModalOpen(true)}
                    className="w-full py-4 bg-white text-black font-semibold rounded-full uppercase tracking-widest hover:bg-neutral-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                  >
                    Modificar Precio
                  </button>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                <h3 className="text-lg font-semibold uppercase tracking-tight text-white mb-6 flex justify-between items-center">
                  Resumen Financiero
                  <span className="text-xs bg-[hsl(76,85%,67%)]/10 text-[hsl(76,85%,67%)] px-3 py-1 rounded-full font-bold">{projectPaymentType === 'mensual' ? 'Recurrente' : 'Único'}</span>
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <DollarSign size={18} className="text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">Precio Acordado</div>
                        <div className="text-xs text-white/50 mt-1">{projectPaymentType === 'mensual' ? 'Cobro mensual recurrente' : 'Pago total del proyecto'}</div>
                      </div>
                    </div>
                    <div className="text-emerald-400 font-bold text-lg">{formatARS(projectPrice)}</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Moneda</p>
                    <p className="text-2xl font-bold text-white">Pesos Argentinos (ARS)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SERVICIOS */}
        {activeTab === 'services' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold uppercase tracking-tight text-white/90">Servicios Designados</h3>
              <button 
                onClick={() => setIsLinkServiceModalOpen(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm uppercase tracking-wider transition-colors border border-white/10"
              >
                + Vincular Nuevo Servicio
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
                    <option value="modificar_total" className="text-black">Modificar Monto Total</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Monto (ARS $)</label>
                  <input 
                    required
                    type="number" 
                    step="1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                    placeholder="Ej: 250000"
                    value={financeForm.amount}
                    onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Descripción (Opcional)</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 min-h-[80px] resize-none"
                    placeholder="Ej: Reajuste por cambio de requerimientos"
                    value={financeForm.description}
                    onChange={(e) => setFinanceForm({ ...financeForm, description: e.target.value })}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[hsl(76,85%,67%)] text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform mt-4 text-xs shadow-[0_0_20px_rgba(194,242,84,0.3)]"
                >
                  Guardar Cambios
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewVaultModalOpen(false)}></div>
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <button onClick={() => setIsViewVaultModalOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-semibold uppercase tracking-tight text-white mb-6">
                Detalles del Baúl
              </h2>
              
              <form onSubmit={handleUpdateVaultItem} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">TIpo</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 appearance-none"
                    value={selectedVaultItem.item_type}
                    onChange={(e) => setSelectedVaultItem({ ...selectedVaultItem, item_type: e.target.value })}
                  >
                    <option value="link" className="text-black">Enlace Externo</option>
                    <option value="credencial" className="text-black">Credenciales</option>
                    <option value="nota" className="text-black">Nota Privada</option>
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white h-24 resize-none focus:bg-black/50"
                    value={selectedVaultItem.content}
                    onChange={(e) => setSelectedVaultItem({ ...selectedVaultItem, content: e.target.value })}
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => handleDeleteVaultItem(selectedVaultItem.id)}
                    className="flex items-center justify-center gap-2 flex-grow bg-red-500/10 text-red-500 hover:bg-red-500/20 py-4 rounded-xl font-bold uppercase tracking-widest transition-colors text-xs border border-red-500/20"
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                  <button 
                    type="submit"
                    className="flex items-center justify-center gap-2 flex-grow bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors text-xs"
                  >
                    <Edit3 size={16} /> Actualizar
                  </button>
                </div>
              </form>
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