-- 1. Crear tabla de Perfiles (Se vincula con auth.users de Supabase)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Trigger para crear perfil automáticamente cuando un usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'employee');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Configurar Row Level Security (RLS) en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Crear tabla de Proyectos
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  status TEXT NOT NULL,
  status_color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
-- Solo usuarios autenticados pueden ver o modificar proyectos
CREATE POLICY "Authenticated users can select projects" ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert projects" ON public.projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update projects" ON public.projects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete projects" ON public.projects FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Insertar datos de prueba para Proyectos
INSERT INTO public.projects (name, client_name, status, status_color) VALUES 
('EL SITIO RESTO', 'Gestión de Redes & UCOBOT', 'Completado', 'text-[hsl(76,85%,67%)]'),
('MOVE FEEL PERFORM', 'E-Commerce', 'En Progreso', 'text-yellow-500'),
('MÉTODO RAP', 'Solución 360°', 'Revisión', 'text-blue-500');

-- 5. Crear tabla de Servicios
CREATE TABLE public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  align TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public services are viewable by everyone." ON public.services FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert services" ON public.services FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update services" ON public.services FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete services" ON public.services FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Insertar datos de prueba para Servicios
INSERT INTO public.services (title, subtitle, align) VALUES 
('LANDING-PAGE', 'TU PRESENCIA DIGITAL, AL PUNTO. DISEÑAMOS PÁGINAS WEB ORIENTADAS A LA CONVERSIÓN, CON UN MENSAJE CLARO Y ATRACTIVO QUE CAPTA LA ATENCIÓN DE TUS CLIENTES POTENCIALES Y LOS IMPULSA A TOMAR ACCIÓN.', 'left'),
('E-COMMERCE', 'TU TIENDA ABIERTA LAS 24 HORAS. DESARROLLAMOS TIENDAS ONLINE COMPLETAS, INTUITIVAS Y SEGURAS, PARA QUE PUEDAS VENDER TUS PRODUCTOS O SERVICIOS EN INTERNET SIN LÍMITES DE HORARIO NI UBICACIÓN.', 'right'),
('SISTEMAS A MEDIDA', 'SOFTWARE QUE SE ADAPTA A VOS, NO AL REVÉS. CREAMOS SOLUCIONES DE SOFTWARE PERSONALIZADAS SEGÚN LAS NECESIDADES ESPECÍFICAS DE TU NEGOCIO, OPTIMIZANDO PROCESOS Y MEJORANDO LA EFICIENCIA OPERATIVA.', 'left'),
('UCOBOT', 'TU NEGOCIO AUTOMATIZADO, EN UN SOLO LUGAR. PLATAFORMA INTELIGENTE DONDE CUALQUIER NEGOCIO PUEDE CREAR SU PROPIO CHATBOT CON IA, CENTRALIZAR CONVERSACIONES DE MÚLTIPLES APLICACIONES, AUTOMATIZAR PROCESOS CLAVE Y HACER ENVÍOS MASIVOS DE MENSAJES POR WHATSAPP. – ACCESO DESDE $65.000 ARS/MES – WHATSAPP MARKETING: $0.08 USD POR MENSAJE', 'left'),
('GESTIÓN DE REDES Y CONTENIDO', 'CREAMOS Y GESTIONAMOS LA PRESENCIA DE TU MARCA EN REDES SOCIALES DE FORMA INTEGRAL. NOS ENCARGAMOS DE LA ESTRATEGIA, LA PRODUCCIÓN DE CONTENIDO, LA PLANIFICACIÓN EDITORIAL Y LA INTERACCIÓN CON TU COMUNIDAD – PARA QUE TU NEGOCIO COMUNIQUE DE FORMA CONSISTENTE Y PROFESIONAL SIN QUE TENGAS QUE PREOCUPARTE POR ESO.', 'right');

-- 7. Crear tabla de Actividades de la empresa
CREATE TABLE public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  time_ago TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can select activities" ON public.activities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert activities" ON public.activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 8. Insertar datos de prueba para Actividades
INSERT INTO public.activities (title, subtitle, time_ago, color) VALUES
('Pago Recibido', 'Move Feel Perform - 50%', 'HACE 2 HORAS', 'bg-[hsl(76,85%,67%)]'),
('Deploy Realizado', 'El Sitio Resto (Producción)', 'AYER', 'bg-blue-500'),
('Nuevo Lead', 'Contacto vía UCOBOT', 'HACE 2 DÍAS', 'bg-white/20');
