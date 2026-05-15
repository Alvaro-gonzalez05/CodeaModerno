import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ClientsTab({ clients }: { clients: any[] }) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from('clients').insert({
      name: newClient.name,
      email: newClient.email,
      contact_info: { phone: newClient.phone }
    });
    if (!error) {
      setIsCreateModalOpen(false);
      setNewClient({ name: '', email: '', phone: '' });
      router.refresh();
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from('clients').update({
      name: selectedClient.name,
      email: selectedClient.email,
      contact_info: selectedClient.contact_info
    }).eq('id', selectedClient.id);
    if (!error) {
      setIsEditModalOpen(false);
      setSelectedClient(null);
      router.refresh();
    }
  };

  const handleDeleteClient = async (client: any) => {
    if (!confirm(`¿Eliminar el cliente "${client.name}"? Esta acción no se puede deshacer.`)) return;
    const supabase = createClient();
    await supabase.from('clients').delete().eq('id', client.id);
    router.refresh();
  };

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
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-white text-black rounded-xl px-6 py-4 font-black uppercase tracking-widest hover:bg-gray-200 transition-colors text-xs w-fit"
        >
          + NUEVO CLIENTE
        </button>
      </div>

      {/* CREATE CLIENT MODAL */}
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
              Crear Nuevo Cliente
            </h2>

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Nombre del Cliente</label>
                <input
                  required
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                  placeholder="Ej: Tech Company"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Email</label>
                <input
                  required
                  type="email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                  placeholder="hello@techcompany.com"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Teléfono</label>
                <input
                  type="tel"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                  placeholder="+54 11 1234-5678"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors mt-4 text-xs"
              >
                Guardar Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLIENT MODAL */}
      {isEditModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 lg:p-10 w-full max-w-xl shadow-2xl relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl lg:text-3xl font-bold uppercase tracking-tighter mb-8 text-white">
              Editar Cliente
            </h2>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Nombre del Cliente</label>
                <input
                  required
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                  placeholder="Ej: Tech Company"
                  value={selectedClient.name}
                  onChange={(e) => setSelectedClient({ ...selectedClient, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Email</label>
                <input
                  required
                  type="email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                  placeholder="hello@techcompany.com"
                  value={selectedClient.email}
                  onChange={(e) => setSelectedClient({ ...selectedClient, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Teléfono</label>
                <input
                  type="tel"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] transition-all text-sm text-white focus:bg-black/50"
                  placeholder="+54 11 1234-5678"
                  value={selectedClient.contact_info?.phone || ''}
                  onChange={(e) => setSelectedClient({
                    ...selectedClient,
                    contact_info: { ...selectedClient.contact_info, phone: e.target.value }
                  })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors mt-4 text-xs"
              >
                Actualizar Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm p-8 stat-card relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full -mr-10 -mt-10 blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-xl text-white">
                {client.name.charAt(0)}
              </div>
              <div className="flex gap-1 items-center">
                <button
                  onClick={() => {
                    setSelectedClient(client);
                    setIsEditModalOpen(true);
                  }}
                  className="text-gray-500 hover:text-[hsl(76,85%,67%)] transition-colors p-1"
                  title="Editar cliente"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteClient(client)}
                  className="text-gray-500 hover:text-red-500 transition-colors p-1"
                  title="Eliminar cliente"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-bold tracking-widest uppercase mb-1">{client.name}</h3>
              <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-6">{client.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6 relative z-10">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">Proyectos</p>
                <p className="text-lg font-black">{client.projects}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">Facturado</p>
                <p className="text-lg font-black text-[#c2f254]">{client.totalSpent}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-6 relative z-10">
              <button
                onClick={() => console.log(`Crear nuevo proyecto para ${client.name}`)}
                className="flex-1 py-2 bg-[hsl(76,85%,67%)] text-black font-bold rounded-lg uppercase tracking-widest hover:scale-[1.02] transition-transform text-xs"
              >
                + Proyecto
              </button>
              <button
                onClick={() => console.log(`Ver proyectos de ${client.name}`)}
                className="py-2 px-4 bg-white/10 text-white font-bold rounded-lg uppercase tracking-widest hover:bg-white/20 transition-colors text-xs border border-white/20"
              >
                Ver
              </button>
            </div>
          </div>
        ))}
        {clients.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No hay clientes registrados todavía.</p>
          </div>
        )}
      </div>
    </>
  );
}
