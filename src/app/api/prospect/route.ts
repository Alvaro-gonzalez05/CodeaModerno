import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';

const SEARCH_KEYWORDS = /busca|buscá|encontrá|negocios|empresas|emprendimiento|restaurant|bar|café|tienda|inmobiliaria|gimnasio|clínica|farmacia|taller|hotel|agencia|rubros|variedad|locales/i;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key no configurada' }, { status: 500 });

  try {
    const { query, foundNames = [], leads = [], messages = [] } = await request.json();

    const genAI = new GoogleGenAI({ apiKey });

    const leadsContext = leads.length > 0
      ? `PROSPECTOS YA ENCONTRADOS (${leads.length}):\n${leads.map((l: any) =>
          `- ${l.name} (${l.location || '?'}): ${l.digitalPresence || ''} | Contacto: ${[l.whatsapp, l.email, l.website, l.instagram].filter(Boolean).join(', ') || 'sin datos'}`
        ).join('\n')}`
      : 'Aún no hay prospectos encontrados.';

    const alreadyFound = foundNames.length > 0
      ? `NO REPETIR ESTOS NEGOCIOS: ${foundNames.join(' | ')}`
      : '';

    // System prompt compartido para el paso de formateo y para el modo chat
    const formatSystemInstruction = `Sos PROCOBOT, el prospector de clientes de Codea Desarrollos, una Software Factory de Mendoza, Argentina.
El dueño se llama Alvaro González.

SERVICIOS DE CODEA:
1. Landing Page — webs de conversión, diseño atractivo. Precio: presupuesto personalizado.
2. E-Commerce — tiendas online completas, 24hs. Precio: presupuesto personalizado.
3. Sistemas a Medida — software personalizado para optimizar procesos. Precio: presupuesto personalizado.
4. Ucobot — chatbot con IA, automatizaciones, envíos masivos WhatsApp. Desde $100.000 ARS/mes. Marketing WhatsApp: $0.085 USD/mensaje.
5. Gestión de Redes y Contenido — estrategia, producción, publicación en Instagram/Facebook/TikTok. Precio según alcance. Pauta publicitaria aparte.
Formas de pago: Efectivo, transferencia, débito automático.

${leadsContext}
${alreadyFound}

MODO CHAT / MENSAJES EN FRÍO:
- Respondé en español rioplatense, concreto y útil.
- Para mensajes en frío: empezá con "Hola, soy Alvaro de Codea Desarrollos, una Software Factory de Mendoza."
- Si piden enumerar servicios: listá los 5 completos numerados.
- Si no piden enumerar: mencioná 1-2 que encajen con el rubro del prospecto.
- Terminá con llamado a la acción: "¿Les gustaría que les mandemos una propuesta?" o "¿Tienen 10 minutos para que les cuente?"

FORMATO DE RESPUESTA — SOLO JSON válido, empezando con {:
{"message":"texto en español, podés usar **negrita**, listas con -, saltos \\n","leads":[]}

Para búsquedas con negocios encontrados, usá EXACTAMENTE este esquema (campo "leads", no "businesses"):
{"message":"resumen breve","leads":[{"name":"Nombre Exacto","location":"Ciudad, Provincia","phone":null,"email":null,"whatsapp":null,"website":null,"instagram":"@usuario","digitalPresence":"descripción 1-2 oraciones de su situación digital","servicesNeeded":["Sitio web","Redes sociales"],"opportunityScore":8}]}

REGLAS DE DATOS:
- NUNCA inventes contactos. Solo lo que esté publicado explícitamente.
- Usá null (sin comillas) para campos sin datos. NUNCA uses la cadena "null".
- WhatsApp: +5492612345678 (54 + área sin 0 + número, sin espacios).
- Instagram: SOLO @usuario, nunca URL completa.
- servicesNeeded: máximo 3 ítems, 2-3 palabras, capitalizados.
- opportunityScore: número entero del 1 al 10. NUNCA uses el campo "potential".
- El array se llama "leads", NUNCA "businesses" ni "results".`;

    const isSearchMode = SEARCH_KEYWORDS.test(query);

    let rawText = '';

    if (isSearchMode) {
      // PASO 1: Google Search — obtener datos crudos, cualquier formato
      const searchResp = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: query }] }],
        config: {
          systemInstruction: `Sos un investigador de negocios. Usá Google Search para encontrar negocios REALES que coincidan con lo pedido.
Para cada negocio anotá: nombre exacto, ciudad/provincia, sitio web (si tiene), Instagram u otras redes (si tiene), teléfono (si aparece publicado), email (si aparece publicado), y describí en 1-2 oraciones su situación digital actual.
${alreadyFound}
Buscá entre 4-6 negocios de rubros variados. Sé específico y real, no inventes datos.`,
          tools: [{ googleSearch: {} }],
        },
      });
      const searchData = searchResp.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!searchData) {
        return NextResponse.json({ message: 'No encontré resultados. Probá con otra búsqueda.', leads: [] });
      }

      // PASO 2: Formatear como JSON — sin Google Search, forzar JSON
      const formatResp = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{
            text: `Acá tenés los datos de negocios encontrados:\n\n${searchData}\n\nConvertí TODA esa información al formato JSON del sistema. Incluí todos los negocios encontrados como leads. No omitas ninguno.`,
          }],
        }],
        config: {
          systemInstruction: formatSystemInstruction,
          responseMimeType: 'application/json',
        },
      });
      rawText = formatResp.candidates?.[0]?.content?.parts?.[0]?.text || '';

    } else {
      // MODO CHAT: llamada única, sin Google Search, JSON forzado
      const chatContents: any[] = [
        ...messages.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        { role: 'user', parts: [{ text: query }] },
      ];

      const chatResp = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: chatContents,
        config: {
          systemInstruction: formatSystemInstruction,
          responseMimeType: 'application/json',
        },
      });
      rawText = chatResp.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    // Parsear JSON de la respuesta
    let parsed: any = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Intentar extraer JSON si hay texto extra
      const blockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (blockMatch) { try { parsed = JSON.parse(blockMatch[1]); } catch {} }
      if (!parsed) {
        const objMatch = rawText.match(/\{[\s\S]*\}/);
        if (objMatch) { try { parsed = JSON.parse(objMatch[0]); } catch {} }
      }
    }

    const sanitizeNull = (v: any): string | null => {
      if (!v || v === 'null' || v === 'undefined' || v === 'N/A') return null;
      return String(v).trim() || null;
    };

    const potentialToScore = (p: string): number => {
      const lower = String(p).toLowerCase();
      if (lower === 'alto' || lower === 'high') return 8;
      if (lower === 'medio' || lower === 'medium' || lower === 'moderate') return 5;
      return 3;
    };

    let message = '';
    let newLeads: any[] = [];

    if (parsed) {
      message = parsed.message || 'Completado.';
      // Gemini sometimes returns "businesses" instead of "leads"
      const rawLeads: any[] = parsed.leads || parsed.businesses || parsed.results || [];
      const foundNamesLower = new Set(foundNames.map((n: string) => n.toLowerCase()));
      newLeads = rawLeads
        .filter((l: any) => l.name && !foundNamesLower.has(l.name.toLowerCase()))
        .map((l: any, i: number) => ({
          id: `lead-${Date.now()}-${i}`,
          name: l.name,
          location: sanitizeNull(l.location || l.address || l.city),
          phone: sanitizeNull(l.phone),
          email: sanitizeNull(l.email),
          whatsapp: sanitizeNull(l.whatsapp),
          website: sanitizeNull(l.website),
          instagram: sanitizeNull(l.instagram),
          digitalPresence: l.digitalPresence || l.description || l.summary || '',
          servicesNeeded: Array.isArray(l.servicesNeeded) ? l.servicesNeeded : [],
          opportunityScore: typeof l.opportunityScore === 'number'
            ? l.opportunityScore
            : l.potential ? potentialToScore(l.potential) : 5,
        }));
    } else {
      message = rawText.replace(/```[\s\S]*?```/g, '').trim() || 'No encontré resultados. Probá con otra búsqueda.';
    }

    return NextResponse.json({ message, leads: newLeads });

  } catch (error: any) {
    console.error('[Prospect] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
