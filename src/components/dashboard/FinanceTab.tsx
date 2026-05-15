import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function FinanceTab({ payments, expenses, monthlyStats }: {
  payments: any[];
  expenses: any[];
  monthlyStats: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    marginPercentage: number;
  };
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'gasto',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'otros'
  });

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const amount = parseFloat(newTransaction.amount);
    if (!amount || amount <= 0) return;

    if (newTransaction.type === 'gasto') {
      await supabase.from('expenses').insert({
        title: newTransaction.description,
        amount,
        expense_date: newTransaction.date,
        category: newTransaction.category
      });
    } else {
      await supabase.from('payments').insert({
        amount,
        payment_date: newTransaction.date,
        status: 'recibido',
        notes: newTransaction.description
      });
    }

    setIsModalOpen(false);
    setNewTransaction({ type: 'gasto', description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'otros' });
    router.refresh();
  };

  const fmt = (n: number) => n.toLocaleString('en-US');

  const handleDeleteTransaction = async (id: string, tableType: 'payment' | 'expense') => {
    if (!confirm('¿Eliminar esta transacción? Esta acción no se puede deshacer.')) return;
    const supabase = createClient();
    if (tableType === 'payment') {
      await supabase.from('payments').delete().eq('id', id);
    } else {
      await supabase.from('expenses').delete().eq('id', id);
    }
    router.refresh();
  };

  const allTransactions = [
    ...payments.map(p => ({
      id: p.id as string,
      tableType: 'payment' as const,
      desc: `PAGO: ${p.project?.name || 'Proyecto'} - ${p.notes || 'Pago recibido'}`,
      amount: `+$${fmt(Number(p.amount))}`,
      date: new Date(p.payment_date + 'T12:00:00').toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
      status: p.status === 'recibido' ? 'COMPLETADO' : 'PENDIENTE',
      color: 'text-[#c2f254]',
      created_at: p.payment_date
    })),
    ...expenses.map(e => ({
      id: e.id as string,
      tableType: 'expense' as const,
      desc: `GASTO: ${e.title}`,
      amount: `-$${fmt(Number(e.amount))}`,
      date: new Date(e.expense_date + 'T12:00:00').toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
      status: 'DEBITADO',
      color: 'text-red-400',
      created_at: e.expense_date
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);

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
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[hsl(76,85%,67%)] text-black rounded-xl px-6 py-4 font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(194,242,84,0.4)] hover:scale-[1.02] transition-all text-xs w-fit"
          >
            + NUEVA TRANSACCIÓN
          </button>
          <button className="bg-white/5 border border-white/20 text-white rounded-xl px-6 py-4 font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all text-xs w-fit">
            DESCARGAR REPORTE
          </button>
        </div>
      </div>

      {/* ADD TRANSACTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 lg:p-10 w-full max-w-xl shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl lg:text-3xl font-bold uppercase tracking-tighter mb-8 text-white">
              Nueva Transacción
            </h2>

            <form onSubmit={handleAddTransaction} className="space-y-6">
              {/* Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'gasto' })}
                  className={`py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all border ${newTransaction.type === 'gasto' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
                >
                  Gasto
                </button>
                <button
                  type="button"
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'ingreso' })}
                  className={`py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all border ${newTransaction.type === 'ingreso' ? 'bg-[#c2f254]/20 border-[#c2f254] text-[#c2f254]' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
                >
                  Ingreso
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Descripción</label>
                <input
                  required
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                  placeholder={newTransaction.type === 'gasto' ? 'Ej: Hosting mensual' : 'Ej: Pago cliente ABC'}
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Monto (USD)</label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                    placeholder="0.00"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Fecha</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  />
                </div>
              </div>

              {newTransaction.type === 'gasto' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Categoría</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50 appearance-none"
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  >
                    <option value="software" className="text-black">Software / SaaS</option>
                    <option value="hosting" className="text-black">Hosting / Infraestructura</option>
                    <option value="marketing" className="text-black">Marketing</option>
                    <option value="servicios" className="text-black">Servicios externos</option>
                    <option value="otros" className="text-black">Otros</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors mt-4 text-xs"
              >
                Registrar Transacción
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-8 stat-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#c2f254] rounded-full -mr-10 -mt-10 blur-[80px] opacity-10 pointer-events-none"></div>
          <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">Ingresos Totales</p>
          <h2 className="text-5xl font-black tracking-tighter text-white mb-2">${fmt(monthlyStats.totalIncome)}<span className="text-2xl text-gray-500">.00</span></h2>
          <p className="text-[10px] font-bold tracking-widest text-[#c2f254] uppercase">DE {payments.length} PAGOS</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-8 stat-card relative overflow-hidden">
          <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">Gastos / Costos</p>
          <h2 className="text-5xl font-black tracking-tighter text-white mb-2">${fmt(monthlyStats.totalExpenses)}<span className="text-2xl text-gray-500">.00</span></h2>
          <p className="text-[10px] font-bold tracking-widest text-red-400 uppercase">DE {expenses.length} GASTOS</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-8 stat-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full -mr-10 -mt-10 blur-[80px] opacity-10 pointer-events-none"></div>
          <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">Balance Neto</p>
          <h2 className="text-5xl font-black tracking-tighter text-[#c2f254] mb-2">${fmt(monthlyStats.netBalance)}<span className="text-2xl text-gray-500">.00</span></h2>
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">MARGEN DEL {monthlyStats.marginPercentage.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-6 lg:p-10 stat-card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black tracking-widest uppercase">Transacciones Recientes</h3>
            <button className="text-[10px] font-bold tracking-widest text-gray-400 hover:text-white uppercase transition-colors">
              Ver Historial Completo →
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {allTransactions.length === 0 && (
              <p className="text-sm text-gray-500 py-4">No hay transacciones registradas todavía.</p>
            )}
            {allTransactions.map((tx, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-white/5 gap-2 sm:gap-0 group/tx">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold tracking-widest text-white uppercase truncate">{tx.desc}</p>
                  <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mt-1">{tx.date}</p>
                </div>
                <div className="flex items-center gap-4 sm:text-right">
                  <div>
                    <p className={`text-base font-black tracking-widest mb-1 ${tx.color}`}>{tx.amount}</p>
                    <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">{tx.status}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTransaction(tx.id, tx.tableType)}
                    className="opacity-0 group-hover/tx:opacity-100 transition-opacity text-gray-600 hover:text-red-500 p-1 flex-shrink-0"
                    title="Eliminar transacción"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-6 lg:p-10 stat-card flex flex-col">
          <h3 className="text-xl font-black tracking-widest uppercase mb-8">Distribución</h3>
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-48 h-48 rounded-full border-[15px] border-neutral-800 border-t-[#c2f254] border-r-blue-500 border-l-[#c2f254] relative flex items-center justify-center drop-shadow-2xl">
              <div className="text-center text-white font-black tracking-tighter text-2xl">
                {monthlyStats.marginPercentage.toFixed(0)}%
              </div>
            </div>

            <div className="w-full mt-10 space-y-4">
              <div className="flex justify-between items-center text-xs font-bold tracking-widest uppercase">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#c2f254]"></div> Ingresos</span>
                <span>${fmt(monthlyStats.totalIncome)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold tracking-widest uppercase">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Gastos</span>
                <span>${fmt(monthlyStats.totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold tracking-widest uppercase">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Balance</span>
                <span className="text-[#c2f254]">${fmt(monthlyStats.netBalance)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
