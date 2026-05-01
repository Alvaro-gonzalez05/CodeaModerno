'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Link2, Unlink, RefreshCcw, Heart, MessageCircle, Eye, Users, UserPlus, ImageIcon, BarChart3, ExternalLink, AlertTriangle, CheckCircle2, Loader2, ChevronDown, ChevronLeft, ChevronRight, TrendingUp, DollarSign, MousePointerClick, Megaphone, Target, Bookmark, Share2, Reply, UserCheck, LinkIcon } from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  name: string;
  profile_picture_url: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  biography?: string;
  website?: string;
}

interface MediaItem {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  permalink: string;
}

interface InsightMetric {
  name: string;
  period: string;
  values: { value: number; end_time: string }[];
  title: string;
  description: string;
  total_value?: { value: number };
}

const formatNumber = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
};

export default function ContentManagerTab({ projectId }: { projectId: string }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaNextCursor, setMediaNextCursor] = useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [insights, setInsights] = useState<InsightMetric[]>([]);
  const [demographics, setDemographics] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [adsData, setAdsData] = useState<any>(null);
  const [isLoadingAds, setIsLoadingAds] = useState(false);
  const [adsError, setAdsError] = useState('');
  const [adsTokenInput, setAdsTokenInput] = useState('');
  const [isConnectingAds, setIsConnectingAds] = useState(false);
  const [hasAdsToken, setHasAdsToken] = useState(false);
  // When the EAA token returns multiple ad accounts, let the user pick one
  const [adAccountChoices, setAdAccountChoices] = useState<any[] | null>(null);
  const [pendingAdsToken, setPendingAdsToken] = useState('');
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [insightsApiErrors, setInsightsApiErrors] = useState<string[]>([]);
  const [mediaInsights, setMediaInsights] = useState<any>(null);
  const [isLoadingMediaInsights, setIsLoadingMediaInsights] = useState(false);
  const [error, setError] = useState('');
  const [needsIgaaToken, setNeedsIgaaToken] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [activeSection, setActiveSection] = useState<'posts' | 'insights' | 'ads'>('posts');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [carouselChildren, setCarouselChildren] = useState<any[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselDir, setCarouselDir] = useState<'left' | 'right'>('right'); // direction of last slide
  const [isLoadingCarousel, setIsLoadingCarousel] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [projectId]);

  // Lock scroll while the media modal is open. Dashboard's <main> is the scroll
  // container (not body), so we lock both.
  useEffect(() => {
    if (!selectedMedia) return;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const mainEl = document.querySelector('main');
    const previousMainOverflow = mainEl ? (mainEl as HTMLElement).style.overflow : '';
    if (mainEl) (mainEl as HTMLElement).style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      if (mainEl) (mainEl as HTMLElement).style.overflow = previousMainOverflow;
    };
  }, [selectedMedia]);

  const apiCall = async (action: string, extra: Record<string, any> = {}) => {
    const res = await fetch('/api/instagram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, projectId, ...extra }),
    });
    return res.json();
  };

  const checkConnection = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiCall('get_profile');
      if (data.connected) {
        setIsConnected(true);
        setProfile(data.profile);
        setTokenExpired(false);
        // Auto-load media
        loadMedia();
      } else {
        setIsConnected(false);
        if (data.tokenExpired) setTokenExpired(true);
      }
    } catch {
      setError('Error al verificar conexión');
    }
    setIsLoading(false);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken.trim()) return;
    setIsConnecting(true);
    setError('');
    setNeedsIgaaToken(false);
    try {
      const data = await apiCall('connect', { accessToken: accessToken.trim() });
      
      if (data.eaa_saved_as_ads) {
        // EAA token was saved as ads_token on existing IGAA connection
        setHasAdsToken(true);
        setAccessToken('');
        setError('');
        // Refresh the connection to show profile
        await checkConnection();
        return;
      }

      if (data.error === 'eaa_needs_igaa') {
        // EAA was saved for ads, but need IGAA for Instagram
        setNeedsIgaaToken(true);
        setHasAdsToken(true);
        setAccessToken('');
        setError('');
      } else if (data.error) {
        let errorMsg = data.error;
        if (data.hint) errorMsg += '\n\n💡 ' + data.hint;
        if (data.debug) {
          errorMsg += '\n\n🔍 Debug: ' + JSON.stringify(data.debug, null, 2);
        }
        setError(errorMsg);
      } else {
        setIsConnected(true);
        setProfile(data.profile);
        setAccessToken('');
        setTokenExpired(false);
        setNeedsIgaaToken(false);
        loadMedia();
      }
    } catch {
      setError('Error al conectar');
    }
    setIsConnecting(false);
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar Instagram de este proyecto?')) return;
    const data = await apiCall('disconnect');
    if (data.success) {
      setIsConnected(false);
      setProfile(null);
      setMedia([]);
      setInsights([]);
      setTokenExpired(false);
    }
  };

  const loadMedia = async (cursor?: string) => {
    setIsLoadingMedia(true);
    try {
      const data = await apiCall('get_media', cursor ? { cursor } : {});
      if (data.media) {
        setMedia(prev => cursor ? [...prev, ...data.media] : data.media);
        setMediaNextCursor(data.paging?.cursors?.after || null);
      }
    } catch {
      // silent
    }
    setIsLoadingMedia(false);
  };

  const loadInsights = async () => {
    setIsLoadingInsights(true);
    setInsightsApiErrors([]);
    try {
      const data = await apiCall('get_insights');
      if (data.insights) setInsights(data.insights);
      if (data.demographics) setDemographics(data.demographics);
      if (data.apiErrors) setInsightsApiErrors(data.apiErrors);
      if (data.error) setError(data.error);
    } catch {
      // silent
    }
    setIsLoadingInsights(false);
  };

  const loadAds = async () => {
    setIsLoadingAds(true);
    setAdsError('');
    try {
      const data = await apiCall('get_ads');
      if (data.error === 'no_ads_token') {
        setHasAdsToken(false);
        setAdsError('');
      } else if (data.error === 'ads_token_expired') {
        setHasAdsToken(false);
        setAdsError(data.hint || 'Token de publicidad expirado');
      } else if (data.error) {
        setAdsError(data.hint || data.error);
      } else {
        setHasAdsToken(true);
        setAdsData(data);
      }
    } catch {
      setAdsError('Error al cargar datos de publicidad');
    }
    setIsLoadingAds(false);
  };

  const connectAdsToken = async (selectedAccountId?: string) => {
    const tokenToUse = selectedAccountId ? pendingAdsToken : adsTokenInput.trim();
    if (!tokenToUse) return;
    setIsConnectingAds(true);
    setAdsError('');
    try {
      const payload: Record<string, any> = { adsToken: tokenToUse };
      if (selectedAccountId) payload.adAccountId = selectedAccountId;
      const data = await apiCall('connect_ads', payload);

      if (data.multiple_accounts) {
        // User must pick which ad account to use
        setAdAccountChoices(data.accounts);
        setPendingAdsToken(tokenToUse);
        setAdsError('');
      } else if (data.error) {
        setAdsError(data.hint || data.error);
      } else {
        setHasAdsToken(true);
        setAdsTokenInput('');
        setPendingAdsToken('');
        setAdAccountChoices(null);
        await loadAds();
      }
    } catch {
      setAdsError('Error al conectar token de publicidad');
    }
    setIsConnectingAds(false);
  };

  const switchAdAccount = async (newAccountId: string) => {
    setIsSwitchingAccount(true);
    setAdsError('');
    try {
      const data = await apiCall('select_ad_account', { adAccountId: newAccountId });
      if (data.error) {
        setAdsError(data.error);
      } else {
        setAdAccountChoices(null);
        await loadAds();
      }
    } catch {
      setAdsError('Error al cambiar de cuenta');
    }
    setIsSwitchingAccount(false);
  };

  const openAccountSwitcher = async () => {
    setIsSwitchingAccount(true);
    setAdsError('');
    try {
      const data = await apiCall('list_ad_accounts');
      if (data.error) {
        setAdsError(data.error);
      } else {
        setAdAccountChoices(data.accounts || []);
      }
    } catch {
      setAdsError('Error al listar cuentas');
    }
    setIsSwitchingAccount(false);
  };

  const disconnectAdsToken = async () => {
    try {
      await apiCall('disconnect_ads');
      setHasAdsToken(false);
      setAdsData(null);
      setAdsError('');
    } catch {
      // silent
    }
  };

  const metricLabelsEs: Record<string, string> = {
    likes: 'Me gusta',
    comments: 'Comentarios',
    shares: 'Compartidos',
    saved: 'Guardados',
    saves: 'Guardados',
    reach: 'Alcance',
    impressions: 'Impresiones',
    total_interactions: 'Interacciones',
    plays: 'Reproducciones',
    replies: 'Respuestas',
    taps_forward: 'Taps adelante',
    taps_back: 'Taps atrás',
    exits: 'Salidas',
    follower_count: 'Seguidores',
    follows_and_unfollows: 'Seguidos / Dejados',
    profile_views: 'Visitas al perfil',
    profile_links_taps: 'Taps en enlace',
    accounts_engaged: 'Cuentas activas',
    ig_reels_avg_watch_time: 'Tiempo prom. de vista',
    ig_reels_video_view_total_time: 'Tiempo total de vista',
    video_views: 'Vistas de video',
    engagement: 'Engagement',
  };

  const loadMediaInsights = async (mediaId: string, mediaType?: string) => {
    setIsLoadingMediaInsights(true);
    setMediaInsights(null);
    try {
      const data = await apiCall('get_media_insights', { mediaId, mediaType });
      if (data.insights) {
        const mapped: Record<string, number> = {};
        data.insights.forEach((m: any) => { mapped[m.name] = m.values?.[0]?.value || 0; });
        setMediaInsights(mapped);
      } else if (data.error) {
        setMediaInsights({ error: data.error });
      }
    } catch {
      setMediaInsights({ error: 'No se pudieron cargar las métricas' });
    }
    setIsLoadingMediaInsights(false);
  };

  const loadCarouselChildren = async (mediaId: string) => {
    setIsLoadingCarousel(true);
    setCarouselChildren([]);
    setCarouselIndex(0);
    try {
      const data = await apiCall('get_carousel_children', { mediaId });
      if (data.children?.length) {
        setCarouselChildren(data.children);
      }
    } catch {
      // silent
    }
    setIsLoadingCarousel(false);
  };

  const loadComments = async (mediaId: string) => {
    setIsLoadingComments(true);
    setComments([]);
    try {
      const data = await apiCall('get_comments', { mediaId });
      if (data.comments) {
        setComments(data.comments);
      }
    } catch {
      // silent
    }
    setIsLoadingComments(false);
  };

  const openMediaDetail = (item: MediaItem) => {
    setSelectedMedia(item);
    setMediaInsights(null);
    setCarouselChildren([]);
    setCarouselIndex(0);
    setComments([]);
    // Auto-load carousel children and comments
    if (item.media_type === 'CAROUSEL_ALBUM') {
      loadCarouselChildren(item.id);
    }
    loadComments(item.id);
  };

  const refreshAll = async () => {
    await checkConnection();
    if (activeSection === 'insights') await loadInsights();
    if (activeSection === 'ads') await loadAds();
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={32} className="animate-spin text-[hsl(76,85%,67%)]" />
        <p className="text-sm text-white/40 uppercase tracking-widest">Cargando conexión...</p>
      </div>
    );
  }

  // Not Connected - Show Token Form
  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
            <Globe size={32} className="text-white" />
          </div>
          <h3 className="text-2xl font-black tracking-tighter uppercase">Conectar Instagram</h3>
          <p className="text-sm text-white/40 mt-2 max-w-md mx-auto">
            {needsIgaaToken 
              ? 'El token EAA fue guardado para publicidad. Ahora pegá tu token de Instagram (IGAA) para completar la conexión.'
              : 'Conectá la cuenta de Instagram de tu cliente para gestionar contenido y ver estadísticas en tiempo real.'}
          </p>
        </div>

        {needsIgaaToken && (
          <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mb-6">
            <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-emerald-200/80 font-bold">Token EAA guardado para publicidad ✓</p>
              <p className="text-xs text-emerald-200/50 mt-1">
                Ahora pegá el token de Instagram (empieza con <strong>IGAA...</strong>) para ver el perfil, posts y estadísticas. 
                Lo podés obtener desde Meta &gt; Instagram &gt; API &gt; Generar token.
              </p>
            </div>
          </div>
        )}

        {tokenExpired && (
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-6">
            <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-200/80">
              El token anterior expiró. Ingresá uno nuevo para reconectar.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl mb-6">
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <pre className="text-sm text-red-200/80 whitespace-pre-wrap font-sans">{error}</pre>
          </div>
        )}

        <form onSubmit={handleConnect} className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 lg:p-8 space-y-6">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-2">
                {needsIgaaToken ? 'Token de Instagram (IGAA)' : 'Token de Acceso de Meta'}
              </label>
              <textarea
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={needsIgaaToken 
                  ? "Pegá acá el token IGAA de Instagram..."
                  : "Pegá acá el token de acceso (IGAA o EAA)..."}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/20 outline-none focus:border-[hsl(76,85%,67%)]/50 transition-colors resize-none font-mono"
              />
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">
                {needsIgaaToken ? 'Cómo obtener el token IGAA' : 'Tokens aceptados'}
              </p>
              {needsIgaaToken ? (
                <ol className="space-y-2 text-xs text-white/50 list-decimal list-inside">
                  <li>Ir a <strong className="text-white/70">developers.facebook.com</strong> &gt; tu app</li>
                  <li>En el menú izquierdo: <strong className="text-white/70">Instagram</strong> &gt; <strong className="text-white/70">API setup with Instagram Login</strong></li>
                  <li>Click en <strong className="text-white/70">Generate token</strong> para la cuenta de Instagram</li>
                  <li>Copiá el token (empieza con <strong className="text-white/70">IGAA...</strong>)</li>
                </ol>
              ) : (
                <ul className="space-y-2 text-xs text-white/50">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-[hsl(76,85%,67%)]/40 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-white/70">IGAA...</strong> (Instagram) — Perfil, posts, estadísticas. Si tenés ads se piden después.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-blue-400/40 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-white/70">EAA...</strong> (Facebook) — Si la cuenta está vinculada a una Page, todo con un token. Si no, se guarda para ads y se pide IGAA.</span>
                  </li>
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={!accessToken.trim() || isConnecting}
              className={`w-full py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                accessToken.trim() && !isConnecting
                  ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:shadow-lg hover:shadow-pink-500/20 hover:scale-[1.02]'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              {isConnecting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Link2 size={16} />
                  {needsIgaaToken ? 'Conectar con IGAA' : 'Conectar Instagram'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Connected - Show Dashboard
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      {profile && (
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 lg:p-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5">
              {profile.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt={profile.username}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                  <Globe size={28} className="text-white" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black tracking-tighter">@{profile.username}</h3>
                  <CheckCircle2 size={16} className="text-[hsl(76,85%,67%)]" />
                </div>
                {profile.name && (
                  <p className="text-sm text-white/50">{profile.name}</p>
                )}
                {profile.biography && (
                  <p className="text-xs text-white/30 mt-1 max-w-md truncate">{profile.biography}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={refreshAll}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/70 transition-all"
                title="Actualizar"
              >
                <RefreshCcw size={16} />
              </button>
              <a
                href={`https://instagram.com/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/70 transition-all"
                title="Ver en Instagram"
              >
                <ExternalLink size={16} />
              </a>
              <button
                onClick={handleDisconnect}
                className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all"
                title="Desconectar"
              >
                <Unlink size={16} />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black tracking-tighter">{formatNumber(profile.followers_count)}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mt-1">Seguidores</p>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black tracking-tighter">{formatNumber(profile.follows_count)}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mt-1">Siguiendo</p>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black tracking-tighter">{formatNumber(profile.media_count)}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mt-1">Publicaciones</p>
            </div>
          </div>
        </div>
      )}

      {/* Section Toggle */}
      <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-full w-fit">
        {([
          { id: 'posts', label: 'Publicaciones' },
          { id: 'insights', label: 'Estadísticas' },
          { id: 'ads', label: 'Publicidad' },
        ] as const).map((sec) => (
          <button
            key={sec.id}
            onClick={() => {
              setActiveSection(sec.id);
              if (sec.id === 'insights' && insights.length === 0) loadInsights();
              if (sec.id === 'ads' && !adsData) loadAds();
            }}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              activeSection === sec.id
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-200/80">{error}</p>
        </div>
      )}

      {/* Posts Grid */}
      {activeSection === 'posts' && (
        <div>
          {media.length === 0 && !isLoadingMedia ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ImageIcon size={32} className="text-white/10" />
              <p className="text-sm text-white/30">No se encontraron publicaciones</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {media.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openMediaDetail(item)}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02]"
                  >
                    <img
                      src={item.media_type === 'VIDEO' ? (item.thumbnail_url || '') : item.media_url}
                      alt={item.caption?.substring(0, 50) || 'Post'}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1.5 text-white text-sm font-bold">
                        <Heart size={16} /> {formatNumber(item.like_count)}
                      </div>
                      <div className="flex items-center gap-1.5 text-white text-sm font-bold">
                        <MessageCircle size={16} /> {formatNumber(item.comments_count)}
                      </div>
                    </div>
                    {/* Media type badge */}
                    {item.media_type !== 'IMAGE' && (
                      <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 text-[9px] uppercase tracking-wider font-bold text-white/80">
                        {item.media_type === 'VIDEO' ? '▶ Video' : '◫ Carrusel'}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Load More */}
              {mediaNextCursor && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => loadMedia(mediaNextCursor)}
                    disabled={isLoadingMedia}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/50 hover:text-white/80 transition-all uppercase tracking-widest font-bold"
                  >
                    {isLoadingMedia ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                    Cargar más
                  </button>
                </div>
              )}

              {isLoadingMedia && media.length === 0 && (
                <div className="flex justify-center py-16">
                  <Loader2 size={24} className="animate-spin text-white/20" />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Insights */}
      {activeSection === 'insights' && (
        <div className="space-y-6">
          {isLoadingInsights ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin text-[hsl(76,85%,67%)]" />
              <p className="text-sm text-white/30 uppercase tracking-widest">Cargando estadísticas...</p>
            </div>
          ) : insights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <BarChart3 size={32} className="text-white/10" />
              <p className="text-sm text-white/30">No hay datos de estadísticas disponibles</p>
              {insightsApiErrors.length > 0 ? (
                <div className="max-w-md w-full mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
                  <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-1">Mensaje de la API de Meta</p>
                  {insightsApiErrors.map((e, i) => (
                    <p key={i} className="text-xs text-amber-200/80">{e}</p>
                  ))}
                  <p className="text-[10px] text-amber-200/40 mt-2">
                    Verificá que el token IGAA tenga el permiso <strong>instagram_manage_insights</strong>, que la cuenta sea Business/Creator (no personal) y que esté vinculada a una Página de Facebook.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-white/20">Las estadísticas requieren una cuenta Business con al menos 100 seguidores.</p>
              )}
            </div>
          ) : (
            <>
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((metric) => {
                  // IG v21: aggregated metrics return { total_value: { value } } and have no `values` array.
                  // Time-series metrics (reach, follower_count) still return `values: [{ value, end_time }]`.
                  const values: Array<{ value: number; end_time?: string }> = Array.isArray(metric.values) ? metric.values : [];
                  const hasTotalValue = typeof metric.total_value?.value === 'number';
                  const total = hasTotalValue
                    ? metric.total_value!.value
                    : values.reduce((sum: number, v: any) => sum + (v.value || 0), 0);
                  const avg = values.length > 0
                    ? Math.round(total / values.length)
                    : total;
                  const metricIcons: Record<string, any> = {
                    reach: <Users size={18} />,
                    follower_count: <UserPlus size={18} />,
                    follows_and_unfollows: <UserCheck size={18} />,
                    profile_views: <Eye size={18} />,
                    profile_links_taps: <LinkIcon size={18} />,
                    accounts_engaged: <Target size={18} />,
                    total_interactions: <TrendingUp size={18} />,
                    likes: <Heart size={18} />,
                    comments: <MessageCircle size={18} />,
                    shares: <Share2 size={18} />,
                    saves: <Bookmark size={18} />,
                    replies: <Reply size={18} />,
                  };

                  // follower_count is cumulative, show last value instead of total
                  const isFollowerCount = metric.name === 'follower_count';
                  const displayTotal = isFollowerCount
                    ? values[values.length - 1]?.value || 0
                    : total;
                  const displayAvg = isFollowerCount
                    ? (values.length >= 2
                        ? (values[values.length - 1]?.value || 0) - (values[0]?.value || 0)
                        : 0)
                    : avg;
                  const avgLabel = isFollowerCount ? 'Cambio en 30d' : 'Promedio diario';
                  const totalLabel = isFollowerCount ? 'Actual' : 'Total';

                  return (
                    <div key={metric.name} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-[hsl(76,85%,67%)]/10 flex items-center justify-center text-[hsl(76,85%,67%)]">
                          {metricIcons[metric.name] || <BarChart3 size={18} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold capitalize">{metricLabelsEs[metric.name] || metric.title}</p>
                          <p className="text-[9px] text-white/30 uppercase tracking-widest">Últimos 30 días</p>
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-black tracking-tighter">{formatNumber(displayTotal)}</p>
                          <p className="text-[10px] text-white/40">{totalLabel}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-base font-bold ${isFollowerCount && displayAvg > 0 ? 'text-emerald-400' : isFollowerCount && displayAvg < 0 ? 'text-red-400' : 'text-white/60'}`}>
                            {isFollowerCount && displayAvg > 0 ? '+' : ''}{formatNumber(displayAvg)}
                          </p>
                          <p className="text-[10px] text-white/30">{avgLabel}</p>
                        </div>
                      </div>
                      {/* Mini bar chart — only for time-series metrics that include daily values */}
                      {values.length > 0 && (
                        <div className="flex items-end gap-[2px] mt-3 h-10 group/chart">
                          {values.slice(-30).map((v: any, i: number) => {
                            const max = Math.max(...values.map((x: any) => x.value || 0), 1);
                            const height = ((v.value || 0) / max) * 100;
                            const dateLabel = v.end_time
                              ? new Date(v.end_time).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
                              : null;
                            return (
                              <div
                                key={i}
                                className="relative flex-1 group/bar"
                                style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}
                              >
                                <div
                                  className="w-full bg-[hsl(76,85%,67%)]/30 rounded-t-sm min-h-[2px] transition-all group-hover/bar:bg-[hsl(76,85%,67%)]/70"
                                  style={{ height: `${Math.max(height, 4)}%` }}
                                />
                                {/* Tooltip */}
                                {(v.value || 0) > 0 && (
                                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/bar:flex flex-col items-center z-20">
                                    <div className="bg-[#1a1a1a] border border-white/15 rounded-lg px-2 py-1 text-center shadow-xl whitespace-nowrap">
                                      <p className="text-xs font-bold text-white leading-tight">{formatNumber(v.value || 0)}</p>
                                      {dateLabel && <p className="text-[9px] text-white/40 leading-tight">{dateLabel}</p>}
                                    </div>
                                    <div className="w-1.5 h-1.5 bg-[#1a1a1a] border-r border-b border-white/15 rotate-45 -mt-[5px]" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Demographics — shape is now { age:[], gender:[], city:[], country:[] } keyed by breakdown */}
              {demographics && Object.keys(demographics).length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users size={16} className="text-[hsl(76,85%,67%)]" /> Demografía de Seguidores
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(demographics as Record<string, any[]>).map(([breakdown, results]) => {
                      const label =
                        breakdown === 'city' ? 'Por Ciudad' :
                        breakdown === 'country' ? 'Por País' :
                        breakdown === 'age' ? 'Por Edad' :
                        breakdown === 'gender' ? 'Por Género' : breakdown;
                      const list = Array.isArray(results) ? results : [];
                      const maxVal = Math.max(...list.map((r: any) => r.value || 0), 1);
                      return (
                        <div key={breakdown}>
                          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">{label}</p>
                          <div className="space-y-2">
                            {list
                              .slice()
                              .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
                              .slice(0, 8)
                              .map((item: any, i: number) => {
                                const pct = ((item.value || 0) / maxVal) * 100;
                                return (
                                  <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs text-white/50 w-20 truncate">{item.dimension_values?.[0] || '?'}</span>
                                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-[hsl(76,85%,67%)]/50 rounded-full"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-white/40 w-12 text-right">{formatNumber(item.value || 0)}</span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Ads / Publicidad */}
      {activeSection === 'ads' && (
        <div className="space-y-6">
          {isLoadingAds ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin text-[hsl(76,85%,67%)]" />
              <p className="text-sm text-white/30 uppercase tracking-widest">Cargando datos de publicidad...</p>
            </div>
          ) : adAccountChoices ? (
            /* Ad Account Selector — must render BEFORE !hasAdsToken so it shows after a multi-account response */
            <div className="max-w-xl mx-auto py-8 space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <Megaphone size={24} className="text-white/40" />
                </div>
                <h4 className="text-base font-bold mb-1">Elegí la cuenta publicitaria</h4>
                <p className="text-xs text-white/40">Tu token tiene acceso a varias. Seleccioná con cuál querés trabajar para este proyecto.</p>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {adAccountChoices.map((acc) => {
                  const statusLabel = acc.status === 1 ? 'Activa' : acc.status === 2 ? 'Deshabilitada' : acc.status === 3 ? 'Pendiente' : `Estado ${acc.status}`;
                  const statusColor = acc.status === 1 ? 'text-emerald-400' : 'text-amber-400';
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => (pendingAdsToken ? connectAdsToken(acc.id) : switchAdAccount(acc.id))}
                      disabled={isConnectingAds || isSwitchingAccount}
                      className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 rounded-xl p-4 transition-all disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate">{acc.name}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">
                            {acc.id} · {acc.currency} · <span className={statusColor}>{statusLabel}</span>
                          </p>
                        </div>
                        <Link2 size={14} className="text-white/30 flex-shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => { setAdAccountChoices(null); setPendingAdsToken(''); }}
                className="w-full py-2 text-xs text-white/40 hover:text-white/70 uppercase tracking-widest font-bold"
              >
                Cancelar
              </button>
            </div>
          ) : !hasAdsToken ? (
            /* Connect Ads Token Form */
            <div className="flex flex-col items-center justify-center py-12 gap-5 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center">
                <Megaphone size={28} className="text-white/30" />
              </div>
              <div className="text-center">
                <h4 className="text-base font-bold mb-1">Conectar Meta Ads</h4>
                <p className="text-xs text-white/40 leading-relaxed">
                  Para ver estadísticas de publicidad necesitás un token de Facebook con permiso <strong className="text-white/60">ads_read</strong>.
                </p>
              </div>

              <div className="w-full space-y-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white/40 space-y-2">
                  <p className="font-bold text-white/60">¿Cómo obtener el token?</p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>Ir a <span className="text-[hsl(76,85%,67%)]">developers.facebook.com/tools/explorer</span></li>
                    <li>Seleccioná tu app de Meta</li>
                    <li>En &quot;User or Page&quot; elegí <strong className="text-white/60">User Token</strong></li>
                    <li>Agregá permisos: <strong className="text-white/60">ads_read</strong>, <strong className="text-white/60">business_management</strong></li>
                    <li>Click en <strong className="text-white/60">Generate Access Token</strong></li>
                    <li>Copiá el token (empieza con <strong className="text-white/60">EAA...</strong>)</li>
                  </ol>
                </div>

                <input
                  type="password"
                  placeholder="Pegá tu token de Facebook Ads (EAA...)"
                  value={adsTokenInput}
                  onChange={(e) => setAdsTokenInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20 focus:outline-none focus:border-[hsl(76,85%,67%)]/30 transition-colors"
                />

                {adsError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-300">{adsError}</p>
                  </div>
                )}

                <button
                  onClick={() => connectAdsToken()}
                  disabled={!adsTokenInput.trim() || isConnectingAds}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-bold uppercase tracking-widest disabled:opacity-30 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  {isConnectingAds ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                  Conectar Publicidad
                </button>
              </div>
            </div>
          ) : adsError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Megaphone size={32} className="text-white/10" />
              <p className="text-sm text-white/30 text-center max-w-md">{adsError}</p>
              <div className="flex gap-2">
                <button
                  onClick={loadAds}
                  className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/50 hover:text-white/80 transition-all uppercase tracking-widest font-bold"
                >
                  Reintentar
                </button>
                <button
                  onClick={disconnectAdsToken}
                  className="px-6 py-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs text-red-400 transition-all uppercase tracking-widest font-bold"
                >
                  Desconectar
                </button>
              </div>
            </div>
          ) : !adsData?.adAccount ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Megaphone size={32} className="text-white/10" />
              <p className="text-sm text-white/30">No se encontraron cuentas publicitarias</p>
              <p className="text-xs text-white/20">Asegurate de que la cuenta tenga una cuenta publicitaria de Meta activa.</p>
            </div>
          ) : (
            <>
              {/* Ad Account Header */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Megaphone size={22} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-black tracking-tighter">{adsData.adAccount.name}</h4>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">
                        {adsData.adAccount.currency} · Cuenta Publicitaria
                        {adsData.adAccount.status === 2 && <span className="ml-2 text-amber-400">(Deshabilitada)</span>}
                        {adsData.adAccount.status === 3 && <span className="ml-2 text-amber-400">(Pendiente)</span>}
                        {adsData.adAccount.status === 1 && <span className="ml-2 text-emerald-400">(Activa)</span>}
                      </p>
                      {(adsData.adAccount.amount_spent || adsData.adAccount.balance) && (
                        <div className="flex gap-3 mt-1">
                          {adsData.adAccount.amount_spent && (
                            <span className="text-[10px] text-white/30">Total gastado: <strong className="text-white/60">${(parseFloat(adsData.adAccount.amount_spent) / 100).toLocaleString('es-AR')}</strong></span>
                          )}
                          {adsData.adAccount.balance && (
                            <span className="text-[10px] text-white/30">Balance: <strong className="text-white/60">${(parseFloat(adsData.adAccount.balance) / 100).toLocaleString('es-AR')}</strong></span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={openAccountSwitcher}
                    disabled={isSwitchingAccount}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/70 transition-all disabled:opacity-50"
                    title="Cambiar cuenta publicitaria"
                  >
                    {isSwitchingAccount ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                  </button>
                  <button
                    onClick={loadAds}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/70 transition-all"
                    title="Actualizar"
                  >
                    <RefreshCcw size={16} />
                  </button>
                  {adsData.adAccount.id && (
                    <a
                      href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adsData.adAccount.id.replace('act_', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-xs text-blue-400 hover:text-blue-300 transition-all font-bold uppercase tracking-widest"
                      title="Ver campañas en Meta Ads Manager"
                    >
                      <ExternalLink size={13} /> Meta Ads
                    </a>
                  )}
                  <button
                    onClick={disconnectAdsToken}
                    className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all"
                    title="Desconectar publicidad"
                  >
                    <Unlink size={16} />
                  </button>
                </div>

                {/* Summary Stats */}
                {adsData.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                    {[
                      { label: 'Invertido', value: `$${parseFloat(adsData.summary.spend || 0).toLocaleString('es-AR')}`, icon: <DollarSign size={16} /> },
                      { label: 'Alcance', value: formatNumber(parseInt(adsData.summary.reach || 0)), icon: <Users size={16} /> },
                      { label: 'Impresiones', value: formatNumber(parseInt(adsData.summary.impressions || 0)), icon: <Eye size={16} /> },
                      { label: 'Clicks', value: formatNumber(parseInt(adsData.summary.clicks || 0)), icon: <MousePointerClick size={16} /> },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-white/30 mb-1">{stat.icon}</div>
                        <p className="text-lg font-black tracking-tighter">{stat.value}</p>
                        <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {adsData.summary && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                      <p className="text-base font-bold text-[hsl(76,85%,67%)]">${parseFloat(adsData.summary.cpc || 0).toFixed(2)}</p>
                      <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold">CPC</p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                      <p className="text-base font-bold text-[hsl(76,85%,67%)]">${parseFloat(adsData.summary.cpm || 0).toFixed(2)}</p>
                      <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold">CPM</p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                      <p className="text-base font-bold text-[hsl(76,85%,67%)]">{parseFloat(adsData.summary.ctr || 0).toFixed(2)}%</p>
                      <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold">CTR</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Campaigns */}
              {adsData.campaigns?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Target size={16} className="text-[hsl(76,85%,67%)]" /> Campañas ({adsData.campaigns.length})
                  </h4>
                  <div className="space-y-3">
                    {adsData.campaigns.map((campaign: any) => {
                      const ins = campaign.insights?.data?.[0];
                      return (
                        <div key={campaign.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                            <div>
                              <h5 className="text-sm font-bold">{campaign.name}</h5>
                              <div className="flex items-center gap-3 mt-1">
                                <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${
                                  campaign.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                                  campaign.status === 'PAUSED' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-white/10 text-white/40'
                                }`}>
                                  {campaign.status === 'ACTIVE' ? 'Activa' : campaign.status === 'PAUSED' ? 'Pausada' : campaign.status}
                                </span>
                                {campaign.objective && (
                                  <span className="text-[9px] text-white/30 uppercase tracking-widest">
                                    {campaign.objective.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {ins && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
                              {[
                                { label: 'Gastado', value: `$${parseFloat(ins.spend || 0).toLocaleString('es-AR')}` },
                                { label: 'Alcance', value: formatNumber(parseInt(ins.reach || 0)) },
                                { label: 'Impresiones', value: formatNumber(parseInt(ins.impressions || 0)) },
                                { label: 'Clicks', value: formatNumber(parseInt(ins.clicks || 0)) },
                                { label: 'CTR', value: `${parseFloat(ins.ctr || 0).toFixed(2)}%` },
                              ].map((s, i) => (
                                <div key={i} className="bg-white/[0.03] rounded-xl p-2.5 text-center">
                                  <p className="text-sm font-bold">{s.value}</p>
                                  <p className="text-[8px] uppercase tracking-widest text-white/30">{s.label}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {ins?.actions && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {ins.actions.slice(0, 6).map((action: any, i: number) => (
                                <span key={i} className="text-[10px] bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-white/50">
                                  {action.action_type?.replace(/_/g, ' ')}: <strong className="text-white/80">{formatNumber(parseInt(action.value || 0))}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Individual Ads */}
              {adsData.ads?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ImageIcon size={16} className="text-[hsl(76,85%,67%)]" /> Anuncios en Instagram ({adsData.ads.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {adsData.ads.map((ad: any) => {
                      const ins = ad.insights?.data?.[0];
                      return (
                        <div key={ad.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4">
                          {ad.creative?.thumbnail_url && (
                            <img src={ad.creative.thumbnail_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{ad.name}</p>
                            <span className={`text-[8px] uppercase tracking-widest font-bold ${
                              ad.status === 'ACTIVE' ? 'text-emerald-400' : 'text-white/30'
                            }`}>
                              {ad.status === 'ACTIVE' ? 'Activo' : ad.status}
                            </span>
                            {ins && (
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                                <span className="text-[10px] text-white/50">💰 ${parseFloat(ins.spend || 0).toFixed(0)}</span>
                                <span className="text-[10px] text-white/50">👁 {formatNumber(parseInt(ins.impressions || 0))}</span>
                                <span className="text-[10px] text-white/50">🖱 {formatNumber(parseInt(ins.clicks || 0))}</span>
                                <span className="text-[10px] text-white/50">📈 {parseFloat(ins.ctr || 0).toFixed(2)}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state when no campaigns, no ads and no summary */}
              {!adsData.summary && !adsData.campaigns?.length && !adsData.ads?.length && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <Target size={28} className="text-white/10" />
                  <p className="text-sm text-white/30">No se encontraron campañas ni anuncios en los últimos 30 días</p>
                  <p className="text-xs text-white/20 max-w-md">
                    Esto puede pasar si la cuenta publicitaria es de solo lectura, no tiene campañas activas, 
                    o no tiene anuncios publicados en Instagram recientemente.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Media Detail Modal */}
      {selectedMedia && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => { setSelectedMedia(null); setMediaInsights(null); }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
            {/* Image / Carousel */}
            <div className="md:w-1/2 md:max-h-[90vh] aspect-square flex-shrink-0 bg-black relative overflow-hidden">
              {selectedMedia.media_type === 'CAROUSEL_ALBUM' && carouselChildren.length > 0 ? (
                <>
                  {/* Slide wrapper — animates in from left or right based on nav direction */}
                  <div
                    key={carouselIndex}
                    className={`w-full h-full ${carouselDir === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
                  >
                    {carouselChildren[carouselIndex]?.media_type === 'VIDEO' ? (
                      <video
                        src={carouselChildren[carouselIndex].media_url}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        src={carouselChildren[carouselIndex].media_url}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  {/* Carousel Navigation */}
                  {carouselChildren.length > 1 && (
                    <>
                      <button
                        onClick={() => { setCarouselDir('left'); setCarouselIndex((prev) => (prev - 1 + carouselChildren.length) % carouselChildren.length); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all z-10"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => { setCarouselDir('right'); setCarouselIndex((prev) => (prev + 1) % carouselChildren.length); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all z-10"
                      >
                        <ChevronRight size={16} />
                      </button>
                      {/* Dots indicator */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {carouselChildren.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCarouselIndex(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i === carouselIndex ? 'bg-white w-3' : 'bg-white/40'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : selectedMedia.media_type === 'CAROUSEL_ALBUM' && isLoadingCarousel ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-white/30" />
                </div>
              ) : selectedMedia.media_type === 'VIDEO' ? (
                <video
                  src={selectedMedia.media_url}
                  controls
                  className="w-full h-full object-contain"
                  poster={selectedMedia.thumbnail_url}
                />
              ) : (
                <img
                  src={selectedMedia.media_url}
                  alt=""
                  className="w-full h-full object-contain"
                />
              )}
              {/* Carousel badge */}
              {selectedMedia.media_type === 'CAROUSEL_ALBUM' && carouselChildren.length > 0 && (
                <div className="absolute top-3 right-3 bg-black/60 border border-white/20 rounded-lg px-2 py-1 text-[10px] text-white/70 font-bold">
                  {carouselIndex + 1} / {carouselChildren.length}
                </div>
              )}
            </div>

            {/* Info Panel */}
            <div className="md:w-1/2 flex flex-col min-h-0 overflow-hidden">
              {/* Header */}
              <div className="p-5 pb-3 border-b border-white/10">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Heart size={14} className="text-red-400" />
                    <span className="font-bold">{formatNumber(selectedMedia.like_count)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MessageCircle size={14} className="text-blue-400" />
                    <span className="font-bold">{formatNumber(selectedMedia.comments_count)}</span>
                  </div>
                  {selectedMedia.media_type === 'CAROUSEL_ALBUM' && (
                    <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-white/50 uppercase tracking-widest font-bold">
                      Carrusel
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/30">
                  {new Date(selectedMedia.timestamp).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[hsl(76,85%,67%)]/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[hsl(76,85%,67%)]/70">
                {/* Post Insights */}
                {!mediaInsights && !isLoadingMediaInsights && (
                  <button
                    onClick={() => loadMediaInsights(selectedMedia.id, selectedMedia.media_type)}
                    className="px-4 py-2 rounded-xl bg-[hsl(76,85%,67%)]/10 border border-[hsl(76,85%,67%)]/20 text-xs text-[hsl(76,85%,67%)] hover:bg-[hsl(76,85%,67%)]/20 transition-all uppercase tracking-widest font-bold flex items-center gap-2 w-fit"
                  >
                    <BarChart3 size={12} /> Ver métricas del post
                  </button>
                )}
                {isLoadingMediaInsights && (
                  <div className="flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-[hsl(76,85%,67%)]" />
                    <span className="text-[10px] text-white/30 uppercase tracking-widest">Cargando métricas...</span>
                  </div>
                )}
                {mediaInsights && (
                  mediaInsights.error ? (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-300">{mediaInsights.error}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(mediaInsights).map(([key, val]) => (
                        <div key={key} className="bg-white/5 rounded-xl p-2.5 text-center">
                          <p className="text-sm font-bold">{formatNumber(val as number)}</p>
                          <p className="text-[8px] uppercase tracking-widest text-white/30">{metricLabelsEs[key] || key.replace(/_/g, ' ')}</p>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Caption */}
                {selectedMedia.caption && (
                  <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                    {selectedMedia.caption}
                  </p>
                )}

                {/* Comments Section */}
                <div className="border-t border-white/10 pt-4">
                  <h5 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3 flex items-center gap-2">
                    <MessageCircle size={12} /> Comentarios ({comments.length})
                  </h5>
                  {isLoadingComments ? (
                    <div className="flex items-center gap-2 py-4">
                      <Loader2 size={12} className="animate-spin text-white/30" />
                      <span className="text-[10px] text-white/30 uppercase tracking-widest">Cargando comentarios...</span>
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-xs text-white/20 py-2">No hay comentarios en este post.</p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {comments.map((comment: any) => (
                        <div key={comment.id} className="space-y-2">
                          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-white/80">@{comment.username}</span>
                              <div className="flex items-center gap-2">
                                {comment.like_count > 0 && (
                                  <span className="flex items-center gap-1 text-[10px] text-white/30">
                                    <Heart size={10} /> {comment.like_count}
                                  </span>
                                )}
                                <span className="text-[10px] text-white/20">
                                  {new Date(comment.timestamp).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-white/60 leading-relaxed">{comment.text}</p>
                          </div>
                          {/* Replies */}
                          {comment.replies?.data?.length > 0 && (
                            <div className="ml-4 space-y-2">
                              {comment.replies.data.map((reply: any) => (
                                <div key={reply.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold text-[hsl(76,85%,67%)]/70">@{reply.username}</span>
                                    <div className="flex items-center gap-2">
                                      {reply.like_count > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] text-white/30">
                                          <Heart size={10} /> {reply.like_count}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-white/20">
                                        {new Date(reply.timestamp).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-white/50 leading-relaxed">{reply.text}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-5 pt-3 border-t border-white/10 flex gap-2">
                <a
                  href={selectedMedia.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/50 hover:text-white/80 transition-all uppercase tracking-widest font-bold"
                >
                  <ExternalLink size={12} /> Ver en Instagram
                </a>
                <button
                  onClick={() => { setSelectedMedia(null); setMediaInsights(null); }}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/50 hover:text-white/80 transition-all uppercase tracking-widest font-bold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
