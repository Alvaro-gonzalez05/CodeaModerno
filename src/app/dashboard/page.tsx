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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthStart = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  const monthEnd = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

  // Todas las queries en paralelo — de ~10 round-trips a 1
  const [
    profileResult,
    activeProjectsResult,
    totalClientsResult,
    pendingTasksResult,
    monthlyPaymentsResult,
    projectsResult,
    allProjectsResult,
    clientsResult,
    activitiesResult,
    allPaymentsResult,
    allExpensesResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('projects').select('*', { count: 'exact', head: true }).neq('status', 'OK'),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).neq('status', 'completada'),
    supabase.from('payments').select('amount').eq('status', 'recibido').gte('payment_date', monthStart).lt('payment_date', monthEnd),
    supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('clients').select('*, projects:projects!client_id(id, price)').order('created_at', { ascending: false }),
    supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('payments').select('*, project:projects(name)').eq('status', 'recibido').order('payment_date', { ascending: false }),
    supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
  ]);

  if (allProjectsResult.error) console.error('[dashboard] allProjects error:', allProjectsResult.error);

  const monthlyIncome = monthlyPaymentsResult.data?.reduce((total, p) => total + Number(p.amount), 0) || 0;

  const clientsWithSpent = (clientsResult.data || []).map((client) => {
    const projectList = client.projects || [];
    const totalBilled = projectList.reduce((sum: number, p: any) => sum + Number(p.price || 0), 0);
    return { ...client, totalSpent: `$${totalBilled.toLocaleString()}`, projects: projectList.length };
  });

  const totalIncome = allPaymentsResult.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalExpenses = allExpensesResult.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const netBalance = totalIncome - totalExpenses;
  const marginPercentage = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  const stats = {
    activeProjects: activeProjectsResult.count || 0,
    totalClients: totalClientsResult.count || 0,
    pendingTasks: pendingTasksResult.count || 0,
    monthlyIncome: `$${(monthlyIncome / 1000).toFixed(1)}K`,
  };

  return <DashboardClient
    userProfile={profileResult.data}
    projects={projectsResult.data || []}
    allProjects={allProjectsResult.data || []}
    clients={clientsWithSpent}
    activities={activitiesResult.data || []}
    stats={stats}
    payments={allPaymentsResult.data || []}
    expenses={allExpensesResult.data || []}
    monthlyFinanceStats={{ totalIncome, totalExpenses, netBalance, marginPercentage }}
  />;
}