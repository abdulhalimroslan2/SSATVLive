import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Play,
  Plus,
  Check,
  ChevronRight,
  ChevronDown,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Subtitles,
  Pause,
  X,
  AlertCircle,
} from 'lucide-react';
import type { Channel } from './mockData';
import { Player } from './Player';
import {
  getCurrentProgramme,
  getTimelineSlotsForChannel,
  getDynamicTimelineLabels,
  type EpgProgramme,
} from './epgService';

interface LiveTvViewProps {
  channels: Channel[];
  activeChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
}

// Categories arranged strictly according to SSATVLive_Plus_v6 (1).apk
const APK_CATEGORIES = [
  'MALAYSIA',
  'INDONESIA',
  'CHINESE',
  'KOREAN',
  'INDIAN',
  'MOVIES',
  'ENTERTAINMENT',
  'KNOWLEDGE',
  'KIDS',
  'NEWS',
  'SPORTS FHD',
  'RADIO',
];

export const LiveTvView: React.FC<LiveTvViewProps> = ({
  channels,
  activeChannel,
  onSelectChannel,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('MALAYSIA');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [inList, setInList] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<'TODAY' | 'TOMORROW'>('TODAY');
  const [showTrackModal, setShowTrackModal] = useState<boolean>(false);
  const [activeTrackTab, setActiveTrackTab] = useState<'subtitles' | 'audio'>('subtitles');
  const [subtitleTracks, setSubtitleTracks] = useState<any[]>([]);
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [isSubtitleVisible, setIsSubtitleVisible] = useState<boolean>(false);
  const [activeSubtitleId, setActiveSubtitleId] = useState<number | string | null>('off');
  const [activeAudioId, setActiveAudioId] = useState<number | string | null>(null);
  const [subtitleToast, setSubtitleToast] = useState<string | null>(null);
  const toastTimerRef = useRef<any>(null);

  const triggerSubtitleToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setSubtitleToast(msg);
    toastTimerRef.current = setTimeout(() => {
      setSubtitleToast(null);
    }, 2800);
  };

  // Sync subtitle and audio tracks from Shaka Player
  useEffect(() => {
    const handleTracksUpdated = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      const subs = detail.subtitles || [];
      const auds = detail.variants || detail.audio || [];
      setSubtitleTracks(subs);
      setAudioTracks(auds);
      setIsSubtitleVisible(detail.isSubtitleVisible || false);

      const activeSub = subs.find((s: any) => s.active);
      if (activeSub && detail.isSubtitleVisible) {
        setActiveSubtitleId(activeSub.id);
      } else if (!detail.isSubtitleVisible) {
        setActiveSubtitleId('off');
      }

      const activeAud = auds.find((a: any) => a.active);
      if (activeAud) {
        setActiveAudioId(activeAud.id);
      }
    };

    window.addEventListener('ssatv-tracks-updated', handleTracksUpdated);
    return () => {
      window.removeEventListener('ssatv-tracks-updated', handleTracksUpdated);
    };
  }, []);

  // Controls for video playback & mute
  const togglePlay = () => {
    const video = document.querySelector('.ssatv-live-viewport video') as HTMLVideoElement;
    if (video) {
      if (video.paused) {
        video.play().catch(() => {});
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const video = document.querySelector('.ssatv-live-viewport video') as HTMLVideoElement;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    } else {
      setIsMuted(!isMuted);
    }
  };

  const formatTrackLanguage = (lang: string, label?: string | null): string => {
    if (label && label.trim() && label !== lang) return label;
    const l = (lang || '').toLowerCase().trim();
    if (l.startsWith('may') || l.startsWith('ms') || l.startsWith('zlm')) return 'Bahasa Melayu';
    if (l.startsWith('eng') || l.startsWith('en')) return 'English';
    if (l.startsWith('chi') || l.startsWith('zh') || l.startsWith('zho')) return 'Bahasa Cina (中文)';
    if (l.startsWith('tam') || l.startsWith('ta')) return 'Bahasa Tamil (தமிழ்)';
    if (l.startsWith('ind') || l.startsWith('id')) return 'Bahasa Indonesia';
    if (l.startsWith('kor') || l.startsWith('ko')) return 'Bahasa Korea (한국어)';
    if (l.startsWith('jpn') || l.startsWith('ja')) return 'Bahasa Jepun (日本語)';
    if (l.startsWith('tha') || l.startsWith('th')) return 'Bahasa Thai (ไทย)';
    if (l.startsWith('hin') || l.startsWith('hi')) return 'Bahasa Hindi (हिन्दी)';
    if (l.startsWith('ara') || l.startsWith('ar')) return 'Bahasa Arab (العربية)';
    return lang ? lang.toUpperCase() : 'Standard';
  };

  const formatLanguageBadge = (lang: string): string => {
    const l = (lang || '').toLowerCase().trim();
    if (l.startsWith('may') || l.startsWith('ms')) return 'BM';
    if (l.startsWith('eng') || l.startsWith('en')) return 'ENG';
    if (l.startsWith('chi') || l.startsWith('zh')) return 'CN';
    if (l.startsWith('tam') || l.startsWith('ta')) return 'TAM';
    if (l.startsWith('ind') || l.startsWith('id')) return 'ID';
    if (l.startsWith('kor') || l.startsWith('ko')) return 'KR';
    if (l.startsWith('jpn') || l.startsWith('ja')) return 'JP';
    return (lang || 'CC').slice(0, 3).toUpperCase();
  };

  // Filter channels based on selected APK category
  const categoryChannels = useMemo(() => {
    if (!channels || channels.length === 0) return [];
    return channels.filter(
      (c) => c.category && c.category.toUpperCase() === activeCategory.toUpperCase()
    );
  }, [channels, activeCategory]);

  // Current playing channel: either activeChannel prop, or first channel in active category, or TV3 FHD
  const currentChannel: Channel = useMemo(() => {
    if (activeChannel) return activeChannel;
    if (categoryChannels.length > 0) return categoryChannels[0];
    const defaultTv3 = channels.find(
      (c) => c.name.toUpperCase().includes('TV3') || c.contentId.toLowerCase() === 'tv3'
    );
    return defaultTv3 || channels[0] || ({} as Channel);
  }, [activeChannel, categoryChannels, channels]);

  // Real-time clock sync (ticks every 30s so EPG dynamically stays synchronized with device)
  const [clockNow, setClockNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setClockNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Real currently airing programme from EPG matching device clock
  const currentProgram: EpgProgramme = useMemo(() => {
    if (!currentChannel || !currentChannel.name) {
      return {
        title: 'Siaran Langsung',
        desc: 'Tonton siaran langsung saluran definisi tinggi di SSATV.',
        start: '',
        stop: '',
        date: '',
        startHour: clockNow.getHours(),
        timeSlot: `${clockNow.getHours() % 12 || 12}:00 - ${(clockNow.getHours() + 1) % 12 || 12}:00`,
        genre: 'Live TV',
      };
    }
    return getCurrentProgramme(currentChannel, clockNow);
  }, [currentChannel, clockNow]);

  // Live Channels carousel list (top 10 channels in active category)
  const carouselChannels = useMemo(() => {
    return categoryChannels.length > 0 ? categoryChannels.slice(0, 10) : channels.slice(0, 10);
  }, [categoryChannels, channels]);

  // All Channels grid (all channels in active category)
  const gridChannels = useMemo(() => {
    return categoryChannels.length > 0 ? categoryChannels : channels.slice(0, 18);
  }, [categoryChannels, channels]);

  // Top channels for EPG Guide table (top 6 in active category)
  const guideChannels = useMemo(() => {
    return categoryChannels.length >= 4 ? categoryChannels.slice(0, 6) : channels.slice(0, 6);
  }, [categoryChannels, channels]);

  const handleSelectChannel = (ch: Channel) => {
    onSelectChannel(ch);
    setIsPlaying(true);
  };

  const handleWatchLive = () => {
    handleSelectChannel(currentChannel);

    const container =
      (document.querySelector('.ssatv-live-viewport') as HTMLElement) ||
      (document.querySelector('.video-player-container') as HTMLElement) ||
      (document.querySelector('video') as HTMLElement);

    const video = document.querySelector('video') as HTMLVideoElement | null;

    if (container) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if ((container as any).mozRequestFullScreen) {
        (container as any).mozRequestFullScreen();
      } else if (video && (video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen();
      }
    }
  };

  const epgTimeline = useMemo(() => getDynamicTimelineLabels(clockNow), [clockNow]);

  const liveScrubberPercent = useMemo(() => {
    const m = clockNow.getMinutes();
    return Math.min(100, Math.max(5, Math.round((m / 60) * 100)));
  }, [clockNow]);

  return (
    <div className="ssatv-livetv-container">
      {/* 1. BROWSE BY CATEGORY PILLS (Arranged strictly according to APK) */}
      <section className="ssatv-browse-live-section" style={{ marginTop: 0, marginBottom: 8 }}>
        <div className="ssatv-category-pills-row">
          {APK_CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`ssatv-cat-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 2. SPLIT-HERO LIVE STAGE (60% / 40%) */}
      <section className="ssatv-live-hero-stage">
        {/* Left: Embedded 16:9 Live Video Player with Apple TV HUD */}
        <div className="ssatv-live-player-pane">
          <div className="ssatv-live-viewport">
            {currentChannel && currentChannel.streamUrl ? (
              <Player key={currentChannel.id || 'live_hero'} channel={currentChannel} hideOverlay />
            ) : (
              <div className="ssatv-live-fallback-img" style={{ background: '#07090e' }} />
            )}

            {/* Top-Left Red Live Badge */}
            <div className="ssatv-player-live-badge">
              <span className="ssatv-live-pulse-dot" />
              LIVE
            </div>

            {/* Apple TV On-Screen Subtitle / Audio Feedback Pill */}
            {subtitleToast && (
              <div className="ssatv-subtitle-toast-pill">
                <Subtitles size={16} />
                <span>{subtitleToast}</span>
              </div>
            )}

            {/* Custom Apple TV Bottom Control HUD */}
            <div className="ssatv-live-hud-bar">
              <div className="ssatv-hud-left">
                <button
                  className="ssatv-hud-btn"
                  onClick={togglePlay}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={17} /> : <Play size={17} />}
                </button>

                <button
                  className="ssatv-hud-btn"
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                </button>

                <span className="ssatv-hud-live-label">
                  <span className="ssatv-live-pulse-dot" />
                  LIVE
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                  {currentChannel.name}
                </span>
              </div>

              {/* Scrubber Bar synced with real hour progress */}
              <div className="ssatv-hud-scrubber-track">
                <div className="ssatv-hud-scrubber-fill" style={{ width: `${liveScrubberPercent}%` }} />
                <div className="ssatv-hud-scrubber-handle" style={{ left: `${liveScrubberPercent}%` }} />
              </div>

              <div className="ssatv-hud-right">
                <div style={{ position: 'relative' }}>
                  <button
                    className={`ssatv-hud-btn ${isSubtitleVisible ? 'ssatv-hud-btn-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTrackModal(!showTrackModal);
                    }}
                    title="Pilih Sarikata & Audio (Subtitles)"
                  >
                    <Subtitles size={17} />
                    {isSubtitleVisible && <span className="ssatv-sub-active-badge">ON</span>}
                  </button>

                  {/* Apple TV Track Selector Popover */}
                  {showTrackModal && (
                    <div
                      className="ssatv-track-popover animate-fade-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="ssatv-track-header">
                        <div className="ssatv-track-header-left">
                          <Subtitles size={16} style={{ color: 'var(--ssatv-red)' }} />
                          <span className="ssatv-track-title">Pilihan Sarikata & Audio</span>
                        </div>
                        <button
                          className="ssatv-track-close"
                          onClick={() => setShowTrackModal(false)}
                          title="Tutup"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Tabs */}
                      <div className="ssatv-track-tabs">
                        <button
                          className={`ssatv-track-tab ${activeTrackTab === 'subtitles' ? 'active' : ''}`}
                          onClick={() => setActiveTrackTab('subtitles')}
                        >
                          Sarikata {subtitleTracks.length > 0 ? `(${subtitleTracks.length})` : ''}
                        </button>
                        <button
                          className={`ssatv-track-tab ${activeTrackTab === 'audio' ? 'active' : ''}`}
                          onClick={() => setActiveTrackTab('audio')}
                        >
                          Audio {audioTracks.length > 0 ? `(${audioTracks.length})` : ''}
                        </button>
                      </div>

                      {/* Tab Content: Subtitles */}
                      {activeTrackTab === 'subtitles' && (
                        <div className="ssatv-track-list">
                          {/* Option: Turn Off Subtitles */}
                          <button
                            className={`ssatv-track-item ${!isSubtitleVisible || activeSubtitleId === 'off' ? 'selected' : ''}`}
                            onClick={() => {
                              (window as any).__ssatv_player_controller?.selectSubtitle('off');
                              setActiveSubtitleId('off');
                              setIsSubtitleVisible(false);
                              triggerSubtitleToast('Sarikata Dimatikan (Off)');
                            }}
                          >
                            <div className="ssatv-track-item-left">
                              <span className="ssatv-track-badge">OFF</span>
                              <span className="ssatv-track-name">Matikan Sarikata (Off)</span>
                            </div>
                            {(!isSubtitleVisible || activeSubtitleId === 'off') && (
                              <Check size={16} className="ssatv-track-check" />
                            )}
                          </button>

                          {/* Dynamic Stream Subtitles */}
                          {subtitleTracks.length > 0 ? (
                            subtitleTracks.map((track) => {
                              const isSelected = isSubtitleVisible && (activeSubtitleId === track.id || track.active);
                              const trackLabel = formatTrackLanguage(track.language, track.label);
                              return (
                                <button
                                  key={track.id}
                                  className={`ssatv-track-item ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    (window as any).__ssatv_player_controller?.selectSubtitle(track.id);
                                    setActiveSubtitleId(track.id);
                                    setIsSubtitleVisible(true);
                                    triggerSubtitleToast(`Sarikata: ${trackLabel}`);
                                  }}
                                >
                                  <div className="ssatv-track-item-left">
                                    <span className="ssatv-track-badge">
                                      {formatLanguageBadge(track.language)}
                                    </span>
                                    <span className="ssatv-track-name">
                                      {trackLabel}
                                    </span>
                                  </div>
                                  {isSelected && <Check size={16} className="ssatv-track-check" />}
                                </button>
                              );
                            })
                          ) : (
                            <div className="ssatv-track-empty-note">
                              <AlertCircle size={14} style={{ flexShrink: 0, color: 'rgba(255,255,255,0.6)' }} />
                              <span>Tiada sarikata digital tertanam (Embedded Subtitles) dalam suapan saluran ini.</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab Content: Audio Languages */}
                      {activeTrackTab === 'audio' && (
                        <div className="ssatv-track-list">
                          {audioTracks.length > 0 ? (
                            Array.from(new Set(audioTracks.map((t: any) => t.language || 'original'))).map((lang: any) => {
                              const matchingTrack = audioTracks.find((t: any) => (t.language || 'original') === lang);
                              const isSelected = activeAudioId === matchingTrack?.id || matchingTrack?.active;
                              const audioLabel = formatTrackLanguage(lang);
                              return (
                                <button
                                  key={lang}
                                  className={`ssatv-track-item ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    if (matchingTrack) {
                                      (window as any).__ssatv_player_controller?.selectAudio(matchingTrack.id);
                                      setActiveAudioId(matchingTrack.id);
                                      triggerSubtitleToast(`Audio: ${audioLabel}`);
                                    }
                                  }}
                                >
                                  <div className="ssatv-track-item-left">
                                    <span className="ssatv-track-badge">{formatLanguageBadge(lang)}</span>
                                    <span className="ssatv-track-name">{audioLabel}</span>
                                  </div>
                                  {isSelected && <Check size={16} className="ssatv-track-check" />}
                                </button>
                              );
                            })
                          ) : (
                            <div className="ssatv-track-empty-note">
                              <span>Hanya 1 aliran audio utama aktif (Default).</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button className="ssatv-hud-btn" title="Settings / Quality">
                  <Settings size={17} />
                </button>
                <button
                  className="ssatv-hud-btn"
                  onClick={() => {
                    const el = document.querySelector('.ssatv-live-viewport');
                    if (el) {
                      if (!document.fullscreenElement) {
                        el.requestFullscreen().catch(() => {});
                      } else {
                        document.exitFullscreen().catch(() => {});
                      }
                    }
                  }}
                  title="Fullscreen"
                >
                  <Maximize size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Editorial Showcase */}
        <div className="ssatv-live-editorial-pane">
          {/* Tag */}
          <div className="ssatv-live-now-tag">LIVE NOW</div>

          {/* Real Channel Brand with Logo / Number */}
          <div className="ssatv-live-channel-brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {currentChannel.thumbnail && (
              <img
                src={currentChannel.thumbnail}
                alt={currentChannel.name}
                style={{ height: 26, width: 'auto', objectFit: 'contain' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
            <span className="ssatv-brand-text">{currentChannel.name}</span>
            {currentChannel.ch_number && (
              <span className="ssatv-brand-num-badge">{currentChannel.ch_number}</span>
            )}
          </div>

          {/* Real Airing Program Title from EPG */}
          <h1 className="ssatv-live-prog-title">{currentProgram.title}</h1>

          {/* Real Meta & Category Pill */}
          <div className="ssatv-live-prog-meta">
            <span className="ssatv-prog-time">{currentProgram.timeSlot}</span>
            <span className="ssatv-prog-genre-pill">
              {currentChannel.category || 'MALAYSIA'}
            </span>
            <span className="ssatv-prog-genre-pill" style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa' }}>
              FHD 1080p
            </span>
          </div>

          {/* Crimson Divider Line */}
          <div className="ssatv-live-divider-line" />

          {/* Real Synopsis from EPG */}
          <p className="ssatv-live-prog-synopsis">
            {currentProgram.desc ||
              `Tonton siaran langsung saluran ${currentChannel.name}. Menampilkan rancangan hiburan, berita dan siaran eksklusif berkualiti tinggi.`}
          </p>

          {/* Dual Action Buttons */}
          <div className="ssatv-live-actions">
            <button className="ssatv-btn-watch" onClick={handleWatchLive}>
              <Play size={18} fill="#000" color="#000" />
              <span>WATCH LIVE</span>
            </button>

            <button
              className={`ssatv-btn-list ${inList ? 'in-list' : ''}`}
              onClick={() => setInList(!inList)}
            >
              {inList ? (
                <>
                  <Check size={18} color="#ff2a4b" />
                  <span>IN MY LIST</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>ADD TO MY LIST</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 3. LIVE CHANNELS CAROUSEL (Real Channel Names & Real Airing EPG Shows) */}
      <section className="ssatv-live-shelf-section">
        <div className="ssatv-row-header">
          <h2 className="ssatv-row-title">
            <span>Saluran Langsung {activeCategory}</span>
            <ChevronRight size={18} className="ssatv-row-chevron" />
          </h2>
        </div>

        <div className="ssatv-live-channels-row">
          {carouselChannels.map((ch) => {
            const isSelected = currentChannel.id === ch.id;
            const prog = getCurrentProgramme(ch);

            return (
              <div
                key={ch.id}
                className={`ssatv-live-channel-card ${isSelected ? 'active-glow' : ''}`}
                onClick={() => handleSelectChannel(ch)}
              >
                <div className="ssatv-live-card-thumb-wrap">
                  {ch.thumbnail ? (
                    <img
                      src={ch.thumbnail}
                      alt={ch.name}
                      className="ssatv-live-card-img"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLElement).style.opacity = '0.3';
                      }}
                    />
                  ) : (
                    <div
                      className="ssatv-live-card-img"
                      style={{
                        background: 'linear-gradient(135deg, #161a23, #0a0d14)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.4)',
                        fontWeight: 700,
                        fontSize: '1.2rem',
                      }}
                    >
                      {ch.name}
                    </div>
                  )}
                  <div className="ssatv-live-card-overlay" />

                  {/* Card Content Overlay */}
                  <div className="ssatv-live-card-inner">
                    <div className="ssatv-live-card-badge">
                      <span className="ssatv-live-pulse-dot" />
                      LIVE
                    </div>

                    <div className="ssatv-live-card-bottom">
                      <div className="ssatv-live-card-brand">
                        <span>{ch.name}</span>
                        {ch.ch_number && (
                          <span className="ssatv-brand-num-small">{ch.ch_number}</span>
                        )}
                      </div>
                      <div className="ssatv-live-card-prog" title={prog.title}>
                        {prog.title}
                      </div>
                      <div className="ssatv-live-card-time">{prog.timeSlot}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. ALL CHANNELS GRID (Real Channels in active category) */}
      <section className="ssatv-all-channels-section">
        <div className="ssatv-row-header">
          <h2 className="ssatv-row-title">
            <span>Semua Saluran {activeCategory} ({gridChannels.length})</span>
          </h2>
        </div>

        <div className="ssatv-all-channels-grid">
          {gridChannels.map((ch) => {
            const prog = getCurrentProgramme(ch);
            const isSelected = currentChannel.id === ch.id;

            return (
              <div
                key={ch.id}
                className={`ssatv-grid-channel-card ${isSelected ? 'active-glow' : ''}`}
                onClick={() => handleSelectChannel(ch)}
              >
                <div className="ssatv-grid-card-thumb">
                  {ch.thumbnail ? (
                    <img
                      src={ch.thumbnail}
                      alt={ch.name}
                      className="ssatv-grid-img"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLElement).style.opacity = '0.3';
                      }}
                    />
                  ) : (
                    <div
                      className="ssatv-grid-img"
                      style={{
                        background: 'linear-gradient(135deg, #151822, #0b0e16)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.4)',
                        fontWeight: 700,
                      }}
                    >
                      {ch.name}
                    </div>
                  )}
                  <div className="ssatv-grid-overlay" />

                  <div className="ssatv-grid-top-brand">
                    <span>{ch.name}</span>
                    {ch.ch_number && (
                      <span className="ssatv-brand-num-small">{ch.ch_number}</span>
                    )}
                  </div>

                  <div className="ssatv-grid-bottom-info">
                    <div className="ssatv-grid-live-indicator">
                      <span className="ssatv-live-pulse-dot" />
                      LIVE
                    </div>
                    <div className="ssatv-grid-title" title={prog.title}>
                      {prog.title}
                    </div>
                    <div className="ssatv-grid-time">{prog.timeSlot}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. INTERACTIVE TV GUIDE (REAL EPG TIMELINE GRID) */}
      <section className="ssatv-epg-section">
        <div className="ssatv-epg-header">
          <h2 className="ssatv-row-title">
            <span>PANDUAN RANCANGAN TV (EPG)</span>
          </h2>

          <div
            className="ssatv-epg-day-selector"
            onClick={() => setSelectedDay(selectedDay === 'TODAY' ? 'TOMORROW' : 'TODAY')}
            title="Tukar Hari"
          >
            <span>{selectedDay === 'TODAY' ? 'HARI INI' : 'ESOK'}</span>
            <ChevronDown size={14} />
          </div>
        </div>

        <div className="ssatv-epg-grid-wrap">
          {/* Time Header Row */}
          <div className="ssatv-epg-time-row">
            <div className="ssatv-epg-channel-col-header">SALURAN</div>
            <div className="ssatv-epg-timeline-cells">
              {epgTimeline.map((t) => (
                <div
                  key={t}
                  className={`ssatv-epg-time-header ${t === 'NOW' ? 'active-now' : ''}`}
                >
                  {t}
                  {t === 'NOW' && <span className="ssatv-epg-now-needle" />}
                </div>
              ))}
            </div>
          </div>

          {/* Channel Program Rows from Real EPG */}
          <div className="ssatv-epg-rows-stack">
            {guideChannels.map((ch) => {
              const slotsData = getTimelineSlotsForChannel(ch, clockNow);
              const isSelected = currentChannel.id === ch.id;
              const slotList = slotsData.dynamicSlots;

              return (
                <div key={ch.id} className={`ssatv-epg-row ${isSelected ? 'active-row' : ''}`}>
                  {/* Channel Label */}
                  <div
                    className="ssatv-epg-channel-cell"
                    onClick={() => handleSelectChannel(ch)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="ssatv-epg-ch-name">{ch.name}</span>
                    {ch.ch_number && (
                      <span className="ssatv-brand-num-small">{ch.ch_number}</span>
                    )}
                  </div>

                  {/* Program Slots */}
                  <div className="ssatv-epg-slots-cells">
                    {slotList.map((item, sIdx) => (
                      <div
                        key={sIdx}
                        className={`ssatv-epg-program-block ${item.isNow ? 'is-airing-now' : ''}`}
                        onClick={() => handleSelectChannel(ch)}
                      >
                        <div className="ssatv-epg-slot-title" title={item.programme.title}>
                          {item.programme.title}
                        </div>
                        <div className="ssatv-epg-slot-meta">
                          <span className="ssatv-epg-slot-time">{item.programme.timeSlot}</span>
                          <span className="ssatv-epg-slot-genre">
                            {item.programme.genre || ch.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
