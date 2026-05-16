import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_INSTRUCTION = `Sos un asistente especializado en prospección de clientes para Codea Desarrollos, una software factory argentina con base en Mendoza. Tu rol es ayudar a encontrar negocios y empresas que podrían necesitar servicios de desarrollo web, apps móviles, automatización, ecommerce o gestión digital.

Cuando te pidan buscar clientes/negocios, respondé ÚNICAMENTE con un JSON válido sin texto extra, con esta estructura exacta:
{
  "message": "mensaje conversacional en español argentino usando 'vos', explicando qué encontraste",
  "businesses": [
    {
      "name": "Nombre del negocio",
      "description": "Qué hace el negocio y por qué podría necesitar servicios de software (2 oraciones concretas)",
      "industry": "Rubro específico",
      "address": "Dirección o zona",
      "phone": "+54... o null",
      "website": "https://... o null",
      "instagram": "@usuario o null",
      "whatsapp": "+54... con código de país o null",
      "googleMaps": "https://maps.google.com/... o null",
      "potential": "alto o medio o bajo"
    }
  ]
}

Generá entre 4 y 8 negocios cuando el usuario pida buscar clientes. Sé específico con nombres y datos plausibles.
Potencial ALTO = claramente necesitan digitalización urgente. MEDIO = podrían mejorar bastante. BAJO = ya tienen algo pero hay oportunidad.
Para preguntas generales sin búsqueda, respondé con businesses: [].
Usá siempre español argentino informal (vos, dale, etc).`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1]?.content || '';

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    const rawText = result.response.text();

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ message: rawText, businesses: [] });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        message: parsed.message || '',
        businesses: (parsed.businesses || []).map((b: any, i: number) => ({
          ...b,
          id: `biz-${Date.now()}-${i}`,
        })),
      });
    } catch {
      return NextResponse.json({ message: rawText, businesses: [] });
    }

  } catch (error: any) {
    console.error('[client-finder]', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
