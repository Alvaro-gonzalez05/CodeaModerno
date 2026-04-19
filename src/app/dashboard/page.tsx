import { Metadata } from 'next';
import DashboardClient from '@/components/DashboardClient';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Dashboard | Codea Desarrollos',
  description: 'Panel de administración del sistema Codea.',
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener Perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Obtener resumen de métricas
  const { count: activeProjectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'Completado');

  // Obtener Proyectos
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  // Obtener Actividad
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  const stats = {
    activeProjects: activeProjectsCount || 0,
    totalClients: 124, // Dato estático demostrativo
    pendingTasks: 42, // Dato estático demostrativo
    monthlyIncome: '$12.4K' // Dato estático demostrativo
  };

  return <DashboardClient 
    userProfile={profile} 
    projects={projects || []} 
    activities={activities || []} 
    stats={stats} 
  />;
}