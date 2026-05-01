// Helpers compartidos para Instagram Graph API + Meta Marketing API.
// Centraliza las llamadas para que tanto /api/instagram como /api/chat (UcoBot)
// puedan reutilizarlas.

import type { SupabaseClient } from '@supabase/supabase-js';

export const IG_API = 'https://graph.instagram.com/v21.0';
export const FB_API = 'https://graph.facebook.com/v21.0';

export const PROFILE_FIELDS =
  'id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website';
export const MEDIA_FIELDS =
  'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink';

export interface SocialConnection {
  id: string;
  project_id: string;
  platform: string;
  access_token: string;
  ads_token: string | null;
  ad_account_id: string | null;
  ig_user_id: string | null;
  ig_username: string | null;
  ig_profile_picture: string | null;
  is_active: boolean;
}

export const isIGToken = (token: string) => token.startsWith('IGAA');

export const getApiBase = (token: string, igUserId?: string | null) => {
  if (isIGToken(token)) {
    return { base: IG_API, userPath: 'me' };
  }
  return { base: FB_API, userPath: igUserId || 'me' };
};

// ---------------------------------------------------------------------------
// Connection loader
// ---------------------------------------------------------------------------

export async function getConnection(
  supabase: SupabaseClient,
  projectId: string
): Promise<SocialConnection | null> {
  const { data } = await supabase
    .from('project_social_connections')
    .select('*')
    .eq('project_id', projectId)
    .eq('platform', 'instagram')
    .single();
  return (data as SocialConnection) || null;
}

// ---------------------------------------------------------------------------
// Read helpers (Instagram Graph API)
// ---------------------------------------------------------------------------

export async function fetchProfile(conn: SocialConnection) {
  const { base, userPath } = getApiBase(conn.access_token, conn.ig_user_id);
  const res = await fetch(
    `${base}/${userPath}?fields=${PROFILE_FIELDS}&access_token=${encodeURIComponent(conn.access_token)}`
  );
  return res.json();
}

export async function fetchMedia(conn: SocialConnection, limit = 25) {
  const { base, userPath } = getApiBase(conn.access_token, conn.ig_user_id);
  const res = await fetch(
    `${base}/${userPath}/media?fields=${MEDIA_FIELDS}&limit=${limit}&access_token=${encodeURIComponent(conn.access_token)}`
  );
  const data = await res.json();
  return data.data || [];
}

export async function fetchAccountInsights(conn: SocialConnection) {
  const { base, userPath } = getApiBase(conn.access_token, conn.ig_user_id);
  const tokenParam = encodeURIComponent(conn.access_token);
  const since = Math.floor(Date.now() / 1000) - 30 * 86400;
  const until = Math.floor(Date.now() / 1000);

  // IG Graph API v21 split metrics into two groups:
  //  - Time-series (period=day): reach, follower_count
  //  - Aggregated (metric_type=total_value): accounts_engaged, total_interactions,
  //    likes, comments, shares, saves, replies, profile_views, follows_and_unfollows, profile_links_taps
  // Demographics now require a `breakdown` parameter (age | gender | city | country).
  const timeSeriesMetrics = 'reach,follower_count';
  const totalValueMetrics =
    'accounts_engaged,total_interactions,likes,comments,shares,saves,replies,profile_views,follows_and_unfollows,profile_links_taps';
  const demographicBreakdowns = ['age', 'gender', 'city', 'country'] as const;

  const [timeSeriesRes, totalValueRes, ...demoResponses] = await Promise.all([
    fetch(
      `${base}/${userPath}/insights?metric=${timeSeriesMetrics}&period=day&since=${since}&until=${until}&access_token=${tokenParam}`
    ),
    fetch(
      `${base}/${userPath}/insights?metric=${totalValueMetrics}&metric_type=total_value&period=day&since=${since}&until=${until}&access_token=${tokenParam}`
    ),
    ...demographicBreakdowns.map((breakdown) =>
      fetch(
        `${base}/${userPath}/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=${breakdown}&access_token=${tokenParam}`
      )
    ),
  ]);

  const [timeSeriesData, totalValueData, ...demoDataRaw] = await Promise.all([
    timeSeriesRes.json(),
    totalValueRes.json(),
    ...demoResponses.map((r) => r.json()),
  ]);

  const insights = [
    ...(timeSeriesData.data || []),
    ...(totalValueData.data || []),
  ];

  // Aggregate metric values into a single 30-day total per metric.
  const totals: Record<string, number> = {};
  for (const m of insights) {
    if (typeof m.total_value?.value === 'number') {
      totals[m.name] = m.total_value.value;
    } else if (Array.isArray(m.values)) {
      totals[m.name] = m.values.reduce((acc: number, v: any) => acc + (v.value || 0), 0);
    }
  }

  // Collect demographics keyed by breakdown dimension.
  const demographics: Record<string, any[]> = {};
  demographicBreakdowns.forEach((breakdown, idx) => {
    const data = demoDataRaw[idx];
    const breakdowns = data?.data?.[0]?.total_value?.breakdowns;
    if (Array.isArray(breakdowns) && breakdowns.length) {
      const results = breakdowns[0]?.results || [];
      if (results.length) demographics[breakdown] = results;
    }
  });

  return {
    insights,
    totals,
    demographics: Object.keys(demographics).length ? demographics : null,
  };
}

async function fetchSingleMediaInsights(
  conn: SocialConnection,
  mediaId: string,
  mediaType?: string
): Promise<Record<string, number>> {
  const { base } = getApiBase(conn.access_token, conn.ig_user_id);
  const type = (mediaType || '').toUpperCase();

  let metrics: string;
  if (type === 'STORY') {
    metrics = 'impressions,reach,replies,taps_forward,taps_back,exits';
  } else if (type === 'VIDEO' || type === 'REEL') {
    metrics = 'likes,comments,shares,saved,reach,total_interactions,plays';
  } else {
    metrics = 'likes,comments,shares,saved,reach,total_interactions';
  }

  const tryFetch = async (m: string) => {
    const r = await fetch(
      `${base}/${mediaId}/insights?metric=${m}&access_token=${encodeURIComponent(conn.access_token)}`
    );
    return r.json();
  };

  let data = await tryFetch(metrics);
  if (data.error) data = await tryFetch('likes,comments,saved,reach');
  if (data.error) data = await tryFetch('reach');

  const out: Record<string, number> = {};
  if (Array.isArray(data.data)) {
    for (const m of data.data) out[m.name] = m.values?.[0]?.value || 0;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Analytical: rank posts by engagement and surface best/worst
// ---------------------------------------------------------------------------

export interface AnalyzedPost {
  id: string;
  caption: string | null;
  media_type: string;
  permalink: string;
  thumbnail_url?: string;
  media_url?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  total_interactions: number;
  engagement_rate: number; // % of reach
}

export async function analyzePosts(
  conn: SocialConnection,
  limit = 12
): Promise<{
  posts: AnalyzedPost[];
  best: AnalyzedPost[];
  worst: AnalyzedPost[];
  averages: { engagement_rate: number; likes: number; comments: number; reach: number };
}> {
  const media = await fetchMedia(conn, limit);

  const enriched: AnalyzedPost[] = await Promise.all(
    media.map(async (m: any) => {
      const insights = await fetchSingleMediaInsights(conn, m.id, m.media_type);
      const likes = insights.likes ?? m.like_count ?? 0;
      const comments = insights.comments ?? m.comments_count ?? 0;
      const shares = insights.shares ?? 0;
      const saves = insights.saved ?? 0;
      const reach = insights.reach ?? 0;
      const total_interactions =
        insights.total_interactions ?? likes + comments + shares + saves;
      const engagement_rate = reach > 0 ? (total_interactions / reach) * 100 : 0;

      return {
        id: m.id,
        caption: m.caption || null,
        media_type: m.media_type,
        permalink: m.permalink,
        thumbnail_url: m.thumbnail_url,
        media_url: m.media_url,
        timestamp: m.timestamp,
        likes,
        comments,
        shares,
        saves,
        reach,
        total_interactions,
        engagement_rate: Math.round(engagement_rate * 100) / 100,
      };
    })
  );

  const sorted = [...enriched].sort((a, b) => b.engagement_rate - a.engagement_rate);
  const best = sorted.slice(0, 3);
  const worst = sorted.slice(-3).reverse();

  const n = enriched.length || 1;
  const avg = {
    engagement_rate:
      Math.round((enriched.reduce((s, p) => s + p.engagement_rate, 0) / n) * 100) / 100,
    likes: Math.round(enriched.reduce((s, p) => s + p.likes, 0) / n),
    comments: Math.round(enriched.reduce((s, p) => s + p.comments, 0) / n),
    reach: Math.round(enriched.reduce((s, p) => s + p.reach, 0) / n),
  };

  return { posts: enriched, best, worst, averages: avg };
}

// ---------------------------------------------------------------------------
// Meta Marketing API (Ads)
// ---------------------------------------------------------------------------

export async function fetchAdsOverview(conn: SocialConnection) {
  if (!conn.ads_token) return { error: 'no_ads_token' as const };

  const token = conn.ads_token;
  let adAccount: any = null;

  if (conn.ad_account_id) {
    const r = await fetch(
      `${FB_API}/${conn.ad_account_id}?fields=id,name,account_status,currency,amount_spent,balance&access_token=${encodeURIComponent(token)}`
    );
    const j = await r.json();
    if (j.error) return { error: 'ads_token_expired' as const, message: j.error.message };
    adAccount = j;
  } else {
    const r = await fetch(
      `${FB_API}/me/adaccounts?fields=id,name,account_status,currency,amount_spent,balance&access_token=${encodeURIComponent(token)}`
    );
    const j = await r.json();
    if (j.error || !j.data?.length) return { error: 'no_ad_accounts' as const };
    adAccount = j.data[0];
  }

  const actId = adAccount.id;

  const [campaignsRes, adsRes, summaryRes] = await Promise.all([
    fetch(
      `${FB_API}/${actId}/campaigns?fields=id,name,status,objective,start_time,stop_time,daily_budget,lifetime_budget,insights.date_preset(last_90d){impressions,reach,clicks,spend,cpc,cpm,ctr,actions}&limit=50&access_token=${encodeURIComponent(token)}`
    ),
    fetch(
      `${FB_API}/${actId}/ads?fields=id,name,status,campaign_id,creative{thumbnail_url,title,body},insights.date_preset(last_90d){impressions,reach,clicks,spend,cpc,cpm,ctr,actions}&limit=50&access_token=${encodeURIComponent(token)}`
    ),
    fetch(
      `${FB_API}/${actId}/insights?date_preset=last_90d&fields=impressions,reach,clicks,spend,cpc,cpm,ctr,actions&access_token=${encodeURIComponent(token)}`
    ),
  ]);

  const [campaignsData, adsData, summaryData] = await Promise.all([
    campaignsRes.json(),
    adsRes.json(),
    summaryRes.json(),
  ]);

  return {
    adAccount: {
      id: adAccount.id,
      name: adAccount.name,
      currency: adAccount.currency,
      status: adAccount.account_status,
      amount_spent: adAccount.amount_spent,
      balance: adAccount.balance,
    },
    campaigns: campaignsData.data || [],
    ads: adsData.data || [],
    summary: summaryData.data?.[0] || null,
  };
}

export async function pauseCampaign(conn: SocialConnection, campaignId: string) {
  if (!conn.ads_token) return { error: 'no_ads_token' };
  const r = await fetch(`${FB_API}/${campaignId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `status=PAUSED&access_token=${encodeURIComponent(conn.ads_token)}`,
  });
  return r.json();
}

export async function resumeCampaign(conn: SocialConnection, campaignId: string) {
  if (!conn.ads_token) return { error: 'no_ads_token' };
  const r = await fetch(`${FB_API}/${campaignId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `status=ACTIVE&access_token=${encodeURIComponent(conn.ads_token)}`,
  });
  return r.json();
}

export async function updateCampaignBudget(
  conn: SocialConnection,
  campaignId: string,
  dailyBudgetMinorUnits: number
) {
  if (!conn.ads_token) return { error: 'no_ads_token' };
  const params = new URLSearchParams({
    daily_budget: String(dailyBudgetMinorUnits),
    access_token: conn.ads_token,
  });
  const r = await fetch(`${FB_API}/${campaignId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  return r.json();
}

// Resolve the FB Page id linked to the IG business account (needed for boost).
async function resolveLinkedPageId(conn: SocialConnection): Promise<string | null> {
  if (!conn.ads_token || !conn.ig_user_id) return null;
  const r = await fetch(
    `${FB_API}/me/accounts?fields=id,name,instagram_business_account&access_token=${encodeURIComponent(conn.ads_token)}`
  );
  const j = await r.json();
  if (!j.data) return null;
  const match = j.data.find((p: any) => p.instagram_business_account?.id === conn.ig_user_id);
  return match?.id || null;
}

export interface BoostPostOptions {
  mediaId: string;
  dailyBudgetMinorUnits: number; // p.ej. 200000 = $2000 si la cuenta es ARS
  durationDays: number; // por cuántos días correr
  objective?: string; // OUTCOME_ENGAGEMENT (default), OUTCOME_AWARENESS, OUTCOME_TRAFFIC
  countries?: string[]; // ['AR'] por defecto
  ageMin?: number;
  ageMax?: number;
}

// Crea Campaign + Ad Set + Ad para promocionar un post existente de IG.
// Todo se crea en estado PAUSED — el usuario debe activar manualmente desde Meta.
export async function boostInstagramPost(
  conn: SocialConnection,
  opts: BoostPostOptions
) {
  if (!conn.ads_token) return { error: 'Falta ads_token (token de Facebook con permiso ads_management).' };
  if (!conn.ad_account_id) return { error: 'Falta ad_account_id en la conexión.' };
  if (!conn.ig_user_id) return { error: 'Falta ig_user_id (Instagram Business Account ID).' };

  const pageId = await resolveLinkedPageId(conn);
  if (!pageId) {
    return {
      error: 'No se encontró la Página de Facebook vinculada al IG. Verificá que el ads_token tenga acceso a la Page y que la IG esté linkeada.',
    };
  }

  const token = conn.ads_token;
  const actId = conn.ad_account_id;
  const objective = opts.objective || 'OUTCOME_ENGAGEMENT';
  const countries = opts.countries?.length ? opts.countries : ['AR'];

  // 1. Campaign
  const campaignRes = await fetch(`${FB_API}/${actId}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      name: `[UcoBot] Boost IG ${opts.mediaId} - ${new Date().toISOString().slice(0, 10)}`,
      objective,
      status: 'PAUSED',
      special_ad_categories: '[]',
      is_adset_budget_sharing_enabled: 'false',
      access_token: token,
    }).toString(),
  });
  const campaign = await campaignRes.json();
  console.log('[boostIG] campaign response:', JSON.stringify(campaign, null, 2));
  if (campaign.error) return { error: `Campaign: ${campaign.error.message} (code ${campaign.error.code})` };

  // 2. Ad Set
  const startTime = Math.floor(Date.now() / 1000) + 3600; // empieza en 1h
  const endTime = startTime + opts.durationDays * 86400;

  // Map objective → optimization_goal
  // NOTE: ENGAGED_USERS is NOT valid for OUTCOME_ENGAGEMENT.
  // POST_ENGAGEMENT is the correct optimization_goal for boosting IG posts with OUTCOME_ENGAGEMENT.
  const optimizationGoal =
    objective === 'OUTCOME_AWARENESS'
      ? 'REACH'
      : objective === 'OUTCOME_TRAFFIC'
        ? 'LINK_CLICKS'
        : 'POST_ENGAGEMENT'; // OUTCOME_ENGAGEMENT → POST_ENGAGEMENT

  const billingEvent = 'IMPRESSIONS'; // POST_ENGAGEMENT and REACH both use IMPRESSIONS as billing event

  const targeting = {
    geo_locations: { countries },
    age_min: opts.ageMin || 18,
    age_max: opts.ageMax || 65,
    publisher_platforms: ['instagram'],
    instagram_positions: ['stream', 'explore', 'reels'],
    targeting_automation: { advantage_audience: 0 },
  };

  const adsetRes = await fetch(`${FB_API}/${actId}/adsets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      name: `[UcoBot] AdSet ${opts.mediaId}`,
      campaign_id: campaign.id,
      daily_budget: String(opts.dailyBudgetMinorUnits),
      billing_event: billingEvent,
      optimization_goal: optimizationGoal,
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      start_time: String(startTime),
      end_time: String(endTime),
      targeting: JSON.stringify(targeting),
      status: 'PAUSED',
      access_token: token,
    }).toString(),
  });
  const adset = await adsetRes.json();
  console.log('[boostIG] adset response:', JSON.stringify(adset, null, 2));
  if (adset.error) return { error: `AdSet: ${adset.error.message} (code ${adset.error.code})`, campaign_id: campaign.id };

  // 3. Creative — boostear un post existente de IG.
  //    El instagram_actor_id debe ser el IG Business Account vinculado a la FB Page.
  //    Lo obtenemos desde /{pageId}?fields=instagram_business_account (más confiable que
  //    /{actId}/instagram_accounts que requiere vinculación explícita al ad account).
  let igActorId = conn.ig_user_id!;
  try {
    const pageIgRes = await fetch(
      `${FB_API}/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(token)}`
    );
    const pageIgData = await pageIgRes.json();
    console.log('[boostIG] page instagram_business_account:', JSON.stringify(pageIgData, null, 2));
    if (pageIgData.instagram_business_account?.id) {
      igActorId = pageIgData.instagram_business_account.id;
    }
  } catch (_) { /* fallback to conn.ig_user_id */ }

  console.log('[boostIG] using igActorId:', igActorId, '| pageId:', pageId);

  const creativeRes = await fetch(`${FB_API}/${actId}/adcreatives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      name: `[UcoBot] Creative ${opts.mediaId}`,
      source_instagram_media_id: opts.mediaId,
      access_token: token,
    }).toString(),
  });
  const creative = await creativeRes.json();
  console.log('[boostIG] creative response:', JSON.stringify(creative, null, 2));
  if (creative.error) {
    return {
      error: `Creative: ${creative.error.message} (code ${creative.error.code})`,
      campaign_id: campaign.id,
      adset_id: adset.id,
    };
  }

  // 4. Ad
  const adRes = await fetch(`${FB_API}/${actId}/ads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      name: `[UcoBot] Ad ${opts.mediaId}`,
      adset_id: adset.id,
      creative: JSON.stringify({ creative_id: creative.id }),
      status: 'PAUSED',
      access_token: token,
    }).toString(),
  });
  const ad = await adRes.json();
  if (ad.error) {
    return {
      error: `Ad: ${ad.error.message}`,
      campaign_id: campaign.id,
      adset_id: adset.id,
      creative_id: creative.id,
    };
  }

  return {
    success: true,
    message:
      'Campaña creada en estado PAUSADO. Revisala en Meta Ads Manager y activala manualmente.',
    campaign_id: campaign.id,
    adset_id: adset.id,
    creative_id: creative.id,
    ad_id: ad.id,
  };
}
