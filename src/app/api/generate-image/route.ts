import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';

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
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Se requiere un prompt' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    // Extract image and text from response
    let imageBase64: string | null = null;
    let imageMimeType: string | null = null;
    let textResponse: string | null = null;

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          textResponse = part.text;
        } else if (part.inlineData) {
          imageBase64 = part.inlineData.data || null;
          imageMimeType = part.inlineData.mimeType || 'image/png';
        }
      }
    }

    if (!imageBase64) {
      return NextResponse.json({
        error: 'No se pudo generar la imagen. Es posible que el prompt haya sido filtrado por las políticas de seguridad.',
        text: textResponse,
      }, { status: 422 });
    }

    return NextResponse.json({
      image: imageBase64,
      mimeType: imageMimeType,
      text: textResponse,
    });
  } catch (error: any) {
    console.error('Generate image error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar imagen' },
      { status: 500 }
    );
  }
}
