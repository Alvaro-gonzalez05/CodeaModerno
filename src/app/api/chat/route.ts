import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
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
        description: 'Agregar un nuevo item al vault de un proyecto. Puede ser una nota, enlace o texto.',
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
          'Crear una campaña de Meta Ads para promocionar un post existente de Instagram. Crea Campaign + AdSet + Ad en estado PAUSADO (el usuario debe activar manualmente en Meta para seguridad). SIEMPRE pedí confirmación al usuario, mostrando media_id, presupuesto diario, días, países y objetivo antes de ejecutar.',
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
          },
          required: ['project_id', 'media_id', 'daily_budget', 'days'],
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
      return error ? { error: error.message } : { vault_items: data };
    }

    case 'add_to_vault': {
      const { data, error } = await supabase
        .from('project_vault')
        .insert({
          project_id: args.project_id,
          title: args.title,
          content: args.content,
          type: args.type || 'note',
          created_by: userId,
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
      // Recortar caption a 200 chars para no inflar el contexto
      const trim = (p: any) => ({ ...p, caption: p.caption ? p.caption.slice(0, 200) : null });
      return {
        analyzed: result.posts.length,
        averages: result.averages,
        best: result.best.map(trim),
        worst: result.worst.map(trim),
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
      });
      console.log('[ig_boost_post] result:', JSON.stringify(r, null, 2));
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
- Cuando te pidan diagnosticar performance: usá ig_analyze_posts y ig_get_account_insights, después explicá con datos concretos qué funciona y qué no (engagement rate, alcance, top posts, peores posts).
- Cuando te pidan un "plan de pauta": combiná ig_analyze_posts (para detectar el mejor post a promocionar) + ig_get_account_insights (para entender la audiencia y demografía) + ig_get_ads_overview (para ver histórico de spend y CPC). Devolvé una recomendación estructurada con: 1) qué post promocionar y por qué, 2) presupuesto diario sugerido en ARS, 3) duración, 4) objetivo (engagement / awareness / traffic), 5) audiencia (países, edades), 6) métricas KPI a vigilar.
- Cuando te pidan diagnosticar campañas: usá ig_get_ads_overview y mará banderas: CTR < 1% (creatividad débil), CPC alto vs benchmark del rubro, frecuencia >3 (saturación), spend sin conversiones.
- ACCIONES DE ESCRITURA EN META ADS (ig_pause_campaign, ig_resume_campaign, ig_update_campaign_budget, ig_boost_post): SIEMPRE pedí confirmación al usuario antes de ejecutar, mostrándole exactamente qué va a pasar (nombre de campaña, monto, etc.). NUNCA ejecutés ig_boost_post sin que el usuario confirme explícitamente media_id, presupuesto y días. ig_boost_post crea todo en estado PAUSADO por seguridad — avisá esto al usuario.
- MUY IMPORTANTE: NUNCA asumas que una función va a fallar basándote en intentos anteriores del historial. Si el usuario te pide ejecutar una acción, SIEMPRE llamá la función real sin importar si falló antes. Solo reportá errores reales que vengan de la respuesta de la función, nunca inventes ni predijas errores.

Formato de respuestas:
- Usá markdown para formatear (negritas, listas, etc).
- Cuando listés datos, usá tablas o listas claras.
- Montos siempre en ARS (pesos argentinos).
- Fechas en formato argentino (DD/MM/YYYY).

El usuario autenticado actualmente tiene ID: ${user.id}`,
      tools: tools as any,
    });

    // Build conversation history
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1].content;

    let response = await chat.sendMessage(lastMessage);
    let result = response.response;

    // Handle function calls in a loop (Gemini may chain multiple)
    const MAX_ITERATIONS = 8;
    let iterations = 0;

    while (result.candidates?.[0]?.content?.parts?.some((p: any) => p.functionCall) && iterations < MAX_ITERATIONS) {
      iterations++;
      const functionCalls = result.candidates[0].content.parts.filter((p: any) => p.functionCall);

      const functionResponses = [];
      for (const part of functionCalls) {
        const { name, args } = part.functionCall!;
        const fnResult = await executeFunction(name, args, user.id);
        functionResponses.push({
          functionResponse: {
            name,
            response: fnResult,
          },
        });
      }

      response = await chat.sendMessage(functionResponses);
      result = response.response;
    }

    const text = result.text();
    return NextResponse.json({ message: text });
  } catch (error: any) {
    console.error('UcoBot error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del bot' },
      { status: 500 }
    );
  }
}
