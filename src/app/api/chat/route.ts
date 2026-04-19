import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

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
