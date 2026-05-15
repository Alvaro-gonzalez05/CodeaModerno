-- Actualización incremental para migrar de datos hardcodeados
-- Solo agrega lo que falta, evita errores de tablas existentes

-- 1. ACTUALIZAR TABLA DE CLIENTES EXISTENTE (agregar campos faltantes)
DO $$
BEGIN
    -- Agregar campos si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'tier') THEN
        ALTER TABLE public.clients ADD COLUMN tier TEXT DEFAULT 'STANDARD';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'contact_info') THEN
        ALTER TABLE public.clients ADD COLUMN contact_info JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'updated_at') THEN
        ALTER TABLE public.clients ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
    END IF;
END $$;

-- 2. ACTUALIZAR TABLA DE PROYECTOS (agregar campos faltantes)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'description') THEN
        ALTER TABLE public.projects ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'start_date') THEN
        ALTER TABLE public.projects ADD COLUMN start_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'end_date') THEN
        ALTER TABLE public.projects ADD COLUMN end_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'priority') THEN
        ALTER TABLE public.projects ADD COLUMN priority TEXT DEFAULT 'media';
    END IF;
END $$;

-- 3. CREAR TABLA DE TAREAS (si no existe)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pendiente', -- pendiente, en_progreso, completada, bloqueada
  priority TEXT DEFAULT 'media', -- alta, media, baja
  due_date DATE,
  estimated_hours INTEGER,
  actual_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- RLS para tasks si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks') THEN
        ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can select tasks" ON public.tasks FOR SELECT USING (auth.role() = 'authenticated');
        CREATE POLICY "Authenticated users can insert tasks" ON public.tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        CREATE POLICY "Authenticated users can update tasks" ON public.tasks FOR UPDATE USING (auth.role() = 'authenticated');
        CREATE POLICY "Authenticated users can delete tasks" ON public.tasks FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 4. CREAR TABLA DE PAGOS (si no existe)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_date DATE NOT NULL,
  payment_method TEXT, -- transferencia, efectivo, tarjeta, etc.
  status TEXT DEFAULT 'pendiente', -- pendiente, recibido, cancelado
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- RLS para payments si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments') THEN
        ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can select payments" ON public.payments FOR SELECT USING (auth.role() = 'authenticated');
        CREATE POLICY "Authenticated users can insert payments" ON public.payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        CREATE POLICY "Authenticated users can update payments" ON public.payments FOR UPDATE USING (auth.role() = 'authenticated');
        CREATE POLICY "Authenticated users can delete payments" ON public.payments FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 5. CREAR TABLA DE GASTOS (si no existe)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  category TEXT, -- software, hardware, marketing, oficina, etc.
  expense_date DATE NOT NULL,
  receipt_url TEXT, -- URL del comprobante si se sube
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- RLS para expenses si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses') THEN
        ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can select expenses" ON public.expenses FOR SELECT USING (auth.role() = 'authenticated');
        CREATE POLICY "Authenticated users can insert expenses" ON public.expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        CREATE POLICY "Authenticated users can update expenses" ON public.expenses FOR UPDATE USING (auth.role() = 'authenticated');
        CREATE POLICY "Authenticated users can delete expenses" ON public.expenses FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 6. MEJORAR LA TABLA DE ACTIVIDADES EXISTENTE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'activity_type') THEN
        ALTER TABLE public.activities ADD COLUMN activity_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'related_id') THEN
        ALTER TABLE public.activities ADD COLUMN related_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'metadata') THEN
        ALTER TABLE public.activities ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- 7. MIGRAR CLIENTES DE HARDCODEADO A LA BASE DE DATOS (solo si no existen)
INSERT INTO public.clients (name, email, tier, contact_info)
SELECT * FROM (VALUES
    ('MOVE FEEL PERFORM', 'movefeel@gmail.com', 'PRO', '{"phone": "+54 11 1234-5678"}'),
    ('EL SITIO RESTO', 'contacto@elsitio.com', 'STANDARD', '{"phone": "+54 11 8765-4321"}'),
    ('MÉTODO RAP', 'rap@metodo.com', 'VIP', '{"phone": "+54 11 5555-6666"}'),
    ('UCOBOT SAAS', 'hello@ucobot.ai', 'ENTERPRISE', '{"phone": "+54 11 7777-8888"}'),
    ('LOGÍSTICA X', 'admin@logx.com', 'STANDARD', '{"phone": "+54 11 9999-0000"}'),
    ('TECH NOVA', 'info@technova.com', 'PRO', '{"phone": "+54 11 1111-2222"}')
) AS v(name, email, tier, contact_info)
WHERE NOT EXISTS (
    SELECT 1 FROM public.clients WHERE name = v.name
);

-- 8. VINCULAR PROYECTOS EXISTENTES CON CLIENTES Y AGREGAR PRECIOS
UPDATE public.projects
SET
    client_id = (SELECT id FROM public.clients WHERE name = 'EL SITIO RESTO' LIMIT 1),
    price = 2100.00,
    payment_type = 'unico',
    description = 'Gestión de Redes Sociales y desarrollo de UCOBOT'
WHERE name = 'EL SITIO RESTO' AND client_id IS NULL;

UPDATE public.projects
SET
    client_id = (SELECT id FROM public.clients WHERE name = 'MOVE FEEL PERFORM' LIMIT 1),
    price = 4500.00,
    payment_type = 'unico',
    description = 'Desarrollo de plataforma E-Commerce completa'
WHERE name = 'MOVE FEEL PERFORM' AND client_id IS NULL;

UPDATE public.projects
SET
    client_id = (SELECT id FROM public.clients WHERE name = 'MÉTODO RAP' LIMIT 1),
    price = 8000.00,
    payment_type = 'mensual',
    description = 'Solución 360° completa para metodología RAP'
WHERE name = 'MÉTODO RAP' AND client_id IS NULL;

-- 9. CAMBIAR ESTADOS DE PROYECTOS A 'OK' Y 'CRÍTICO'
UPDATE public.projects SET
    status = 'OK',
    status_color = 'text-[hsl(76,85%,67%)]'
WHERE status IN ('Completado', 'En Progreso');

UPDATE public.projects SET
    status = 'CRÍTICO',
    status_color = 'text-red-500'
WHERE status = 'Revisión';

-- 10. INSERTAR DATOS DE EJEMPLO PARA TAREAS (solo si la tabla está vacía)
INSERT INTO public.tasks (project_id, title, description, status, priority, due_date, estimated_hours)
SELECT
    p.id,
    v.title,
    v.description,
    v.status,
    v.priority,
    v.due_date,
    v.estimated_hours
FROM (VALUES
    ('MOVE FEEL PERFORM', 'Diseñar base de datos del e-commerce', 'Crear esquema completo de la base de datos', 'completada', 'alta', '2024-01-15'::date, 8),
    ('MOVE FEEL PERFORM', 'Implementar carrito de compras', 'Desarrollar funcionalidad del carrito', 'en_progreso', 'alta', '2024-01-25'::date, 12),
    ('EL SITIO RESTO', 'Configurar UCOBOT', 'Configuración inicial del chatbot', 'pendiente', 'media', '2024-02-01'::date, 6),
    ('MÉTODO RAP', 'Documentar metodología', 'Crear documentación completa', 'en_progreso', 'baja', '2024-02-10'::date, 20)
) AS v(project_name, title, description, status, priority, due_date, estimated_hours)
JOIN public.projects p ON p.name = v.project_name
WHERE NOT EXISTS (SELECT 1 FROM public.tasks);

-- 11. INSERTAR DATOS DE EJEMPLO PARA PAGOS (solo si la tabla está vacía)
INSERT INTO public.payments (project_id, amount, currency, payment_date, payment_method, status, notes)
SELECT
    p.id,
    v.amount,
    v.currency,
    v.payment_date,
    v.payment_method,
    v.status,
    v.notes
FROM (VALUES
    ('MOVE FEEL PERFORM', 2250.00, 'USD', '2024-01-10'::date, 'transferencia', 'recibido', 'Pago del 50% inicial'),
    ('EL SITIO RESTO', 2100.00, 'USD', '2023-12-15'::date, 'transferencia', 'recibido', 'Pago completo del proyecto'),
    ('MÉTODO RAP', 4000.00, 'USD', '2024-01-01'::date, 'transferencia', 'recibido', 'Pago del 50% inicial')
) AS v(project_name, amount, currency, payment_date, payment_method, status, notes)
JOIN public.projects p ON p.name = v.project_name
WHERE NOT EXISTS (SELECT 1 FROM public.payments);

-- 12. INSERTAR DATOS DE EJEMPLO PARA GASTOS (solo si la tabla está vacía)
INSERT INTO public.expenses (title, description, amount, currency, category, expense_date)
SELECT * FROM (VALUES
    ('Vercel Pro Plan', 'Suscripción mensual a Vercel Pro para hosting', 20.00, 'USD', 'software', '2024-01-01'::date),
    ('Adobe Creative Suite', 'Licencia mensual de Adobe para diseño', 52.99, 'USD', 'software', '2024-01-01'::date),
    ('Figma Professional', 'Suscripción anual a Figma', 144.00, 'USD', 'software', '2024-01-01'::date),
    ('Office Supplies', 'Materiales de oficina diversos', 150.00, 'USD', 'oficina', '2024-01-05'::date)
) AS v(title, description, amount, currency, category, expense_date)
WHERE NOT EXISTS (SELECT 1 FROM public.expenses);

-- 13. ACTUALIZAR ACTIVIDADES CON DATOS REALES (reemplazar hardcodeadas)
DELETE FROM public.activities WHERE activity_type IS NULL;

INSERT INTO public.activities (title, subtitle, time_ago, color, activity_type, related_id) VALUES
('Pago Recibido', 'Move Feel Perform - $2,250', 'HACE 2 HORAS', 'bg-[hsl(76,85%,67%)]', 'payment_received', (SELECT id FROM public.projects WHERE name = 'MOVE FEEL PERFORM' LIMIT 1)),
('Proyecto Completado', 'El Sitio Resto - Entregado', 'AYER', 'bg-blue-500', 'project_completed', (SELECT id FROM public.projects WHERE name = 'EL SITIO RESTO' LIMIT 1)),
('Nueva Tarea Asignada', 'Método RAP - Documentación', 'HACE 2 DÍAS', 'bg-white/20', 'task_assigned', (SELECT id FROM public.projects WHERE name = 'MÉTODO RAP' LIMIT 1));

-- 14. CREAR FUNCIÓN PARA AUTOMATIZAR ACTIVIDADES (si no existe)
CREATE OR REPLACE FUNCTION public.create_activity(
  p_title TEXT,
  p_subtitle TEXT,
  p_activity_type TEXT,
  p_related_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activities (title, subtitle, time_ago, color, activity_type, related_id)
  VALUES (p_title, p_subtitle, 'AHORA', 'bg-[hsl(76,85%,67%)]', p_activity_type, p_related_id)
  RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ ACTUALIZACIÓN COMPLETADA
-- Este SQL debe ejecutarse sin errores sobre tu base de datos existente
SELECT 'Migración completada exitosamente. Datos hardcodeados migrados a la base de datos.' as resultado;