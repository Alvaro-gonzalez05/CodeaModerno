-- Extensión del sistema - Tablas faltantes para migrar de datos hardcodeados
-- Ejecutar después de los schemas anteriores

-- 1. TABLA DE CLIENTES
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_info JSONB DEFAULT '{}', -- Para teléfono, dirección, etc.
  tier TEXT DEFAULT 'STANDARD', -- STANDARD, PRO, VIP, ENTERPRISE
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can select clients" ON public.clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert clients" ON public.clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update clients" ON public.clients FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete clients" ON public.clients FOR DELETE USING (auth.role() = 'authenticated');

-- 2. MODIFICAR TABLA DE PROYECTOS PARA AGREGAR CAMPOS NECESARIOS
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'unico'; -- unico, mensual
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'media'; -- alta, media, baja

-- 3. TABLA DE TAREAS
CREATE TABLE public.tasks (
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

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can select tasks" ON public.tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert tasks" ON public.tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update tasks" ON public.tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete tasks" ON public.tasks FOR DELETE USING (auth.role() = 'authenticated');

-- 4. TABLA DE FINANZAS/PAGOS
CREATE TABLE public.payments (
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

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can select payments" ON public.payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert payments" ON public.payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update payments" ON public.payments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete payments" ON public.payments FOR DELETE USING (auth.role() = 'authenticated');

-- 5. TABLA DE GASTOS DE LA EMPRESA
CREATE TABLE public.expenses (
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

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can select expenses" ON public.expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert expenses" ON public.expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update expenses" ON public.expenses FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete expenses" ON public.expenses FOR DELETE USING (auth.role() = 'authenticated');

-- 6. MEJORAR LA TABLA DE ACTIVIDADES PARA SER MÁS DINÁMICA
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS activity_type TEXT; -- new_project, payment_received, task_assigned, new_client
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS related_id UUID; -- ID del proyecto, cliente, tarea, etc.
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'; -- Datos adicionales

-- 7. INSERTAR CLIENTES DE EJEMPLO (MIGRAR DE HARDCODEADO)
INSERT INTO public.clients (name, email, tier, contact_info) VALUES
('MOVE FEEL PERFORM', 'movefeel@gmail.com', 'PRO', '{"phone": "+54 11 1234-5678"}'),
('EL SITIO RESTO', 'contacto@elsitio.com', 'STANDARD', '{"phone": "+54 11 8765-4321"}'),
('MÉTODO RAP', 'rap@metodo.com', 'VIP', '{"phone": "+54 11 5555-6666"}'),
('UCOBOT SAAS', 'hello@ucobot.ai', 'ENTERPRISE', '{"phone": "+54 11 7777-8888"}'),
('LOGÍSTICA X', 'admin@logx.com', 'STANDARD', '{"phone": "+54 11 9999-0000"}'),
('TECH NOVA', 'info@technova.com', 'PRO', '{"phone": "+54 11 1111-2222"}');

-- 8. ACTUALIZAR PROYECTOS EXISTENTES CON CLIENTES
-- Primero obtener los IDs de los clientes insertados y actualizar los proyectos
UPDATE public.projects
SET client_id = (SELECT id FROM public.clients WHERE name = 'EL SITIO RESTO' LIMIT 1),
    price = 2100.00,
    payment_type = 'unico',
    description = 'Gestión de Redes Sociales y desarrollo de UCOBOT'
WHERE name = 'EL SITIO RESTO';

UPDATE public.projects
SET client_id = (SELECT id FROM public.clients WHERE name = 'MOVE FEEL PERFORM' LIMIT 1),
    price = 4500.00,
    payment_type = 'unico',
    description = 'Desarrollo de plataforma E-Commerce completa'
WHERE name = 'MOVE FEEL PERFORM';

UPDATE public.projects
SET client_id = (SELECT id FROM public.clients WHERE name = 'MÉTODO RAP' LIMIT 1),
    price = 8000.00,
    payment_type = 'mensual',
    description = 'Solución 360° completa para metodología RAP'
WHERE name = 'MÉTODO RAP';

-- 9. INSERTAR ALGUNAS TAREAS DE EJEMPLO
INSERT INTO public.tasks (project_id, title, description, status, priority, due_date, estimated_hours) VALUES
((SELECT id FROM public.projects WHERE name = 'MOVE FEEL PERFORM' LIMIT 1), 'Diseñar base de datos del e-commerce', 'Crear esquema completo de la base de datos', 'completada', 'alta', '2024-01-15', 8),
((SELECT id FROM public.projects WHERE name = 'MOVE FEEL PERFORM' LIMIT 1), 'Implementar carrito de compras', 'Desarrollar funcionalidad del carrito', 'en_progreso', 'alta', '2024-01-25', 12),
((SELECT id FROM public.projects WHERE name = 'EL SITIO RESTO' LIMIT 1), 'Configurar UCOBOT', 'Configuración inicial del chatbot', 'pendiente', 'media', '2024-02-01', 6),
((SELECT id FROM public.projects WHERE name = 'MÉTODO RAP' LIMIT 1), 'Documentar metodología', 'Crear documentación completa', 'en_progreso', 'baja', '2024-02-10', 20);

-- 10. INSERTAR ALGUNOS PAGOS DE EJEMPLO
INSERT INTO public.payments (project_id, amount, currency, payment_date, payment_method, status, notes) VALUES
((SELECT id FROM public.projects WHERE name = 'MOVE FEEL PERFORM' LIMIT 1), 2250.00, 'USD', '2024-01-10', 'transferencia', 'recibido', 'Pago del 50% inicial'),
((SELECT id FROM public.projects WHERE name = 'EL SITIO RESTO' LIMIT 1), 2100.00, 'USD', '2023-12-15', 'transferencia', 'recibido', 'Pago completo del proyecto'),
((SELECT id FROM public.projects WHERE name = 'MÉTODO RAP' LIMIT 1), 4000.00, 'USD', '2024-01-01', 'transferencia', 'recibido', 'Pago del 50% inicial');

-- 11. INSERTAR ALGUNOS GASTOS DE EJEMPLO
INSERT INTO public.expenses (title, description, amount, currency, category, expense_date) VALUES
('Vercel Pro Plan', 'Suscripción mensual a Vercel Pro para hosting', 20.00, 'USD', 'software', '2024-01-01'),
('Adobe Creative Suite', 'Licencia mensual de Adobe para diseño', 52.99, 'USD', 'software', '2024-01-01'),
('Figma Professional', 'Suscripción anual a Figma', 144.00, 'USD', 'software', '2024-01-01'),
('Office Supplies', 'Materiales de oficina diversos', 150.00, 'USD', 'oficina', '2024-01-05');

-- 12. CAMBIAR ESTADOS DE PROYECTOS A 'OK' Y 'CRÍTICO'
UPDATE public.projects SET status = 'OK', status_color = 'text-[hsl(76,85%,67%)]' WHERE status = 'Completado';
UPDATE public.projects SET status = 'OK', status_color = 'text-[hsl(76,85%,67%)]' WHERE status = 'En Progreso';
UPDATE public.projects SET status = 'CRÍTICO', status_color = 'text-red-500' WHERE status = 'Revisión';

-- 13. ACTUALIZAR ACTIVIDADES CON DATOS REALES
DELETE FROM public.activities; -- Limpiar actividades hardcodeadas
INSERT INTO public.activities (title, subtitle, time_ago, color, activity_type, related_id) VALUES
('Pago Recibido', 'Move Feel Perform - $2,250', 'HACE 2 HORAS', 'bg-[hsl(76,85%,67%)]', 'payment_received', (SELECT id FROM public.projects WHERE name = 'MOVE FEEL PERFORM' LIMIT 1)),
('Proyecto Completado', 'El Sitio Resto - Entregado', 'AYER', 'bg-blue-500', 'project_completed', (SELECT id FROM public.projects WHERE name = 'EL SITIO RESTO' LIMIT 1)),
('Nueva Tarea Asignada', 'Método RAP - Documentación', 'HACE 2 DÍAS', 'bg-white/20', 'task_assigned', (SELECT id FROM public.projects WHERE name = 'MÉTODO RAP' LIMIT 1));

-- 14. CREAR FUNCIÓN PARA AUTOMATIZAR ACTIVIDADES
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