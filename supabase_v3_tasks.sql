-- =============================================
-- V3: Sistema de Tareas por Proyecto
-- =============================================

-- 1. Tabla de tareas de proyecto
CREATE TABLE public.project_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_progreso', 'completada')),
  priority TEXT DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. RLS para project_tasks
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks are viewable by authenticated users."
  ON public.project_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tasks."
  ON public.project_tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks."
  ON public.project_tasks FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete tasks."
  ON public.project_tasks FOR DELETE
  TO authenticated
  USING (true);

-- 3. Índices para rendimiento
CREATE INDEX idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_assigned_to ON public.project_tasks(assigned_to);
CREATE INDEX idx_project_tasks_due_date ON public.project_tasks(due_date);
CREATE INDEX idx_project_tasks_status ON public.project_tasks(status);
