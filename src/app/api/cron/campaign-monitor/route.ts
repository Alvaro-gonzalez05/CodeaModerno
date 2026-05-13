import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchAdsOverview } from '@/lib/instagram/helpers';

// This endpoint is called by Supabase pg_cron every 6 hours.
// It fetches campaign metrics for all projects with ads_token,
// analyzes them with Gemini, and stores the insights in campaign_insights.

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }
  if (!geminiKey) {
    return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 500 });
  }

  // Use service_role client to bypass RLS
  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Get all projects with active ads connections
    const { data: connections, error: connErr } = await supabase
      .from('project_social_connections')
      .select('project_id, access_token, ads_token, ad_account_id, ig_user_id, ig_username')
      .eq('is_active', true)
      .not('ads_token', 'is', null);

    if (connErr) {
      console.error('[CampaignMonitor] Error fetching connections:', connErr.message);
      return NextResponse.json({ error: connErr.message }, { status: 500 });
    }

    if (!connections || connections.length === 0) {
      console.log('[CampaignMonitor] No projects with ads connections found.');
      return NextResponse.json({ message: 'No projects to monitor', processed: 0 });
    }

    console.log(`[CampaignMonitor] Found ${connections.length} project(s) with ads connections.`);

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const results: { projectId: string; status: string; error?: string }[] = [];

    for (const conn of connections) {
      try {
        console.log(`[CampaignMonitor] Processing project ${conn.project_id} (@${conn.ig_username})`);

        // 2. Fetch ads data from Meta API
        const adsData = await fetchAdsOverview(conn as any);

        if ('error' in adsData && adsData.error) {
          console.warn(`[CampaignMonitor] Ads error for ${conn.project_id}:`, adsData.error);
          results.push({ projectId: conn.project_id, status: 'error', error: String(adsData.error) });
          continue;
        }

        const campaigns = (adsData as any).campaigns || [];
        const ads = (adsData as any).ads || [];
        const summary = (adsData as any).summary || null;

        // Skip if no campaigns at all
        if (campaigns.length === 0) {
          console.log(`[CampaignMonitor] No campaigns for ${conn.project_id}, skipping.`);
          results.push({ projectId: conn.project_id, status: 'no_campaigns' });
          continue;
        }

        // 3. Prepare data for Gemini analysis
        const activeCampaigns = campaigns.filter((c: any) => c.status === 'ACTIVE');
        const campaignSummary = campaigns.map((c: any) => {
          const ins = c.insights?.data?.[0];
          return {
            id: c.id,
            name: c.name,
            status: c.status,
            spend: ins?.spend,
            ctr: ins?.ctr,
          };
        });

        const adSummary = ads.map((ad: any) => {
          const ins = ad.insights?.data?.[0];
          return {
            id: ad.id,
            name: ad.name,
            status: ad.status,
            spend: ins?.spend,
            impressions: ins?.impressions,
            clicks: ins?.clicks,
            ctr: ins?.ctr,
          };
        });

        const totalSpend = summary?.spend ? parseFloat(summary.spend) : 0;
        const totalImpressions = summary?.impressions ? parseInt(summary.impressions) : 0;
        const totalClicks = summary?.clicks ? parseInt(summary.clicks) : 0;

        // 4. Ask Gemini for analysis
        const analysisPrompt = `Sos un analista de marketing digital evaluando Meta Ads.
Analizá estos datos y generá un JSON estrictamente válido. No uses markdown de bloques de código en tu respuesta, devolvé SOLO el JSON.

Cuenta: @${conn.ig_username}
General: Gastado: $${totalSpend}, Impresiones: ${totalImpressions}, Clicks: ${totalClicks}, CTR: ${summary?.ctr || 0}%

Campañas:
${JSON.stringify(campaignSummary, null, 2)}

Anuncios individuales (ESTOS SON LOS QUE TENÉS QUE OPINAR):
${JSON.stringify(adSummary, null, 2)}

INSTRUCCIONES DE FORMATO JSON ESPERADO:
{
  "global_feedback": "1 párrafo muy corto con el estado general de la cuenta publicitaria.",
  "alerts": [
    {"type": "warning|success|info", "message": "Alerta corta general"}
  ],
  "ad_insights": {
    "ID_DEL_ANUNCIO_ACA": {
      "short": "Ej: CTR bajo (0.5%). Cambiá la imagen.",
      "long": "Ej: Este anuncio gastó $X pero el CTR está por debajo del 1%, lo que indica que la imagen no llama la atención o el público no es el correcto. Sugiero pausarlo o cambiar el creativo."
    }
  }
}

IMPORTANTE: El JSON debe tener en la key "ad_insights" el ID real de cada anuncio (ad.id) que te pasé arriba, para que podamos mapearlo en la interfaz. Si un anuncio no gastó nada, decí "Sin datos de gasto todavía, hay que esperar."`;

        const geminiResponse = await model.generateContent(analysisPrompt);
        let fullText = geminiResponse.response.text();
        
        // Clean up markdown code blocks if Gemini ignores the prompt
        fullText = fullText.replace(/```json\n?|\n?```/g, '').trim();

        let aiFeedback = '';
        let aiAlerts: any[] = [];

        try {
          const parsed = JSON.parse(fullText);
          aiFeedback = JSON.stringify({
            global: parsed.global_feedback,
            ads: parsed.ad_insights || {}
          });
          aiAlerts = parsed.alerts || [];
        } catch (e) {
          console.warn('[CampaignMonitor] Failed to parse Gemini JSON:', e);
          aiFeedback = JSON.stringify({ global: fullText, ads: {} });
        }

        // 5. Store in Supabase
        const { error: insertErr } = await supabase
          .from('campaign_insights')
          .insert({
            project_id: conn.project_id,
            campaigns_snapshot: campaignSummary,
            account_summary: summary || {},
            ai_feedback: aiFeedback,
            ai_alerts: aiAlerts,
            total_spend: totalSpend,
            total_impressions: totalImpressions,
            total_clicks: totalClicks,
            active_campaigns: activeCampaigns.length,
          });

        if (insertErr) {
          console.error(`[CampaignMonitor] Insert error for ${conn.project_id}:`, insertErr.message);
          results.push({ projectId: conn.project_id, status: 'insert_error', error: insertErr.message });
        } else {
          console.log(`[CampaignMonitor] ✅ Insights saved for ${conn.project_id}`);
          results.push({ projectId: conn.project_id, status: 'ok' });
        }

      } catch (projectErr: any) {
        console.error(`[CampaignMonitor] Error processing ${conn.project_id}:`, projectErr.message);
        results.push({ projectId: conn.project_id, status: 'error', error: projectErr.message });
      }
    }

    // 6. Cleanup: keep only last 30 days of insights per project
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('campaign_insights')
      .delete()
      .lt('created_at', thirtyDaysAgo);

    return NextResponse.json({
      message: 'Campaign monitor completed',
      processed: results.length,
      results,
    });

  } catch (err: any) {
    console.error('[CampaignMonitor] Fatal error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
