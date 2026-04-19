'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Key, Link as LinkIcon, Globe, Bot, X, UploadCloud, File as FileIcon, FileText, Trash2, Edit3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

gsap.registerPlugin(useGSAP);

export default function ProjectDetailView({ project, onBack }: { project: any, onBack: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const subParam = searchParams.get('sub') || 'vault';
  const activeTab = subParam as 'vault' | 'finances' | 'services';

  const setActiveTab = (tab: 'vault' | 'finances' | 'services') => {
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

  useEffect(() => {
    const fetchVaultItems = async () => {
      if (!project?.id) return;
      const { data, error } = await supabase
        .from('project_vault')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
        
      if (data) {
        setVaultItems(data);
      }
    };
    fetchVaultItems();
  }, [project, supabase]);

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

  const handleFinanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Finance Registered:", financeForm);
    setIsUpdateFinanceModalOpen(false);
    setFinanceForm({ type: 'abono', amount: '', description: '' });
  };

  const handleLinkServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Service Linked:", serviceForm);
    setIsLinkServiceModalOpen(false);
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
          { id: 'finances', label: 'Finanzas & Pagos' },
          { id: 'services', label: 'Servicios Asignados' }
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

        {/* FINANZAS */}
        {activeTab === 'finances' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 flex flex-col justify-center items-start relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(76,85%,67%)]/5 to-transparent z-0 pointer-events-none"></div>
                <div className="relative z-10 w-full">
                  <h3 className="text-white/50 text-sm uppercase tracking-widest mb-2">Modelo de Pago</h3>
                  <div className="text-3xl font-bold mb-8">Pago Único</div>

                  <h3 className="text-white/50 text-sm uppercase tracking-widest mb-2">Monto Total</h3>
                  <div className="text-5xl font-light mb-8">$2,500 <span className="text-2xl text-white/30">USD</span></div>

                  <button 
                    onClick={() => setIsUpdateFinanceModalOpen(true)}
                    className="w-full py-4 bg-white text-black font-semibold rounded-full uppercase tracking-widest hover:bg-neutral-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                  >
                    Registrar Cobro o Modificar
                  </button>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                <h3 className="text-lg font-semibold uppercase tracking-tight text-white mb-6 flex justify-between items-center">
                  Historial Finance
                  <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-white/60 font-normal">Pendiente: $1,250 USD</span>
                </h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div>
                        <div className="font-medium text-white">Adelanto 50%</div>
                        <div className="text-xs text-white/50 mt-1">12 Abril 2026</div>
                      </div>
                      <div className="text-emerald-400 font-semibold">+$1,250.00</div>
                   </div>
                   <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div>
                         <div className="font-medium text-white/60">Pago Final (Restante)</div>
                         <div className="text-xs text-white/40 mt-1">Estimado: Entrega</div>
                      </div>
                      <div className="text-white/40 font-semibold">-$1,250.00</div>
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
               <div className="flex items-center gap-6 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] group hover:border-white/20 transition-all relative overflow-hidden">
                 <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity z-0 pointer-events-none"></div>
                 <div className="w-14 h-14 rounded-full border border-white/10 bg-black/50 flex flex-shrink-0 items-center justify-center text-white/90 relative z-10">
                   <Globe size={26} />
                 </div>
                 <div className="relative z-10 w-full">
                   <div className="flex justify-between items-start w-full">
                     <h4 className="text-lg font-bold text-white tracking-widest uppercase mb-1">Website & Web App</h4>
                     <button className="text-xs text-white/30 hover:text-red-400 transition-colors uppercase font-bold tracking-widest">
                       Desvincular
                     </button>
                   </div>
                   <p className="text-sm text-white/50">Next.js + Postgres. Diseño responsivo.</p>
                 </div>
               </div>

               <div className="flex items-center gap-6 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] group hover:border-white/20 transition-all relative overflow-hidden">
                 <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity z-0 pointer-events-none"></div>
                 <div className="w-14 h-14 rounded-full border border-white/10 bg-black/50 flex flex-shrink-0 items-center justify-center text-white/90 relative z-10">
                   <Bot size={26} />
                 </div>
                 <div className="relative z-10 w-full">
                   <div className="flex justify-between items-start w-full">
                     <h4 className="text-lg font-bold text-white tracking-widest uppercase mb-1">IA Asistente</h4>
                     <button className="text-xs text-white/30 hover:text-red-400 transition-colors uppercase font-bold tracking-widest">
                       Desvincular
                     </button>
                   </div>
                   <p className="text-sm text-white/50">Asistente Virtual IA entrenado con RAG.</p>
                 </div>
               </div>
            </div>
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
                    <option value="abono" className="text-black">Registrar Pago / Abono</option>
                    <option value="modificar_total" className="text-black">Modificar Monto Total</option>
                    <option value="cargo" className="text-black">Aplicar Cargo Extra</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Monto (USD)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                    placeholder="Ej: 500"
                    value={financeForm.amount}
                    onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Descripción / Comprobante</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 min-h-[80px] resize-none"
                    placeholder="Ej: Adelanto del 50% vía PayPal / Reajuste por servidor extra"
                    value={financeForm.description}
                    onChange={(e) => setFinanceForm({ ...financeForm, description: e.target.value })}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[hsl(76,85%,67%)] text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform mt-4 text-xs shadow-[0_0_20px_rgba(194,242,84,0.3)]"
                >
                  Registrar Transacción
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
              
              <form onSubmit={handleLinkServiceSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Seleccionar Servicio del Catálogo</label>
                  <select 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 appearance-none"
                    value={serviceForm.service_id}
                    onChange={(e) => setServiceForm({ ...serviceForm, service_id: e.target.value })}
                  >
                    <option value="" disabled className="text-gray-500">Haz clic y busca un servicio...</option>
                    <option value="1" className="text-black">Website & Web App (Next.js + Postgres)</option>
                    <option value="2" className="text-black">E-Commerce (Shopify / Medusa)</option>
                    <option value="3" className="text-black">IA / Automatización (Chatbots)</option>
                    <option value="4" className="text-black">Branding & Diseño UI/UX</option>
                  </select>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-6">
                  <p className="text-xs text-blue-400">
                    Al vincular este servicio, se habilitarán reportes y seguimientos específicos para esta área técnica dentro del proyecto general.
                  </p>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors mt-4 text-xs shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  Confirmar Vinculación
                </button>
              </form>
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
      </div>
    </div>
  );
}