-- 1. Crear tabla independiente para CLIENTES
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can select clients" ON public.clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage clients" ON public.clients FOR ALL USING (auth.role() = 'authenticated');

-- 2. Expandir la tabla PROYECTOS actual
-- OJO: Esto actualiza la tabla projects agregando los campos financieros y vinculando al cliente
ALTER TABLE public.projects 
ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN price NUMERIC DEFAULT 0,
ADD COLUMN payment_type TEXT DEFAULT 'unico'; -- Puede ser 'unico' o 'mensual/recurrente'

-- 3. Tabla Pivot: PROYECTO_SERVICIOS (Relación Muchos a Muchos)
-- Permite que un proyecto tenga múltiples servicios (ej: "Landing Page" + "UCOBOT")
CREATE TABLE public.project_services (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, service_id)
);

ALTER TABLE public.project_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage project services" ON public.project_services FOR ALL USING (auth.role() = 'authenticated');

-- 4. Nueva Tabla: EL BAÚL DEL PROYECTO (project_vault)
-- Aquí se guardarán contraseñas, links, archivos, notas, etc.
CREATE TABLE public.project_vault (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- Ej: 'link', 'nota', 'credencial'
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Para links será la URL, para credenciales será un JSON (usuario/pass), para notas será texto largo
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.project_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can select vault items" ON public.project_vault FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage vault items" ON public.project_vault FOR ALL USING (auth.role() = 'authenticated');
