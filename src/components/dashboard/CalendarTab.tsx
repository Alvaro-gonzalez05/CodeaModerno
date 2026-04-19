'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, AlertTriangle, CheckCircle2, ListTodo, X, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CalendarTabProps {
  currentUserId: string;
}

export default function CalendarTab({ currentUserId }: CalendarTabProps) {
  const supabase = createClient();

  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);

      // Fetch ALL tasks across all projects (start_date always exists)
      const { data: allTasks } = await supabase
        .from('project_tasks')
        .select('*, assigned:assigned_to(id, full_name), creator:created_by(id, full_name), project:project_id(id, name)')
        .order('start_date', { ascending: true });
      if (allTasks) setTasks(allTasks);

      // Fetch projects for context
      const { data: proj } = await supabase
        .from('projects')
        .select('id, name')
        .order('name', { ascending: true });
      if (proj) setProjects(proj);

      setLoading(false);
    };

    fetchTasks();
  }, []);

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => { setCurrentDate(new Date()); setSelectedDay(today.getDate()); };

  // Group tasks by day of current month (using start_date → end_date range)
  const tasksByDay = useMemo(() => {
    const map: Record<number, any[]> = {};
    tasks.forEach(task => {
      const start = task.start_date ? new Date(task.start_date) : (task.created_at ? new Date(task.created_at) : null);
      if (!start) return;
      const end = task.end_date ? new Date(task.end_date) : start;

      // For each day in the range, add the task if it falls in the current month
      const cursor = new Date(start);
      cursor.setHours(0, 0, 0, 0);
      const endDay = new Date(end);
      endDay.setHours(23, 59, 59, 999);

      while (cursor <= endDay) {
        if (cursor.getFullYear() === year && cursor.getMonth() === month) {
          const day = cursor.getDate();
          if (!map[day]) map[day] = [];
          // Avoid duplicates
          if (!map[day].some((t: any) => t.id === task.id)) {
            map[day].push(task);
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    return map;
  }, [tasks, year, month]);

  // Tasks for selected day
  const selectedDayTasks = selectedDay ? (tasksByDay[selectedDay] || []) : [];

  // Upcoming tasks (next 7 days from start_date or end_date)
  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return tasks.filter(t => {
      if (t.status === 'completada') return false;
      const start = t.start_date ? new Date(t.start_date) : null;
      const end = t.end_date ? new Date(t.end_date) : start;
      if (!start) return false;
      // Task is upcoming if its range overlaps with next 7 days
      return (end || start) >= now && start <= weekFromNow;
    }).slice(0, 8);
  }, [tasks]);

  const getTaskPriorityDot = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-500';
      case 'alta': return 'bg-orange-500';
      case 'media': return 'bg-yellow-500';
      case 'baja': return 'bg-blue-500';
      default: return 'bg-white/30';
    }
  };

  const isMyTask = (task: any) => task.assigned?.id === currentUserId;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="dashboard-header text-4xl lg:text-6xl font-black tracking-tighter uppercase">
          <span className="text-white">Calen</span>
          <span className="text-transparent" style={{ WebkitTextStroke: '1.5px white' }}>dario</span>
        </h1>
        <p className="text-white/50 text-sm uppercase tracking-widest mt-2">
          Todas las tareas del equipo en un solo lugar
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="xl:col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 lg:p-8">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold uppercase tracking-tight text-white">
                {monthNames[month]} {year}
              </h2>
              <button 
                onClick={goToday}
                className="text-[10px] px-3 py-1.5 bg-[hsl(76,85%,67%)]/10 text-[hsl(76,85%,67%)] rounded-full font-bold uppercase tracking-widest hover:bg-[hsl(76,85%,67%)]/20 transition-colors"
              >
                Hoy
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10">
                <ChevronLeft size={18} className="text-white/70" />
              </button>
              <button onClick={nextMonth} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10">
                <ChevronRight size={18} className="text-white/70" />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-center text-[10px] font-bold tracking-widest text-white/30 uppercase py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before first day of month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-xl" />
            ))}

            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayTasks = tasksByDay[day] || [];
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = day === selectedDay;
              const hasMyTasks = dayTasks.some(t => isMyTask(t));
              const hasOtherTasks = dayTasks.some(t => !isMyTask(t));

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all relative group border ${
                    isSelected
                      ? 'bg-white/15 border-[hsl(76,85%,67%)]/50 shadow-[0_0_15px_rgba(194,242,84,0.15)]'
                      : isToday 
                        ? 'bg-[hsl(76,85%,67%)]/10 border-[hsl(76,85%,67%)]/30'
                        : dayTasks.length > 0
                          ? 'bg-white/5 border-white/10 hover:bg-white/10'
                          : 'border-transparent hover:bg-white/5'
                  }`}
                >
                  <span className={`text-sm font-medium ${isToday ? 'text-[hsl(76,85%,67%)] font-bold' : isSelected ? 'text-white font-bold' : 'text-white/70'}`}>
                    {day}
                  </span>
                  {dayTasks.length > 0 && (
                    <div className="flex gap-0.5">
                      {hasMyTasks && <span className="w-1.5 h-1.5 rounded-full bg-[hsl(76,85%,67%)]" />}
                      {hasOtherTasks && <span className="w-1.5 h-1.5 rounded-full bg-white/40" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[hsl(76,85%,67%)]" />
              <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Mis tareas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
              <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Del equipo</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Próximas tareas */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/70 mb-4 flex items-center gap-2">
              <Clock size={14} className="text-[hsl(76,85%,67%)]" /> Próximos 7 días
            </h3>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-2">
                {upcomingTasks.map((task: any) => {
                  const isOverdue = task.end_date && new Date(task.end_date) < new Date();
                  return (
                    <div key={task.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getTaskPriorityDot(task.priority)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium truncate">{task.title}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest">{task.project?.name}</p>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isOverdue ? 'text-red-400' : 'text-white/40'}`}>
                          {new Date(task.end_date || task.start_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </span>
                        {isMyTask(task) && (
                          <span className="text-[8px] text-[hsl(76,85%,67%)] font-bold uppercase tracking-widest">Tuya</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/30 text-xs uppercase tracking-widest text-center py-4">
                No hay tareas próximas
              </p>
            )}
          </div>

          {/* Stats rápidos */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/70 mb-4">
              Resumen
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Mis pendientes', value: tasks.filter(t => isMyTask(t) && t.status === 'pendiente').length, color: 'text-white' },
                { label: 'En progreso', value: tasks.filter(t => isMyTask(t) && t.status === 'en_progreso').length, color: 'text-yellow-400' },
                { label: 'Completadas', value: tasks.filter(t => isMyTask(t) && t.status === 'completada').length, color: 'text-emerald-400' },
                { label: 'Total equipo', value: tasks.filter(t => t.status !== 'completada').length, color: 'text-[hsl(76,85%,67%)]' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Tareas del día seleccionado */}
      {selectedDay !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] w-full max-w-2xl shadow-2xl relative max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 lg:p-8 border-b border-white/10 flex-shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[hsl(76,85%,67%)]/10 flex items-center justify-center">
                    <Calendar size={18} className="text-[hsl(76,85%,67%)]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tighter text-white">
                      {selectedDay} de {monthNames[month]}
                    </h2>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                      {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'tarea' : 'tareas'} · {selectedDayTasks.filter(t => isMyTask(t)).length} tuyas
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDay(null)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10"
              >
                <X size={18} className="text-white/50" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-3">
              {selectedDayTasks.length > 0 ? (
                selectedDayTasks.map((task: any) => {
                  const isOverdue = task.end_date && new Date(task.end_date) < new Date() && task.status !== 'completada';
                  const isMine = isMyTask(task);

                  return (
                    <div 
                      key={task.id} 
                      className={`p-5 rounded-2xl border transition-all ${
                        isMine
                          ? 'bg-[hsl(76,85%,67%)]/5 border-[hsl(76,85%,67%)]/20 hover:border-[hsl(76,85%,67%)]/40'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Top row: priority + status + overdue */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                            task.priority === 'urgente' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            task.priority === 'alta' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            task.priority === 'media' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {task.priority}
                          </span>
                          {isOverdue && (
                            <span className="flex items-center gap-1 text-[9px] text-red-400 font-bold uppercase tracking-widest">
                              <AlertTriangle size={10} /> Vencida
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${
                          task.status === 'completada' ? 'bg-emerald-500/20 text-emerald-400' :
                          task.status === 'en_progreso' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-white/10 text-white/40'
                        }`}>
                          {task.status === 'completada' ? 'Completada' : task.status === 'en_progreso' ? 'En Progreso' : 'Pendiente'}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className={`text-base font-semibold mb-1 ${task.status === 'completada' ? 'line-through text-white/30' : 'text-white'}`}>
                        {task.title}
                      </h4>

                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-white/40 mb-3 line-clamp-2">{task.description}</p>
                      )}

                      {/* Project name */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-white/50 uppercase tracking-widest font-bold">
                          {task.project?.name || 'Sin proyecto'}
                        </span>
                      </div>

                      {/* Bottom row: assignee + dates */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          {task.assigned?.full_name ? (
                            <>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-[9px] font-bold ${
                                isMine 
                                  ? 'bg-[hsl(76,85%,67%)]/10 border-[hsl(76,85%,67%)]/30 text-[hsl(76,85%,67%)]'
                                  : 'bg-white/10 border-white/10 text-white/60'
                              }`}>
                                {task.assigned.full_name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className={`text-xs font-medium ${isMine ? 'text-[hsl(76,85%,67%)]' : 'text-white/70'}`}>
                                  {isMine ? 'Tú' : task.assigned.full_name}
                                </p>
                                {isMine && <p className="text-[9px] text-[hsl(76,85%,67%)]/60 uppercase tracking-widest">Asignada a vos</p>}
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-white/25 flex items-center gap-1">
                              <User size={12} /> Sin asignar
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          {task.start_date && (
                            <p className="text-[10px] text-white/30 flex items-center gap-1 uppercase tracking-widest">
                              <Clock size={10} />
                              {new Date(task.start_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                              {task.end_date && <> → {new Date(task.end_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</>}
                            </p>
                          )}
                          {task.creator?.full_name && (
                            <p className="text-[9px] text-white/20 mt-0.5 uppercase tracking-widest">
                              Creada por {task.creator.full_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center">
                  <Calendar size={40} className="text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 text-sm uppercase tracking-widest">
                    No hay tareas para este día
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
