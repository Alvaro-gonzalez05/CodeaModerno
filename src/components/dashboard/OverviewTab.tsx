import React from 'react';

export default function OverviewTab({ stats, projects, activities }: { stats: any, projects: any[], activities: any[] }) {
  const dashboardStats = [
    { label: 'PROYECTOS ACTIVOS', value: stats.activeProjects.toString().padStart(2, '0'), change: '+2 ESTE MES', highlight: true },
    { label: 'CLIENTES TOTALES', value: stats.totalClients.toString(), change: '+15% VS MES PASADO', highlight: false },
    { label: 'TAREAS PENDIENTES', value: stats.pendingTasks.toString(), change: 'AL DÍA', highlight: false },
    { label: 'INGRESOS MENSUALES', value: stats.monthlyIncome, change: '+8% ESTE MES', highlight: true },
  ];

  return (
    <>
      {/* Header y Titulo Principal */}
      <div className="mb-12 md:mb-16">
        <p className="text-[10px] md:text-xs font-bold tracking-widest text-[#c2f254] mb-4 uppercase dashboard-header">
          Métricas Principales
        </p>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none big-title overflow-hidden flex flex-wrap gap-x-4">
          <span className="block">CODEA</span>
          <span className="block text-transparent" style={{ WebkitTextStroke: '1px white' }}>SISTEMA</span>
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
        {dashboardStats.map((stat, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-6 lg:p-8 flex flex-col justify-between stat-card group hover:border-white/20 transition-colors relative overflow-hidden">
            {stat.highlight && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(76,85%,67%)] rounded-full -mr-10 -mt-10 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
            )}
            <p className="text-[10px] font-bold tracking-widest text-gray-500 mb-4">{stat.label}</p>
            <div>
              <p className={`text-4xl md:text-5xl font-black tracking-tighter mb-2 ${stat.highlight ? 'text-white' : 'text-gray-300'}`}>
                {stat.value}
              </p>
              <p className={`text-[10px] font-bold tracking-widest uppercase ${stat.highlight ? 'text-[hsl(76,85%,67%)]' : 'text-gray-500'}`}>
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Projects Panel */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-6 md:p-10 flex flex-col stat-card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black tracking-widest uppercase">Proyectos Recientes</h3>
            <button className="text-[10px] font-bold tracking-widest text-gray-400 hover:text-white uppercase transition-colors">
              Ver Todos â†’
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            {projects.map((project, idx) => (
              <div key={idx} className="project-row flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 gap-4 sm:gap-0 cursor-pointer relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-[hsl(76,85%,67%)]/0 to-[hsl(76,85%,67%)]/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out z-0"></div>
                <div className="flex-1 relative z-10">
                  <p className="text-sm md:text-base font-bold tracking-widest uppercase">{project.name}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">{project.clients?.name || project.client_name}</p>
                </div>
                <div className="flex items-center gap-4 sm:gap-8 justify-between sm:justify-end w-full sm:w-auto relative z-10">
                  <span className={`text-[10px] md:text-xs font-black tracking-widest uppercase px-3 py-1.5 rounded-full bg-white/5 ${project.status_color || 'text-white'}`}>
                    {project.status}
                  </span>
                  <button className="text-gray-500 hover:text-[hsl(76,85%,67%)] transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-gray-500">No hay proyectos recientes.</p>
            )}
          </div>
        </div>

        {/* Quick Actions / Activity */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-6 md:p-10 flex flex-col stat-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
          
          <h3 className="text-xl font-black tracking-widest uppercase mb-8 relative z-10">Actividad</h3>
          
          <div className="flex-1 relative">
            <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-white/10"></div>
            
            <div className="space-y-8 relative z-10">
              {activities.map((act, idx) => (
                <div key={idx} className="project-row flex gap-4">
                  <div className={`w-6 h-6 rounded-full shrink-0 mt-1 ${act.color} ${act.color.includes('bg-[hsl') ? 'shadow-[0_0_15px_rgba(194,242,84,0.4)]' : ''}`}></div>
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase">{act.title}</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase">{act.subtitle}</p>
                    <p className={`text-[10px] font-bold mt-2 ${act.color.includes('bg-[hsl') ? 'text-[hsl(76,85%,67%)]' : 'text-gray-500'}`}>{act.time_ago}</p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-gray-500">No hay actividad reciente.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}



