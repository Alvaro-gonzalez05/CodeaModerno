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
    .neq('status', 'OK');

  // Obtener total de clientes
  const { count: totalClientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });

  // Obtener tareas pendientes
  const { count: pendingTasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'completada');

  // Calcular ingresos mensuales reales
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: monthlyPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'recibido')
    .gte('payment_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
    .lt('payment_date', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

  const monthlyIncome = monthlyPayments?.reduce((total, payment) => total + Number(payment.amount), 0) || 0;

  // Obtener Proyectos para overview (sin join a clients para evitar inner-join implícito de PostgREST)
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  // Obtener TODOS los proyectos para la tab de proyectos
  // No hacemos join a clients para evitar el inner-join implícito de PostgREST
  // cuando RLS restringe qué clientes ve el usuario autenticado.
  // client_name está almacenado directamente en la fila del proyecto.
  const { data: allProjects, error: allProjectsError } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (allProjectsError) console.error('[dashboard] allProjects error:', allProjectsError);

  // Obtener todos los clientes con sus proyectos (precio acumulado)
  const { data: clients } = await supabase
    .from('clients')
    .select(`
      *,
      projects:projects!client_id(id, price)
    `)
    .order('created_at', { ascending: false });

  const clientsWithSpent = (clients || []).map((client) => {
    const projectList = client.projects || [];
    const totalBilled = projectList.reduce((sum: number, p: any) => sum + Number(p.price || 0), 0);
    return {
      ...client,
      totalSpent: `$${totalBilled.toLocaleString()}`,
      projects: projectList.length
    };
  });

  // Obtener Actividad
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  // Obtener datos financieros para FinanceTab
  const { data: allPayments } = await supabase
    .from('payments')
    .select(`
      *,
      project:projects(name)
    `)
    .eq('status', 'recibido')
    .order('payment_date', { ascending: false });

  const { data: allExpenses } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });

  // Calcular estadísticas financieras mensuales
  const totalIncome = allPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
  const totalExpenses = allExpenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
  const netBalance = totalIncome - totalExpenses;
  const marginPercentage = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  const monthlyFinanceStats = {
    totalIncome,
    totalExpenses,
    netBalance,
    marginPercentage
  };

  const stats = {
    activeProjects: activeProjectsCount || 0,
    totalClients: totalClientsCount || 0,
    pendingTasks: pendingTasksCount || 0,
    monthlyIncome: `$${(monthlyIncome / 1000).toFixed(1)}K`
  };

  return <DashboardClient
    userProfile={profile}
    projects={projects || []}
    allProjects={allProjects || []}
    clients={clientsWithSpent || []}
    activities={activities || []}
    stats={stats}
    payments={allPayments || []}
    expenses={allExpenses || []}
    monthlyFinanceStats={monthlyFinanceStats}
  />;
}