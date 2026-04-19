-- =============================================
-- V3.1: Agregar start_date y end_date a project_tasks
-- Reemplaza due_date por un rango de fechas
-- =============================================

-- 1. Agregar columnas start_date y end_date
ALTER TABLE public.project_tasks
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- 2. Migrar datos existentes: copiar due_date a end_date si había
UPDATE public.project_tasks SET end_date = due_date WHERE due_date IS NOT NULL;

-- 3. Copiar created_at a start_date para tareas existentes que no lo tengan
UPDATE public.project_tasks SET start_date = created_at WHERE start_date IS NULL;

-- 4. Índice para start_date (reemplaza el de due_date para el calendario)
CREATE INDEX IF NOT EXISTS idx_project_tasks_start_date ON public.project_tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_project_tasks_end_date ON public.project_tasks(end_date);
