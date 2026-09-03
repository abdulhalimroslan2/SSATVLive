import React, { useEffect, useRef, useState } from 'react';
import type { Channel } from './mockData';
import shaka from 'shaka-player/dist/shaka-player.ui.js';
import 'shaka-player/dist/controls.css';
import Hls from 'hls.js';
import { Play, AlertCircle, RefreshCw, Maximize, Minimize } from 'lucide-react';

interface PlayerProps {
  channel: Channel;
}

// Detect iOS device
const IS_IOS = typeof navigator !== 'undefined' && (
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
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

export const Player: React.FC<PlayerProps> = ({ channel }) => {
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
        ['http://ngtv-live-cbj.gcdn.co/', '/gcdn/'],
        ['https://ngtv-live-cbj.gcdn.co/', '/gcdn-s/'],
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

          await player.attach(video);
          if (isCancelled) return false;

          const ui = new shaka.ui.Overlay(player, container, video);
          uiRef.current = ui;
          ui.getControls();

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

            // RESPONSE FILTER: Rewrite MPD for ClearKey DRM (Case-insensitive & XML-safe)
            if (isDash && isClearKeyHex) {
              networkEngine.registerResponseFilter((type: any, response: any) => {
                // Only process MANIFEST responses
                if (type !== shaka.net.NetworkingEngine.RequestType.MANIFEST && type !== 0) return;

                let mpd: string;
                try {
                  mpd = new TextDecoder().decode(response.data);
                } catch (_e) { return; }

                if (!mpd.includes('<MPD') && !mpd.includes('<mpd')) return;

                const clearKeyUuid = 'urn:uuid:1077efec-c0b2-4d02-ace3-3c1e52e2fb4b';

                // 1. Replace Widevine UUID with ClearKey UUID case-insensitively (handles uppercase & lowercase UUIDs)
                let rewritten = mpd.replace(/urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed/gi, clearKeyUuid);

                // 2. Remove Widevine PSSH boxes so CDM uses default_KID directly
                rewritten = rewritten.replace(/<(?:cenc:)?pssh[^>]*>[\s\S]*?<\/(?:cenc:)?pssh>/gi, '');

                // 3. Fix Mixed Content (HTTP -> HTTPS) for BaseURL
                rewritten = rewritten.replaceAll('<BaseURL>http://', '<BaseURL>https://');

                // 4. Inject ClearKey ContentProtection node safely if still not present
                if (!rewritten.includes(clearKeyUuid)) {
                  rewritten = rewritten.replace(
                    /<ContentProtection\s+[^>]*?schemeIdUri="urn:mpeg:dash:mp4protection:2011"[^>]*?cenc:default_KID="([^"]+)"[^>]*?>/gi,
                    (match, kid) => `${match}\n      <ContentProtection schemeIdUri="${clearKeyUuid}" value="cenc" cenc:default_KID="${kid}" />`
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

          // Configure Shaka Player DRM & Streaming for Zero-Buffer Playback
          player.configure({
            drm: drmConfig,
            streaming: {
              lowLatencyMode: false,
              inaccurateManifestTolerance: 2,
              bufferingGoal: IS_IOS ? 8 : 20,
              rebufferingGoal: IS_IOS ? 2 : 2.5,
              bufferBehind: IS_IOS ? 5 : 15,
              stallEnabled: true,
              stallThreshold: 0.8,
              stallSkip: 0.3,
              safeSeekOffset: 2,
              retryParameters: {
                maxAttempts: 6,
                baseDelay: 200,
                backoffFactor: 1.3,
                fuzzFactor: 0.2,
                timeout: 12000,
              }
            },
              manifest: {
                dash: {
                  ignoreMinBufferTime: true,
                  autoCorrectDrift: true,
                  initialSegmentLimit: 2,
                },
                availabilityWindowOverride: 60,
                retryParameters: {
                  maxAttempts: 6,
                  baseDelay: 200,
                  backoffFactor: 1.3,
                  fuzzFactor: 0.2,
                  timeout: 12000,
                }
              },
              abr: {
                enabled: true,
                defaultBandwidthEstimate: 3500000,
                switchInterval: 2,
                bandwidthUpgradeTarget: 0.85,
                bandwidthDowngradeTarget: 0.95,
                restrictions: IS_IOS ? {
                  maxHeight: 720,
                  maxBandwidth: 2500000
                } : {}
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
                console.log('[Player] Buffer quota exceeded, seeking to live edge...');
                try {
                  if (player.isLive()) {
                    video.currentTime = player.seekRange().end - 3;
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
              if (video.duration && video.currentTime >= video.duration - 2) {
                video.currentTime = 0;
                video.play().catch(() => {});
              } else {
                try {
                  player.retryStreaming();
                } catch (_e) {}
              }
            });

            console.log(`[Player] 🚀 Shaka loading ${cleanUrl}`);
            await player.load(cleanUrl);
            if (isCancelled) return false;

            await startPlay(video);
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
        console.log('[Player] Video ended, restarting stream seamlessly...');
        video.currentTime = 0;
        video.play().catch(() => {});
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
        video.playsInline = true;
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

      // If video has ended or reached the end of available duration, loop back to start immediately
      if (video.ended || (video.duration > 0 && video.duration < 120 && video.currentTime >= video.duration - 0.5)) {
        console.log('[Player] Watchdog detected end of stream, auto-looping...');
        video.currentTime = 0;
        video.play().catch(() => {});
        return;
      }

      if (video.paused || video.readyState < 2) {
        stallCount = 0;
        return;
      }

      const currentTime = video.currentTime;
      if (lastTime >= 0 && Math.abs(currentTime - lastTime) < 0.05) {
        stallCount++;
        if (stallCount >= 2) {
          console.log('[Player] Playback stall detected, auto-recovering...');
          try {
            if (video.duration > 0 && video.duration < 120 && video.currentTime >= video.duration - 1.5) {
              video.currentTime = 0;
            } else if (player && player.isLive()) {
              const seekRange = player.seekRange();
              if (seekRange && seekRange.end) {
                video.currentTime = seekRange.end - 3;
              }
              player.retryStreaming();
            } else {
              video.currentTime += 0.5;
            }
            video.play().catch(() => {});
          } catch (_e) {}
          stallCount = 0;
        }
      } else {
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
          controls
        />

        {/* Dedicated TV Remote & Mobile Full Screen Overlay Bar */}
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
            background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.8) 100%)',
            transition: 'opacity 0.3s ease',
            opacity: showOverlayControls ? 1 : 0,
            zIndex: 25,
          }}
        >
          {/* Top Bar: Channel Details & Dedicated Full Screen Button */}
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

          {/* Bottom Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>

            {/* Quick Floating Fullscreen Icon on Bottom Right */}
            <button
              className="player-quick-fs-fab"
              onClick={toggleFullscreen}
              style={{ pointerEvents: 'auto' }}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize size={20} color="#fff" /> : <Maximize size={20} color="#fff" />}
            </button>
          </div>
        </div>

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
