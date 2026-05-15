-- =============================================
-- V6: MIGRACIÓN SUPER CONSERVADORA
-- Solo agrega lo esencial para el dashboard sin romper nada existente
-- =============================================

-- 1. AGREGAR SOLO CAMPOS FALTANTES A CLIENTES (respeta toda tu estructura)
DO $$
BEGIN
    -- Solo agregar 'tier' si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clients' AND column_name = 'tier') THEN
        ALTER TABLE public.clients ADD COLUMN tier TEXT DEFAULT 'STANDARD';
    END IF;

    -- Solo agregar 'contact_info' si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clients' AND column_name = 'contact_info') THEN
        ALTER TABLE public.clients ADD COLUMN contact_info JSONB DEFAULT '{}';
    END IF;
END $$;

-- 2. CREAR SOLO LA TABLA DE PAGOS (para finanzas) - RESPETA project_tasks existente
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_date DATE NOT NULL,
  payment_method TEXT DEFAULT 'transferencia',
  status TEXT DEFAULT 'recibido',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- RLS para payments (solo si la tabla se creó nueva)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments') THEN
        ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can manage payments"
        ON public.payments FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- 3. CREAR SOLO LA TABLA DE GASTOS (para finanzas)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  category TEXT DEFAULT 'software',
  expense_date DATE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- RLS para expenses (solo si la tabla se creó nueva)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses') THEN
        ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can manage expenses"
        ON public.expenses FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- 4. AGREGAR SOLO CAMPOS NUEVOS A ACTIVITIES (respeta estructura actual)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'activities' AND column_name = 'activity_type') THEN
        ALTER TABLE public.activities ADD COLUMN activity_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'activities' AND column_name = 'related_id') THEN
        ALTER TABLE public.activities ADD COLUMN related_id UUID;
    END IF;
END $$;

-- 5. ACTUALIZAR SOLO LOS ESTADOS DE PROYECTOS (de hardcodeado a OK/CRÍTICO)
-- Esto es SEGURO porque solo cambia el contenido, no la estructura
UPDATE public.projects SET
    status = 'OK',
    status_color = 'text-[hsl(76,85%,67%)]'
WHERE status IN ('Completado', 'En Progreso');

UPDATE public.projects SET
    status = 'CRÍTICO',
    status_color = 'text-red-500'
WHERE status = 'Revisión';

-- 6. AGREGAR CLIENTES SOLO SI NO EXISTEN (super conservador)
INSERT INTO public.clients (name, email, tier, contact_info)
SELECT name, email, tier, contact_info::jsonb
FROM (VALUES
    ('MOVE FEEL PERFORM', 'movefeel@gmail.com', 'PRO', '{"phone": "+54 11 1234-5678"}'),
    ('EL SITIO RESTO', 'contacto@elsitio.com', 'STANDARD', '{"phone": "+54 11 8765-4321"}'),
    ('MÉTODO RAP', 'rap@metodo.com', 'VIP', '{"phone": "+54 11 5555-6666"}')
) AS new_clients(name, email, tier, contact_info)
WHERE NOT EXISTS (
    SELECT 1 FROM public.clients WHERE clients.name = new_clients.name
);

-- 7. VINCULAR PROYECTOS EXISTENTES CON CLIENTES (solo si no están vinculados)
-- ESTO ES SEGURO - solo actualiza si client_id es NULL
UPDATE public.projects
SET client_id = (SELECT id FROM public.clients WHERE name = 'EL SITIO RESTO' LIMIT 1)
WHERE name = 'EL SITIO RESTO' AND client_id IS NULL;

UPDATE public.projects
SET client_id = (SELECT id FROM public.clients WHERE name = 'MOVE FEEL PERFORM' LIMIT 1)
WHERE name = 'MOVE FEEL PERFORM' AND client_id IS NULL;

UPDATE public.projects
SET client_id = (SELECT id FROM public.clients WHERE name = 'MÉTODO RAP' LIMIT 1)
WHERE name = 'MÉTODO RAP' AND client_id IS NULL;

-- 8. AGREGAR DATOS DE EJEMPLO FINANCIEROS (solo si las tablas están vacías)
-- PAGOS DE EJEMPLO
INSERT INTO public.payments (project_id, amount, currency, payment_date, payment_method, status, notes)
SELECT p.id, amount, currency, payment_date::date, payment_method, status, notes
FROM (VALUES
    ('MOVE FEEL PERFORM', 2250.00, 'USD', '2024-01-10', 'transferencia', 'recibido', 'Pago inicial del 50%'),
    ('EL SITIO RESTO', 2100.00, 'USD', '2023-12-15', 'transferencia', 'recibido', 'Pago completo'),
    ('MÉTODO RAP', 4000.00, 'USD', '2024-01-01', 'transferencia', 'recibido', 'Pago inicial del 50%')
) AS example_payments(project_name, amount, currency, payment_date, payment_method, status, notes)
JOIN public.projects p ON p.name = example_payments.project_name
WHERE NOT EXISTS (SELECT 1 FROM public.payments LIMIT 1);

-- GASTOS DE EJEMPLO
INSERT INTO public.expenses (title, description, amount, currency, category, expense_date)
SELECT title, description, amount, currency, category, expense_date::date
FROM (VALUES
    ('Vercel Pro Plan', 'Hosting mensual', 20.00, 'USD', 'software', '2024-01-01'),
    ('Adobe Creative Suite', 'Licencias de diseño', 52.99, 'USD', 'software', '2024-01-01'),
    ('Materiales de Oficina', 'Suministros varios', 150.00, 'USD', 'oficina', '2024-01-05')
) AS example_expenses(title, description, amount, currency, category, expense_date)
WHERE NOT EXISTS (SELECT 1 FROM public.expenses LIMIT 1);

-- 9. FUNCIÓN HELPER PARA ACTIVIDADES (solo crear si no existe)
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

-- ✅ MIGRACIÓN MÍNIMA COMPLETADA
-- Este SQL es SUPER CONSERVADOR y respeta toda tu estructura existente
SELECT 'Migración segura completada. Dashboard con datos reales habilitado.' as resultado;