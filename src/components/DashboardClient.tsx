"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Tabs
import OverviewTab from './dashboard/OverviewTab';
import ProjectsTab from './dashboard/ProjectsTab';
import ClientsTab from './dashboard/ClientsTab';
import FinanceTab from './dashboard/FinanceTab';
import SettingsTab from './dashboard/SettingsTab';
import CalendarTab from './dashboard/CalendarTab';
import ClientFinderTab from './dashboard/ClientFinderTab';

const navItems = [
  { id: 'overview', name: 'PANEL PRINCIPAL', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'projects', name: 'PROYECTOS', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 'calendar', name: 'CALENDARIO', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'clients', name: 'CLIENTES', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { id: 'finance', name: 'FINANZAS', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'settings', name: 'AJUSTES', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'client-finder', name: 'BUSCADOR DE CLIENTES', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
];

export default function DashboardClient({ userProfile, projects, allProjects, clients, activities, stats, payments, expenses, monthlyFinanceStats }: {
  userProfile: any,
  projects: any[],
  allProjects: any[],
  clients: any[],
  activities: any[],
  stats: any,
  payments: any[],
  expenses: any[],
  monthlyFinanceStats: any
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const activeTab = searchParams.get('tab') || 'overview';

  useGSAP(() => {
    const tl = gsap.timeline();
    
    // Sidebar
    tl.fromTo(".sidebar-item", 
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power3.out" }
    );

    // Titulos principales
    tl.fromTo(".dashboard-header", 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" },
      "-=0.4"
    );
    
    tl.fromTo(".big-title span", 
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" },
      "-=0.5"
    );

    // Tarjetas de estadisticas
    tl.fromTo(".stat-card", 
      { scale: 0.9, opacity: 0, y: 30 },
      { scale: 1, opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "back.out(1.5)" },
      "-=0.4"
    );

    // Panel de proyectos
    tl.fromTo(".project-row", 
      { x: 30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" },
      "-=0.2"
    );

  }, { scope: containerRef, dependencies: [activeTab] }); // Re-run animation when tab changes

  const handleLogout = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    gsap.to(containerRef.current, {
      y: -50,
      opacity: 0,
      scale: 0.98,
      duration: 0.6,
      ease: 'power3.in',
      onComplete: () => {
        form.submit();
      }
    });
  };

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    params.delete('projectId');
    params.delete('sub');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} projects={projects} activities={activities} />;
      case 'projects':
        return <ProjectsTab projects={allProjects} />;
      case 'calendar':
        return <CalendarTab currentUserId={userProfile?.id || ''} />;
      case 'clients':
        return <ClientsTab clients={clients} />;
      case 'finance':
        return <FinanceTab payments={payments} expenses={expenses} monthlyStats={monthlyFinanceStats} />;
      case 'settings':
        return <SettingsTab profile={userProfile} onLogout={handleLogout} />;
      case 'client-finder':
        return <ClientFinderTab />;
      default:
        return <OverviewTab stats={stats} projects={projects} activities={activities} />;
    }
  };

  return (
    <div ref={containerRef} className="flex h-screen bg-black text-white overflow-hidden font-sans selection:bg-[hsl(76,85%,67%)] selection:text-black">
      
      {/* Estrellas / Ruido de fondo (Sutil) */}
      <div className="absolute inset-0 z-0 bg-transparent pointer-events-none" style={{ backgroundImage: 'radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 50px 160px, #ffffff, rgba(0,0,0,0))', backgroundRepeat: 'repeat', backgroundSize: '150px 150px', opacity: 0.1 }} />

      {/* Sidebar (Desktop) */}
      <aside className="w-72 bg-black border-r border-white/10 hidden md:flex flex-col justify-between py-8 px-6 relative z-10">
        <div>
          {/* Logo */}
          <Link href="/" className="dashboard-header inline-block text-3xl font-black tracking-tighter hover:scale-105 transition-transform mb-16">
            CODEA <span className="text-transparent" style={{ WebkitTextStroke: '1px white' }}>DESARROLLOS</span>
          </Link>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item, idx) => (
              <button 
                key={idx} 
                onClick={() => handleTabChange(item.id)}
                className={"sidebar-item w-full text-left group flex items-center gap-4 py-4 px-4 rounded-xl transition-all relative overflow-hidden " + (activeTab === item.id ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-white')}
              >
                <div className={"absolute inset-0 bg-gradient-to-r from-[hsl(76,85%,67%)]/0 to-[hsl(76,85%,67%)]/10 transition-transform duration-500 ease-out z-0 " + (activeTab === item.id ? 'translate-x-0' : 'translate-x-[-100%] group-hover:translate-x-0')}></div>
                <svg className={"w-5 h-5 z-10 transition-colors " + (activeTab === item.id ? 'text-[hsl(76,85%,67%)]' : 'group-hover:text-[hsl(76,85%,67%)]')} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="text-xs font-bold tracking-widest z-10">{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User / Footer Sidebar */}
        <div className="sidebar-item border-t border-white/10 pt-6 mt-10">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 group-hover:border-[hsl(76,85%,67%)] transition-colors overflow-hidden relative">
              <span className="font-bold text-sm tracking-widest text-[hsl(76,85%,67%)] relative z-10">{userProfile?.full_name?.substring(0, 2).toUpperCase() || 'US'}</span>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-white uppercase truncate w-32">{userProfile?.full_name || 'USUARIO'}</p>
              <p className="text-[10px] text-gray-500 tracking-wider uppercase truncate w-32">{userProfile?.role || 'CODEA SISTEMA'}</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST" className="mt-4" onSubmit={handleLogout}>
             <button type="submit" className="text-[10px] text-gray-500 hover:text-white uppercase font-bold tracking-widest">
               Cerrar Sesión
             </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className={"flex-1 flex flex-col relative z-10 h-full overflow-x-hidden " + (activeTab === 'client-finder' ? 'overflow-hidden' : 'overflow-y-auto pb-20 md:pb-10')}>
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-6 border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-50">
          <Link href="/" className="text-xl font-black tracking-tighter">
            CODEA <span className="text-transparent" style={{ WebkitTextStroke: '1px white' }}>DESARROLLOS</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white hover:text-[hsl(76,85%,67%)] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[73px] left-0 w-full bg-black border-b border-white/10 z-40 px-4 py-2">
            <nav className="space-y-1">
              {navItems.map((item, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleTabChange(item.id)}
                  className={"w-full text-left flex items-center gap-4 py-4 px-4 rounded-xl transition-all " + (activeTab === item.id ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-white')}
                >
                  <svg className={"w-5 h-5 " + (activeTab === item.id ? 'text-[hsl(76,85%,67%)]' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span className="text-xs font-bold tracking-widest uppercase">{item.name}</span>
                </button>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-white/10 px-4">
              <form action="/api/auth/logout" method="POST" onSubmit={handleLogout}>
                <button type="submit" className="text-xs text-red-400 font-bold tracking-widest uppercase w-full text-left py-2 mb-2">
                  Cerrar Sesión
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'client-finder' ? (
          <div className="flex-1 overflow-hidden min-h-0">
            {renderContent()}
          </div>
        ) : (
          <div className="p-6 md:p-12 lg:p-16 max-w-[1600px] w-full mx-auto">
            {renderContent()}
          </div>
        )}

      </main>
      
    </div>
  );
}

