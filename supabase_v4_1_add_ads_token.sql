-- =============================================
-- V4.1: Add ads_token and ad_account_id columns
-- Para soporte de Meta Marketing API (publicidad)
-- =============================================

-- Agregar columna para token de Facebook Ads (EAA...)
ALTER TABLE public.project_social_connections 
  ADD COLUMN IF NOT EXISTS ads_token TEXT;

-- Agregar columna para Ad Account ID
ALTER TABLE public.project_social_connections 
  ADD COLUMN IF NOT EXISTS ad_account_id TEXT;
