import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import type { Channel } from './mockData';
import { Player } from './Player';
import {
  getCurrentProgramme,
  getTimelineSlotsForChannel,
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

  // Real currently airing programme from EPG
  const currentProgram: EpgProgramme = useMemo(() => {
    if (!currentChannel || !currentChannel.name) {
      return {
        title: 'Siaran Langsung',
        desc: 'Tonton siaran langsung saluran definisi tinggi di SSATV.',
        start: '20260903220000',
        stop: '20260903230000',
        date: '2026-09-03',
        startHour: 22,
        timeSlot: '10:00 PM – 11:00 PM',
        genre: 'Live TV',
      };
    }
    return getCurrentProgramme(currentChannel);
  }, [currentChannel]);

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

  const epgTimeline = ['NOW', '9 PM', '10 PM', '11 PM', '12 AM'];

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
              <Player key={currentChannel.id || 'live_hero'} channel={currentChannel} />
            ) : (
              <div className="ssatv-live-fallback-img" style={{ background: '#07090e' }} />
            )}

            {/* Top-Left Red Live Badge */}
            <div className="ssatv-player-live-badge">
              <span className="ssatv-live-pulse-dot" />
              LIVE
            </div>

            {/* Custom Apple TV Bottom Control HUD */}
            <div className="ssatv-live-hud-bar">
              <div className="ssatv-hud-left">
                <button
                  className="ssatv-hud-btn"
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={17} /> : <Play size={17} />}
                </button>

                <button
                  className="ssatv-hud-btn"
                  onClick={() => setIsMuted(!isMuted)}
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

              {/* Scrubber Bar */}
              <div className="ssatv-hud-scrubber-track">
                <div className="ssatv-hud-scrubber-fill" style={{ width: '75%' }} />
                <div className="ssatv-hud-scrubber-handle" style={{ left: '75%' }} />
              </div>

              <div className="ssatv-hud-right">
                <button className="ssatv-hud-btn" title="Subtitles / Audio">
                  <Subtitles size={17} />
                </button>
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
            <button className="ssatv-btn-watch" onClick={() => handleSelectChannel(currentChannel)}>
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
              const slots = getTimelineSlotsForChannel(ch);
              const isSelected = currentChannel.id === ch.id;

              const slotList = [
                { slot: slots.now, isNow: true },
                { slot: slots.h9pm, isNow: false },
                { slot: slots.h10pm, isNow: false },
                { slot: slots.h11pm, isNow: false },
                { slot: slots.h12am, isNow: false },
              ];

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
                        <div className="ssatv-epg-slot-title" title={item.slot.title}>
                          {item.slot.title}
                        </div>
                        <div className="ssatv-epg-slot-meta">
                          <span className="ssatv-epg-slot-time">{item.slot.timeSlot}</span>
                          <span className="ssatv-epg-slot-genre">
                            {item.slot.genre || ch.category}
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
