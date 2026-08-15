import React, { useEffect, useRef, useState } from 'react';
import type { Channel } from './mockData';
import shaka from 'shaka-player/dist/shaka-player.ui.js';
import 'shaka-player/dist/controls.css';
import Hls from 'hls.js';
import { Play, AlertCircle, RefreshCw } from 'lucide-react';

interface PlayerProps {
  channel: Channel;
}

// Detect iOS device
const IS_IOS = typeof navigator !== 'undefined' && (
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);

export const Player: React.FC<PlayerProps> = ({ channel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [hasAutoplayError, setHasAutoplayError] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);

  const playerRef = useRef<shaka.Player | null>(null);
  const uiRef = useRef<shaka.ui.Overlay | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const cleanupPlayers = async () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (uiRef.current) {
      await uiRef.current.destroy();
      uiRef.current = null;
    }
    if (playerRef.current) {
      await playerRef.current.destroy();
      playerRef.current = null;
    }
  };

  useEffect(() => {
    let isCancelled = false;
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
        ['https://d25tgymtnqzu8s.cloudfront.net/', '/rtm-stream/'],
        ['https://d2xz2v5wuvgur6.cloudfront.net/', '/cf-d2xz/'],
        ['https://d2tjypxxy769fn.cloudfront.net/', '/cf-d2tj/'],
        ['https://d84q7nw4qf3j3.cloudfront.net/', '/cf-d84q/'],
        ['https://d3b0v7fggu5zwm.cloudfront.net/', '/cf-d3b0/'],
        ['https://slive.mana2.my/', '/mana2/'],
        ['http://ngtv-live-cbj.gcdn.co/', '/gcdn/'],
        ['https://ngtv-live-cbj.gcdn.co/', '/gcdn-s/'],
      ];

      // Clean up URL and route through proxy if needed
      let cleanUrl = channel.streamUrl ? channel.streamUrl.split('|')[0].trim() : '';
      for (const [from, to] of PROXY_MAP) {
        if (cleanUrl.startsWith(from)) {
          cleanUrl = window.location.origin + cleanUrl.replace(from, to);
          break;
        }
      }
      if (cleanUrl.startsWith('/')) {
        cleanUrl = window.location.origin + cleanUrl;
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

          // Configure Network Request Filter for Proxies
          const networkEngine = player.getNetworkingEngine();
          if (networkEngine) {
            networkEngine.registerRequestFilter((_type: any, request: any) => {
              const url = request.uris[0];
              for (const [from, to] of PROXY_MAP) {
                if (url.startsWith(from)) {
                  request.uris[0] = window.location.origin + url.replace(from, to);
                  break;
                }
              }
            });

            // Determine DRM Mode
            const isLicenseUrl = Boolean(
              channel.clearKey && (
                channel.clearKey.startsWith('http://') ||
                channel.clearKey.startsWith('https://') ||
                channel.clearKey.includes('/wvmax')
              )
            );
            const isClearKeyHex = Boolean(
              channel.clearKey && !isLicenseUrl && channel.clearKey.includes(':')
            );

            // RESPONSE FILTER: ONLY rewrite MPD for ClearKey DRM (NOT for Widevine license server)
            if (isDash && isClearKeyHex) {
              networkEngine.registerResponseFilter((type: any, response: any) => {
                // Only process MANIFEST responses
                if (type !== shaka.net.NetworkingEngine.RequestType.MANIFEST && type !== 0) return;

                let mpd: string;
                try {
                  mpd = new TextDecoder().decode(response.data);
                } catch (_e) { return; }

                if (!mpd.includes('<MPD') && !mpd.includes('<mpd')) return;

                const widevineUuid = 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed';
                const clearKeyUuid = 'urn:uuid:1077efec-c0b2-4d02-ace3-3c1e52e2fb4b';

                // 1. Replace Widevine UUID with ClearKey UUID
                let rewritten = mpd.replaceAll(widevineUuid, clearKeyUuid);

                // 2. Remove Widevine PSSH boxes from ClearKey ContentProtection so CDM uses default_KID directly
                rewritten = rewritten.replace(/<cenc:pssh>[^<]*<\/cenc:pssh>/g, '');

                // 3. Fix Mixed Content (HTTP -> HTTPS) for BaseURL
                rewritten = rewritten.replaceAll('<BaseURL>http://', '<BaseURL>https://');

                // 4. Inject ClearKey ContentProtection node preserving all KID attributes
                if (!rewritten.includes(clearKeyUuid)) {
                  rewritten = rewritten.replace(
                    /<ContentProtection\s+([^>]*?)schemeIdUri="urn:mpeg:dash:mp4protection:2011"([^>]*?)(\/?>)/gi,
                    (match, p1, p2, p3) => `${match}\n      <ContentProtection schemeIdUri="${clearKeyUuid}"${p1}${p2}${p3}`
                  );
                }

                response.data = new TextEncoder().encode(rewritten);
              });
            }

            // In Shaka Player: Configure DRM appropriately
            const drmConfig: any = {};

            if (isLicenseUrl) {
              let licenseUrl = channel.clearKey!.trim();
              for (const [from, to] of PROXY_MAP) {
                if (licenseUrl.startsWith(from)) {
                  licenseUrl = window.location.origin + licenseUrl.replace(from, to);
                  break;
                }
              }
              drmConfig.servers = {
                'com.widevine.alpha': licenseUrl,
                'com.microsoft.playready': licenseUrl,
              };
              drmConfig.advanced = {
                'com.widevine.alpha': {
                  videoRobustness: 'SW_SECURE_CRYPTO',
                  audioRobustness: 'SW_SECURE_CRYPTO',
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

            // Configure Shaka Player DRM & Streaming
            player.configure({
              drm: drmConfig,
              streaming: {
                lowLatencyMode: false,
                inaccurateManifestTolerance: 2,
                bufferingGoal: IS_IOS ? 6 : 15,
                rebufferingGoal: IS_IOS ? 2 : 4,
                bufferBehind: IS_IOS ? 5 : 15,
                stallEnabled: true,
                stallThreshold: 1,
                stallSkip: 0.5,
                safeSeekOffset: 2,
                retryParameters: {
                  maxAttempts: 8,
                  baseDelay: 500,
                  backoffFactor: 1.5,
                  fuzzFactor: 0.3,
                  timeout: 30000
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
                  maxAttempts: 8,
                  baseDelay: 500,
                  backoffFactor: 1.5,
                  fuzzFactor: 0.3,
                  timeout: 30000
                }
              },
              abr: {
                restrictions: IS_IOS ? {
                  maxHeight: 480,
                  maxBandwidth: 1000000
                } : {}
              }
            });

            player.addEventListener('error', (event: any) => {
              const detail = event?.detail;
              console.warn('[Player] Shaka error event:', detail?.code, detail?.message, detail);
              
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
              console.log('[Player] Shaka stall detected, auto-nudging playback...');
              try {
                video.currentTime += 0.25;
                video.play().catch(() => {});
              } catch (_e) {}
            });
          }

          let mimeType: string | undefined = undefined;
          if (isHls) mimeType = 'application/x-mpegurl';
          else if (isDash) mimeType = 'application/dash+xml';

          console.log(`[Player] Loading ${channel.name} via Shaka: ${cleanUrl.substring(0, 80)}...`);
          await player.load(cleanUrl, null, mimeType);
          if (isCancelled) return false;

          console.log(`[Player] ✅ ${channel.name} loaded successfully via Shaka`);
          await startPlay(video);
          return true;
        } catch (err: any) {
          console.error(`[Player] ❌ Shaka failed for ${channel.name}:`, err?.message || err, err);
          return false;
        }
      };

      // -------------------------------------------------------------
      // STRATEGY 2: HLS.JS (For HLS .m3u8 fallback)
      // -------------------------------------------------------------
      const tryHlsJs = async () => {
        if (!isHls || !Hls.isSupported()) return false;
        try {
          const hls = new Hls({
            enableWorker: !IS_IOS,
            lowLatencyMode: false,
            maxBufferLength: IS_IOS ? 5 : 30,
            maxMaxBufferLength: IS_IOS ? 8 : 60,
            maxBufferSize: IS_IOS ? 5 * 1000000 : 60 * 1000000,
            maxBufferHole: 0.5,
            liveSyncDurationCount: IS_IOS ? 2 : 3,
            liveMaxLatencyDurationCount: IS_IOS ? 4 : 10,
            capLevelToPlayerSize: IS_IOS,
          });
          hlsRef.current = hls;
          hls.loadSource(cleanUrl);
          hls.attachMedia(video);

          return new Promise<boolean>((resolve) => {
            hls.on(Hls.Events.MANIFEST_PARSED, async () => {
              if (isCancelled) return resolve(false);
              
              if (IS_IOS && hls.levels.length > 1) {
                const safeLevel = hls.levels.findIndex(l => l.height <= 480);
                if (safeLevel >= 0) {
                  hls.currentLevel = safeLevel;
                  hls.autoLevelCapping = safeLevel;
                }
              }
              
              await startPlay(video);
              resolve(true);
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

      // On iOS + HLS: Native AVFoundation is the most reliable
      if (IS_IOS && isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
        console.log(`[Player] iOS detected, using native HLS for ${channel.name}`);
        success = await tryNativeVideo();
      }

      // Default primary: Shaka Player (handles DASH, ClearKey DRM, and HLS)
      if (!success) {
        success = await tryShakaPlayer();
      }
      
      // Fallback for HLS streams
      if (!success && isHls) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          success = await tryNativeVideo();
        }
        if (!success) {
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

    // Watchdog to recover from decoder stalls
    let lastTime = -1;
    let stallCount = 0;
    const stallCheckInterval = setInterval(() => {
      const video = videoRef.current;
      const player = playerRef.current;
      if (!video || video.paused || video.ended || video.readyState < 2) {
        stallCount = 0;
        return;
      }

      const currentTime = video.currentTime;
      if (lastTime >= 0 && Math.abs(currentTime - lastTime) < 0.05) {
        stallCount++;
        if (stallCount >= 3) {
          console.log('[Player] Playback stall detected, nudging forward...');
          try {
            if (player && player.isLive()) {
              const seekRange = player.seekRange();
              video.currentTime = seekRange.end - 3;
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
    }, 1500);

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
        style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}
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
