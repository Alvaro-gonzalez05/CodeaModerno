import React from 'react';

export default function SettingsTab({ profile, onLogout }: { profile: any, onLogout?: (e: React.FormEvent) => void }) {
  return (
    <>
      <div className="mb-12 md:mb-16">
        <p className="text-[10px] md:text-xs font-bold tracking-widest text-gray-400 mb-4 uppercase dashboard-header">
          Configuración
        </p>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none big-title overflow-hidden flex flex-wrap gap-x-4">
          <span className="block text-transparent" style={{ WebkitTextStroke: '1px white' }}>AJUSTES DEL</span>
          <span className="block">PERFIL</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-6 lg:p-10 stat-card flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full bg-neutral-800 border-2 border-[hsl(76,85%,67%)] mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(194,242,84,0.1)] relative overflow-hidden group cursor-pointer">
             <span className="text-4xl font-black tracking-widest text-[#c2f254] relative z-10">{profile?.full_name?.substring(0,2).toUpperCase() || 'AD'}</span>
             <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
               <span className="text-[10px] font-bold uppercase tracking-widest text-white">Cambiar</span>
             </div>
          </div>
          <h2 className="text-2xl font-black tracking-widest uppercase mb-1">{profile?.full_name || 'Usuario'}</h2>
          <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-8">{profile?.role || 'Empleado'}</p>
          
          <div className="w-full flex-1">
             <div className="w-full bg-white/5 rounded-xl p-4 text-left mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">Estado</p>
                  <p className="text-xs font-bold tracking-widest text-[#c2f254] uppercase">Activo</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-[#c2f254] shadow-[0_0_10px_rgba(194,242,84,0.5)]"></div>
             </div>
             
             <form action="/api/auth/logout" method="POST" className="mt-8" onSubmit={onLogout}>
               <button type="submit" className="w-full bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-4 font-black uppercase tracking-widest hover:bg-red-500 hover:text-black hover:border-red-500 transition-all text-xs">
                 Cerrar Sesión
               </button>
             </form>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-6 lg:p-10 stat-card">
          <h3 className="text-xl font-black tracking-widest uppercase mb-8">Información Personal</h3>
          
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 ml-1">Nombre Completo</label>
                <input 
                  type="text" 
                  defaultValue={profile?.full_name || ''}
                  className="bg-black/50 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[hsl(76,85%,67%)] focus:bg-black transition-all text-sm font-medium"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 ml-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  disabled
                  defaultValue={"alvaro@codea.com"}
                  className="bg-black/20 border border-white/5 rounded-xl px-4 py-4 outline-none text-gray-500 text-sm font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 ml-1">Bio / Descripción (Interna)</label>
              <textarea 
                rows={4}
                placeholder="Desarrollador Full Stack enfocado en interfaces de alto impacto..."
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[hsl(76,85%,67%)] focus:bg-black transition-all text-sm font-medium resize-none"
              ></textarea>
            </div>

            <div className="border-t border-white/10 pt-8 mt-8">
              <h3 className="text-xl font-black tracking-widest uppercase mb-6 text-white/50">Cambiar Contraseña</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 ml-1">Nueva Contraseña</label>
                  <input 
                    type="password" 
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[hsl(76,85%,67%)] focus:bg-black transition-all text-sm font-medium"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 ml-1">Confirmar Contraseña</label>
                  <input 
                    type="password" 
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[hsl(76,85%,67%)] focus:bg-black transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-8">
              <button type="button" className="bg-[hsl(76,85%,67%)] text-black rounded-xl px-8 py-4 font-black uppercase tracking-widest xl:hover:shadow-[0_0_30px_rgba(194,242,84,0.4)] hover:scale-[1.02] transition-all text-xs">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>

      </div>
    </>
  );
}




