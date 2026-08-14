import React, { useEffect, useRef, useState } from 'react';
import type { Channel } from './mockData';
import shaka from 'shaka-player/dist/shaka-player.ui.js';
import 'shaka-player/dist/controls.css';
import Hls from 'hls.js';
import { Play, AlertCircle, RefreshCw } from 'lucide-react';

interface PlayerProps {
  channel: Channel;
}

// Detect iOS once at module level
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

      // Clean up URL
      let cleanUrl = channel.streamUrl ? channel.streamUrl.split('|')[0].trim() : '';
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
            // On iOS, only proxy manifest requests. Let segments go direct to CDN.
            // This avoids the latency of double-hop through Vercel Edge for every 6s segment.
            networkEngine.registerRequestFilter((_type: any, request: any) => {
              const url = request.uris[0];
              const proxyMap: [string, string][] = [
                ['https://linearjitp-playback.astro.com.my/', '/astro-linear/'],
                ['https://d2xz2v5wuvgur6.cloudfront.net/', '/cf-d2xz/'],
                ['https://d2tjypxxy769fn.cloudfront.net/', '/cf-d2tj/'],
                ['https://d84q7nw4qf3j3.cloudfront.net/', '/cf-d84q/'],
                ['https://d3b0v7fggu5zwm.cloudfront.net/', '/cf-d3b0/'],
                ['https://d25tgymtnqzu8s.cloudfront.net/', '/rtm-stream/'],
                ['https://ptv2026.com/', '/ptv2026/'],
                ['https://load.ptv2026.com/', '/load-ptv/'],
                ['https://slive.mana2.my/', '/mana2/'],
                ['http://ngtv-live-cbj.gcdn.co/', '/gcdn/'],
                ['https://ngtv-live-cbj.gcdn.co/', '/gcdn-s/'],
              ];
              for (const [from, to] of proxyMap) {
                if (url.startsWith(from)) {
                  request.uris[0] = window.location.origin + url.replace(from, to);
                  break;
                }
              }
            });

            // RESPONSE FILTER: rewrite MPD — swap Widevine UUID → ClearKey UUID
            if (isDash && channel.clearKey) {
              networkEngine.registerResponseFilter((_type: any, response: any) => {
                let mpd: string;
                try {
                  mpd = new TextDecoder().decode(response.data);
                } catch (_e) { return; }

                if (!mpd.includes('<MPD') && !mpd.includes('<mpd')) return;

                const widevineUuid = 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed';
                const clearKeyUuid = 'urn:uuid:1077efec-c0b2-4d02-ace3-3c1e52e2fb4b';
                let rewritten = mpd.replaceAll(widevineUuid, clearKeyUuid);

                // Fix Mixed Content (HTTP -> HTTPS) for BaseURL
                rewritten = rewritten.replaceAll('<BaseURL>http://', '<BaseURL>https://');

                // Inject ClearKey ContentProtection node if missing
                if (!rewritten.includes(clearKeyUuid) && rewritten.includes('mp4protection')) {
                   rewritten = rewritten.replace(
                     /(<ContentProtection schemeIdUri="urn:mpeg:dash:mp4protection:2011"[^>]*>)/g,
                     `$1\n      <ContentProtection schemeIdUri="urn:uuid:1077efec-c0b2-4d02-ace3-3c1e52e2fb4b"/>`
                   );
                }

                response.data = new TextEncoder().encode(rewritten).buffer;
              });
            }

            // LICENSE REQUEST INTERCEPTOR
            const clearKeysMap: Record<string, string> = {};
            let jwkSetDataUrl = '';

            if (channel.clearKey) {
              const [rawKeyId, rawKey] = channel.clearKey.split(':');
              const normalizeHex = (s: string) => s.replace(/-/g, '').toLowerCase();
              const keyIdHex = normalizeHex(rawKeyId);
              const keyValueHex = normalizeHex(rawKey);

              const hexToBase64Url = (hex: string): string => {
                const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
                return btoa(String.fromCharCode(...bytes))
                  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
              };

              const kidB64 = hexToBase64Url(keyIdHex);
              const keyB64 = hexToBase64Url(keyValueHex);

              jwkSetDataUrl = 'data:application/json,' + encodeURIComponent(JSON.stringify({
                keys: [{ kty: 'oct', kid: kidB64, k: keyB64 }],
                type: 'temporary'
              }));

              networkEngine.registerRequestFilter((type: any, request: any) => {
                if (type === shaka.net.NetworkingEngine.RequestType.LICENSE || type === 5) {
                  request.uris[0] = jwkSetDataUrl;
                }
              });

              clearKeysMap[keyIdHex] = keyValueHex;
              if (rawKeyId.includes('-')) {
                clearKeysMap[rawKeyId.toLowerCase()] = keyValueHex;
              }
              if (keyIdHex.length === 32) {
                const hyphenatedKid = `${keyIdHex.slice(0,8)}-${keyIdHex.slice(8,12)}-${keyIdHex.slice(12,16)}-${keyIdHex.slice(16,20)}-${keyIdHex.slice(20)}`;
                clearKeysMap[hyphenatedKid] = keyValueHex;
              }

              try {
                const urlObj = new URL(cleanUrl);
                const kidParam = urlObj.searchParams.get('kid');
                if (kidParam) {
                  clearKeysMap[normalizeHex(kidParam)] = keyValueHex;
                  clearKeysMap[kidParam.toLowerCase()] = keyValueHex;
                }
              } catch (_e) { /* ignore */ }
            }

            // =====================================================
            // iOS-SPECIFIC: Extreme buffer minimization to prevent
            // WebKit SourceBuffer QuotaExceededError
            // =====================================================
            player.configure({
              drm: {
                clearKeys: clearKeysMap,
                servers: jwkSetDataUrl ? { 'org.w3.clearkey': jwkSetDataUrl } : {}
              },
              streaming: {
                lowLatencyMode: false,
                // iOS WebKit has ~30MB SourceBuffer limit.
                // At 4Mbps 1080p, 30 seconds = 15MB. Keep buffers tiny on iOS.
                bufferingGoal: IS_IOS ? 4 : 15,
                rebufferingGoal: IS_IOS ? 1 : 4,
                bufferBehind: IS_IOS ? 3 : 15,
                smallGapLimit: 1.0,
                jumpLargeGaps: true,
                retryParameters: {
                  maxAttempts: 8,
                  baseDelay: 300,
                  backoffFactor: 1.5,
                  fuzzFactor: 0.3,
                  timeout: 20000
                }
              },
              manifest: {
                dash: {
                  ignoreMinBufferTime: true,
                  autoCorrectDrift: true,
                },
                retryParameters: {
                  maxAttempts: 8,
                  baseDelay: 300,
                  backoffFactor: 1.5,
                  fuzzFactor: 0.3,
                  timeout: 20000
                }
              },
              abr: {
                restrictions: IS_IOS ? {
                  // Force max 480p on iOS to dramatically reduce segment sizes
                  // and prevent SourceBuffer memory overflow
                  maxHeight: 480,
                  maxBandwidth: 1000000
                } : {}
              }
            });

            // Error recovery: automatically retry on recoverable errors
            player.addEventListener('error', (event: any) => {
              const detail = event?.detail;
              console.warn('[Player] Shaka error:', detail?.code, detail?.message);
              
              // QuotaExceededError or BUFFER_APPEND_ERROR
              if (detail?.code === 3017 || detail?.code === 3015) {
                console.log('[Player] SourceBuffer quota exceeded, clearing buffer and retrying...');
                try {
                  // Seek to live edge to discard old buffered data
                  if (player.isLive()) {
                    video.currentTime = player.seekRange().end - 3;
                  }
                  player.retryStreaming();
                } catch (_e) {}
                return;
              }
              
              if (detail?.severity === shaka.util.Error.Severity.RECOVERABLE) {
                try { player.retryStreaming(); } catch (_e) {}
              }
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
          console.warn(`[Player] ❌ Shaka failed for ${channel.name}:`, err?.message || err);
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
            enableWorker: !IS_IOS, // Disable workers on iOS (WebKit compat)
            lowLatencyMode: false,
            maxBufferLength: IS_IOS ? 5 : 30,
            maxMaxBufferLength: IS_IOS ? 8 : 60,
            maxBufferSize: IS_IOS ? 5 * 1000000 : 60 * 1000000, // 5MB on iOS
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
              
              // On iOS: cap quality to lowest available level
              if (IS_IOS && hls.levels.length > 1) {
                // Find 480p or below
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
                // Try recovery before giving up
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
      // STRATEGY 3: NATIVE HTML5 VIDEO FALLBACK
      // -------------------------------------------------------------
      const tryNativeVideo = async () => {
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

      if (IS_IOS && isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
        // iOS + HLS: Always use native AVFoundation (most stable, hardware accelerated)
        console.log(`[Player] iOS detected, using native HLS for ${channel.name}`);
        success = await tryNativeVideo();
      }

      if (!success) {
        // Desktop or iOS+DASH: use Shaka Player
        success = await tryShakaPlayer();
      }
      
      if (!success && isHls) {
        // Fallback chain for HLS
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          success = await tryNativeVideo();
        }
        if (!success) {
          success = await tryHlsJs();
        }
      }
      
      if (!success) {
        success = await tryNativeVideo();
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
      } catch (playErr: any) {
        // Check if video actually has data loaded
        if (video.readyState >= 2) {
          // Video has data but autoplay is blocked by browser policy
          console.warn('Autoplay blocked by browser policy', playErr);
          setHasAutoplayError(true);
        } else {
          // Video has no data - this is a loading error, not autoplay block
          // Wait a moment for data to arrive, then try again
          console.warn('Video not ready yet, waiting...', playErr);
          await new Promise(r => setTimeout(r, 2000));
          try {
            await video.play();
          } catch (_e2) {
            console.warn('Retry play also failed, showing play button');
            setHasAutoplayError(true);
          }
        }
      }
    };

    // ===============================================================
    // iOS STALL WATCHDOG: Detect frozen playback and auto-recover
    // Checks every 1.5 seconds if currentTime has moved.
    // After 3 consecutive stalls (~4.5s frozen), force seek to live edge.
    // ===============================================================
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
        console.log(`[Player] Stall detected #${stallCount} at t=${currentTime.toFixed(1)}`);
        
        if (stallCount >= 3) {
          console.log('[Player] Persistent stall — seeking to live edge...');
          try {
            if (player && player.isLive()) {
              // Seek to 3 seconds before live edge
              const seekRange = player.seekRange();
              video.currentTime = seekRange.end - 3;
              player.retryStreaming();
            } else {
              // Non-Shaka: just nudge forward
              video.currentTime += 1;
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
        // First try playing muted (guaranteed to work)
        video.muted = true;
        await video.play();
        // Once playing, unmute
        video.muted = false;
        setHasAutoplayError(false);
      } catch (e1) {
        console.warn('Muted play failed, trying unmuted user-gesture play', e1);
        try {
          // Fallback: try unmuted play (should work within user gesture)
          video.muted = false;
          await video.play();
          setHasAutoplayError(false);
        } catch (e2) {
          console.error('All play attempts failed', e2);
          // Last resort: keep it muted but playing
          try {
            video.muted = true;
            await video.play();
            setHasAutoplayError(false);
          } catch (_e3) {}
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
