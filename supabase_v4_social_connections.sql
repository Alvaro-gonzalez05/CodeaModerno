-- =============================================
-- V4: Social Media Connections (Meta/Instagram)
-- Almacena tokens de acceso y datos de conexión
-- =============================================

-- 1. Tabla para conexiones de redes sociales
CREATE TABLE IF NOT EXISTS public.project_social_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'instagram', -- 'instagram', 'facebook', etc.
  access_token TEXT NOT NULL,
  ads_token TEXT, -- Facebook token (EAA...) para Marketing API / Ads
  ad_account_id TEXT, -- Meta Ad Account ID (act_XXXXX)
  ig_user_id TEXT, -- Instagram Business Account ID
  ig_username TEXT,
  ig_profile_picture TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(project_id, platform)
);

-- 2. RLS
ALTER TABLE public.project_social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage social connections"
  ON public.project_social_connections
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_social_connections_project ON public.project_social_connections(project_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON public.project_social_connections(platform);
