import React, { useEffect, useRef, useState } from 'react';
import type { Channel } from './mockData';
import shaka from 'shaka-player/dist/shaka-player.ui.js';
import 'shaka-player/dist/controls.css';
import Hls from 'hls.js';
import { Play, AlertCircle, RefreshCw } from 'lucide-react';

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
  if (IS_NATIVE_APP) {
    return 'https://ssatvlive.vercel.app';
  }
  return window.location.origin;
};

export const Player: React.FC<PlayerProps> = ({ channel, hideOverlay = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [hasAutoplayError, setHasAutoplayError] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlayControls, setShowOverlayControls] = useState(true);
  const hideControlsTimerRef = useRef<any>(null);

  const playerRef = useRef<shaka.Player | null>(null);
  const uiRef = useRef<shaka.ui.Overlay | null>(null);
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
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
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
    hideControlsTimerRef.current = setTimeout(() => {
      setShowOverlayControls(false);
    }, 3500);
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  useEffect(() => {
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

  const cleanupPlayers = async () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (uiRef.current) {
      uiRef.current.destroy();
      uiRef.current = null;
    }
    if (playerRef.current) {
      await playerRef.current.destroy();
      playerRef.current = null;
    }
  };

  useEffect(() => {
    let isCancelled = false;
    let stallCheckInterval: any = null;
    setEngineError(null);
    setHasAutoplayError(false);

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
        ['https://ngtv-vod.gcdn.co/', '/ngtv-vod/'],
        ['https://dms-api.viu.com/', '/viu-vod/'],
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
      if (cleanUrl.startsWith('/')) {
        cleanUrl = proxyBase + cleanUrl;
      }

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

          if (!hideOverlay) {
            const ui = new shaka.ui.Overlay(player, container, video);
            uiRef.current = ui;
            ui.getControls();
          }

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

                // 3. Remove Widevine & PlayReady ContentProtection tags so CDM binds directly to ClearKey
                rewritten = rewritten.replace(/<ContentProtection[^>]*?urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95[^>]*>[\s\S]*?<\/ContentProtection>/gi, '');
                rewritten = rewritten.replace(/<ContentProtection[^>]*?urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95[^>]*\/>/gi, '');
                rewritten = rewritten.replace(/<ContentProtection[^>]*?urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed[^>]*>[\s\S]*?<\/ContentProtection>/gi, '');
                rewritten = rewritten.replace(/<ContentProtection[^>]*?urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed[^>]*\/>/gi, '');
                rewritten = rewritten.replace(/<(?:cenc:)?pssh[^>]*>[\s\S]*?<\/(?:cenc:)?pssh>/gi, '');

                // 4. Unconditionally inject ClearKey ContentProtection with kidUuid into EVERY AdaptationSet
                if (!rewritten.includes(clearKeyUuid)) {
                  rewritten = rewritten.replace(
                    /<AdaptationSet([^>]*)>/gi,
                    `<AdaptationSet$1>\n      <ContentProtection schemeIdUri="urn:mpeg:dash:mp4protection:2011" value="cenc" cenc:default_KID="${kidUuid}" />\n      <ContentProtection schemeIdUri="${clearKeyUuid}" value="cenc" cenc:default_KID="${kidUuid}" />`
                  );
                } else if (!rewritten.includes(`cenc:default_KID="${kidUuid}"`)) {
                  // Ensure default_KID is attached to existing ClearKey tags
                  rewritten = rewritten.replace(
                    new RegExp(`(<ContentProtection[^>]*?${clearKeyUuid}[^>]*?)(/?>)`, 'gi'),
                    `$1 cenc:default_KID="${kidUuid}"$2`
                  );
                }

                response.data = new TextEncoder().encode(rewritten);
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
              bufferingGoal: IS_MOBILE ? 10 : 20,
              rebufferingGoal: IS_MOBILE ? 2 : 4,
              bufferBehind: IS_MOBILE ? 4 : 15,
              stallEnabled: true,
              stallThreshold: 3.0,
              stallSkip: 0.5,
              safeSeekOffset: 6,
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
                ignoreMinBufferTime: false,
                autoCorrectDrift: true,
                initialSegmentLimit: 4,
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
              switchInterval: IS_MOBILE ? 10 : 2,
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
            
            // Restrictions cannot be met (e.g. 4K UHD format)
            if (detail?.code === 6001) {
              console.log('[Player] Code 6001: Clearing ABR restrictions and retrying...');
              try {
                player.configure({ abr: { restrictions: {} } });
                player.retryStreaming();
              } catch (_e) {}
              return;
            }

            // QuotaExceededError or BUFFER_APPEND_ERROR on iOS
            if (detail?.code === 3017 || detail?.code === 3015) {
              console.log('[Player] Buffer append issue, clearing buffer behind...');
              try {
                player.configure({ streaming: { bufferBehind: 5, bufferingGoal: 10 } });
                if (player.isLive()) {
                  const range = player.seekRange();
                  if (range && range.end) {
                    video.currentTime = Math.max(range.start, range.end - 8);
                  }
                }
                player.retryStreaming();
              } catch (_e) {}
              return;
            }
            
            if (detail?.isRecoverable || detail?.severity === shaka.util.Error.Severity.RECOVERABLE) {
              try {
                player.retryStreaming();
              } catch (_e) {}
            }
          });

          player.addEventListener('stalldetected', () => {
            console.log('[Player] Shaka stall detected, auto-recovering...');
            if (!player.isLive() && video.duration && video.currentTime >= video.duration - 2) {
              video.currentTime = 0;
              video.play().catch(() => {});
            } else if (player.isLive()) {
              const range = player.seekRange();
              if (range && range.end) {
                // Only seek if we have fallen outside the seek range
                if (video.currentTime < range.start || video.currentTime > range.end - 2) {
                  video.currentTime = Math.max(range.start, range.end - 8);
                }
              }
              const playPromise = video.play();
              if (playPromise) {
                playPromise.catch(() => {
                  video.muted = true;
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
            video.muted = true;
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
      try {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('x5-playsinline', 'true');
        await video.play();
        setHasAutoplayError(false);
      } catch (playErr: any) {
        console.warn('Autoplay blocked or failed', playErr);
        setHasAutoplayError(true);
      }
    };

    // Watchdog to recover from decoder stalls and auto-loop bounded live streams
    let lastTime = -1;
    let stallCount = 0;
    stallCheckInterval = setInterval(() => {
      const video = videoRef.current;
      const player = playerRef.current;
      if (!video) return;

      const isLiveStream = player ? player.isLive() : channel.category !== 'VOD';

      // 1. If non-live video has ended or reached the end of available duration, loop back
      if (!isLiveStream && (video.ended || (video.duration > 0 && video.duration < 120 && video.currentTime >= video.duration - 0.5))) {
        console.log('[Player] Watchdog detected end of short VOD stream, auto-looping...');
        video.currentTime = 0;
        video.play().catch(() => {});
        return;
      }

      const currentTime = video.currentTime;
      // Detect if video playback is stuck (time not progressing or stuck buffering)
      const isTimeStuck = lastTime >= 0 && Math.abs(currentTime - lastTime) < 0.05;
      const isBufferStuck = video.readyState < 3;

      if (!video.paused && (isTimeStuck || isBufferStuck)) {
        stallCount++;
        // Give 4 seconds before initiating proactive recovery
        if (stallCount >= 4) {
          console.log('[Player] Playback stall confirmed (4s), auto-recovering...');
          try {
            if (!isLiveStream) {
              if (video.duration > 0 && video.duration < 120 && video.currentTime >= video.duration - 1.5) {
                video.currentTime = 0;
              } else {
                video.currentTime += 0.5;
              }
            } else if (player && player.isLive()) {
              const seekRange = player.seekRange();
              if (seekRange && seekRange.end) {
                // Seek to safe live edge (6 seconds behind)
                const safeTarget = Math.max(seekRange.start, seekRange.end - 6);
                if (Math.abs(video.currentTime - safeTarget) > 2) {
                  video.currentTime = safeTarget;
                }
              }
              // Proactively retry streaming to refresh segment pipeline
              player.retryStreaming();
            } else {
              video.currentTime += 0.5;
            }
            
            const p = video.play();
            if (p) {
              p.catch(() => {
                video.muted = true;
                video.play().catch(() => {});
              });
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

  const handleManualPlayUnmute = async () => {
    if (videoRef.current) {
      const video = videoRef.current;
      try {
        video.muted = false;
        await video.play();
        setHasAutoplayError(false);
      } catch (err) {
        console.warn('Direct unmuted play failed, playing muted first:', err);
        try {
          video.muted = true;
          await video.play();
          video.muted = false;
          setHasAutoplayError(false);
        } catch (_e2) {
          console.error('All play attempts failed:', _e2);
        }
      }
    }
  };

  return (
    <div className="main-player-section">
      <div 
        ref={videoContainerRef} 
        className={`video-player-container ${isFullscreen ? 'is-fullscreen' : ''}`}
        style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}
        onMouseMove={resetHideTimer}
        onTouchStart={resetHideTimer}
        tabIndex={0}
      >
        <video
          ref={videoRef}
          poster={channel.thumbnail}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          autoPlay
          playsInline
          muted
        />

        {/* Dedicated TV Remote & Full Screen Overlay Bar (hidden when hideOverlay is true) */}
        {!hideOverlay && (
          <div 
            className={`player-custom-overlay ${showOverlayControls ? 'visible' : 'hidden'}`}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '1.25rem',
              background: 'transparent',
              transition: 'opacity 0.3s ease',
              opacity: showOverlayControls ? 1 : 0,
              zIndex: 25,
            }}
          >
            {/* Top Bar: Channel Details */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="live-pill" style={{ pointerEvents: 'auto' }}>
                  <span className="live-dot" /> LIVE
                </div>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  {channel.name}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                  • {channel.category}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Manual Autoplay / Unmute Overlay */}
        {hasAutoplayError && (
          <div 
            onClick={handleManualPlayUnmute}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 30
            }}
          >
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 0 30px rgba(229, 9, 20, 0.6)'
            }}>
              <Play size={32} fill="#ffffff" style={{ marginLeft: '4px' }} />
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
              Klik Untuk Mainkan Siaran
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              (Sila klik untuk memulakan audio & video)
            </div>
          </div>
        )}

        {/* Engine Failure Overlay */}
        {engineError && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(15, 20, 30, 0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            zIndex: 40
          }}>
            <AlertCircle size={48} color="var(--accent-red)" style={{ marginBottom: '1rem' }} />
            <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#fff' }}>Ralat Siaran</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '1.5rem' }}>
              {engineError}
            </p>
            <button 
              className="btn-red"
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
