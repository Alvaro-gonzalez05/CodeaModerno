import React from 'react';

const mockClients = [
  { name: 'MOVE FEEL PERFORM', contact: 'movefeel@gmail.com', projects: 2, totalSpent: '$4,500', tier: 'PRO' },
  { name: 'EL SITIO RESTO', contact: 'contacto@elsitio.com', projects: 1, totalSpent: '$2,100', tier: 'STANDARD' },
  { name: 'MÉTODO RAP', contact: 'rap@metodo.com', projects: 3, totalSpent: '$8,000', tier: 'VIP' },
  { name: 'UCOBOT SAAS', contact: 'hello@ucobot.ai', projects: 4, totalSpent: '$12,000', tier: 'ENTERPRISE' },
  { name: 'LOGÍSTICA X', contact: 'admin@logx.com', projects: 1, totalSpent: '$1,500', tier: 'STANDARD' },
  { name: 'TECH NOVA', contact: 'info@technova.com', projects: 2, totalSpent: '$5,200', tier: 'PRO' },
];

export default function ClientsTab() {
  return (
    <>
      <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] md:text-xs font-bold tracking-widest text-blue-400 mb-4 uppercase dashboard-header">
            Cartera de Negocios
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none big-title overflow-hidden flex flex-wrap gap-x-4">
            <span className="block">NUESTROS</span>
            <span className="block text-transparent" style={{ WebkitTextStroke: '1px white' }}>CLIENTES</span>
          </h1>
        </div>
        <button className="bg-white text-black rounded-xl px-6 py-4 font-black uppercase tracking-widest hover:bg-gray-200 transition-colors text-xs w-fit">
          + NUEVO CLIENTE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockClients.map((client, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-8 stat-card relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full -mr-10 -mt-10 blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-xl text-white">
                {client.name.charAt(0)}
              </div>
              <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full ${client.tier === 'VIP' || client.tier === 'ENTERPRISE' ? 'bg-[#c2f254]/10 text-[#c2f254]' : 'bg-white/5 text-gray-400'}`}>
                {client.tier}
              </span>
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-bold tracking-widest uppercase mb-1">{client.name}</h3>
              <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-6">{client.contact}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6 relative z-10">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">Proyectos</p>
                <p className="text-lg font-black">{client.projects}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">Inversión</p>
                <p className="text-lg font-black text-[#c2f254]">{client.totalSpent}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}



