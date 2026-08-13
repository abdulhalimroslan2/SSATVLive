import React, { useEffect, useRef, useState } from 'react';
import type { Channel } from './mockData';
import shaka from 'shaka-player/dist/shaka-player.ui.js';
import 'shaka-player/dist/controls.css';
import Hls from 'hls.js';
import { Play, AlertCircle, RefreshCw } from 'lucide-react';

interface PlayerProps {
  channel: Channel;
}

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
      const tryShakaPlayer = async () => {
        try {
          shaka.polyfill.installAll();
          if (!shaka.Player.isBrowserSupported()) throw new Error('Shaka not supported');

          const player = new shaka.Player();
          playerRef.current = player;

          await player.attach(video);
          if (isCancelled) return;

          const ui = new shaka.ui.Overlay(player, container, video);
          uiRef.current = ui;
          ui.getControls();

          // Configure Network Request Filter for Proxies
          const networkEngine = player.getNetworkingEngine();
          if (networkEngine) {
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
            // This allows Shaka to use its built-in ClearKey EME path
            if (isDash && channel.clearKey) {
              networkEngine.registerResponseFilter((_type: any, response: any) => {
                const url: string = response.uri || '';
                if (!url.includes('.mpd')) return;

                let mpd: string;
                try {
                  mpd = new TextDecoder().decode(response.data);
                } catch (_e) { return; }

                // Replace Widevine UUID with W3C ClearKey UUID
                const widevineUuid = 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed';
                const clearKeyUuid = 'urn:uuid:1077efec-c0b2-4d02-ace3-3c1e52e2fb4b';
                const rewritten = mpd.replaceAll(widevineUuid, clearKeyUuid);

                response.data = new TextEncoder().encode(rewritten).buffer;
              });
            }

            // LICENSE REQUEST INTERCEPTOR: intercept ClearKey license requests
            // and return JWK key set directly (no external server needed)
            if (channel.clearKey) {
              const [rawKeyId, rawKey] = channel.clearKey.split(':');
              const normalizeHex = (s: string) => s.replace(/-/g, '').toLowerCase();
              const keyIdHex = normalizeHex(rawKeyId);
              const keyValueHex = normalizeHex(rawKey);

              // Base64url encode hex key bytes
              const hexToBase64Url = (hex: string): string => {
                const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
                return btoa(String.fromCharCode(...bytes))
                  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
              };

              const kidB64 = hexToBase64Url(keyIdHex);
              const keyB64 = hexToBase64Url(keyValueHex);

              networkEngine.registerRequestFilter((type: any, request: any) => {
                // type 5 = LICENSE
                if (type !== 5) return;
                const url: string = request.uris[0] || '';
                // Only intercept ClearKey license requests
                if (!url.includes('clearkey') && !url.includes('1077efec')) return;

                // Parse license request to get requested KIDs, return JWK response
                const jwkSet = JSON.stringify({
                  keys: [{ kty: 'oct', kid: kidB64, k: keyB64 }],
                  type: 'temporary'
                });

                // Override: respond directly by throwing a special shaka response
                request.uris[0] = 'data:application/json,' + encodeURIComponent(jwkSet);
              });

              // Configure clearKeys map as backup
              const clearKeysMap: Record<string, string> = {};
              clearKeysMap[keyIdHex] = keyValueHex;

              // Also add URL kid param variant
              try {
                const urlObj = new URL(cleanUrl);
                const kidParam = urlObj.searchParams.get('kid');
                if (kidParam) clearKeysMap[normalizeHex(kidParam)] = keyValueHex;
              } catch (_e) { /* ignore */ }

              player.configure({
                drm: {
                  clearKeys: clearKeysMap,
                },
                streaming: {
                  lowLatencyMode: false,
                  bufferingGoal: 30,
                  rebufferingGoal: 5,
                  bufferBehind: 30,
                  retryParameters: {
                    maxAttempts: 6,
                    baseDelay: 500,
                    backoffFactor: 1.5,
                    fuzzFactor: 0.3,
                    timeout: 30000
                  }
                }
              });
            }
          }

          let mimeType: string | undefined = undefined;
          if (isHls) mimeType = 'application/x-mpegurl';
          else if (isDash) mimeType = 'application/dash+xml';

          console.log(`[Player] Loading ${channel.name} via Shaka: ${cleanUrl.substring(0, 80)}...`);
          await player.load(cleanUrl, null, mimeType);
          if (isCancelled) return;

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
            enableWorker: true,
            lowLatencyMode: true,
          });
          hlsRef.current = hls;
          hls.loadSource(cleanUrl);
          hls.attachMedia(video);

          return new Promise<boolean>((resolve) => {
            hls.on(Hls.Events.MANIFEST_PARSED, async () => {
              if (isCancelled) return resolve(false);
              await startPlay(video);
              resolve(true);
            });
            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (data.fatal) {
                console.warn('Hls.js fatal error:', data);
                resolve(false);
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

      // Attempt Playback Hierarchy
      let success = await tryShakaPlayer();
      
      if (!success && isHls) {
        // Apple devices (iOS Safari/Chrome, macOS Safari) have flawless native HLS support.
        // Hls.js via MSE often freezes or stalls on iOS.
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          success = await tryNativeVideo();
        }
        
        // If native HLS failed or wasn't supported (e.g. Windows/Android), fallback to hls.js
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
        await video.play();
      } catch (playErr) {
        console.warn('Autoplay blocked by browser policy', playErr);
        setHasAutoplayError(true);
      }
    };

    initStream();

    return () => {
      isCancelled = true;
      cleanupPlayers();
    };
  }, [channel.contentId]);

  const handleManualPlayUnmute = async () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      try {
        await videoRef.current.play();
        setHasAutoplayError(false);
      } catch (e) {
        console.error('Manual play failed', e);
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
