import React, { useEffect, useRef, useState } from 'react';
import type { Channel } from './mockData';
import shaka from 'shaka-player/dist/shaka-player.ui.js';
import Hls from 'hls.js';
import { Maximize, Minimize, Volume2, VolumeX, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface PlayerProps {
  channel: Channel;
  hideOverlay?: boolean;
}

// Detect iOS device
const IS_IOS = typeof navigator !== 'undefined' && (
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);

// Detect all mobile devices (iOS, Android, small screens)
const IS_MOBILE = typeof navigator !== 'undefined' && (
  IS_IOS || /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (typeof window !== 'undefined' && window.innerWidth <= 768)
);

// Detect if running inside Capacitor Android native app or standalone APK
const IS_NATIVE_APP = typeof window !== 'undefined' && (
  Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
  window.location.protocol === 'capacitor:' ||
  window.location.protocol === 'file:' ||
  (window.location.hostname === 'localhost' && window.location.port !== '5173')
);

export const getProxyBaseUrl = (): string => {
  // 1. Dynamic edge proxy configured in client browser/STB
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('custom_edge_proxy');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/$/, '');
    }
  }

  // 2. Build-time environment variable (e.g. set in Vercel settings)
  const envProxy = (import.meta as any).env?.VITE_STREAM_PROXY_URL;
  if (envProxy && envProxy.trim()) {
    return envProxy.trim().replace(/\/$/, '');
  }

  // 3. Native Capacitor / APK environment
  if (IS_NATIVE_APP) {
    return 'https://ssatvlive.vercel.app';
  }

  // 4. Default to current host
  return window.location.origin;
};

export const Player: React.FC<PlayerProps> = ({ channel, hideOverlay = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlayControls, setShowOverlayControls] = useState(true);
  const hideControlsTimerRef = useRef<any>(null);

  // Apple TV Player State (Gambar 2)
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubtitlesModal, setShowSubtitlesModal] = useState(false);
  const [subtitlesTab, setSubtitlesTab] = useState<'subtitles' | 'audio'>('subtitles');
  const [availableTextTracks, setAvailableTextTracks] = useState<any[]>([]);
  const [availableAudioTracks, setAvailableAudioTracks] = useState<any[]>([]);
  const [activeTextTrackId, setActiveTextTrackId] = useState<number | null>(null);
  const [activeAudioTrackId, setActiveAudioTrackId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isVodStream = channel.category === 'VOD' || channel.category === 'MOVIES' || channel.category === 'SERIES';

  const playerRef = useRef<shaka.Player | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const toggleFullscreen = () => {
    const container = videoContainerRef.current;
    const video = videoRef.current;
    if (!container) return;

    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if (video && (video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen();
      }
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitFullscreenElement && (document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
      } catch (err) {
        console.warn('Player exitFullscreen error:', err);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  const resetHideTimer = () => {
    setShowOverlayControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    // Only auto-hide if subtitles/audio modal is NOT open
    if (!showSubtitlesModal) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowOverlayControls(false);
      }, 3500);
    }
  };

  // Keep controls persistently visible when subtitles modal is open
  useEffect(() => {
    if (showSubtitlesModal) {
      setShowOverlayControls(true);
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    } else {
      resetHideTimer();
    }
  }, [showSubtitlesModal]);

  // Global pointer activity tracking during fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handlePointerActivity = () => {
      resetHideTimer();
    };

    window.addEventListener('mousemove', handlePointerActivity, { passive: true });
    window.addEventListener('touchstart', handlePointerActivity, { passive: true });
    window.addEventListener('pointermove', handlePointerActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handlePointerActivity);
      window.removeEventListener('touchstart', handlePointerActivity);
      window.removeEventListener('pointermove', handlePointerActivity);
    };
  }, [isFullscreen, showSubtitlesModal]);

  useEffect(() => {
    if (hideOverlay) {
      setIsFullscreen(false);
      return;
    }
    const handleFsChange = () => {
      const fsEl = document.fullscreenElement || (document as any).webkitFullscreenElement;
      const isTarget = fsEl && (fsEl === videoContainerRef.current || videoContainerRef.current?.contains(fsEl));
      setIsFullscreen(Boolean(isTarget));
      resetHideTimer();
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, [hideOverlay]);

  useEffect(() => {
    if (hideOverlay) return; // Embedded view handles its own keyboard navigation and shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      const key = e.key.toLowerCase();
      const code = e.keyCode || e.which;

      resetHideTimer();

      // 'F' / 'f' -> Toggle Fullscreen
      if (key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
      // 'M' / 'm' -> Toggle Mute
      else if (key === 'm') {
        e.preventDefault();
        toggleMute();
      }
      // Space or Enter on container -> Fullscreen
      else if (key === ' ' || key === 'enter' || code === 13) {
        if (document.activeElement === videoContainerRef.current) {
          e.preventDefault();
          toggleFullscreen();
        }
      }
      // Escape / Back Key (Remote Back KeyCode 4 or 27)
      else if (key === 'escape' || code === 27 || code === 4) {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          e.preventDefault();
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to video element playback events for real-time Apple TV UI updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);

  const refreshTracks = () => {
    const p = playerRef.current;
    if (!p) return;
    try {
      const textTracks = (p as any).getTextTracks ? (p as any).getTextTracks() : [];
      setAvailableTextTracks(textTracks);
      const isVisible = typeof (p as any).isTextTrackVisible === 'function' ? (p as any).isTextTrackVisible() : false;
      if (!isVisible) {
        setActiveTextTrackId(null);
      } else {
        const active = textTracks.find((t: any) => t.active);
        setActiveTextTrackId(active ? active.id : null);
      }

      const audioTracks = (p.getVariantTracks() || []).filter((v: any) => v.type === 'variant');
      setAvailableAudioTracks(audioTracks);
      const activeAudio = audioTracks.find((a: any) => a.active);
      setActiveAudioTrackId(activeAudio ? activeAudio.id : null);
    } catch {}
  };

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    resetHideTimer();
  };

  const handleRewind10 = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, (video.currentTime || 0) - 10);
    resetHideTimer();
  };

  const handleForward10 = () => {
    const video = videoRef.current;
    if (!video) return;
    const maxTime = video.duration && isFinite(video.duration) ? video.duration : (video.currentTime || 0) + 10;
    video.currentTime = Math.min(maxTime, (video.currentTime || 0) + 10);
    resetHideTimer();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const target = parseFloat(e.target.value);
    video.currentTime = target;
    setCurrentTime(target);
    resetHideTimer();
  };

  const handleTogglePip = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      }
    } catch {}
    resetHideTimer();
  };

  const handleToggleAirplay = () => {
    const video = videoRef.current as any;
    if (video && video.webkitShowPlaybackTargetPicker) {
      video.webkitShowPlaybackTargetPicker();
    }
    resetHideTimer();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: channel.name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage('Pautan telah disalin ke papan keratan');
      setTimeout(() => setToastMessage(null), 2500);
    }
    resetHideTimer();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    video.muted = val === 0;
    setVolume(val);
    setIsMuted(val === 0);
    resetHideTimer();
  };

  const handleSelectSubtitle = (trackId: number | 'off') => {
    const p = playerRef.current;
    if (!p) return;
    if (trackId === 'off') {
      if (typeof (p as any).setTextTrackVisibility === 'function') {
        (p as any).setTextTrackVisibility(false);
      }
      setActiveTextTrackId(null);
    } else {
      const track = availableTextTracks.find((t) => t.id === trackId);
      if (track) {
        p.selectTextTrack(track);
        if (typeof (p as any).setTextTrackVisibility === 'function') {
          (p as any).setTextTrackVisibility(true);
        }
        setActiveTextTrackId(track.id);
      }
    }
  };

  const handleSelectAudio = (variantId: number) => {
    const p = playerRef.current;
    if (!p) return;
    const track = availableAudioTracks.find((a) => a.id === variantId);
    if (track) {
      p.selectVariantTrack(track, true);
      setActiveAudioTrackId(track.id);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatRemaining = (cur: number, dur: number) => {
    if (!dur || isNaN(dur) || !isFinite(dur)) return '';
    const rem = Math.max(0, dur - cur);
    return `-${formatTime(rem)}`;
  };

  const cleanupPlayers = async () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (playerRef.current) {
      await playerRef.current.destroy();
      playerRef.current = null;
    }
  };

  useEffect(() => {
    let isCancelled = false;
    let stallCheckInterval: any = null;
    let currentCleanUrl = '';
    setEngineError(null);

    const initStream = async () => {
      if (!videoRef.current || !videoContainerRef.current) return;
      await cleanupPlayers();
      if (isCancelled) return;

      const video = videoRef.current;
      const container = videoContainerRef.current;

      const PROXY_MAP: [string, string][] = [
        ['https://linearjitp-playback.astro.com.my/', '/astro-linear/'],
        ['http://linearjitp-playback.astro.com.my/', '/astro-linear/'],
        ['https://vodejitp-asset-playback-b.astro.com.my/', '/astro-vod/'],
        ['http://vodejitp-asset-playback-b.astro.com.my/', '/astro-vod/'],
        ['https://vod-dai-ott-ap.ssai.iris.synamedia.com/', '/iris-synamedia/'],
        ['https://dms-api.viu.com/', '/viu-vod/'],
        ['https://prod-in.viu.com/', '/viu-key/'],
        ['https://get.perfecttv.net/', '/perfecttv/'],
        ['https://ptv2026.com/', '/ptv2026/'],
        ['http://ptv2026.com/', '/ptv2026/'],
        ['https://load.ptv2026.com/', '/load-ptv/'],
        ['https://depanptv.com/', '/depan-ptv/'],
        ['https://df14pcdp16s98.cloudfront.net/', '/cf-df14/'],
        ['https://d25tgymtnqzu8s.cloudfront.net/', '/rtm-stream/'],
        ['https://d2xz2v5wuvgur6.cloudfront.net/', '/cf-d2xz/'],
        ['https://d2tjypxxy769fn.cloudfront.net/', '/cf-d2tj/'],
        ['https://d84q7nw4qf3j3.cloudfront.net/', '/cf-d84q/'],
        ['https://d3b0v7fggu5zwm.cloudfront.net/', '/cf-d3b0/'],
        ['https://slive.mana2.my/', '/mana2/'],
        ['https://vd466.okcdn.ru/', '/okcdn/'],
        ['https://d2tolhxlph2dpt.cloudfront.net/', '/cf-d2to/'],
      ];

      const proxyBase = getProxyBaseUrl();

      // Clean up URL and route through proxy if needed
      let cleanUrl = channel.streamUrl ? channel.streamUrl.split('|')[0].trim() : '';

      // Normalize Astro VOD direct origin (bypasses broken iris-synamedia redirector)
      cleanUrl = cleanUrl.replace(/https?:\/\/vod-dai-ott-ap\.ssai\.iris\.synamedia\.com\/tenant\/astroprd\/vodejitp-asset-playback-b\.astro\.com\.my\//, 'https://vodejitp-asset-playback-b.astro.com.my/');

      for (const [from, to] of PROXY_MAP) {
        if (cleanUrl.startsWith(from)) {
          cleanUrl = proxyBase + cleanUrl.replace(from, to);
          break;
        }
      }
      if (cleanUrl.match(/https?:\/\/(vd\d+\.okcdn\.ru)\//)) {
        cleanUrl = proxyBase + cleanUrl.replace(/https?:\/\/(vd\d+\.okcdn\.ru)\//, '/okcdn/$1/');
      }
      if (cleanUrl.startsWith('/')) {
        cleanUrl = proxyBase + cleanUrl;
      }
      currentCleanUrl = cleanUrl;

      if (!cleanUrl) {
        setEngineError('No stream URL available');
        return;
      }

      // Detect Stream Type
      const isHls = cleanUrl.includes('.m3u8');
      const isDash = cleanUrl.includes('.mpd');

      // -------------------------------------------------------------
      // STRATEGY 1: SHAKA PLAYER (Best for ClearKey DRM & DASH/HLS)
      // -------------------------------------------------------------
      const tryShakaPlayer = async (): Promise<boolean> => {
        try {
          shaka.polyfill.installAll();
          if (!shaka.Player.isBrowserSupported()) throw new Error('Shaka not supported');

          const player = new shaka.Player();
          playerRef.current = player;
          (window as any).__shakaPlayer = player;

          // Always set the video container so Shaka constructs UITextDisplayer HTML DOM overlays for TTML/VTT subtitles
          player.setVideoContainer(container);

          await player.attach(video);
          if (isCancelled) return false;

          // Determine DRM Mode
          const isLicenseUrl = Boolean(
            channel.clearKey && (
              channel.clearKey.startsWith('http://') ||
              channel.clearKey.startsWith('https://') ||
              channel.clearKey.includes('/wvmax') ||
              channel.clearKey.includes('/wvtonton')
            )
          );
          const isClearKeyHex = Boolean(
            channel.clearKey && !isLicenseUrl && channel.clearKey.includes(':')
          );

          // Configure Network Request Filter for Proxies
          const networkEngine = player.getNetworkingEngine();
          if (networkEngine) {
            networkEngine.registerRequestFilter((_type: any, request: any) => {
              const pBase = getProxyBaseUrl();
              let url = request.uris[0];

              // Direct rewrite for relative paths
              if (url.startsWith('/')) {
                request.uris[0] = pBase + url;
                return;
              }
              if (IS_NATIVE_APP && (url.startsWith('https://localhost/') || url.startsWith('http://localhost/'))) {
                url = url.replace(/https?:\/\/localhost/, pBase);
                request.uris[0] = url;
              }
              if (IS_NATIVE_APP && url.startsWith('capacitor://localhost/')) {
                url = url.replace('capacitor://localhost', pBase);
                request.uris[0] = url;
              }

              // Direct rewrite for iris-synamedia asset URLs
              if (url.includes('vod-dai-ott-ap.ssai.iris.synamedia.com/tenant/astroprd/vodejitp-asset-playback-b.astro.com.my/')) {
                url = url.replace(/https?:\/\/vod-dai-ott-ap\.ssai\.iris\.synamedia\.com\/tenant\/astroprd\/vodejitp-asset-playback-b\.astro\.com\.my\//, 'https://vodejitp-asset-playback-b.astro.com.my/');
              }

              // Direct bypass for GCDN (Global CDN) - already natively supports CORS and blocks server proxy IPs
              if (url.includes('gcdn.co')) {
                if (url.startsWith('http://')) {
                  request.uris[0] = url.replace('http://', 'https://');
                }
                return;
              }

              if (url.match(/https?:\/\/(vd\d+\.okcdn\.ru)\//)) {
                request.uris[0] = pBase + url.replace(/https?:\/\/(vd\d+\.okcdn\.ru)\//, '/okcdn/$1/');
                return;
              }

              for (const [from, to] of PROXY_MAP) {
                if (url.startsWith(from)) {
                  request.uris[0] = pBase + url.replace(from, to);
                  break;
                }
              }
            });

            // RESPONSE FILTER: Rewrite MPD for ClearKey DRM & Edge Acceleration
            if (isDash && isClearKeyHex) {
              networkEngine.registerResponseFilter((type: any, response: any) => {
                if (type !== shaka.net.NetworkingEngine.RequestType.MANIFEST && type !== 0) return;

                let mpd: string;
                try {
                  mpd = new TextDecoder().decode(response.data);
                } catch (_e) { return; }

                if (!mpd.includes('<MPD') && !mpd.includes('<mpd')) return;

                const clearKeyUuid = 'urn:uuid:1077efec-c0b2-4d02-ace3-3c1e52e2fb4b';

                // Extract and format clean KID as UUID (8-4-4-4-12) from channel.clearKey
                const rawKeyId = channel.clearKey!.split(':')[0].replace(/[^0-9a-fA-F]/g, '').toLowerCase();
                const kidUuid = rawKeyId.length === 32
                  ? `${rawKeyId.slice(0, 8)}-${rawKeyId.slice(8, 12)}-${rawKeyId.slice(12, 16)}-${rawKeyId.slice(16, 20)}-${rawKeyId.slice(20)}`
                  : rawKeyId;

                // 1. STRIP <Location> tags completely so Shaka NEVER redirects manifest refreshes to foreign CDNs that drop KIDs
                let rewritten = mpd.replace(/<Location>[\s\S]*?<\/Location>/gi, '');

                // 2. Upgrade BaseURL to HTTPS so direct CDN chunks are secure and avoid mixed content (GCDN supports CORS natively)
                rewritten = rewritten.replace(/<BaseURL>http:\/\/ngtv-live-cbj\.gcdn\.co\//gi, '<BaseURL>https://ngtv-live-cbj.gcdn.co/');
                rewritten = rewritten.replace(/<BaseURL>http:\/\/ngtv-live\.gcdn\.co\//gi, '<BaseURL>https://ngtv-live.gcdn.co/');
                rewritten = rewritten.replace(/<BaseURL>http:\/\/(?!localhost|127\.0\.0\.1)/gi, '<BaseURL>https://');

                // Remove trickmode tracks safely without crossing </AdaptationSet>
                rewritten = rewritten.replace(/<AdaptationSet(?:\s[^>]*)?>((?:(?!<\/AdaptationSet>)[\s\S])*?dashif\.org\/guidelines\/trickmode[\s\S]*?)<\/AdaptationSet>/gi, '');

                // 3. Remove existing ContentProtection tags cleanly without crossing tag boundaries
                rewritten = rewritten.replace(/<ContentProtection(?:\s[^>]*)?\/>/gi, '');
                rewritten = rewritten.replace(/<ContentProtection(?:\s[^>]*)?>((?:(?!<\/ContentProtection>)[\s\S])*?)<\/ContentProtection>/gi, '');
                rewritten = rewritten.replace(/<(?:cenc:)?pssh[^>]*>[\s\S]*?<\/(?:cenc:)?pssh>/gi, '');

                // 4. Inject clean ClearKey ContentProtection with kidUuid into video & audio AdaptationSets
                rewritten = rewritten.replace(
                  /<AdaptationSet(?:\s[^>]*)?(contentType="(?:video|audio)"|mimeType="(?:video|audio)\/mp4")([^>]*)>/gi,
                  (match) => match + `\n      <ContentProtection schemeIdUri="urn:mpeg:dash:mp4protection:2011" value="cenc" cenc:default_KID="${kidUuid}" />\n      <ContentProtection schemeIdUri="${clearKeyUuid}" value="cenc" cenc:default_KID="${kidUuid}" />`
                );

                const encoded = new TextEncoder().encode(rewritten);
                response.data = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);
              });
            }
          }

          // In Shaka Player: Configure DRM appropriately
          const drmConfig: any = {};

          if (isLicenseUrl) {
            let licenseUrl = channel.clearKey!.trim();
            for (const [from, to] of PROXY_MAP) {
              if (licenseUrl.startsWith(from)) {
                licenseUrl = getProxyBaseUrl() + licenseUrl.replace(from, to);
                break;
              }
            }
            drmConfig.servers = {
              'com.widevine.alpha': licenseUrl,
              'com.microsoft.playready': licenseUrl,
            };
            drmConfig.advanced = {
              'com.widevine.alpha': {
                videoRobustness: '',
                audioRobustness: '',
              },
            };
            console.log(`[Player] Using Widevine license server: ${licenseUrl}`);
          } else if (isClearKeyHex) {
            const [rawKeyId, rawKey] = channel.clearKey!.split(':');
            const normalizeHex = (s: string) => s.replace(/[^0-9a-fA-F]/g, '').toLowerCase().trim();
            const keyIdHex = normalizeHex(rawKeyId);
            const keyValueHex = normalizeHex(rawKey);

            if (keyIdHex.length > 0 && keyIdHex.length % 2 === 0 && keyValueHex.length > 0 && keyValueHex.length % 2 === 0) {
              drmConfig.clearKeys = {
                [keyIdHex]: keyValueHex,
              };
            }
          }

          // Configure Shaka Player DRM & Streaming for Zero-Buffer & Mobile Stability
          player.configure({
            drm: drmConfig,
            streaming: {
              lowLatencyMode: false,
              inaccurateManifestTolerance: 2,
              bufferingGoal: IS_MOBILE ? 24 : 20,
              rebufferingGoal: IS_MOBILE ? 4 : 4,
              bufferBehind: IS_MOBILE ? 12 : 15,
              stallEnabled: true,
              stallThreshold: 4.0,
              stallSkip: 0.1,
              safeSeekOffset: 8,
              retryParameters: {
                maxAttempts: 10,
                baseDelay: 300,
                backoffFactor: 1.3,
                fuzzFactor: 0.2,
                timeout: 15000,
              }
            },
            manifest: {
              dash: {
                ignoreMinBufferTime: true,
                autoCorrectDrift: false,
                initialSegmentLimit: 6,
              },
              retryParameters: {
                maxAttempts: 10,
                baseDelay: 300,
                backoffFactor: 1.3,
                fuzzFactor: 0.2,
                timeout: 15000,
              }
            },
            abr: {
              enabled: true,
              defaultBandwidthEstimate: IS_MOBILE ? 1200000 : 2500000,
              switchInterval: IS_MOBILE ? 15 : 2,
              bandwidthUpgradeTarget: 0.85,
              bandwidthDowngradeTarget: 0.95,
              restrictions: {
                maxHeight: IS_MOBILE ? 720 : 2160,
                maxPixels: IS_MOBILE ? 1280 * 720 : 3840 * 2160,
              }
            }
          });

          player.addEventListener('error', (event: any) => {
            const detail = event?.detail;
            console.warn('[Player] Shaka error event:', detail?.code, detail?.message, detail);
            
            // Universal automatic recovery for all live streaming hiccups
            try {
              if (detail?.code === 6001) {
                player.configure({ abr: { restrictions: {} } });
              }
              // Never mutate video.currentTime directly on live streams as it flushes WebKit buffers
              player.retryStreaming();
            } catch (_e) {}
          });

          player.addEventListener('stalldetected', () => {
            console.log('[Player] Shaka stall detected, auto-recovering...');
            if (!player.isLive() && video.duration && video.currentTime >= video.duration - 2) {
              video.currentTime = 0;
              video.play().catch(() => {});
            } else if (player.isLive()) {
              // Retry streaming smoothly without forcing destructive seeks in WebKit
              try {
                player.retryStreaming();
              } catch (_e) {}
              const playPromise = video.play();
              if (playPromise) {
                playPromise.catch(() => {
                  video.play().catch(() => {});
                });
              }
            }
          });

            console.log(`[Player] 🚀 Shaka loading ${cleanUrl}`);
            await player.load(cleanUrl);
            if (isCancelled) return false;

            await startPlay(video);

            // Helper to get Shaka's internal UITextDisplayer regardless of minification
            const getShakaTextDisplayer = () => {
              if (!player) return null;
              if ((player as any).F && typeof (player as any).F.setTextVisibility === 'function') {
                return (player as any).F;
              }
              if (typeof (player as any).getTextDisplayer === 'function') {
                const td = (player as any).getTextDisplayer();
                if (td) return td;
              }
              for (const k of Object.getOwnPropertyNames(player)) {
                const val = (player as any)[k];
                if (val && typeof val === 'object' && typeof val.setTextVisibility === 'function') {
                  return val;
                }
              }
              return null;
            };

            // Hook track change listeners & publish initial track state
            const syncTracks = () => {
              if (!player) return;
              try {
                const textTracks = player.getTextTracks();
                const audioTracks = player.getAudioTracks ? player.getAudioTracks() : [];
                const variants = player.getVariantTracks ? player.getVariantTracks() : [];
                const activeText = textTracks.find((t: any) => t.active);
                const td = getShakaTextDisplayer();
                const isVisible = td && typeof td.isTextVisible === 'function'
                  ? td.isTextVisible()
                  : Boolean(activeText);

                window.dispatchEvent(new CustomEvent('ssatv-tracks-updated', {
                  detail: {
                    subtitles: textTracks,
                    audio: audioTracks,
                    variants: variants,
                    isSubtitleVisible: isVisible,
                  }
                }));
              } catch (_err) {}
            };

            player.addEventListener('trackschanged', syncTracks);
            player.addEventListener('adaptation', syncTracks);
            player.addEventListener('texttrackvisibility', syncTracks);
            syncTracks();

            // Set up global player controller for subtitles & audio switching
            (window as any).__ssatv_player_controller = {
              selectSubtitle: (trackId: number | string | null) => {
                try {
                  const td = getShakaTextDisplayer();
                  if (trackId === null || trackId === 'off' || trackId === -1) {
                    player.selectTextTrack(null as any);
                    if (td && typeof td.setTextVisibility === 'function') {
                      td.setTextVisibility(false);
                    }
                  } else {
                    const tracks = player.getTextTracks();
                    const match = tracks.find((t: any) => t.id === trackId || String(t.id) === String(trackId));
                    if (match) {
                      player.selectTextTrack(match);
                      if (td && typeof td.setTextVisibility === 'function') {
                        td.setTextVisibility(true);
                      }
                    }
                  }
                  syncTracks();
                } catch (e) {
                  console.warn('[Player] Subtitle selection error:', e);
                }
              },
              selectAudio: (audioId: number | string) => {
                try {
                  const variants = player.getVariantTracks ? player.getVariantTracks() : [];
                  const match = variants.find((v: any) => v.id === audioId || String(v.id) === String(audioId));
                  if (match) {
                    player.selectVariantTrack(match, true);
                  } else if (typeof audioId === 'string' && (player as any).selectAudioLanguage) {
                    (player as any).selectAudioLanguage(audioId);
                  }
                  syncTracks();
                } catch (e) {
                  console.warn('[Player] Audio selection error:', e);
                }
              },
              getTracks: () => {
                try {
                  const textTracks = player.getTextTracks();
                  const activeText = textTracks.find((t: any) => t.active);
                  const td = getShakaTextDisplayer();
                  const isVisible = td && typeof td.isTextVisible === 'function'
                    ? td.isTextVisible()
                    : Boolean(activeText);
                  return {
                    subtitles: textTracks,
                    audio: player.getAudioTracks ? player.getAudioTracks() : [],
                    variants: player.getVariantTracks ? player.getVariantTracks() : [],
                    isSubtitleVisible: isVisible,
                  };
                } catch (_e) {
                  return { subtitles: [], audio: [], variants: [], isSubtitleVisible: false };
                }
              }
            };

            return true;
          } catch (err: any) {
            console.error(`[Player] ❌ Shaka failed for ${channel.name}:`, err?.message || err, err);
            return false;
          }
        };

        // -------------------------------------------------------------
        // STRATEGY 2: HLS.JS (For HLS .m3u8 fallback with high buffer)
        // -------------------------------------------------------------
        const tryHlsJs = async () => {
          if (!isHls || !Hls.isSupported()) return false;
          try {
            const hls = new Hls({
              enableWorker: !IS_IOS,
              lowLatencyMode: false,
              maxBufferLength: IS_IOS ? 8 : 30,
              maxMaxBufferLength: IS_IOS ? 12 : 60,
              maxBufferSize: IS_IOS ? 10 * 1000000 : 80 * 1000000,
              maxBufferHole: 0.5,
              liveSyncDurationCount: IS_IOS ? 3 : 3,
              liveMaxLatencyDurationCount: IS_IOS ? 6 : 10,
              capLevelToPlayerSize: IS_IOS,
              nudgeOffset: 0.1,
              nudgeMaxRetry: 5,
              fragLoadingTimeOut: 12000,
              manifestLoadingTimeOut: 10000,
            });
            hlsRef.current = hls;
            hls.loadSource(cleanUrl);
            hls.attachMedia(video);

            return new Promise<boolean>((resolve) => {
              hls.on(Hls.Events.MANIFEST_PARSED, async () => {
                if (isCancelled) return resolve(false);
                
                if (IS_IOS && hls.levels.length > 1) {
                  const safeLevel = hls.levels.findIndex(l => l.height <= 720);
                  if (safeLevel >= 0) {
                    hls.currentLevel = safeLevel;
                    hls.autoLevelCapping = safeLevel;
                  }
                }
                
                await startPlay(video);
                resolve(true);
              });

              // Auto-loop seamlessly if playlist segments end
              hls.on(Hls.Events.BUFFER_EOS, () => {
                console.log('[Player] End of buffer reached in Hls.js, looping seamlessly...');
                video.currentTime = 0;
                video.play().catch(() => {});
              });

              hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                  console.warn('Hls.js fatal error:', data);
                  if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    hls.startLoad();
                  } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    hls.recoverMediaError();
                  } else {
                    resolve(false);
                  }
                }
              });
            });
          } catch (e) {
            return false;
          }
        };

      // -------------------------------------------------------------
      // STRATEGY 3: NATIVE HTML5 VIDEO (HLS on Safari/iOS only)
      // -------------------------------------------------------------
      const tryNativeVideo = async () => {
        if (!isHls && !cleanUrl.includes('.mp4')) {
          return false;
        }
        try {
          video.src = cleanUrl;
          await startPlay(video);
          return true;
        } catch (e) {
          return false;
        }
      };

      // =============================================================
      // PLAYBACK HIERARCHY
      // =============================================================
      let success = false;

      const onEnded = () => {
        const player = playerRef.current;
        if (!player || !player.isLive()) {
          console.log('[Player] Video ended, restarting VOD stream...');
          video.currentTime = 0;
          video.play().catch(() => {});
        } else {
          console.log('[Player] Live stream reached segment boundary, seeking to live edge...');
          try {
            const range = player.seekRange();
            if (range && range.end) {
              video.currentTime = Math.max(range.start, range.end - 8);
            }
          } catch (_e) {}
          video.play().catch(() => {
            video.play().catch(() => {});
          });
        }
      };
      video.addEventListener('ended', onEnded);

      // 1. For plain HLS (.m3u8) streams without DRM: Hls.js provides the best live loop & buffer management
      if (isHls && !channel.clearKey) {
        if (IS_IOS && video.canPlayType('application/vnd.apple.mpegurl')) {
          success = await tryNativeVideo();
        }
        if (!success) {
          success = await tryHlsJs();
        }
        if (!success) {
          success = await tryShakaPlayer();
        }
      } else {
        // 2. For DASH (.mpd) or DRM streams (ClearKey / Widevine): Shaka Player is the primary engine
        success = await tryShakaPlayer();
        if (!success && isHls) {
          success = await tryHlsJs();
        }
      }

      if (!success && !isCancelled) {
        setEngineError('Tidak dapat memainkan siaran ini. Sila cuba lagi atau pilih saluran lain.');
      }
    };

    const startPlay = async (video: HTMLVideoElement) => {
      // Direct unmuted playback: never mute by default
      video.muted = false;
      video.defaultMuted = false;
      video.volume = 1;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('x5-playsinline', 'true');

      // 1. Attempt direct unmuted playback
      try {
        await video.play();
        setIsMuted(false);
        setIsPlaying(true);
        return;
      } catch (playErr: any) {
        console.warn('[Player] Initial unmuted play deferred, ensuring immediate stream play:', playErr);
      }

      // 2. If browser autoplay policy blocks unmuted audio on zero-click load:
      // Play immediately (so live broadcast stream is moving and visible - zero black screen, zero blocking button!)
      try {
        video.muted = true;
        await video.play();
        setIsMuted(true);
        setIsPlaying(true);

        // Auto-unmute immediately on the first user interaction anywhere on the screen
        const unmuteOnFirstGesture = async () => {
          if (videoRef.current) {
            try {
              videoRef.current.muted = false;
              videoRef.current.volume = 1;
              setIsMuted(false);
              await videoRef.current.play();
            } catch (_e) {
              console.warn('[Player] Unmute retry:', _e);
            }
          }
          ['pointerdown', 'mousedown', 'keydown', 'touchstart', 'click', 'scroll', 'wheel'].forEach((evt) => {
            window.removeEventListener(evt, unmuteOnFirstGesture, true);
            document.removeEventListener(evt, unmuteOnFirstGesture, true);
          });
        };

        ['pointerdown', 'mousedown', 'keydown', 'touchstart', 'click', 'scroll', 'wheel'].forEach((evt) => {
          window.addEventListener(evt, unmuteOnFirstGesture, { once: true, capture: true });
          document.addEventListener(evt, unmuteOnFirstGesture, { once: true, capture: true });
        });
      } catch (mutedErr) {
        console.warn('[Player] Video element pending readyState, waiting for canplay:', mutedErr);
        const onCanPlay = async () => {
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('loadeddata', onCanPlay);
          try {
            video.muted = false;
            video.volume = 1;
            await video.play();
            setIsMuted(false);
            setIsPlaying(true);
          } catch (_e) {
            video.muted = true;
            await video.play().catch(() => {});
            setIsMuted(true);
            setIsPlaying(true);
          }
        };
        video.addEventListener('canplay', onCanPlay, { once: true });
        video.addEventListener('loadeddata', onCanPlay, { once: true });
      }
    };

    // Watchdog to recover from decoder stalls and auto-loop bounded live streams
    let lastTime = -1;
    let stallCount = 0;
    stallCheckInterval = setInterval(() => {
      const video = videoRef.current;
      const player = playerRef.current;
      if (!video) return;

      const isLiveStream = isVodStream ? false : (player ? player.isLive() : true);

      // 1. If non-live video has ended or reached the end of available duration, loop back
      if (!isLiveStream && (video.ended || (video.duration > 0 && video.duration < 120 && video.currentTime >= video.duration - 0.5))) {
        console.log('[Player] Watchdog detected end of short VOD stream, auto-looping...');
        video.currentTime = 0;
        video.play().catch(() => {});
        return;
      }

      const currentTime = video.currentTime;
      // Detect if video playback is stuck (only after media has actually started playing)
      const hasStarted = (video.readyState >= 2 || currentTime > 0);
      const isTimeStuck = hasStarted && lastTime >= 0 && Math.abs(currentTime - lastTime) < 0.05;

      if (!video.paused && isTimeStuck) {
        stallCount++;
        // On mobile WebKit, allow transient buffer delays before triggering gentle retry
        if (stallCount === 6) {
          console.log('[Player] Transient stall detected (6s), triggering stream retry...');
          try {
            if (player && player.isLive()) {
              player.retryStreaming();
            }
            const p = video.play();
            if (p) {
              p.catch(() => {
                video.play().catch(() => {});
              });
            }
          } catch (_e) {}
        } else if (stallCount >= 16) {
          // Prolonged stall (16s): Cleanly reload live stream pipeline without tearing down DOM
          console.log('[Player] Prolonged stall (16s), recovering playback...');
          try {
            if (player && player.isLive() && currentCleanUrl) {
              player.load(currentCleanUrl).then(() => {
                video.play().catch(() => {});
              }).catch(() => {});
            } else {
              video.play().catch(() => {});
            }
          } catch (_e) {}
          stallCount = 0;
        }
      } else if (!video.paused) {
        stallCount = 0;
      }
      lastTime = currentTime;
    }, 1000);

    initStream();

    return () => {
      isCancelled = true;
      clearInterval(stallCheckInterval);
      cleanupPlayers();
    };
  }, [channel.id, channel.contentId, channel.streamUrl, channel.clearKey]);


  return (
    <div className="main-player-section">
      <div 
        ref={videoContainerRef} 
        className={`video-player-container ${isFullscreen ? 'is-fullscreen' : ''} ${showOverlayControls ? 'controls-visible' : 'controls-hidden'}`}
        style={{ 
          position: 'relative', 
          width: '100%', 
          aspectRatio: '16/9', 
          backgroundColor: '#000',
          cursor: isFullscreen && !showOverlayControls ? 'none' : 'default'
        }}
        onMouseMove={resetHideTimer}
        onTouchStart={resetHideTimer}
        onClick={() => {
          if (!showOverlayControls) {
            resetHideTimer();
          }
        }}
        tabIndex={0}
      >
        <video
          ref={videoRef}
          poster={channel.thumbnail}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          autoPlay
          playsInline
        />

        {/* Apple TV Video Player UI Overlay (Gambar 2) */}
        {!hideOverlay && (
          <div 
            className={`apple-tv-player-overlay ${showOverlayControls ? 'is-visible' : 'is-hidden'}`}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.75) 100%)',
              transition: 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: showOverlayControls ? 1 : 0,
              zIndex: 25,
            }}
          >
            {/* Top Bar: Picture-in-Picture, AirPlay, Share Pill & Volume Capsule */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              {/* Top-Left Glass Pill (Gambar 2: PiP, AirPlay, Share) */}
              <div className="apple-tv-glass-pill" style={{ pointerEvents: 'auto' }}>
                <button 
                  className="apple-tv-pill-icon-btn" 
                  onClick={handleTogglePip} 
                  title="Picture-in-Picture"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="3" />
                    <rect x="12" y="11" width="8" height="7" rx="1.5" fill="currentColor" />
                  </svg>
                </button>
                <button 
                  className="apple-tv-pill-icon-btn" 
                  onClick={handleToggleAirplay} 
                  title="AirPlay"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" />
                    <polygon points="12 15 17 21 7 21 12 15" fill="currentColor" stroke="none" />
                  </svg>
                </button>
                <button 
                  className="apple-tv-pill-icon-btn" 
                  onClick={handleShare} 
                  title="Kongsi Pautan"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </button>
              </div>

              {/* Toast Message Notification */}
              {toastMessage && (
                <div className="apple-tv-toast-pill" style={{ pointerEvents: 'auto' }}>
                  {toastMessage}
                </div>
              )}

              {/* Top-Right Glass Pill (Gambar 2: Horizontal Volume Slider & Speaker) */}
              <div className="apple-tv-glass-pill apple-tv-volume-pill" style={{ pointerEvents: 'auto' }}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="apple-tv-volume-slider"
                  title="Kekuatan Bunyi"
                />
                <button 
                  className="apple-tv-pill-icon-btn" 
                  onClick={toggleMute} 
                  title={isMuted || volume === 0 ? "Buka Suara" : "Senyap"}
                >
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>
            </div>

            {/* Center Triad (Gambar 2: Rewind 10, Play/Pause Hero, Forward 10) */}
            <div 
              className="apple-tv-center-triad" 
              style={{ pointerEvents: 'auto' }}
            >
              {/* Rewind 10s */}
              <button 
                className="apple-tv-triad-btn apple-tv-step-btn" 
                onClick={handleRewind10} 
                title="Undur 10 Saat"
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="23" fill="rgba(35, 38, 48, 0.72)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
                  <path d="M15 21C16.5 16.5 21 14 26 14.5C31.5 15.2 35.5 20 35.5 25.5C35.5 31.5 30.5 36.5 24.5 36.5C19.5 36.5 15.5 33 14 28.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M11 21H16V16" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="24" y="27.5" fill="#ffffff" fontSize="10.5" fontWeight="700" fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" textAnchor="middle" dominantBaseline="middle">10</text>
                </svg>
              </button>

              {/* Play / Pause Hero Button (Large circular frosted button) */}
              <button 
                className="apple-tv-triad-btn apple-tv-hero-play-btn" 
                onClick={handleTogglePlay} 
                title={isPlaying ? "Jeda" : "Main"}
              >
                {isPlaying ? (
                  <svg width="22" height="26" viewBox="0 0 22 26" fill="#ffffff">
                    <rect x="2" y="1" width="6.5" height="24" rx="2" />
                    <rect x="13.5" y="1" width="6.5" height="24" rx="2" />
                  </svg>
                ) : (
                  <svg width="24" height="26" viewBox="0 0 24 26" fill="#ffffff" style={{ marginLeft: '3px' }}>
                    <path d="M3.5 2.5C3.5 1.3 4.8 0.5 5.8 1.15L22.2 11.65C23.2 12.3 23.2 13.7 22.2 14.35L5.8 24.85C4.8 25.5 3.5 24.7 3.5 23.5V2.5Z" />
                  </svg>
                )}
              </button>

              {/* Forward 10s */}
              <button 
                className="apple-tv-triad-btn apple-tv-step-btn" 
                onClick={handleForward10} 
                title="Maju 10 Saat"
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="23" fill="rgba(35, 38, 48, 0.72)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
                  <path d="M33 21C31.5 16.5 27 14 22 14.5C16.5 15.2 12.5 20 12.5 25.5C12.5 31.5 17.5 36.5 23.5 36.5C28.5 36.5 32.5 33 34 28.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M37 21H32V16" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="24" y="27.5" fill="#ffffff" fontSize="10.5" fontWeight="700" fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" textAnchor="middle" dominantBaseline="middle">10</text>
                </svg>
              </button>
            </div>

            {/* Bottom Section: Title, Subtitle, Timeline Scrub Bar, Subtitle & Fullscreen Toggles */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.4rem', pointerEvents: 'auto' }}>
              {/* Bottom Metadata (Gambar 2: S1, E1 · Pilot / Channel Name) */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <div className="apple-tv-player-submeta">
                    {channel.category ? `${channel.category} • HD` : 'S1, E1 • Siaran Langsung'}
                  </div>
                  <div className="apple-tv-player-title">
                    {channel.name}
                  </div>
                </div>

                {/* Subtitles / Audio & Fullscreen Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                  {/* Apple TV Speech Bubble Subtitles & Audio Button */}
                  <button 
                    className={`apple-tv-pill-icon-btn apple-tv-caption-btn ${showSubtitlesModal ? 'active' : ''}`}
                    onClick={() => {
                      setShowSubtitlesModal(!showSubtitlesModal);
                      refreshTracks();
                      resetHideTimer();
                    }}
                    title="Pilihan Sari Kata & Audio"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      <line x1="8" y1="9" x2="16" y2="9" strokeWidth="2" />
                      <line x1="8" y1="13" x2="13" y2="13" strokeWidth="2" />
                    </svg>
                  </button>

                  {/* Fullscreen Button */}
                  <button 
                    className="apple-tv-pill-icon-btn" 
                    onClick={toggleFullscreen} 
                    title={isFullscreen ? "Keluar Skrin Penuh" : "Skrin Penuh"}
                  >
                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                  </button>

                  {/* Apple TV Frosted Glass Subtitles & Audio Popover */}
                  {showSubtitlesModal && (
                    <div className="apple-tv-subtitles-popover">
                      <div className="apple-tv-popover-tabs">
                        <button 
                          className={`apple-tv-tab-btn ${subtitlesTab === 'subtitles' ? 'active' : ''}`}
                          onClick={() => setSubtitlesTab('subtitles')}
                        >
                          Sari Kata
                        </button>
                        <button 
                          className={`apple-tv-tab-btn ${subtitlesTab === 'audio' ? 'active' : ''}`}
                          onClick={() => setSubtitlesTab('audio')}
                        >
                          Audio
                        </button>
                      </div>

                      <div className="apple-tv-popover-content">
                        {subtitlesTab === 'subtitles' ? (
                          <div className="apple-tv-track-list">
                            <button 
                              className={`apple-tv-track-item ${activeTextTrackId === null ? 'selected' : ''}`}
                              onClick={() => handleSelectSubtitle('off')}
                            >
                              <span>Mati (Off)</span>
                              {activeTextTrackId === null && <Check size={16} />}
                            </button>
                            {availableTextTracks.length > 0 ? (
                              availableTextTracks.map((track) => (
                                <button
                                  key={track.id}
                                  className={`apple-tv-track-item ${activeTextTrackId === track.id ? 'selected' : ''}`}
                                  onClick={() => handleSelectSubtitle(track.id)}
                                >
                                  <span>{track.label || track.language || `Trek ${track.id}`}</span>
                                  {activeTextTrackId === track.id && <Check size={16} />}
                                </button>
                              ))
                            ) : (
                              <div className="apple-tv-empty-text">Tiada sari kata tambahan</div>
                            )}
                          </div>
                        ) : (
                          <div className="apple-tv-track-list">
                            {availableAudioTracks.length > 0 ? (
                              availableAudioTracks.map((audio) => (
                                <button
                                  key={audio.id}
                                  className={`apple-tv-track-item ${activeAudioTrackId === audio.id ? 'selected' : ''}`}
                                  onClick={() => handleSelectAudio(audio.id)}
                                >
                                  <span>{audio.label || audio.language || `Audio ${audio.id}`}</span>
                                  {activeAudioTrackId === audio.id && <Check size={16} />}
                                </button>
                              ))
                            ) : (
                              <button className="apple-tv-track-item selected">
                                <span>Audio Asal (Stereo)</span>
                                <Check size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Scrubber Timeline Bar (Gambar 2: Elapsed, Scrub Bar, Remaining) */}
              <div className="apple-tv-timeline-row">
                <span className="apple-tv-time-text">
                  {formatTime(currentTime)}
                </span>

                <div className="apple-tv-scrub-container">
                  <input
                    type="range"
                    min="0"
                    max={duration > 0 ? duration : 100}
                    step="0.5"
                    value={duration > 0 ? currentTime : 100}
                    onChange={handleSeek}
                    className="apple-tv-scrubber"
                    title="Masa Mainan"
                  />
                </div>

                <span className="apple-tv-time-text remaining">
                  {duration > 0 ? formatRemaining(currentTime, duration) : (isVodStream ? '--:--' : '')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Engine Failure Overlay (Apple TV Style, Zero Red!) */}
        {engineError && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(15, 20, 30, 0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            zIndex: 40
          }}>
            <AlertCircle size={44} color="#ffffff" style={{ marginBottom: '1rem', opacity: 0.85 }} />
            <h4 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#fff' }}>Ralat Siaran</h4>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', maxWidth: '400px', marginBottom: '1.5rem' }}>
              {engineError}
            </p>
            <button 
              className="apple-tv-white-pill-btn"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={16} /> Muat Semula Halaman
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
