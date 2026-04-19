import React from 'react';

const mockTransactions = [
  { desc: 'PAGO: E-COMMERCE M.F. (50%)', amount: '+$2,250.00', date: '19 ABR 2026', status: 'COMPLETADO', color: 'text-[#c2f254]' },
  { desc: 'SUSCRIPCIÓN: UCOBOT SERVER', amount: '-$120.00', date: '18 ABR 2026', status: 'DEBITADO', color: 'text-red-400' },
  { desc: 'PAGO: LANDING PAGE MÉTODO', amount: '+$800.00', date: '15 ABR 2026', status: 'COMPLETADO', color: 'text-[#c2f254]' },
  { desc: 'HOSTING: VERCEL PRO', amount: '-$20.00', date: '12 ABR 2026', status: 'DEBITADO', color: 'text-red-400' },
  { desc: 'PAGO: SISTEMA EL SITIO (FINAL)', amount: '+$1,050.00', date: '10 ABR 2026', status: 'COMPLETADO', color: 'text-[#c2f254]' },
];

export default function FinanceTab() {
  return (
    <>
      <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] md:text-xs font-bold tracking-widest text-purple-400 mb-4 uppercase dashboard-header">
            Balance y Económico
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none big-title overflow-hidden flex flex-wrap gap-x-4">
            <span className="block text-transparent" style={{ WebkitTextStroke: '1px white' }}>ÁREA DE</span>
            <span className="block">FINANZAS</span>
          </h1>
        </div>
        <button className="bg-white/5 border border-white/20 text-white rounded-xl px-6 py-4 font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all text-xs w-fit">
          DESCARGAR REPORTE
        </button>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-8 stat-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#c2f254] rounded-full -mr-10 -mt-10 blur-[80px] opacity-10 pointer-events-none"></div>
          <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">Ingresos Brutos (Mensual)</p>
          <h2 className="text-5xl font-black tracking-tighter text-white mb-2">$12,450<span className="text-2xl text-gray-500">.00</span></h2>
          <p className="text-[10px] font-bold tracking-widest text-[#c2f254] uppercase">+12% VS PASADO MES</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-8 stat-card relative overflow-hidden">
          <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">Gastos / Costos</p>
          <h2 className="text-5xl font-black tracking-tighter text-white mb-2">$840<span className="text-2xl text-gray-500">.50</span></h2>
          <p className="text-[10px] font-bold tracking-widest text-red-400 uppercase">-2% VS PASADO MES</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-8 stat-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full -mr-10 -mt-10 blur-[80px] opacity-10 pointer-events-none"></div>
          <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">Balance Neto</p>
          <h2 className="text-5xl font-black tracking-tighter text-[#c2f254] mb-2">$11,609<span className="text-2xl text-gray-500">.50</span></h2>
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">MARGEN DEL 93.2%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-6 lg:p-10 stat-card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black tracking-widest uppercase">Transacciones Recientes</h3>
            <button className="text-[10px] font-bold tracking-widest text-gray-400 hover:text-white uppercase transition-colors">
              Ver Historial Completo â†’
            </button>
          </div>
          
          <div className="flex flex-col gap-4">
            {mockTransactions.map((tx, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-white/5 gap-2 sm:gap-0">
                <div>
                  <p className="text-xs font-bold tracking-widest text-white uppercase">{tx.desc}</p>
                  <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mt-1">{tx.date}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className={`text-base font-black tracking-widest mb-1 ${tx.color}`}>{tx.amount}</p>
                  <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Placeholder Chart */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-6 lg:p-10 stat-card flex flex-col">
          <h3 className="text-xl font-black tracking-widest uppercase mb-8">Distribución</h3>
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
            {/* Fake Donut Chart */}
            <div className="w-48 h-48 rounded-full border-[15px] border-neutral-800 border-t-[#c2f254] border-r-blue-500 border-l-[#c2f254] relative flex items-center justify-center drop-shadow-2xl">
              <div className="text-cenetr text-white font-black tracking-tighter text-2xl">100%</div>
            </div>
            
            <div className="w-full mt-10 space-y-4">
               <div className="flex justify-between items-center text-xs font-bold tracking-widest uppercase">
                 <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#c2f254]"></div> Desarrollo</span>
                 <span>70%</span>
               </div>
               <div className="flex justify-between items-center text-xs font-bold tracking-widest uppercase">
                 <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Suscripciones</span>
                 <span>20%</span>
               </div>
               <div className="flex justify-between items-center text-xs font-bold tracking-widest uppercase">
                 <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-neutral-700"></div> Otros</span>
                 <span>10%</span>
               </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}



