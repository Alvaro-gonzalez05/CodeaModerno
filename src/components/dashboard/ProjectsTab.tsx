import React, { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import ProjectDetailView from './ProjectDetailView';

export default function ProjectsTab({ projects }: { projects: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const projectIdParam = searchParams.get('projectId');
  const selectedProject = projects.find(p => p.id?.toString() === projectIdParam) || null;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [newProject, setNewProject] = useState({
    name: '',
    client_name: '',
    price: '',
    payment_type: 'unico'
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to Supabase
    console.log("Creating Project:", newProject);
    setIsCreateModalOpen(false);
    // Reset form
    setNewProject({ name: '', client_name: '', price: '', payment_type: 'unico' });
  };

  const handleSelectProject = (project: any) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('projectId', project.id.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('projectId');
    params.delete('sub');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (selectedProject) {
    return <ProjectDetailView project={selectedProject} onBack={handleBack} />;
  }

  return (
    <>
      <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] md:text-xs font-bold tracking-widest text-[#c2f254] mb-4 uppercase dashboard-header">
            Gestión Integral
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none big-title overflow-hidden flex flex-wrap gap-x-4">
            <span className="block">TODOS LOS</span>
            <span className="block text-transparent" style={{ WebkitTextStroke: '1px white' }}>PROYECTOS</span>
          </h1>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[hsl(76,85%,67%)] text-black rounded-xl px-6 py-4 font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(194,242,84,0.4)] hover:scale-[1.02] transition-all text-xs w-fit"
        >
          + NUEVO PROYECTO
        </button>
      </div>

      {/* CREATE PROJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 lg:p-10 w-full max-w-xl shadow-2xl relative">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl lg:text-3xl font-bold uppercase tracking-tighter mb-8 text-white">
              Crear Nuevo Proyecto
            </h2>
            
            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Nombre del Proyecto</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                  placeholder="Ej: E-Commerce Neón"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Nombre del Cliente</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                  placeholder="Ej: John Doe Corp"
                  value={newProject.client_name}
                  onChange={(e) => setNewProject({ ...newProject, client_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Precio Total (USD)</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    step="0.01"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                    placeholder="2500"
                    value={newProject.price}
                    onChange={(e) => setNewProject({ ...newProject, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Tipo de Pago</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 appearance-none"
                    value={newProject.payment_type}
                    onChange={(e) => setNewProject({ ...newProject, payment_type: e.target.value })}
                  >
                    <option value="unico" className="text-black">Pago Único</option>
                    <option value="mensual" className="text-black">Mensual / Recurrente</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors mt-4 text-xs"
              >
                Guardar Proyecto
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-6 lg:p-10 stat-card overflow-hidden">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input 
            type="text" 
            placeholder="BUSCAR PROYECTO..." 
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] focus:bg-black transition-all text-xs font-bold tracking-widest uppercase placeholder:text-gray-600"
          />
          <select className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-xs font-bold tracking-widest uppercase text-gray-400">
            <option>TODOS LOS ESTADOS</option>
            <option>EN PROGRESO</option>
            <option>COMPLETADO</option>
            <option>REVISIÓN</option>
          </select>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 mb-4 text-[10px] font-black tracking-widest uppercase text-gray-500">
          <div className="col-span-4">Proyecto</div>
          <div className="col-span-3">Cliente</div>
          <div className="col-span-3">Estado</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-2">
          {projects.map((project, idx) => (
            <div 
              key={idx} 
              onClick={() => handleSelectProject(project)}
              className="project-row grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 md:p-6 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(76,85%,67%)]/0 to-[hsl(76,85%,67%)]/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out z-0"></div>
              
              <div className="col-span-1 md:col-span-4 relative z-10 flex flex-col">
                <span className="md:hidden text-[10px] font-bold text-gray-500 uppercase mb-1">Proyecto</span>
                <p className="text-sm font-bold tracking-widest uppercase">{project.name}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">ID: {project.id.split('-')[0]}</p>
              </div>

              <div className="col-span-1 md:col-span-3 relative z-10 flex flex-col">
                <span className="md:hidden text-[10px] font-bold text-gray-500 uppercase mb-1">Cliente</span>
                <p className="text-xs font-bold tracking-wider uppercase text-gray-300">{project.client_name}</p>
              </div>

              <div className="col-span-1 md:col-span-3 relative z-10 flex flex-col items-start md:items-start">
                <span className="md:hidden text-[10px] font-bold text-gray-500 uppercase mb-1">Estado</span>
                <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full bg-white/5 ${project.status_color || 'text-white'}`}>
                  {project.status}
                </span>
              </div>

              <div className="col-span-1 md:col-span-2 relative z-10 flex justify-end">
                <button className="text-gray-500 hover:text-[hsl(76,85%,67%)] transition-colors px-3 py-2">
                  <span className="text-[10px] font-bold tracking-widest uppercase">EDITAR</span>
                </button>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
             <p className="text-sm text-gray-500 p-6">No hay proyectos para mostrar.</p>
          )}
        </div>
      </div>
    </>
  );
}



