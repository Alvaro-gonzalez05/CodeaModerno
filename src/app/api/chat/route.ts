import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import {
  getConnection,
  fetchProfile,
  fetchAccountInsights,
  analyzePosts,
  fetchAdsOverview,
  pauseCampaign,
  resumeCampaign,
  updateCampaignBudget,
  boostInstagramPost,
  activateBoost,
} from '@/lib/instagram/helpers';

// --- Gemini Tool Declarations ---
const tools = [
  {
    functionDeclarations: [
      {
        name: 'get_projects',
        description: 'Obtener la lista de todos los proyectos con su información básica (nombre, estado, precio, tipo de pago, cliente, fechas).',
        parameters: { type: SchemaType.OBJECT, properties: {} },
      },
      {
        name: 'get_project_details',
        description: 'Obtener detalles completos de un proyecto específico por su ID, incluyendo servicios vinculados.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto' },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'get_tasks',
        description: 'Obtener tareas de un proyecto específico, o todas las tareas si no se especifica proyecto. Incluye asignado, creador, prioridad, estado, fechas.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto (opcional, si no se pasa trae todas)' },
            status: { type: SchemaType.STRING, description: 'Filtrar por estado: pendiente, en_progreso, completada (opcional)' },
          },
        },
      },
      {
        name: 'create_task',
        description: 'Crear una nueva tarea en un proyecto. Requiere project_id y title. Opcionalmente: description, assigned_to (UUID del empleado), priority (baja/media/alta/urgente), start_date, end_date.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto' },
            title: { type: SchemaType.STRING, description: 'Título de la tarea' },
            description: { type: SchemaType.STRING, description: 'Descripción detallada (opcional)' },
            assigned_to: { type: SchemaType.STRING, description: 'UUID del empleado al que se asigna (opcional)' },
            priority: { type: SchemaType.STRING, description: 'Prioridad: baja, media, alta, urgente (default: media)' },
            start_date: { type: SchemaType.STRING, description: 'Fecha de inicio ISO (opcional)' },
            end_date: { type: SchemaType.STRING, description: 'Fecha de fin ISO (opcional)' },
          },
          required: ['project_id', 'title'],
        },
      },
      {
        name: 'update_task_status',
        description: 'Cambiar el estado de una tarea existente.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            task_id: { type: SchemaType.STRING, description: 'UUID de la tarea' },
            status: { type: SchemaType.STRING, description: 'Nuevo estado: pendiente, en_progreso, completada' },
          },
          required: ['task_id', 'status'],
        },
      },
      {
        name: 'delete_task',
        description: 'Eliminar una tarea por su ID.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            task_id: { type: SchemaType.STRING, description: 'UUID de la tarea a eliminar' },
          },
          required: ['task_id'],
        },
      },
      {
        name: 'get_vault',
        description: 'Obtener los items del vault (bóveda/archivos) de un proyecto.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto' },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'add_to_vault',
        description: 'Agregar un nuevo item al vault de un proyecto. ¡PROHIBIDO USAR SIN CONFIRMACIÓN! Solo llamá a esta tool si el usuario ya aprobó explícitamente el texto/idea propuesta en el chat.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto' },
            title: { type: SchemaType.STRING, description: 'Título del item' },
            content: { type: SchemaType.STRING, description: 'Contenido del item' },
            type: { type: SchemaType.STRING, description: 'Tipo: note, link, credential, file (default: note)' },
          },
          required: ['project_id', 'title', 'content'],
        },
      },
      {
        name: 'get_profiles',
        description: 'Obtener todos los perfiles/empleados del sistema con su nombre y rol.',
        parameters: { type: SchemaType.OBJECT, properties: {} },
      },
      {
        name: 'update_project',
        description: 'Actualizar datos de un proyecto (nombre, estado, precio, tipo de pago, descripción).',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto' },
            name: { type: SchemaType.STRING, description: 'Nuevo nombre (opcional)' },
            status: { type: SchemaType.STRING, description: 'Nuevo estado (opcional)' },
            price: { type: SchemaType.NUMBER, description: 'Nuevo precio (opcional)' },
            payment_type: { type: SchemaType.STRING, description: 'Tipo de pago (opcional)' },
            description: { type: SchemaType.STRING, description: 'Nueva descripción (opcional)' },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'get_project_services',
        description: 'Obtener los servicios vinculados a un proyecto.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto' },
          },
          required: ['project_id'],
        },
      },

      // ====== INSTAGRAM / META ADS ======
      {
        name: 'ig_get_profile',
        description:
          'Obtener el perfil de Instagram conectado al proyecto (username, seguidores, seguidos, cantidad de posts, bio, web, foto).',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto' },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'ig_get_account_insights',
        description:
          'Obtener métricas agregadas de la cuenta de Instagram en los últimos 30 días: reach, interacciones, likes, comentarios, shares, saves, replies, vistas al perfil, evolución de seguidores, taps en links, y demografía (edad, género, ciudad, país).',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto' },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'ig_analyze_posts',
        description:
          'Analiza los últimos N posts del IG: trae cada post con sus métricas (likes, comments, shares, saves, reach, total_interactions) y calcula engagement rate. Devuelve los TOP 3 posts por engagement, los PEORES 3, y promedios. Usalo cuando el usuario pida diagnosticar performance, detectar fallas o identificar qué contenido funciona mejor.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto' },
            limit: { type: SchemaType.NUMBER, description: 'Cantidad de posts a analizar (default 12, máx 25)' },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'ig_get_ads_overview',
        description:
          'Obtener el resumen de publicidad de Meta Ads del proyecto: cuenta publicitaria (nombre, moneda, gasto, balance), campañas con métricas (impresiones, alcance, clicks, spend, CPC, CPM, CTR), anuncios y resumen de spend de los últimos 90 días. Usalo para diagnosticar campañas (CPC alto, CTR bajo, mal rendimiento).',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto' },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'ig_pause_campaign',
        description:
          'Pausar una campaña activa de Meta Ads. SIEMPRE confirmá con el usuario antes de ejecutar (mostrá el nombre de la campaña).',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto' },
            campaign_id: { type: SchemaType.STRING, description: 'ID de la campaña' },
          },
          required: ['project_id', 'campaign_id'],
        },
      },
      {
        name: 'ig_resume_campaign',
        description:
          'Reactivar una campaña pausada de Meta Ads. SIEMPRE confirmá con el usuario antes de ejecutar.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto' },
            campaign_id: { type: SchemaType.STRING, description: 'ID de la campaña' },
          },
          required: ['project_id', 'campaign_id'],
        },
      },
      {
        name: 'ig_update_campaign_budget',
        description:
          'Modificar el presupuesto diario de una campaña de Meta Ads. El monto se pasa en la moneda principal (ej. ARS) — el sistema lo convierte a unidades menores. SIEMPRE confirmá con el usuario antes de ejecutar.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto' },
            campaign_id: { type: SchemaType.STRING, description: 'ID de la campaña' },
            daily_budget: { type: SchemaType.NUMBER, description: 'Nuevo presupuesto diario en moneda principal (ej. 2000 = $2000 ARS)' },
          },
          required: ['project_id', 'campaign_id', 'daily_budget'],
        },
      },
      {
        name: 'ig_boost_post',
        description:
          'Crear una campaña de Meta Ads para promocionar un post existente de Instagram. Crea Campaign + AdSet + Ad en estado PAUSADO. SIEMPRE pedí confirmación al usuario, mostrando media_id, presupuesto diario, días, países y objetivo antes de ejecutar. Una vez creada, ofrecele al usuario activarla directamente con ig_activate_boost o revisarla en el Ads Manager.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto' },
            media_id: { type: SchemaType.STRING, description: 'ID del post de Instagram a promocionar' },
            daily_budget: { type: SchemaType.NUMBER, description: 'Presupuesto diario en moneda principal (ej. 2000 = $2000 ARS)' },
            days: { type: SchemaType.NUMBER, description: 'Cantidad de días que correrá la campaña' },
            objective: { type: SchemaType.STRING, description: 'Objetivo: OUTCOME_ENGAGEMENT (default), OUTCOME_AWARENESS, OUTCOME_TRAFFIC' },
            countries: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Códigos de país ISO (default ["AR"])' },
            age_min: { type: SchemaType.NUMBER, description: 'Edad mínima (default 18)' },
            age_max: { type: SchemaType.NUMBER, description: 'Edad máxima (default 65)' },
            link_url: { type: SchemaType.STRING, description: 'URL de destino del CTA (ej. https://cliente.com/servicios). REQUERIDA por Meta. Preguntále al usuario cuál usar — NUNCA inventes ni asumas una URL por defecto.' },
            call_to_action: { type: SchemaType.STRING, description: 'Tipo de CTA: LEARN_MORE, SHOP_NOW, SIGN_UP, CONTACT_US, BOOK_TRAVEL, DOWNLOAD, MESSAGE_PAGE. REQUERIDO. Preguntále al usuario cuál usar.' },
          },
          required: ['project_id', 'media_id', 'daily_budget', 'days', 'link_url', 'call_to_action'],
        },
      },
      {
        name: 'ig_activate_boost',
        description:
          'Activar una campaña de Meta Ads previamente creada con ig_boost_post. Activa los 3 niveles (Campaign + AdSet + Ad) de una sola vez para que la pauta comience a correr. SIEMPRE pedí confirmación al usuario antes de activar, mostrando campaign_id y el detalle de la campaña.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'UUID del proyecto' },
            campaign_id: { type: SchemaType.STRING, description: 'ID de la campaña a activar' },
            adset_id: { type: SchemaType.STRING, description: 'ID del AdSet a activar' },
            ad_id: { type: SchemaType.STRING, description: 'ID del Ad a activar' },
          },
          required: ['project_id', 'campaign_id', 'adset_id', 'ad_id'],
        },
      },

      // ====== IMAGE GENERATION ======
      {
        name: 'generate_image',
        description:
          'Generar una imagen usando IA (Gemini) a partir de un prompt descriptivo. ¡PROHIBIDO USAR SIN CONFIRMACIÓN! Solo llamá a esta tool si el usuario ya te dio el OK o te pidió explícitamente generar las imágenes. La imagen se guarda AUTOMÁTICAMENTE en el baúl.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            prompt: {
              type: SchemaType.STRING,
              description: 'Prompt descriptivo para generar una sola imagen. Usá esto o "prompts", no ambos.',
            },
            prompts: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: 'Lista de prompts descriptivos para generar múltiples imágenes a la vez (ej. slides de un carrusel). Cada string es una imagen distinta.',
            },
            reference_image_id: {
              type: SchemaType.STRING,
              description: 'Si el usuario pide editar o modificar una imagen existente, pasá aquí el ID del vault de esa imagen (suele extraerse del tag @imagen_UUID).',
            },
            reference_intent: {
              type: SchemaType.STRING,
              enum: ['edit', 'style_base'],
              description: "Obligatorio si usas reference_image_id. Usá 'edit' si el usuario quiere corregir un texto o detalle de LA MISMA imagen. Usá 'style_base' si el usuario quiere generar NUEVAS imágenes (ej. resto de un carrusel) basándose en el estilo visual de la imagen de referencia.",
            },
            reference_image_index: {
              type: SchemaType.INTEGER,
              description: 'Opcional. Si el reference_image_id apunta a un carrusel con múltiples imágenes, indicá aquí el índice (empezando desde 1) del slide específico que el usuario quiere usar o editar.',
            },
            project_id: {
              type: SchemaType.STRING,
              description: 'UUID del proyecto (opcional, para contexto)',
            },
          },
          required: ['prompt'],
        },
      },
    ],
  },
];

// --- Execute Supabase Function ---
async function executeFunction(name: string, args: any, userId: string) {
  const supabase = await createClient();

  switch (name) {
    case 'get_projects': {
      const { data, error } = await supabase
        .from('projects')
        .select('*, client:client_id(id, name, email)')
        .order('created_at', { ascending: false });
      return error ? { error: error.message } : { projects: data };
    }

    case 'get_project_details': {
      const { data, error } = await supabase
        .from('projects')
        .select('*, client:client_id(id, name, email)')
        .eq('id', args.project_id)
        .single();
      return error ? { error: error.message } : { project: data };
    }

    case 'get_tasks': {
      let query = supabase
        .from('project_tasks')
        .select('*, assigned:assigned_to(id, full_name), creator:created_by(id, full_name), project:project_id(id, name)')
        .order('created_at', { ascending: false });
      if (args.project_id) query = query.eq('project_id', args.project_id);
      if (args.status) query = query.eq('status', args.status);
      const { data, error } = await query;
      return error ? { error: error.message } : { tasks: data };
    }

    case 'create_task': {
      const payload: any = {
        project_id: args.project_id,
        title: args.title,
        created_by: userId,
        status: 'pendiente',
        priority: args.priority || 'media',
        start_date: args.start_date || new Date().toISOString(),
      };
      if (args.description) payload.description = args.description;
      if (args.assigned_to) payload.assigned_to = args.assigned_to;
      if (args.end_date) payload.end_date = args.end_date;

      const { data, error } = await supabase
        .from('project_tasks')
        .insert(payload)
        .select('*, assigned:assigned_to(id, full_name)')
        .single();
      return error ? { error: error.message } : { task: data, message: 'Tarea creada exitosamente' };
    }

    case 'update_task_status': {
      const updates: any = { status: args.status };
      if (args.status === 'completada') updates.completed_at = new Date().toISOString();
      else updates.completed_at = null;

      const { data, error } = await supabase
        .from('project_tasks')
        .update(updates)
        .eq('id', args.task_id)
        .select('*, assigned:assigned_to(id, full_name)')
        .single();
      return error ? { error: error.message } : { task: data, message: `Tarea actualizada a "${args.status}"` };
    }

    case 'delete_task': {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', args.task_id);
      return error ? { error: error.message } : { message: 'Tarea eliminada exitosamente' };
    }

    case 'get_vault': {
      const { data, error } = await supabase
        .from('project_vault')
        .select('*')
        .eq('project_id', args.project_id)
        .order('created_at', { ascending: false });
        
      if (data) {
        // Remover código base64 gigantesco para no reventar el límite de tokens de Gemini (Error 429)
        const safeData = data.map(item => ({
          ...item,
          content: item.content ? item.content.replace(/data:image\/[^;]+;base64,[a-zA-Z0-9+/=]+/g, '[IMAGEN BASE64 OCULTA PARA AHORRAR MEMORIA]') : item.content
        }));
        return { vault_items: safeData };
      }
      
      return error ? { error: error.message } : { vault_items: data };
    }

    case 'add_to_vault': {
      const { data, error } = await supabase
        .from('project_vault')
        .insert({
          project_id: args.project_id,
          title: args.title,
          content: args.content,
          item_type: args.type === 'note' ? 'nota' : (args.type || 'nota'),
        })
        .select()
        .single();
      return error ? { error: error.message } : { item: data, message: 'Item agregado al vault' };
    }

    case 'get_profiles': {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name');
      return error ? { error: error.message } : { profiles: data };
    }

    case 'update_project': {
      const updates: any = {};
      if (args.name) updates.name = args.name;
      if (args.status) updates.status = args.status;
      if (args.price !== undefined) updates.price = args.price;
      if (args.payment_type) updates.payment_type = args.payment_type;
      if (args.description) updates.description = args.description;

      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', args.project_id)
        .select()
        .single();
      return error ? { error: error.message } : { project: data, message: 'Proyecto actualizado' };
    }

    case 'get_project_services': {
      const { data, error } = await supabase
        .from('project_services')
        .select('*, service:service_id(id, name, description, category)')
        .eq('project_id', args.project_id);
      return error ? { error: error.message } : { services: data };
    }

    // ====== INSTAGRAM / META ADS ======
    case 'ig_get_profile': {
      const conn = await getConnection(supabase, args.project_id);
      if (!conn) return { error: 'No hay conexión de Instagram en este proyecto.' };
      const profile = await fetchProfile(conn);
      if (profile.error) return { error: profile.error.message };
      return { profile, ig_username: conn.ig_username, ig_user_id: conn.ig_user_id };
    }

    case 'ig_get_account_insights': {
      const conn = await getConnection(supabase, args.project_id);
      if (!conn) return { error: 'No hay conexión de Instagram en este proyecto.' };
      const data = await fetchAccountInsights(conn);
      return {
        period: 'last_30_days',
        totals: data.totals,
        demographics: data.demographics,
      };
    }

    case 'ig_analyze_posts': {
      const conn = await getConnection(supabase, args.project_id);
      if (!conn) return { error: 'No hay conexión de Instagram en este proyecto.' };
      const limit = Math.min(args.limit || 12, 25);
      const result = await analyzePosts(conn, limit);
      // best/worst get richer detail for analysis (300 char captions)
      const trimFull = (p: any) => ({
        id: p.id,
        caption: p.caption ? p.caption.slice(0, 300) : null,
        media_type: p.media_type,
        permalink: p.permalink,
        timestamp: p.timestamp,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        saves: p.saves,
        reach: p.reach,
        engagement_rate: p.engagement_rate,
      });
      // all_posts is a compact summary — no URLs, short captions (100 chars)
      // This keeps the payload small enough for Gemini to process (~10KB vs 36KB)
      const trimCompact = (p: any) => ({
        id: p.id,
        caption: p.caption ? p.caption.slice(0, 100) : null,
        media_type: p.media_type,
        timestamp: p.timestamp,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        saves: p.saves,
        reach: p.reach,
        engagement_rate: p.engagement_rate,
      });
      return {
        analyzed: result.posts.length,
        averages: result.averages,
        best: result.best.map(trimFull),
        worst: result.worst.map(trimFull),
        all_posts: result.posts.map(trimCompact),
      };
    }

    case 'ig_get_ads_overview': {
      const conn = await getConnection(supabase, args.project_id);
      if (!conn) return { error: 'No hay conexión de Instagram en este proyecto.' };
      const data = await fetchAdsOverview(conn);
      if ('error' in data) {
        if (data.error === 'no_ads_token')
          return { error: 'El proyecto no tiene un ads_token (token de Facebook Marketing). Pediselo al usuario o que lo conecte desde el dashboard.' };
        if (data.error === 'ads_token_expired')
          return { error: 'El ads_token expiró. Hay que reconectarlo desde el dashboard.' };
        if (data.error === 'no_ad_accounts')
          return { error: 'El ads_token no tiene cuentas publicitarias accesibles.' };
      }
      return data;
    }

    case 'ig_pause_campaign': {
      const conn = await getConnection(supabase, args.project_id);
      if (!conn) return { error: 'No hay conexión de Instagram en este proyecto.' };
      const r = await pauseCampaign(conn, args.campaign_id);
      if (r.error) return { error: typeof r.error === 'string' ? r.error : r.error.message };
      return { success: true, message: `Campaña ${args.campaign_id} pausada.` };
    }

    case 'ig_resume_campaign': {
      const conn = await getConnection(supabase, args.project_id);
      if (!conn) return { error: 'No hay conexión de Instagram en este proyecto.' };
      const r = await resumeCampaign(conn, args.campaign_id);
      if (r.error) return { error: typeof r.error === 'string' ? r.error : r.error.message };
      return { success: true, message: `Campaña ${args.campaign_id} reactivada.` };
    }

    case 'ig_update_campaign_budget': {
      const conn = await getConnection(supabase, args.project_id);
      if (!conn) return { error: 'No hay conexión de Instagram en este proyecto.' };
      // Convertir moneda principal a unidades menores (Meta usa centavos)
      const minor = Math.round(args.daily_budget * 100);
      const r = await updateCampaignBudget(conn, args.campaign_id, minor);
      if (r.error) return { error: typeof r.error === 'string' ? r.error : r.error.message };
      return { success: true, message: `Presupuesto diario actualizado a ${args.daily_budget}.` };
    }

    case 'generate_image': {
      try {
        const imgApiKey = process.env.GEMINI_API_KEY;
        if (!imgApiKey) return { error: 'API key no configurada para generación de imágenes.' };
        const genAI = new GoogleGenAI({ apiKey: imgApiKey });
        
        const promptsToGenerate: string[] = args.prompts && args.prompts.length > 0 
          ? args.prompts 
          : (args.prompt ? [args.prompt] : []);

        if (promptsToGenerate.length === 0) {
          return { error: 'No se proveyó ningún prompt para generar.' };
        }

        console.log(`\n[UcoBot] Generando ${promptsToGenerate.length} imagen/es vía Nano Banana Pro...`);

        // --- PASO 1: Detectar estilo visual + nombre de marca del feed de Instagram ---
        let brandStyleContext = '';
        let brandName = '';
        if (args.project_id) {
          try {
            const conn = await getConnection(supabase, args.project_id);
            if (conn) {
              brandName = conn.ig_username || '';
              console.log('[UcoBot] Marca detectada:', brandName);
              const postsResult = await analyzePosts(conn, 25);
              
              const imageUrls: string[] = [];
              for (const post of postsResult.posts) {
                const url = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url;
                if (url) imageUrls.push(url);
              }

              if (imageUrls.length > 0) {
                const imageParts: Array<{ inlineData: { data: string; mimeType: string } }> = [];
                for (const url of imageUrls.slice(0, 10)) {
                  try {
                    const imgRes = await fetch(url);
                    if (imgRes.ok) {
                      const buffer = await imgRes.arrayBuffer();
                      const base64 = Buffer.from(buffer).toString('base64');
                      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
                      imageParts.push({ inlineData: { data: base64, mimeType: contentType } });
                    }
                  } catch (fetchErr) {}
                }

                if (imageParts.length > 0) {
                  const styleAnalysis = await genAI.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [{
                      role: 'user',
                      parts: [
                        ...imageParts,
                        { text: 'You are a senior graphic designer specializing in social media branding. Analyze ALL these Instagram posts from a brand. Describe their visual identity in a SINGLE paragraph (max 120 words) focusing ONLY on: 1) Dominant color palette (specific hex colors if possible), 2) Typography style (weight, size, font family), 3) Background treatment (dark, light, gradient, textures), 4) Decorative elements used (abstract 3D shapes, geometric patterns, glassmorphism cards, neon glows, chrome/metallic objects, line art, overlapping layers, etc), 5) Overall aesthetic vibe (minimalist, maximalist, futuristic, corporate, editorial, etc), 6) Variety of design approaches used across different posts. Be extremely specific and technical. Write in English. Do NOT describe content topics, ONLY visual design language.' }
                      ]
                    }],
                  });
                  brandStyleContext = styleAnalysis.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  console.log('[UcoBot] Estilo visual detectado:', brandStyleContext);
                }
              }
            }
          } catch (styleErr) {
            console.warn('[UcoBot] No pude analizar el estilo del feed:', styleErr);
          }
        }

        const graphicBoost = 'Design this as a premium Instagram carousel slide by a top-tier creative agency. Add subtle decorative graphic elements, visual depth, and layered compositions to avoid a flat or basic look. Match the exact typography style, fonts, and visual language from the brand reference. CRITICAL: ALL visible text in the image MUST be written in SPANISH (Latin American). ABSOLUTELY NO EMOJIS in the image. Square 1:1 aspect ratio for Instagram.';
        const brandNameInstruction = brandName ? ` The brand name is "${brandName}". If a brand name or watermark is needed, use ONLY this exact name.` : '';
        
        // Cargar imagen de referencia
        let referenceImagePart: { inlineData: { mimeType: string, data: string } } | null = null;
        if (args.reference_image_id && args.project_id) {
           try {
             // Fetch from project_vault
             const { data: vaultItem } = await supabase.from('project_vault').select('content').eq('id', args.reference_image_id).single();
             if (vaultItem && vaultItem.content) {
                // Find all base64 images globally
                const imgMatches = [...vaultItem.content.matchAll(/data:(image\/[^;]+);base64,([a-zA-Z0-9+/=]+)/g)];
                if (imgMatches.length > 0) {
                  let targetIndex = 0;
                  if (args.reference_image_index && args.reference_image_index > 0 && args.reference_image_index <= imgMatches.length) {
                    targetIndex = args.reference_image_index - 1;
                  }
                  referenceImagePart = { inlineData: { mimeType: imgMatches[targetIndex][1], data: imgMatches[targetIndex][2] } };
                  console.log(`[UcoBot] Imagen de referencia (${args.reference_image_id}, slide ${targetIndex + 1}) cargada exitosamente.`);
                }
             }
           } catch(e) {
              console.warn('[UcoBot] No se pudo cargar imagen de referencia:', e);
           }
        }

        const generatedImageUrls: string[] = [];
        let savedVaultItemId: string | null = null;

        // Loop over prompts to generate them sequentially
        for (let i = 0; i < promptsToGenerate.length; i++) {
          const currentPrompt = promptsToGenerate[i];
          console.log(`[UcoBot] Generando imagen ${i + 1}/${promptsToGenerate.length}:`, currentPrompt);

          let enhancedPrompt = currentPrompt;
          if (brandStyleContext) {
            enhancedPrompt = `${currentPrompt}. STYLE: ${brandStyleContext}. DESIGN RULES: ${graphicBoost}${brandNameInstruction} High quality, 4k resolution.`;
          } else {
            enhancedPrompt = `${currentPrompt}. DESIGN RULES: ${graphicBoost}${brandNameInstruction} High quality, 4k resolution.`;
          }

          if (referenceImagePart) {
            if (args.reference_intent === 'edit') {
              enhancedPrompt += " MODIFY THE PROVIDED REFERENCE IMAGE ACCORDING TO THESE INSTRUCTIONS. DO NOT DEVIATE FROM THE ORIGINAL STRUCTURE MORE THAN NECESSARY. Keep the exact same layout and background, only change what is requested.";
            } else {
              const layouts = ["Focus on the center", "Split screen horizontally", "Align graphic elements to the left, text to the right", "Align graphic elements to the right, text to the left", "Bottom heavy layout", "Top heavy layout", "Diagonal composition"];
              const dynamicLayout = promptsToGenerate.length > 1 ? `CRITICAL LAYOUT INSTRUCTION for this specific slide: ${layouts[i % layouts.length]}. You MUST change the spatial arrangement of the background shapes/elements so it looks like a DIFFERENT slide.` : "ADJUST the layout dynamically.";
              
              enhancedPrompt += ` USE THE PROVIDED REFERENCE IMAGE AS A STRICT STYLE AND BRANDING GUIDE ONLY. Create a NEW composition that belongs to the same visual family (same colors, textures, aesthetic rules), but you MUST change the background shapes and layout to fit the new content. ${dynamicLayout} It MUST NOT be an identical copy of the reference image. CRITICAL TYPOGRAPHY RULE: You MUST keep the EXACT SAME font family, font weight, and typography style for the text as seen in the reference image. Do NOT change the font style under any circumstances.`;
            }
          }

          const parts: any[] = [{ text: enhancedPrompt }];
          if (referenceImagePart) {
             parts.unshift(referenceImagePart); // La imagen va antes del texto en Gemini
          }

          const imgResponse = await genAI.models.generateContent({
            model: 'nano-banana-pro-preview',
            contents: [{
              role: 'user',
              parts: parts
            }],
            config: {
              responseModalities: ['IMAGE'],
            },
          });

          let imageBase64: string | null | undefined = null;
          let imageMimeType: string = 'image/jpeg';

          if (imgResponse.candidates?.[0]?.content?.parts) {
            for (const part of imgResponse.candidates[0].content.parts) {
              if (part.inlineData) {
                imageBase64 = part.inlineData.data;
                imageMimeType = part.inlineData.mimeType || 'image/jpeg';
              }
            }
          }

          if (imageBase64) {
            const imageDataUrl = `data:${imageMimeType};base64,${imageBase64}`;
            generatedImageUrls.push(imageDataUrl);
          }
        }
        
        // Auto-guardar en el baúl una sola vez para todo el set
        if (generatedImageUrls.length > 0 && args.project_id) {
          let title = promptsToGenerate.length > 1 
            ? `Carrusel generado (${generatedImageUrls.length} slides)` 
            : `Imagen: ${promptsToGenerate[0].slice(0, 30)}...`;
            
          let content = '';
          if (promptsToGenerate.length > 1) {
            content += `> **Prompt Original:** ${JSON.stringify(promptsToGenerate)}\n\n`;
            content += `<div class="image-carousel">\n`;
            generatedImageUrls.forEach((url, idx) => {
              content += `![Slide ${idx+1}](${url})\n`;
            });
            content += `</div>`;
          } else {
            content = `> **Prompt Original:** ${promptsToGenerate[0]}\n\n![Imagen Generada](${generatedImageUrls[0]})`;
          }

          const { data: insertedData } = await supabase.from('project_vault').insert({
            project_id: args.project_id,
            title,
            content,
            item_type: 'nota'
          }).select('id');
          if (insertedData && insertedData.length > 0) {
            savedVaultItemId = insertedData[0].id;
          }
        }

        if (generatedImageUrls.length === 0) {
           return { error: 'No se pudo generar ninguna imagen. Los prompts pudieron haber sido filtrados por seguridad.' };
        }

        return {
          success: true,
          message: `¡Se generaron ${generatedImageUrls.length} imagen/es con éxito! Fueron guardadas en el Baúl.`,
          vault_item_id: savedVaultItemId,
          image_previews: generatedImageUrls, // Note: returning an array now
        };
      } catch (e: any) {
        console.error('[UcoBot] Error CRÍTICO al generar imagen:', e);
        return { error: `Error al generar imagen: ${e.message}` };
      }
    }

    case 'ig_boost_post': {
      const conn = await getConnection(supabase, args.project_id);
      if (!conn) return { error: 'No hay conexión de Instagram en este proyecto.' };
      const minor = Math.round(args.daily_budget * 100);
      console.log('[ig_boost_post] args:', JSON.stringify(args, null, 2));
      console.log('[ig_boost_post] dailyBudgetMinorUnits:', minor, '| ad_account_id:', conn.ad_account_id, '| ig_user_id:', conn.ig_user_id);
      const r = await boostInstagramPost(conn, {
        mediaId: args.media_id,
        dailyBudgetMinorUnits: minor,
        durationDays: args.days,
        objective: args.objective,
        countries: args.countries,
        ageMin: args.age_min,
        ageMax: args.age_max,
        linkUrl: args.link_url,
        callToAction: args.call_to_action,
      });
      console.log('[ig_boost_post] result:', JSON.stringify(r, null, 2));
      return r;
    }

    case 'ig_activate_boost': {
      const conn = await getConnection(supabase, args.project_id);
      if (!conn) return { error: 'No hay conexión de Instagram en este proyecto.' };
      console.log('[ig_activate_boost] Activating campaign:', args.campaign_id, 'adset:', args.adset_id, 'ad:', args.ad_id);
      const r = await activateBoost(conn, args.campaign_id, args.adset_id, args.ad_id);
      console.log('[ig_activate_boost] result:', JSON.stringify(r, null, 2));
      return r;
    }

    default:
      return { error: `Función desconocida: ${name}` };
  }
}

// --- POST Handler ---
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key no configurada' }, { status: 500 });
  }

  try {
    const { messages, projectId } = await request.json();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `Sos UcoBot, el asistente IA interno del sistema de gestión de Codea Desarrollos.
Tu nombre viene de "Uco", el valle en Mendoza, Argentina, donde nació la empresa.

Tu personalidad:
- Sos profesional pero cercano, usás "vos" (español argentino rioplatense).
- Respondés de forma concisa y directa, pero con onda.
- Usás emojis con moderación para dar vida a las respuestas.
- Cuando ejecutás una acción, confirmás qué hiciste con claridad.

Tu rol:
- Estás asistiendo dentro de un PROYECTO ESPECÍFICO con ID: ${projectId}
- Cuando el usuario pida tareas, vault, servicios o info, usá siempre este project_id por defecto.
- Tenés acceso completo a los proyectos, tareas, vault, empleados y facturación del sistema.
- Podés consultar, crear, modificar y eliminar datos usando las herramientas disponibles.
- Siempre que el usuario pida algo ambiguo, consultá los datos primero para dar una respuesta precisa.
- Si te piden crear una tarea, usá el project_id actual a menos que digan otro proyecto.
- Si te piden asignar a alguien y no sabés el UUID, buscá los perfiles primero.

Gestión de Redes (Instagram + Meta Ads):
- Si el proyecto tiene servicio de gestión de redes, tenés tools "ig_*" para leer perfil, métricas, posts y campañas.
- Cuando te pidan diagnosticar performance: usá ig_analyze_posts (con limit alto, ej 25) y ig_get_account_insights, después explicá con datos concretos qué funciona y qué no. La respuesta de ig_analyze_posts incluye "all_posts" con TODOS los posts analizados — usá este campo para tener contexto completo de TODO el contenido, no solo los top/worst 3.
- Cuando te pidan un "plan de pauta": combiná ig_analyze_posts (para detectar el mejor post a promocionar mirando TODOS los posts en "all_posts") + ig_get_account_insights (para entender la audiencia y demografía) + ig_get_ads_overview (para ver histórico de spend y CPC). Devolvé una recomendación estructurada con: 1) qué post promocionar y por qué (basándote en engagement_rate, reach, shares de cada post), 2) presupuesto diario sugerido en ARS, 3) duración, 4) objetivo (engagement / awareness / traffic), 5) audiencia (países, edades), 6) métricas KPI a vigilar.
- Cuando te pidan diagnosticar campañas: usá ig_get_ads_overview y mará banderas: CTR < 1% (creatividad débil), CPC alto vs benchmark del rubro, frecuencia >3 (saturación), spend sin conversiones.
- ACCIONES DE ESCRITURA EN META ADS (ig_pause_campaign, ig_resume_campaign, ig_update_campaign_budget, ig_boost_post, ig_activate_boost): SIEMPRE pedí confirmación al usuario antes de ejecutar, mostrándole exactamente qué va a pasar (nombre de campaña, monto, etc.). NUNCA ejecutés ig_boost_post sin que el usuario confirme explícitamente media_id, presupuesto, días, link_url y call_to_action. Para ig_boost_post DEBÉS preguntarle al usuario qué URL de destino quiere y qué llamada a la acción (LEARN_MORE/SHOP_NOW/SIGN_UP/CONTACT_US/BOOK_TRAVEL/DOWNLOAD/MESSAGE_PAGE) — NUNCA asumas valores por defecto, cada cliente tiene su propio sitio.
- FLUJO DE BOOST: 1) ig_boost_post crea todo en estado PAUSADO → 2) Mostrale al usuario el resumen con campaign_id, adset_id y ad_id → 3) Preguntale "¿Querés que la active ahora?" → 4) Si confirma, usá ig_activate_boost con campaign_id, adset_id y ad_id que devolvió ig_boost_post → 5) Confirmá la activación.
- DESPUÉS DE ig_boost_post EXITOSO: el resultado incluye campaign_id, adset_id, ad_id, "post" (con caption, media_type, permalink, thumbnail) y "links" (instagram_post, ads_manager_campaign, ads_manager_adset, ads_manager_ad). SIEMPRE mostrale al usuario un resumen visual con: 1) qué post se promocionó (caption corto + tipo de media + link al post de IG como [Ver post en Instagram](permalink)), 2) link al Ads Manager de la campaña como [Abrir en Meta Ads Manager](ads_manager_campaign), 3) Preguntale: "¿Querés que la active ahora o preferís revisarla primero en el Ads Manager?"
- RESULTADOS DE CAMPAÑAS: Cuando te pidan ver resultados o performance de campañas activas, usá ig_get_ads_overview que trae métricas de los últimos 90 días: impressions, reach, clicks, spend, CPC, CPM, CTR, y acciones. Explicá los resultados de forma clara y accionable.
- IDS REALES vs HISTORIAL: NUNCA confíes en IDs de campañas mencionados en mensajes anteriores del historial. El usuario puede haber borrado o modificado campañas directamente en Meta Ads Manager. Cuando te pidan activar, pausar o ver campañas, SIEMPRE llamá ig_get_ads_overview primero para obtener los IDs REALES y actuales de las campañas que existen. Usá esos IDs frescos, NO los del historial de chat.
- Cuando el usuario diga "mirá mis campañas", "fijate las publicidades", "qué campañas tengo", o similar → SIEMPRE llamá ig_get_ads_overview para traer la data real de Meta. La respuesta incluye campaigns con id, name, status (PAUSED/ACTIVE), y ads con campaign_id, adset_id y ad_id. Usá esos datos para responder.
- MUY IMPORTANTE: NUNCA asumas que una función va a fallar basándote en intentos anteriores del historial. Si el usuario te pide ejecutar una acción, SIEMPRE llamá la función real sin importar si falló antes. Solo reportá errores reales que vengan de la respuesta de la función, nunca inventes ni predijas errores.

Generación de Contenido e Ideas (Copywriting & Estrategia):
- REGLA DE ORO DE PROHIBICIÓN: ¡TIENES ESTRICTAMENTE PROHIBIDO GUARDAR IDEAS EN EL BAÚL O GENERAR IMÁGENES DE INMEDIATO! Cuando el usuario te pida una idea de contenido, carrusel o guion, TU ÚNICO TRABAJO INICIAL es redactar la propuesta en el chat y PREGUNTARLE: "¿Qué te parece esta idea? ¿Querés que le hagamos algún ajuste o la guardo en el Baúl?". RECIÉN CUANDO EL USUARIO TE DIGA "Sí, guardala" o "Me gusta, armalo", PODRÁS llamar a las tools 'add_to_vault' y/o 'generate_image'. Si llamas a las tools antes de que el usuario apruebe, el sistema fallará.
- Cuando el usuario te pida "ideas de contenido", "armame un carrusel", "guiones para reels" o "posts para Instagram", actuá como un Copywriter y Estratega de Contenido experto.
- PRIMER PASO SIEMPRE: Llamá a ig_analyze_posts (para ver de qué trata la cuenta, qué tono usan en sus captions y qué tipo de formato tuvo más engagement) y get_vault (para leer el tono de marca si está definido).
- Si te piden un CARRUSEL: Estructurá tu respuesta en diapositivas (Slide 1: Gancho, Slide 2-4: Desarrollo de valor, Slide 5: Call to Action). Sugerí texto para la imagen y el caption del post. REGLA CRÍTICA DE COPY PARA IMÁGENES: Para el texto que va DENTRO de la imagen, podés sugerir un Título Principal y OBLIGATORIAMENTE un Párrafo Corto/Subtítulo (de 2 a 3 líneas) que desarrolle la idea. Es importante que la imagen tenga sustento de contenido y no quede vacía, pero sin llegar a ser un muro de texto interminable.
- Si te piden un REEL o VIDEO: Armá un guion estructurado en 3 partes: Gancho (primeros 3 segundos), Desarrollo (cuerpo del video), y CTA. Incluí sugerencias visuales o de audio en tendencia.
- Adaptá tu tono y vocabulario para que suene idéntico a las publicaciones más exitosas que encontraste en ig_analyze_posts.
- VARIEDAD Y RECICLAJE DE CONTENIDO: Para no aburrir a la audiencia, tus nuevas propuestas no deben ser repetitivas en sus temas. SIN EMBARGO, está perfecto y es muy recomendable que recicles una misma "Idea Core" en distintos formatos (ej. si una idea gustó como carrusel, podés adaptarla y plasmar esa misma idea en un formato de Video/Reel).

Generación de Imágenes:
- Tenés la tool "generate_image" que genera imágenes con IA de forma automática usando el motor visual de Nano Banana (Gemini 3).
- REGLA CRÍTICA DE FIDELIDAD DE TEXTO: Cuando generes imágenes para un carrusel o post que ya planificaste previamente, ESTÁS OBLIGADO a mandar EXACTAMENTE los títulos y subtítulos/textos que escribiste en tu idea original al motor de imágenes. NO resumas ni omitas el texto descriptivo, el usuario quiere ver exactamente tu propuesta plasmada en la gráfica.
- REGLA CRÍTICA PARA CARRUSELES: Si el usuario te pide generar un carrusel nuevo o varias imágenes a la vez, DEBES usar el parámetro 'prompts' (un array de strings) en UNA ÚNICA llamada a la tool "generate_image". NUNCA llames a la tool varias veces por separado en este caso.
- EXCEPCIÓN AL CARRUSEL: Si el usuario te pide EDITAR (reference_intent: 'edit') varios slides específicos de un carrusel ya existente, SÍ PODÉS y DEBÉS llamar a la tool varias veces (una llamada independiente por cada slide a editar). Esto es porque necesitás pasar un 'reference_image_index' distinto para cada imagen.
- REGLA DE EDICIÓN CONTEXTUAL: Si el usuario te pide editar la última imagen/carrusel que generaste o de la que vienen hablando (ej. 'cambiale el fondo al slide 2' o 'agregale X a esa imagen'), NO le pidas que te la etiquete manualmente. Simplemente recordá el 'vault_item_id' que te devolvió la última llamada a 'generate_image' (o buscalo en el historial de llamadas) y pasalo como 'reference_image_id'.
- IMPORTANTE: El sistema detecta AUTOMÁTICAMENTE el estilo visual del feed de Instagram del proyecto. Descarga TODAS las publicaciones, las analiza visualmente con IA, y usa esa información para que la imagen generada respete la paleta de colores, tipografía y estética de la marca. También obtiene el nombre real de la cuenta de Instagram para usarlo como marca de agua si hace falta.
- Vos solo tenés que pasarle un prompt descriptivo EN INGLÉS con lo que querés que aparezca en la imagen. El sistema se encarga solo del estilo.
- REGLA SOBRE EMOJIS: NUNCA incluyas emojis en el prompt visual a menos que el usuario lo pida explícitamente. Si el usuario te pidió que NO haya emojis, incluí "NO EMOJIS, ABSOLUTELY NO EMOJIS" de forma explícita al final de cada prompt en inglés.
- La imagen se guarda AUTOMÁTICAMENTE en el Baúl (Vault) del proyecto.
- ADEMÁS, la respuesta de la tool incluye un campo "image_previews" con las URLs de las imágenes generadas. SIEMPRE que la tool devuelva este campo, no intentes imprimirlas en el chat. Simplemente decile al usuario "¡Listo! Ya generé las imágenes y te las dejé guardadas en el Baúl como un carrusel."

Formato de respuestas:
- Usá markdown para formatear (negritas, listas, etc).
- Cuando listés datos, usá tablas o listas claras.
- Montos siempre en ARS (pesos argentinos).
- Fechas en formato argentino (DD/MM/YYYY).

El usuario autenticado actualmente tiene ID: ${user.id}`,
      tools: tools as any,
    });

    // Build conversation history
    const history = messages.slice(0, -1).map((msg: any) => {
      const parts: any[] = [{ text: msg.content }];
      if (msg.role === 'user' && msg.images && msg.images.length > 0) {
        msg.images.forEach((imgUrl: string) => {
          const match = imgUrl.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            });
          }
        });
      }
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts,
      };
    });

    const chat = model.startChat({ history });
    const lastMsg = messages[messages.length - 1];
    const lastMessageParts: any[] = [{ text: lastMsg.content }];
    
    if (lastMsg.images && lastMsg.images.length > 0) {
      lastMsg.images.forEach((imgUrl: string) => {
        const match = imgUrl.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          lastMessageParts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
        }
      });
    }

    let response = await chat.sendMessage(lastMessageParts);
    let result = response.response;

    // Handle function calls in a loop (Gemini may chain multiple)
    const MAX_ITERATIONS = 12;
    let iterations = 0;
    const generatedImages: string[] = []; // Collect generated images separately

    while (result.candidates?.[0]?.content?.parts?.some((p: any) => p.functionCall) && iterations < MAX_ITERATIONS) {
      iterations++;
      const functionCalls = result.candidates[0].content.parts.filter((p: any) => p.functionCall);

      console.log(`[UcoBot] Iteration ${iterations} — ${functionCalls.length} function call(s):`, functionCalls.map((p: any) => p.functionCall?.name).join(', '));

      const functionResponses = [];
      for (const part of functionCalls) {
        const { name, args } = part.functionCall!;
        console.log(`[UcoBot] Executing: ${name}`);
        const fnResult = await executeFunction(name, args, user.id);
        
        // If generate_image returned images, extract them BEFORE sending to Gemini
        // to avoid bloating Gemini's context with massive base64 data
        let resultForGemini = fnResult;
        if (name === 'generate_image' && (fnResult as any).image_previews) {
          generatedImages.push(...(fnResult as any).image_previews);
          // Send a lightweight result to Gemini
          resultForGemini = {
            success: (fnResult as any).success,
            message: (fnResult as any).message + ' Las imágenes ya se muestran al usuario en el chat automáticamente.',
          };
        }
        
        const resultStr = JSON.stringify(resultForGemini);
        console.log(`[UcoBot] ${name} result size: ${resultStr.length} chars`);
        functionResponses.push({
          functionResponse: {
            name,
            response: resultForGemini,
          },
        });
      }

      response = await chat.sendMessage(functionResponses);
      result = response.response;
    }

    if (iterations >= MAX_ITERATIONS) {
      console.warn(`[UcoBot] Hit MAX_ITERATIONS (${MAX_ITERATIONS})`);
    }

    // Safely extract text from response
    let text = '';
    try {
      text = result.text();
    } catch (textErr: any) {
      console.warn('[UcoBot] result.text() failed:', textErr.message);
      // Try to extract text parts manually
      const parts = result.candidates?.[0]?.content?.parts;
      if (parts) {
        text = parts
          .filter((p: any) => p.text)
          .map((p: any) => p.text)
          .join('\n');
      }
    }

    if (!text || text.trim().length === 0) {
      // Log detailed diagnostics for empty responses
      console.warn('[UcoBot] Empty response after', iterations, 'iterations.');
      console.warn('[UcoBot] promptFeedback:', JSON.stringify((result as any).promptFeedback, null, 2));
      console.warn('[UcoBot] candidates count:', result.candidates?.length ?? 'undefined');
      if (result.candidates?.[0]) {
        console.warn('[UcoBot] finishReason:', (result.candidates[0] as any).finishReason);
        console.warn('[UcoBot] safetyRatings:', JSON.stringify((result.candidates[0] as any).safetyRatings, null, 2));
        console.warn('[UcoBot] parts:', JSON.stringify(result.candidates[0].content?.parts?.map((p: any) => ({ hasText: !!p.text, hasFnCall: !!p.functionCall })), null, 2));
      }
      text = '⚠️ No pude generar una respuesta completa. Probá de nuevo o con una consulta más corta.';
    }

    return NextResponse.json({ message: text, generatedImages });
  } catch (error: any) {
    console.error('UcoBot error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del bot' },
      { status: 500 }
    );
  }
}
