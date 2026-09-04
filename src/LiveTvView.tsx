import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Plus,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  Pause,
  X,
  AlertCircle,
  Search,
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
  onBack?: () => void;
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
  onBack,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('MALAYSIA');

  // Synchronize active category with activeChannel if selected externally (e.g. from Home Live Now)
  useEffect(() => {
    if (activeChannel?.category) {
      const match = APK_CATEGORIES.find(
        (cat) => cat.toUpperCase() === activeChannel.category.toUpperCase()
      );
      if (match) {
        setActiveCategory(match);
      }
    }
  }, [activeChannel]);

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

  // Fullscreen & Controls Visibility Management
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showOverlayControls, setShowOverlayControls] = useState<boolean>(true);
  const [isIdle, setIsIdle] = useState<boolean>(false);
  const hideControlsTimerRef = useRef<any>(null);
  const liveViewportRef = useRef<HTMLDivElement>(null);

  // Channel Dropdown State in Fullscreen Topbar
  const [showChannelDropdown, setShowChannelDropdown] = useState<boolean>(false);
  const [channelSearchQuery, setChannelSearchQuery] = useState<string>('');
  const [dropdownCategory, setDropdownCategory] = useState<string>('ALL');
  const channelDropdownRef = useRef<HTMLDivElement>(null);

  const resetHideTimer = useCallback(() => {
    setShowOverlayControls(true);
    setIsIdle(false);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    // Only set auto-hide timer if neither the track modal nor channel dropdown is open
    if (!showTrackModal && !showChannelDropdown) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowOverlayControls(false);
        setIsIdle(true);
      }, 3500);
    }
  }, [showTrackModal, showChannelDropdown]);

  // Keep controls persistently visible whenever the track modal or channel dropdown is open
  useEffect(() => {
    if (showTrackModal || showChannelDropdown) {
      setShowOverlayControls(true);
      setIsIdle(false);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    } else {
      resetHideTimer();
    }
  }, [showTrackModal, showChannelDropdown, resetHideTimer]);

  // Close channel dropdown on click outside
  useEffect(() => {
    if (!showChannelDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        channelDropdownRef.current &&
        !channelDropdownRef.current.contains(e.target as Node)
      ) {
        setShowChannelDropdown(false);
        resetHideTimer();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showChannelDropdown, resetHideTimer]);

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

  const [isVideoBuffering, setIsVideoBuffering] = useState<boolean>(false);
  const [isVideoPaused, setIsVideoPaused] = useState<boolean>(false);

  // Controls for video playback & mute
  const togglePlay = useCallback(() => {
    const video = document.querySelector('.ssatv-live-viewport video') as HTMLVideoElement;
    if (video) {
      if (video.paused) {
        video.play().catch(() => {});
        setIsPlaying(true);
        setIsVideoPaused(false);
      } else {
        video.pause();
        setIsPlaying(false);
        setIsVideoPaused(true);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
    resetHideTimer();
  }, [resetHideTimer]);

  const toggleMute = useCallback(() => {
    const video = document.querySelector('.ssatv-live-viewport video') as HTMLVideoElement;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    } else {
      setIsMuted((prev) => !prev);
    }
    resetHideTimer();
  }, [resetHideTimer]);

  // Sync isMuted state with live video element & Auto-unmute on any user interaction
  useEffect(() => {
    const updateAudioSync = () => {
      const video = document.querySelector('.ssatv-live-viewport video') as HTMLVideoElement;
      if (video) {
        setIsMuted(video.muted);
      }
    };
    updateAudioSync();
    const interval = setInterval(updateAudioSync, 500);

    const tryAutoUnmute = () => {
      const video = document.querySelector('.ssatv-live-viewport video') as HTMLVideoElement;
      if (video && video.muted) {
        video.muted = false;
        video.volume = 1;
        setIsMuted(false);
        video.play().catch(() => {});
      }
    };

    const events = ['pointerdown', 'mousedown', 'keydown', 'touchstart', 'click', 'mousemove', 'wheel', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, tryAutoUnmute, { capture: true, passive: true }));

    return () => {
      clearInterval(interval);
      events.forEach((evt) => window.removeEventListener(evt, tryAutoUnmute, true));
    };
  }, []);

  // Safe exit fullscreen function
  const exitFullscreen = useCallback(async () => {
    const el = liveViewportRef.current;
    
    // 1. Instantly remove CSS fallback fullscreen class from viewport and document
    if (el) {
      el.classList.remove('is-fullscreen');
    }
    document.querySelectorAll('.is-fullscreen').forEach((n) => n.classList.remove('is-fullscreen'));
    setIsFullscreen(false);
    setShowChannelDropdown(false);

    // 2. Safely call browser native exitFullscreen if native fullscreen is active
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } else if ((document as any).webkitFullscreenElement) {
        if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      } else if ((document as any).mozFullScreenElement) {
        if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        }
      } else if ((document as any).msFullscreenElement) {
        if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('exitFullscreen native call handled:', err);
    }

    // 3. Ensure cleanup is completely applied
    if (el) {
      el.classList.remove('is-fullscreen');
    }
    document.querySelectorAll('.is-fullscreen').forEach((n) => n.classList.remove('is-fullscreen'));
    setIsFullscreen(false);
    window.dispatchEvent(new Event('ssatv-fullscreen-change'));
    resetHideTimer();
  }, [resetHideTimer]);

  // Safe enter fullscreen function
  const enterFullscreen = useCallback(async () => {
    const el = liveViewportRef.current;
    if (!el) return;

    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        await (el as any).webkitRequestFullscreen();
      } else if ((el as any).mozRequestFullScreen) {
        await (el as any).mozRequestFullScreen();
      }
    } catch (err) {
      console.warn('Native requestFullscreen failed, using CSS fallback:', err);
    }

    el.classList.add('is-fullscreen');
    setIsFullscreen(true);
    window.dispatchEvent(new Event('ssatv-fullscreen-change'));
    resetHideTimer();
  }, [resetHideTimer]);

  // Fullscreen toggle function
  const toggleFullscreen = useCallback(() => {
    const el = liveViewportRef.current;
    const isCurrentlyFs = Boolean(
      document.fullscreenElement || 
      (document as any).webkitFullscreenElement || 
      (el && el.classList.contains('is-fullscreen')) ||
      isFullscreen
    );

    if (isCurrentlyFs) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, exitFullscreen, enterFullscreen]);

  // Track Fullscreen state changes
  useEffect(() => {
    const handleFsChange = () => {
      const hasNativeFs = Boolean(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      const el = liveViewportRef.current;
      if (!hasNativeFs) {
        if (el) el.classList.remove('is-fullscreen');
        document.querySelectorAll('.is-fullscreen').forEach((n) => n.classList.remove('is-fullscreen'));
        setIsFullscreen(false);
      } else {
        if (el) el.classList.add('is-fullscreen');
        setIsFullscreen(true);
      }
      resetHideTimer();
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, [resetHideTimer]);

  // Pointer movement listener: whenever the mouse moves or user touches in fullscreen, wake up controls
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
  }, [isFullscreen, resetHideTimer]);

  // Keyboard controls for convenient TV & Desktop experience
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
      // Space -> Toggle Play/Pause
      else if (key === ' ' || code === 32) {
        e.preventDefault();
        togglePlay();
      }
      // Escape / Remote Back
      else if (key === 'escape' || code === 27 || code === 4) {
        if (showChannelDropdown) {
          setShowChannelDropdown(false);
        } else if (showTrackModal) {
          setShowTrackModal(false);
        } else if (isFullscreen) {
          e.preventDefault();
          exitFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showChannelDropdown, showTrackModal, isFullscreen, toggleFullscreen, exitFullscreen, togglePlay, toggleMute, resetHideTimer]);

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

  // Filter channels for the fullscreen dropdown by category & search query
  const dropdownFilteredChannels = useMemo(() => {
    if (!channels || channels.length === 0) return [];

    return channels.filter((ch) => {
      // Category filter
      const matchesCategory =
        dropdownCategory === 'ALL' ||
        (ch.category && ch.category.toUpperCase() === dropdownCategory.toUpperCase());

      if (!matchesCategory) return false;

      // Search filter
      if (!channelSearchQuery.trim()) return true;
      const q = channelSearchQuery.toLowerCase().trim();
      const nameMatch = ch.name?.toLowerCase().includes(q);
      const numMatch = ch.ch_number?.toLowerCase().includes(q);
      const catMatch = ch.category?.toLowerCase().includes(q);

      return Boolean(nameMatch || numMatch || catMatch);
    });
  }, [channels, dropdownCategory, channelSearchQuery]);

  // Current playing channel: either activeChannel prop, or first channel in active category, or TV3 FHD
  const currentChannel: Channel = useMemo(() => {
    if (activeChannel) return activeChannel;
    if (categoryChannels.length > 0) return categoryChannels[0];
    const defaultTv3 = channels.find(
      (c) => c.name.toUpperCase().includes('TV3') || c.contentId.toLowerCase() === 'tv3'
    );
    return defaultTv3 || channels[0] || ({} as Channel);
  }, [activeChannel, categoryChannels, channels]);

  // Monitor the video element events directly
  useEffect(() => {
    let checkTimer: any = null;
    const attachVideoListeners = () => {
      const video = document.querySelector('.ssatv-live-viewport video') as HTMLVideoElement | null;
      if (!video) return;

      const onWaiting = () => setIsVideoBuffering(true);
      const onPlaying = () => {
        setIsVideoBuffering(false);
        setIsVideoPaused(false);
        setIsPlaying(true);
      };
      const onPause = () => {
        setIsVideoPaused(true);
        setIsPlaying(false);
      };
      const onTimeUpdate = () => {
        if (!video.paused && video.readyState >= 2) {
          setIsVideoBuffering(false);
          setIsVideoPaused(false);
        }
      };

      video.addEventListener('waiting', onWaiting);
      video.addEventListener('playing', onPlaying);
      video.addEventListener('pause', onPause);
      video.addEventListener('timeupdate', onTimeUpdate);

      return () => {
        video.removeEventListener('waiting', onWaiting);
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('timeupdate', onTimeUpdate);
      };
    };

    const cleanup = attachVideoListeners();
    checkTimer = setInterval(() => {
      const video = document.querySelector('.ssatv-live-viewport video') as HTMLVideoElement | null;
      if (video) {
        setIsVideoPaused(video.paused);
      }
    }, 1500);

    return () => {
      if (cleanup) cleanup();
      if (checkTimer) clearInterval(checkTimer);
    };
  }, [currentChannel]);

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
        desc: '',
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

  // Channels for EPG Guide table (all available channels in active category)
  const guideChannels = useMemo(() => {
    return categoryChannels.length > 0 ? categoryChannels : channels;
  }, [categoryChannels, channels]);

  const handleSelectChannel = (ch: Channel) => {
    onSelectChannel(ch);
    setIsPlaying(true);
    setTimeout(() => {
      const video = document.querySelector('.ssatv-live-viewport video') as HTMLVideoElement;
      if (video) {
        video.muted = false;
        video.volume = 1;
        setIsMuted(false);
        video.play().catch(() => {});
      }
    }, 50);
  };

  const handleWatchLive = () => {
    handleSelectChannel(currentChannel);
    const video = document.querySelector('.ssatv-live-viewport video') as HTMLVideoElement;
    if (video) {
      video.muted = false;
      video.volume = 1;
      setIsMuted(false);
      video.play().catch(() => {});
    }
    enterFullscreen();
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
          <div 
            ref={liveViewportRef}
            className={`ssatv-live-viewport ${isFullscreen ? 'is-fullscreen' : ''} ${showOverlayControls ? 'controls-visible' : 'controls-hidden'} ${isIdle && isFullscreen ? 'is-idle' : ''}`}
            onMouseMove={resetHideTimer}
            onTouchStart={resetHideTimer}
            onClick={() => {
              const video = document.querySelector('.ssatv-live-viewport video') as HTMLVideoElement;
              if (video && video.muted) {
                video.muted = false;
                video.volume = 1;
                setIsMuted(false);
              }
              if (!showOverlayControls) {
                resetHideTimer();
              }
            }}
            onDoubleClick={toggleFullscreen}
            style={{ cursor: isFullscreen && isIdle ? 'none' : 'pointer' }}
          >
            {currentChannel && currentChannel.streamUrl ? (
              <Player key={currentChannel.id || 'live_hero'} channel={currentChannel} hideOverlay />
            ) : (
              <div className="ssatv-live-fallback-img" style={{ background: '#07090e' }} />
            )}

            {/* Apple TV Fullscreen Top Bar: Back, Channel info, Live Program Title, Exit Fullscreen */}
            {isFullscreen && (
              <div 
                className={`ssatv-live-fs-topbar animate-fade-in ${showOverlayControls ? 'is-visible' : 'is-hidden'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="ssatv-fs-top-left">
                  <button 
                    className="apple-tv-pill-icon-btn ssatv-fs-back-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isFullscreen) {
                        exitFullscreen();
                      } else if (onBack) {
                        onBack();
                      }
                    }}
                    title="Keluar Skrin Penuh (Esc / F)"
                  >
                    <ChevronLeft size={20} />
                    <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Kembali</span>
                  </button>

                  <div className="ssatv-fs-channel-dropdown-anchor" ref={channelDropdownRef}>
                    <button 
                      className={`ssatv-fs-channel-badge ssatv-fs-channel-btn ${showChannelDropdown ? 'is-active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowChannelDropdown((prev) => !prev);
                        resetHideTimer();
                      }}
                      title="Klik untuk pilih dan tukar siaran TV"
                    >
                      {currentChannel.thumbnail && (
                        <img 
                          src={currentChannel.thumbnail} 
                          alt={currentChannel.name} 
                          className="ssatv-fs-ch-logo"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      )}
                      <span className="ssatv-fs-ch-name">{currentChannel.name}</span>
                      {currentChannel.ch_number && (
                        <span className="ssatv-brand-num-badge" style={{ padding: '2px 7px', fontSize: '0.72rem' }}>
                          {currentChannel.ch_number}
                        </span>
                      )}
                      <ChevronDown size={14} className={`ssatv-fs-ch-chevron ${showChannelDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Apple TV Live Channel Switcher Popover */}
                    {showChannelDropdown && (
                      <div 
                        className="ssatv-fs-channel-dropdown-popover animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Popover Header */}
                        <div className="ssatv-ch-dropdown-header">
                          <div className="ssatv-ch-dropdown-title-group">
                            <span className="ssatv-ch-dropdown-title">Tukar Saluran TV</span>
                            <span className="ssatv-ch-dropdown-count">{dropdownFilteredChannels.length} siaran</span>
                          </div>
                          <button 
                            className="ssatv-track-close"
                            onClick={() => {
                              setShowChannelDropdown(false);
                              resetHideTimer();
                            }}
                            title="Tutup menu saluran"
                          >
                            <X size={15} />
                          </button>
                        </div>

                        {/* Search Input */}
                        <div className="ssatv-ch-dropdown-search-box">
                          <Search size={15} className="ssatv-ch-search-icon" />
                          <input 
                            type="text" 
                            className="ssatv-ch-dropdown-search-input"
                            placeholder="Cari saluran atau nombor..."
                            value={channelSearchQuery}
                            onChange={(e) => setChannelSearchQuery(e.target.value)}
                            autoFocus
                          />
                          {channelSearchQuery && (
                            <button 
                              className="ssatv-ch-search-clear"
                              onClick={() => setChannelSearchQuery('')}
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>

                        {/* Category Filter Chips */}
                        <div className="ssatv-ch-dropdown-categories">
                          {['ALL', ...APK_CATEGORIES].map((cat) => (
                            <button
                              key={cat}
                              className={`ssatv-ch-category-chip ${dropdownCategory.toUpperCase() === cat.toUpperCase() ? 'active' : ''}`}
                              onClick={() => setDropdownCategory(cat)}
                            >
                              {cat === 'ALL' ? 'SEMUA' : cat}
                            </button>
                          ))}
                        </div>

                        {/* Channels List */}
                        <div className="ssatv-ch-dropdown-list">
                          {dropdownFilteredChannels.length > 0 ? (
                            dropdownFilteredChannels.map((ch) => {
                              const isCurrent = ch.id === currentChannel.id || ch.contentId === currentChannel.contentId;
                              return (
                                <button
                                  key={ch.id || ch.contentId || ch.name}
                                  className={`ssatv-ch-dropdown-item ${isCurrent ? 'selected' : ''}`}
                                  onClick={() => {
                                    handleSelectChannel(ch);
                                    setShowChannelDropdown(false);
                                    resetHideTimer();
                                  }}
                                >
                                  <div className="ssatv-ch-item-left">
                                    <div className="ssatv-ch-item-thumb-box">
                                      {ch.thumbnail ? (
                                        <img 
                                          src={ch.thumbnail} 
                                          alt={ch.name} 
                                          className="ssatv-ch-item-thumb"
                                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                        />
                                      ) : (
                                        <div className="ssatv-ch-item-placeholder" />
                                      )}
                                    </div>
                                    <div className="ssatv-ch-item-details">
                                      <div className="ssatv-ch-item-name-row">
                                        <span className="ssatv-ch-item-name">{ch.name}</span>
                                        {ch.ch_number && (
                                          <span className="ssatv-ch-num-pill">{ch.ch_number}</span>
                                        )}
                                      </div>
                                      {ch.category && (
                                        <span className="ssatv-ch-cat-pill">{ch.category}</span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="ssatv-ch-item-right">
                                    {isCurrent && (
                                      <span className="ssatv-ch-playing-badge" title="Sedang Dimainkan">
                                        <Check size={14} />
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="ssatv-ch-dropdown-empty">
                              <span>Tiada saluran dijumpai untuk "{channelSearchQuery}"</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ssatv-fs-prog-pill">
                    <span className="ssatv-fs-prog-name">{currentProgram.title}</span>
                    {currentProgram.timeSlot && (
                      <span className="ssatv-fs-prog-slot">• {currentProgram.timeSlot}</span>
                    )}
                  </div>
                </div>

                <div className="ssatv-fs-top-right">
                  <span className="ssatv-fs-live-indicator">
                    <span className="ssatv-fs-live-dot" />
                    HD
                  </span>
                  <button 
                    className="apple-tv-pill-icon-btn ssatv-fs-minimize-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      exitFullscreen();
                    }}
                    title="Keluar Skrin Penuh (Esc / F)"
                  >
                    <Minimize size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Center Play/Pause Hero Button Overlay in Fullscreen */}
            {isFullscreen && showOverlayControls && !isVideoBuffering && !isVideoPaused && (
              <div 
                className="ssatv-live-fs-center-triad animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  className="apple-tv-triad-btn apple-tv-hero-play-btn" 
                  onClick={togglePlay} 
                  title={isPlaying ? "Jeda (Space)" : "Main (Space)"}
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
              </div>
            )}


            {/* Subtle Buffering Spinner */}
            {isVideoBuffering && !isVideoPaused && (
              <div 
                className="ssatv-player-buffering-overlay animate-fade-in"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                style={{ cursor: 'pointer' }}
                title="Ketuk untuk sambung tontonan"
              >
                <div className="ssatv-buffering-glow-spinner" />
              </div>
            )}

            {/* Apple TV On-Screen Subtitle / Audio Feedback Pill */}
            {subtitleToast && (
              <div className="ssatv-subtitle-toast-pill">
                <Subtitles size={16} />
                <span>{subtitleToast}</span>
              </div>
            )}

            {/* Custom Apple TV Bottom Control HUD */}
            <div 
              className={`ssatv-live-hud-bar ${showOverlayControls ? 'is-visible' : 'is-hidden'}`}
              onClick={(e) => e.stopPropagation()}
            >
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
                      resetHideTimer();
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
                          <Subtitles size={16} style={{ color: '#ffffff' }} />
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
                  className="ssatv-hud-btn ssatv-hud-fs-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  title={isFullscreen ? "Keluar Skrin Penuh (Esc / F)" : "Skrin Penuh (F)"}
                >
                  {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Editorial Showcase */}
        <div className="ssatv-live-editorial-pane">
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
                    <div className="ssatv-live-card-bottom">
                      <div className="ssatv-live-card-brand">
                        <span>{ch.name}</span>
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
                  </div>

                  <div className="ssatv-grid-bottom-info">
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
