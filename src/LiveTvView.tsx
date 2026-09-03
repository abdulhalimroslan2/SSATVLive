import React, { useState } from 'react';
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

export interface LiveProgram {
  id: string;
  channelId: string;
  channelName: string;
  channelNumber?: string;
  programTitle: string;
  timeSlot: string;
  genre: string;
  synopsis: string;
  thumbnail: string;
  channel: Channel;
}

interface LiveTvViewProps {
  channels: Channel[];
  activeChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
}

export const LiveTvView: React.FC<LiveTvViewProps> = ({
  channels,
  activeChannel,
  onSelectChannel,
}) => {
  // Curated channel mappings matching the reference design
  const liveChannelsData: LiveProgram[] = [
    {
      id: 'ssatv_1',
      channelId: 'ch_ssatv_1',
      channelName: 'SSATV',
      channelNumber: '1',
      programTitle: 'Physics Masterclass',
      timeSlot: '8:00 PM – 9:00 PM',
      genre: 'Education',
      synopsis:
        'An engaging and in-depth session exploring key concepts in Physics for SPM and beyond. Learn with real examples and clear explanations.',
      thumbnail:
        'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800',
      channel:
        channels.find((c) => c.name.toLowerCase().includes('awani')) ||
        channels[0] ||
        ({} as Channel),
    },
    {
      id: 'ssatv_2',
      channelId: 'ch_ssatv_2',
      channelName: 'SSATV',
      channelNumber: '2',
      programTitle: 'Movie Night',
      timeSlot: '8:30 PM – 10:30 PM',
      genre: 'Movie',
      synopsis:
        'A gripping psychological thriller featuring edge-of-your-seat suspense and stunning cinematography.',
      thumbnail:
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=800',
      channel:
        channels.find((c) => c.category === 'MOVIES') ||
        channels[1] ||
        channels[0],
    },
    {
      id: 'ssatv_sports',
      channelId: 'ch_ssatv_sports',
      channelName: 'SSATV SPORTS',
      programTitle: 'Football Tonight',
      timeSlot: '8:00 PM – 10:00 PM',
      genre: 'Sports',
      synopsis:
        'Live coverage, comprehensive post-match analysis, and expert breakdowns of the biggest fixtures tonight.',
      thumbnail:
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
      channel:
        channels.find((c) => c.name.toLowerCase().includes('arena')) ||
        channels.find((c) => c.category.includes('SPORT')) ||
        channels[0],
    },
    {
      id: 'ssatv_news',
      channelId: 'ch_ssatv_news',
      channelName: 'SSATV NEWS',
      programTitle: 'Evening Report',
      timeSlot: '8:00 PM – 9:00 PM',
      genre: 'News',
      synopsis:
        'Breaking headlines, comprehensive global coverage, and in-depth investigations from veteran journalists.',
      thumbnail:
        'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=800',
      channel:
        channels.find(
          (c) =>
            c.name.toLowerCase().includes('awani') ||
            c.name.toLowerCase().includes('berita')
        ) || channels[0],
    },
    {
      id: 'ssatv_kids',
      channelId: 'ch_ssatv_kids',
      channelName: 'SSATV KIDS',
      programTitle: 'Fun Learning',
      timeSlot: '8:00 PM – 9:00 PM',
      genre: 'Kids',
      synopsis:
        'Inspiring stories, interactive adventures, and fun educational quests designed for young minds.',
      thumbnail:
        'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=800',
      channel:
        channels.find(
          (c) =>
            c.name.toLowerCase().includes('ceria') ||
            c.name.toLowerCase().includes('cartoon')
        ) || channels[0],
    },
    {
      id: 'ssatv_docs',
      channelId: 'ch_ssatv_docs',
      channelName: 'SSATV DOCS',
      programTitle: 'Wild Planet',
      timeSlot: '8:00 PM – 9:00 PM',
      genre: 'Documentary',
      synopsis:
        'Witness the raw majesty of untamed wilderness and rare creatures in pristine 4K resolution.',
      thumbnail:
        'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&q=80&w=800',
      channel:
        channels.find(
          (c) =>
            c.name.toLowerCase().includes('discovery') ||
            c.name.toLowerCase().includes('animal')
        ) || channels[0],
    },
  ];

  const [selectedProg, setSelectedProg] = useState<LiveProgram>(
    liveChannelsData[0]
  );
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [inList, setInList] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState('TODAY');

  const categories = [
    'ALL',
    'NEWS',
    'SPORTS',
    'ENTERTAINMENT',
    'EDUCATION',
    'DOCUMENTARY',
    'MUSIC',
    'KIDS',
  ];

  // Current playing channel to feed to Shaka player
  const currentChannel: Channel =
    activeChannel || selectedProg.channel || channels[0];

  const handleSelectLiveProgram = (prog: LiveProgram) => {
    setSelectedProg(prog);
    if (prog.channel && prog.channel.streamUrl) {
      onSelectChannel(prog.channel);
    }
  };

  // EPG Time Slots
  const epgTimeline = ['NOW', '9 PM', '10 PM', '11 PM', '12 AM'];

  const epgSchedule: Record<
    string,
    {
      channelName: string;
      channelNum?: string;
      slots: { title: string; time: string; genre: string }[];
    }
  > = {
    ssatv_1: {
      channelName: 'SSATV',
      channelNum: '1',
      slots: [
        {
          title: 'Physics Masterclass',
          time: '8:00 PM – 9:00 PM',
          genre: 'Education',
        },
        {
          title: 'SPM Physics Tips',
          time: '9:00 PM – 10:00 PM',
          genre: 'Education',
        },
        {
          title: 'Science Explorers',
          time: '10:00 PM – 11:00 PM',
          genre: 'Education',
        },
        { title: 'Exam Boost', time: '11:00 PM – 12:00 AM', genre: 'Education' },
        {
          title: 'Mind in Motion',
          time: '12:00 AM – 1:00 AM',
          genre: 'Education',
        },
      ],
    },
    ssatv_2: {
      channelName: 'SSATV',
      channelNum: '2',
      slots: [
        {
          title: 'Movie Night',
          time: '8:30 PM – 10:30 PM',
          genre: 'Movie',
        },
        {
          title: 'Action Movie',
          time: '10:30 PM – 12:30 AM',
          genre: 'Movie',
        },
        {
          title: 'Late Night Movie',
          time: '12:30 AM – 2:30 AM',
          genre: 'Movie',
        },
        {
          title: 'Classic Movie',
          time: '2:30 AM – 4:30 AM',
          genre: 'Movie',
        },
        {
          title: 'Indie Movie',
          time: '4:30 AM – 6:30 AM',
          genre: 'Movie',
        },
      ],
    },
    ssatv_sports: {
      channelName: 'SSATV SPORTS',
      slots: [
        {
          title: 'Football Tonight',
          time: '8:00 PM – 10:00 PM',
          genre: 'Sports',
        },
        {
          title: 'The Football Review',
          time: '8:00 PM – 11:00 PM',
          genre: 'Sports',
        },
        {
          title: 'Sports Center',
          time: '11:00 PM – 12:00 AM',
          genre: 'Sports',
        },
        {
          title: 'Match Highlights',
          time: '12:00 AM – 1:00 AM',
          genre: 'Sports',
        },
        {
          title: 'Behind the Game',
          time: '1:00 AM – 2:00 AM',
          genre: 'Sports',
        },
      ],
    },
    ssatv_news: {
      channelName: 'SSATV NEWS',
      slots: [
        {
          title: 'Evening Report',
          time: '8:00 PM – 9:00 PM',
          genre: 'News',
        },
        {
          title: 'News Highlights',
          time: '9:00 PM – 10:00 PM',
          genre: 'News',
        },
        {
          title: 'World Tonight',
          time: '10:00 PM – 11:00 PM',
          genre: 'News',
        },
        {
          title: 'News Roundup',
          time: '11:00 PM – 12:00 AM',
          genre: 'News',
        },
        {
          title: 'Overnight News',
          time: '12:00 AM – 1:00 AM',
          genre: 'News',
        },
      ],
    },
  };

  return (
    <div className="ssatv-livetv-container">
      {/* 1. SPLIT-HERO LIVE STAGE (60% / 40%) */}
      <section className="ssatv-live-hero-stage">
        {/* Left: Embedded 16:9 Live Video Player with HUD */}
        <div className="ssatv-live-player-pane">
          <div className="ssatv-live-viewport">
            {/* Live Video Embed */}
            {currentChannel && currentChannel.streamUrl ? (
              <Player
                key={currentChannel.id || 'hero_live'}
                channel={currentChannel}
              />
            ) : (
              <img
                src={selectedProg.thumbnail}
                alt={selectedProg.programTitle}
                className="ssatv-live-fallback-img"
              />
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
              </div>

              {/* Scrubber Bar */}
              <div className="ssatv-hud-scrubber-track">
                <div className="ssatv-hud-scrubber-fill" style={{ width: '68%' }} />
                <div
                  className="ssatv-hud-scrubber-handle"
                  style={{ left: '68%' }}
                />
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

          {/* Channel Brand with Number */}
          <div className="ssatv-live-channel-brand">
            <span className="ssatv-brand-text">{selectedProg.channelName}</span>
            {selectedProg.channelNumber && (
              <span className="ssatv-brand-num-badge">
                {selectedProg.channelNumber}
              </span>
            )}
          </div>

          {/* Program Big Bold Title */}
          <h1 className="ssatv-live-prog-title">{selectedProg.programTitle}</h1>

          {/* Meta & Genre Pill */}
          <div className="ssatv-live-prog-meta">
            <span className="ssatv-prog-time">{selectedProg.timeSlot}</span>
            <span className="ssatv-prog-genre-pill">{selectedProg.genre}</span>
          </div>

          {/* Crimson Divider Line */}
          <div className="ssatv-live-divider-line" />

          {/* Synopsis */}
          <p className="ssatv-live-prog-synopsis">{selectedProg.synopsis}</p>

          {/* Dual Action Buttons */}
          <div className="ssatv-live-actions">
            <button
              className="ssatv-btn-watch"
              onClick={() => handleSelectLiveProgram(selectedProg)}
            >
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

      {/* 2. LIVE CHANNELS CAROUSEL (Active Item Has Glowing Red Border) */}
      <section className="ssatv-live-shelf-section">
        <div className="ssatv-row-header">
          <h2 className="ssatv-row-title">
            <span>Live Channels</span>
            <ChevronRight size={18} className="ssatv-row-chevron" />
          </h2>
        </div>

        <div className="ssatv-live-channels-row">
          {liveChannelsData.map((prog) => {
            const isSelected = selectedProg.id === prog.id;
            return (
              <div
                key={prog.id}
                className={`ssatv-live-channel-card ${
                  isSelected ? 'active-glow' : ''
                }`}
                onClick={() => handleSelectLiveProgram(prog)}
              >
                <div className="ssatv-live-card-thumb-wrap">
                  <img
                    src={prog.thumbnail}
                    alt={prog.programTitle}
                    className="ssatv-live-card-img"
                    loading="lazy"
                  />
                  <div className="ssatv-live-card-overlay" />

                  {/* Card Content Overlay */}
                  <div className="ssatv-live-card-inner">
                    <div className="ssatv-live-card-badge">
                      <span className="ssatv-live-pulse-dot" />
                      LIVE
                    </div>

                    <div className="ssatv-live-card-bottom">
                      <div className="ssatv-live-card-brand">
                        <span>{prog.channelName}</span>
                        {prog.channelNumber && (
                          <span className="ssatv-brand-num-small">
                            {prog.channelNumber}
                          </span>
                        )}
                      </div>
                      <div className="ssatv-live-card-prog">
                        {prog.programTitle}
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

      {/* 3. ALL CHANNELS 6-COLUMN GRID */}
      <section className="ssatv-all-channels-section">
        <div className="ssatv-row-header">
          <h2 className="ssatv-row-title">
            <span>All Channels</span>
          </h2>
        </div>

        <div className="ssatv-all-channels-grid">
          {liveChannelsData.map((prog) => (
            <div
              key={prog.id}
              className="ssatv-grid-channel-card"
              onClick={() => handleSelectLiveProgram(prog)}
            >
              <div className="ssatv-grid-card-thumb">
                <img
                  src={prog.thumbnail}
                  alt={prog.programTitle}
                  className="ssatv-grid-img"
                  loading="lazy"
                />
                <div className="ssatv-grid-overlay" />

                <div className="ssatv-grid-top-brand">
                  <span>{prog.channelName}</span>
                  {prog.channelNumber && (
                    <span className="ssatv-brand-num-small">
                      {prog.channelNumber}
                    </span>
                  )}
                </div>

                <div className="ssatv-grid-bottom-info">
                  <div className="ssatv-grid-live-indicator">
                    <span className="ssatv-live-pulse-dot" />
                    LIVE
                  </div>
                  <div className="ssatv-grid-title">{prog.programTitle}</div>
                  <div className="ssatv-grid-time">{prog.timeSlot}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. INTERACTIVE TV GUIDE (EPG TIMELINE GRID) */}
      <section className="ssatv-epg-section">
        <div className="ssatv-epg-header">
          <h2 className="ssatv-row-title">
            <span>TV GUIDE</span>
          </h2>

          <div 
            className="ssatv-epg-day-selector"
            onClick={() => setSelectedDay(selectedDay === 'TODAY' ? 'TOMORROW' : 'TODAY')}
            title="Tukar Hari"
          >
            <span>{selectedDay}</span>
            <ChevronDown size={14} />
          </div>
        </div>

        <div className="ssatv-epg-grid-wrap">
          {/* Time Header Row */}
          <div className="ssatv-epg-time-row">
            <div className="ssatv-epg-channel-col-header" />
            <div className="ssatv-epg-timeline-cells">
              {epgTimeline.map((t) => (
                <div
                  key={t}
                  className={`ssatv-epg-time-header ${
                    t === 'NOW' ? 'active-now' : ''
                  }`}
                >
                  {t}
                  {t === 'NOW' && <span className="ssatv-epg-now-needle" />}
                </div>
              ))}
            </div>
          </div>

          {/* Channel Program Rows */}
          <div className="ssatv-epg-rows-stack">
            {Object.entries(epgSchedule).map(([chKey, chData]) => (
              <div key={chKey} className="ssatv-epg-row">
                {/* Channel Label */}
                <div className="ssatv-epg-channel-cell">
                  <span className="ssatv-epg-ch-name">{chData.channelName}</span>
                  {chData.channelNum && (
                    <span className="ssatv-brand-num-small">
                      {chData.channelNum}
                    </span>
                  )}
                </div>

                {/* Program Slots */}
                <div className="ssatv-epg-slots-cells">
                  {chData.slots.map((slot, sIdx) => {
                    const isNow = sIdx === 0;
                    return (
                      <div
                        key={sIdx}
                        className={`ssatv-epg-program-block ${
                          isNow ? 'is-airing-now' : ''
                        }`}
                        onClick={() => {
                          const target = liveChannelsData.find(
                            (l) => l.id === chKey
                          );
                          if (target) handleSelectLiveProgram(target);
                        }}
                      >
                        <div className="ssatv-epg-slot-title">{slot.title}</div>
                        <div className="ssatv-epg-slot-meta">
                          <span className="ssatv-epg-slot-time">
                            {slot.time}
                          </span>
                          <span className="ssatv-epg-slot-genre">
                            {slot.genre}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BROWSE LIVE TV CATEGORY PILLS */}
      <section className="ssatv-browse-live-section">
        <div className="ssatv-row-header">
          <h2 className="ssatv-row-title">
            <span>Browse Live TV</span>
            <ChevronRight size={18} className="ssatv-row-chevron" />
          </h2>
        </div>

        <div className="ssatv-category-pills-row">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`ssatv-cat-pill ${
                activeCategory === cat ? 'active' : ''
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
