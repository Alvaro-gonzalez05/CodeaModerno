import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const IG_API = 'https://graph.instagram.com/v21.0';
const FB_API = 'https://graph.facebook.com/v21.0';

// Detect token type: IGAA = Instagram API token, EAA = Facebook token
const isIGToken = (token: string) => token.startsWith('IGAA');

// Get the right base URL and user path based on token type
const getApiBase = (token: string, igUserId?: string) => {
  if (isIGToken(token)) {
    return { base: IG_API, userPath: 'me' };
  }
  return { base: FB_API, userPath: igUserId || 'me' };
};

const PROFILE_FIELDS = 'id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website';
const MEDIA_FIELDS = 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { action, projectId, accessToken, cursor } = body;

  if (!projectId) {
    return NextResponse.json({ error: 'projectId requerido' }, { status: 400 });
  }

  try {
    switch (action) {
      case 'connect': {
        if (!accessToken) {
          return NextResponse.json({ error: 'accessToken requerido' }, { status: 400 });
        }

        let igAccountId: string = '';
        let profileData: any;

        if (isIGToken(accessToken)) {
          // --- Instagram API token (IGAA...) ---
          // Call /me directly on Instagram Graph API
          const profileRes = await fetch(
            `${IG_API}/me?fields=user_id,${PROFILE_FIELDS}&access_token=${encodeURIComponent(accessToken)}`
          );
          profileData = await profileRes.json();

          if (profileData.error) {
            return NextResponse.json({ error: profileData.error.message }, { status: 400 });
          }

          igAccountId = profileData.user_id || profileData.id;
        } else {
          // --- Facebook token (EAA...) ---
          const debugLog: Record<string, any> = {};

          // Strategy 1: Go through Facebook Pages to find Instagram Business Account
          const pagesRes = await fetch(
            `${FB_API}/me/accounts?fields=id,name,instagram_business_account&access_token=${encodeURIComponent(accessToken)}`
          );
          const pagesData = await pagesRes.json();
          debugLog.pages_found = pagesData.data?.length || 0;
          debugLog.pages_names = pagesData.data?.map((p: any) => p.name) || [];
          debugLog.pages_error = pagesData.error?.message || null;

          const pageWithIG = pagesData.data?.find((p: any) => p.instagram_business_account);
          
          if (pageWithIG) {
            igAccountId = pageWithIG.instagram_business_account.id;
            const profileRes = await fetch(
              `${FB_API}/${igAccountId}?fields=${PROFILE_FIELDS}&access_token=${encodeURIComponent(accessToken)}`
            );
            profileData = await profileRes.json();
            if (profileData.error) {
              return NextResponse.json({ error: profileData.error.message }, { status: 400 });
            }
          }

          // Strategy 2: Go through Business Manager → owned pages → IG account
          if (!igAccountId) {
            const bizRes = await fetch(
              `${FB_API}/me/businesses?fields=id,name&access_token=${encodeURIComponent(accessToken)}`
            );
            const bizData = await bizRes.json();
            debugLog.businesses_found = bizData.data?.length || 0;
            debugLog.businesses_names = bizData.data?.map((b: any) => b.name) || [];
            debugLog.businesses_error = bizData.error?.message || null;

            if (bizData.data?.length) {
              for (const biz of bizData.data) {
                // Try instagram_accounts (connected via pages)
                const bizIgRes = await fetch(
                  `${FB_API}/${biz.id}/instagram_accounts?fields=id,username,profile_pic&access_token=${encodeURIComponent(accessToken)}`
                );
                const bizIgData = await bizIgRes.json();
                debugLog[`biz_${biz.name}_ig_accounts`] = bizIgData.data?.length || 0;
                debugLog[`biz_${biz.name}_ig_error`] = bizIgData.error?.message || null;

                if (bizIgData.data?.length) {
                  const igAcc = bizIgData.data[0];
                  igAccountId = igAcc.id;
                  
                  const profileRes = await fetch(
                    `${FB_API}/${igAccountId}?fields=${PROFILE_FIELDS}&access_token=${encodeURIComponent(accessToken)}`
                  );
                  profileData = await profileRes.json();
                  if (profileData.error) {
                    profileData = {
                      id: igAcc.id,
                      username: igAcc.username,
                      name: igAcc.username,
                      profile_picture_url: igAcc.profile_pic,
                    };
                  }
                  break;
                }

                // Try owned_instagram_accounts (directly owned by business)
                const bizOwnedIgRes = await fetch(
                  `${FB_API}/${biz.id}/owned_instagram_accounts?fields=id,username,profile_pic,followers_count,follows_count,media_count&access_token=${encodeURIComponent(accessToken)}`
                );
                const bizOwnedIgData = await bizOwnedIgRes.json();
                debugLog[`biz_${biz.name}_owned_ig`] = bizOwnedIgData.data?.length || 0;
                debugLog[`biz_${biz.name}_owned_ig_error`] = bizOwnedIgData.error?.message || null;
                debugLog[`biz_${biz.name}_owned_ig_names`] = bizOwnedIgData.data?.map((a: any) => a.username) || [];

                if (bizOwnedIgData.data?.length) {
                  const igAcc = bizOwnedIgData.data[0];
                  igAccountId = igAcc.id;

                  const profileRes = await fetch(
                    `${FB_API}/${igAccountId}?fields=${PROFILE_FIELDS}&access_token=${encodeURIComponent(accessToken)}`
                  );
                  profileData = await profileRes.json();
                  if (profileData.error) {
                    profileData = {
                      id: igAcc.id,
                      username: igAcc.username,
                      name: igAcc.username,
                      profile_picture_url: igAcc.profile_pic,
                      followers_count: igAcc.followers_count,
                      follows_count: igAcc.follows_count,
                      media_count: igAcc.media_count,
                    };
                  }
                  break;
                }

                // Try owned pages → IG account
                const bizPagesRes = await fetch(
                  `${FB_API}/${biz.id}/owned_pages?fields=id,name,instagram_business_account&access_token=${encodeURIComponent(accessToken)}`
                );
                const bizPagesData = await bizPagesRes.json();
                debugLog[`biz_${biz.name}_pages`] = bizPagesData.data?.map((p: any) => p.name) || [];
                debugLog[`biz_${biz.name}_pages_error`] = bizPagesData.error?.message || null;

                const bizPageWithIG = bizPagesData.data?.find((p: any) => p.instagram_business_account);
                if (bizPageWithIG) {
                  igAccountId = bizPageWithIG.instagram_business_account.id;
                  const profileRes = await fetch(
                    `${FB_API}/${igAccountId}?fields=${PROFILE_FIELDS}&access_token=${encodeURIComponent(accessToken)}`
                  );
                  profileData = await profileRes.json();
                  if (profileData.error) {
                    return NextResponse.json({ error: profileData.error.message }, { status: 400 });
                  }
                  break;
                }
              }
            }
          }

          // Strategy 3: Try /me/instagram_accounts directly
          if (!igAccountId) {
            const igAccountsRes = await fetch(
              `${FB_API}/me/instagram_accounts?fields=id,username,profile_pic,followers_count,follows_count,media_count&access_token=${encodeURIComponent(accessToken)}`
            );
            const igAccountsData = await igAccountsRes.json();
            debugLog.me_ig_accounts = igAccountsData.data?.length || 0;
            debugLog.me_ig_error = igAccountsData.error?.message || null;

            if (igAccountsData.data?.length) {
              const igAcc = igAccountsData.data[0];
              igAccountId = igAcc.id;
              profileData = {
                id: igAcc.id,
                username: igAcc.username,
                name: igAcc.username,
                profile_picture_url: igAcc.profile_pic,
                followers_count: igAcc.followers_count,
                follows_count: igAcc.follows_count,
                media_count: igAcc.media_count,
              };
            }
          }

          // All auto-discovery strategies failed for EAA token
          if (!igAccountId) {
            // Auto-save the EAA as ads_token since it has ads_read permission
            // Check if there's already a connection (from IGAA)
            const { data: existingConn } = await supabase
              .from('project_social_connections')
              .select('id')
              .eq('project_id', projectId)
              .eq('platform', 'instagram')
              .single();

            if (existingConn) {
              // Already has IGAA connection — just save EAA as ads_token
              await supabase
                .from('project_social_connections')
                .update({
                  ads_token: accessToken,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingConn.id);

              return NextResponse.json({
                success: true,
                eaa_saved_as_ads: true,
                message: 'Token EAA guardado para publicidad. La conexión de Instagram sigue usando tu token anterior.',
              });
            }

            // No existing connection — save EAA as ads_token, but tell user to also connect IGAA
            const { error: insertError } = await supabase
              .from('project_social_connections')
              .upsert({
                project_id: projectId,
                platform: 'instagram',
                access_token: accessToken, // placeholder, will be replaced by IGAA later
                ads_token: accessToken,
                is_active: false, // not fully active without IGAA
                updated_at: new Date().toISOString(),
              }, { onConflict: 'project_id,platform' });

            return NextResponse.json({
              error: 'eaa_needs_igaa',
              eaa_saved: true,
              hint: 'El token EAA se guardó para publicidad (ads). Pero para ver perfil, posts y estadísticas necesitás también tu token de Instagram (IGAA). Pegá el token IGAA para completar la conexión.',
            }, { status: 400 });
          }
        }

        // Save connection (preserve existing ads_token if present)
        const { data: existingRow } = await supabase
          .from('project_social_connections')
          .select('ads_token, ad_account_id')
          .eq('project_id', projectId)
          .eq('platform', 'instagram')
          .single();

        const { data: connection, error: dbError } = await supabase
          .from('project_social_connections')
          .upsert({
            project_id: projectId,
            platform: 'instagram',
            access_token: accessToken,
            ig_user_id: igAccountId,
            ig_username: profileData.username,
            ig_profile_picture: profileData.profile_picture_url,
            ads_token: existingRow?.ads_token || null,
            ad_account_id: existingRow?.ad_account_id || null,
            is_active: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'project_id,platform' })
          .select()
          .single();

        if (dbError) {
          return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, profile: profileData, connection });
      }

      case 'disconnect': {
        const { error: delError } = await supabase
          .from('project_social_connections')
          .delete()
          .eq('project_id', projectId)
          .eq('platform', 'instagram');

        if (delError) {
          return NextResponse.json({ error: delError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      case 'get_profile': {
        const { data: conn } = await supabase
          .from('project_social_connections')
          .select('*')
          .eq('project_id', projectId)
          .eq('platform', 'instagram')
          .single();

        if (!conn) {
          return NextResponse.json({ connected: false });
        }

        const { base, userPath } = getApiBase(conn.access_token, conn.ig_user_id);
        const profileRes = await fetch(
          `${base}/${userPath}?fields=${PROFILE_FIELDS}&access_token=${encodeURIComponent(conn.access_token)}`
        );
        const profileData = await profileRes.json();

        if (profileData.error) {
          if (profileData.error.code === 190) {
            await supabase
              .from('project_social_connections')
              .update({ is_active: false })
              .eq('id', conn.id);
            return NextResponse.json({ connected: false, tokenExpired: true });
          }
          return NextResponse.json({ error: profileData.error.message }, { status: 400 });
        }

        return NextResponse.json({ connected: true, profile: profileData });
      }

      case 'get_media': {
        const { data: conn } = await supabase
          .from('project_social_connections')
          .select('*')
          .eq('project_id', projectId)
          .eq('platform', 'instagram')
          .single();

        if (!conn) {
          return NextResponse.json({ error: 'No hay conexión activa' }, { status: 400 });
        }

        const { base, userPath } = getApiBase(conn.access_token, conn.ig_user_id);
        let url = `${base}/${userPath}/media?fields=${MEDIA_FIELDS}&limit=12&access_token=${encodeURIComponent(conn.access_token)}`;
        if (cursor) {
          url += `&after=${encodeURIComponent(cursor)}`;
        }

        const mediaRes = await fetch(url);
        const mediaData = await mediaRes.json();

        if (mediaData.error) {
          return NextResponse.json({ error: mediaData.error.message }, { status: 400 });
        }

        return NextResponse.json({
          media: mediaData.data || [],
          paging: mediaData.paging || null,
        });
      }

      case 'get_insights': {
        const { data: conn } = await supabase
          .from('project_social_connections')
          .select('*')
          .eq('project_id', projectId)
          .eq('platform', 'instagram')
          .single();

        if (!conn) {
          return NextResponse.json({ error: 'No hay conexión activa' }, { status: 400 });
        }

        const { base, userPath } = getApiBase(conn.access_token, conn.ig_user_id);
        const since = Math.floor(Date.now() / 1000) - 30 * 86400;
        const until = Math.floor(Date.now() / 1000);

        // Fetch multiple metric groups in parallel (some may fail depending on account type)
        const [engagementRes, growthRes, demographicsRes] = await Promise.all([
          // Engagement metrics (day period)
          fetch(
            `${base}/${userPath}/insights?metric=reach,accounts_engaged,total_interactions,likes,comments,shares,saves,replies,profile_views&period=day&since=${since}&until=${until}&access_token=${encodeURIComponent(conn.access_token)}`
          ),
          // Growth metrics (day period)
          fetch(
            `${base}/${userPath}/insights?metric=follower_count,follows_and_unfollows,profile_links_taps&period=day&since=${since}&until=${until}&access_token=${encodeURIComponent(conn.access_token)}`
          ),
          // Demographics (lifetime period) 
          fetch(
            `${base}/${userPath}/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&access_token=${encodeURIComponent(conn.access_token)}`
          ),
        ]);

        const [engagementData, growthData, demographicsData] = await Promise.all([
          engagementRes.json(),
          growthRes.json(),
          demographicsRes.json(),
        ]);

        const allInsights = [
          ...(engagementData.data || []),
          ...(growthData.data || []),
        ];

        const demographics = demographicsData.data?.[0]?.total_value?.breakdowns || null;

        return NextResponse.json({ 
          insights: allInsights,
          demographics,
        });
      }

      case 'get_media_insights': {
        const { data: conn } = await supabase
          .from('project_social_connections')
          .select('*')
          .eq('project_id', projectId)
          .eq('platform', 'instagram')
          .single();

        if (!conn) {
          return NextResponse.json({ error: 'No hay conexión activa' }, { status: 400 });
        }

        const { mediaId, mediaType } = body;
        if (!mediaId) {
          return NextResponse.json({ error: 'mediaId requerido' }, { status: 400 });
        }

        const { base } = getApiBase(conn.access_token, conn.ig_user_id);

        // Different metrics based on media type
        let metrics: string;
        const type = (mediaType || '').toUpperCase();
        if (type === 'STORY') {
          metrics = 'impressions,reach,replies,taps_forward,taps_back,exits';
        } else if (type === 'VIDEO' || type === 'REEL') {
          metrics = 'likes,comments,shares,saved,reach,total_interactions,plays';
        } else {
          // IMAGE, CAROUSEL_ALBUM
          metrics = 'likes,comments,shares,saved,reach,total_interactions';
        }

        // Try with full metrics first
        let insightsRes = await fetch(
          `${base}/${mediaId}/insights?metric=${metrics}&access_token=${encodeURIComponent(conn.access_token)}`
        );
        let insightsData = await insightsRes.json();

        // If error, try with minimal safe metrics
        if (insightsData.error) {
          const fallbackMetrics = 'likes,comments,saved,reach';
          insightsRes = await fetch(
            `${base}/${mediaId}/insights?metric=${fallbackMetrics}&access_token=${encodeURIComponent(conn.access_token)}`
          );
          insightsData = await insightsRes.json();
        }

        // If still error, try engagement metric only
        if (insightsData.error) {
          insightsRes = await fetch(
            `${base}/${mediaId}/insights?metric=reach&access_token=${encodeURIComponent(conn.access_token)}`
          );
          insightsData = await insightsRes.json();
        }

        if (insightsData.error) {
          return NextResponse.json({ error: insightsData.error.message }, { status: 400 });
        }

        return NextResponse.json({ insights: insightsData.data || [] });
      }

      case 'get_carousel_children': {
        const { data: conn } = await supabase
          .from('project_social_connections')
          .select('*')
          .eq('project_id', projectId)
          .eq('platform', 'instagram')
          .single();

        if (!conn) {
          return NextResponse.json({ error: 'No hay conexión activa' }, { status: 400 });
        }

        const { mediaId } = body;
        if (!mediaId) {
          return NextResponse.json({ error: 'mediaId requerido' }, { status: 400 });
        }

        const { base } = getApiBase(conn.access_token, conn.ig_user_id);
        const childrenRes = await fetch(
          `${base}/${mediaId}/children?fields=id,media_type,media_url,thumbnail_url,timestamp&access_token=${encodeURIComponent(conn.access_token)}`
        );
        const childrenData = await childrenRes.json();

        if (childrenData.error) {
          return NextResponse.json({ error: childrenData.error.message }, { status: 400 });
        }

        return NextResponse.json({ children: childrenData.data || [] });
      }

      case 'get_comments': {
        const { data: conn } = await supabase
          .from('project_social_connections')
          .select('*')
          .eq('project_id', projectId)
          .eq('platform', 'instagram')
          .single();

        if (!conn) {
          return NextResponse.json({ error: 'No hay conexión activa' }, { status: 400 });
        }

        const { mediaId } = body;
        if (!mediaId) {
          return NextResponse.json({ error: 'mediaId requerido' }, { status: 400 });
        }

        const { base } = getApiBase(conn.access_token, conn.ig_user_id);
        const commentsRes = await fetch(
          `${base}/${mediaId}/comments?fields=id,text,timestamp,username,like_count,replies{id,text,timestamp,username,like_count}&limit=50&access_token=${encodeURIComponent(conn.access_token)}`
        );
        const commentsData = await commentsRes.json();

        if (commentsData.error) {
          return NextResponse.json({ error: commentsData.error.message }, { status: 400 });
        }

        return NextResponse.json({ comments: commentsData.data || [] });
      }

      case 'connect_ads': {
        const { adsToken } = body;
        if (!adsToken) {
          return NextResponse.json({ error: 'adsToken requerido' }, { status: 400 });
        }

        // Verify the token works by fetching ad accounts
        const verifyRes = await fetch(
          `${FB_API}/me/adaccounts?fields=id,name,account_status,currency&access_token=${encodeURIComponent(adsToken)}`
        );
        const verifyData = await verifyRes.json();

        if (verifyData.error) {
          return NextResponse.json({ 
            error: verifyData.error.message,
            hint: 'El token no tiene acceso a cuentas publicitarias. Asegurate de que tenga el permiso ads_read.'
          }, { status: 400 });
        }

        if (!verifyData.data?.length) {
          return NextResponse.json({ error: 'No se encontraron cuentas publicitarias vinculadas a este token.' }, { status: 400 });
        }

        const adAccount = verifyData.data[0];

        const { error: updateError } = await supabase
          .from('project_social_connections')
          .update({
            ads_token: adsToken,
            ad_account_id: adAccount.id,
            updated_at: new Date().toISOString(),
          })
          .eq('project_id', projectId)
          .eq('platform', 'instagram');

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          adAccount: { id: adAccount.id, name: adAccount.name, currency: adAccount.currency }
        });
      }

      case 'disconnect_ads': {
        const { error: updateError } = await supabase
          .from('project_social_connections')
          .update({
            ads_token: null,
            ad_account_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('project_id', projectId)
          .eq('platform', 'instagram');

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      case 'get_ads': {
        const { data: conn } = await supabase
          .from('project_social_connections')
          .select('*')
          .eq('project_id', projectId)
          .eq('platform', 'instagram')
          .single();

        if (!conn) {
          return NextResponse.json({ error: 'No hay conexión activa' }, { status: 400 });
        }

        if (!conn.ads_token) {
          return NextResponse.json({ 
            error: 'no_ads_token',
            hint: 'No hay token de publicidad configurado. Conectá tu token de Facebook con permiso ads_read.'
          }, { status: 400 });
        }

        const token = conn.ads_token;
        const savedAdAccountId = conn.ad_account_id;

        // Step 1: Get ad accounts (use saved one or discover)
        let adAccount: any;
        if (savedAdAccountId) {
          const accRes = await fetch(
            `${FB_API}/${savedAdAccountId}?fields=id,name,account_status,currency,amount_spent,balance&access_token=${encodeURIComponent(token)}`
          );
          const accData = await accRes.json();
          if (accData.error) {
            // Token may have expired for ads
            return NextResponse.json({ 
              error: 'ads_token_expired',
              hint: 'El token de publicidad expiró o fue revocado. Reconectá desde la sección de Publicidad.'
            }, { status: 400 });
          }
          adAccount = accData;
        } else {
          const adAccountsRes = await fetch(
            `${FB_API}/me/adaccounts?fields=id,name,account_status,currency,amount_spent,balance,disable_reason,funding_source_details&access_token=${encodeURIComponent(token)}`
          );
          const adAccountsData = await adAccountsRes.json();
          if (adAccountsData.error || !adAccountsData.data?.length) {
            return NextResponse.json({ ads: [], campaigns: [], adAccount: null });
          }
          adAccount = adAccountsData.data[0];
        }

        const actId = adAccount.id;

        // Step 2: Get campaigns (all platforms, last 90 days for wider coverage)
        let campaigns: any[] = [];
        try {
          const campaignsRes = await fetch(
            `${FB_API}/${actId}/campaigns?fields=id,name,status,objective,start_time,stop_time,daily_budget,lifetime_budget,insights.date_preset(last_90d){impressions,reach,clicks,spend,cpc,cpm,ctr,actions}&limit=50&access_token=${encodeURIComponent(token)}`
          );
          const campaignsData = await campaignsRes.json();
          campaigns = campaignsData.data || [];
        } catch {
          // Could not fetch campaigns
        }

        // Step 3: Get ad-level data (all platforms, last 90 days)
        let ads: any[] = [];
        try {
          const adsRes = await fetch(
            `${FB_API}/${actId}/ads?fields=id,name,status,creative{thumbnail_url,title,body},insights.date_preset(last_90d){impressions,reach,clicks,spend,cpc,cpm,ctr,actions}&limit=50&access_token=${encodeURIComponent(token)}`
          );
          const adsResponseData = await adsRes.json();
          ads = adsResponseData.data || [];
        } catch {
          // Could not fetch ads
        }

        // Step 4: Get account-level spend summary (last 90 days, all platforms)
        let summary: any = null;
        try {
          const spendRes = await fetch(
            `${FB_API}/${actId}/insights?date_preset=last_90d&fields=impressions,reach,clicks,spend,cpc,cpm,ctr,actions&access_token=${encodeURIComponent(token)}`
          );
          const spendData = await spendRes.json();
          summary = spendData.data?.[0] || null;
        } catch {
          // Could not fetch insights
        }

        return NextResponse.json({
          adAccount: {
            id: adAccount.id,
            name: adAccount.name,
            currency: adAccount.currency,
            status: adAccount.account_status,
            amount_spent: adAccount.amount_spent,
            balance: adAccount.balance,
          },
          campaigns,
          ads,
          summary,
        });
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
