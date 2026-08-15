import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Channel } from './mockData';
import { CATEGORIES } from './mockData';
import { Player } from './Player';
import { Tv, Radio } from 'lucide-react';

interface PerfectTvLiveProps {
  channels: Channel[];
  activeChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
}

export const PerfectTvLive: React.FC<PerfectTvLiveProps> = ({
  channels,
  activeChannel,
  onSelectChannel,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [focusedPanel, setFocusedPanel] = useState<'categories' | 'channels' | 'player'>('channels');
  const [searchFilter, setSearchFilter] = useState('');
  const channelListRef = useRef<HTMLDivElement>(null);

  // Filter channels based on category and search text
  const filteredChannels = useMemo(() => {
    return channels.filter(ch => {
      // Category match
      const matchCat = selectedCategory === 'all' || 
        ch.category.toLowerCase().replace(/\s+/g, '_') === selectedCategory.toLowerCase().replace(/\s+/g, '_') ||
        ch.category.toLowerCase() === selectedCategory.toLowerCase();
      
      // Search match
      const matchSearch = !searchFilter || 
        ch.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        ch.category.toLowerCase().includes(searchFilter.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [channels, selectedCategory, searchFilter]);

  // Current playing channel fallback to first channel
  const currentChannel = activeChannel || (filteredChannels.length > 0 ? filteredChannels[0] : channels[0] || null);

  // Auto-scroll selected channel into view in channel list
  useEffect(() => {
    if (!currentChannel || !channelListRef.current) return;
    const activeEl = channelListRef.current.querySelector('.ptv-channel-item.is-active') as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentChannel?.id]);

  // Global D-Pad / Remote Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a search input
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key === 'ArrowLeft') {
        if (focusedPanel === 'player') setFocusedPanel('channels');
        else if (focusedPanel === 'channels') setFocusedPanel('categories');
      } else if (e.key === 'ArrowRight') {
        if (focusedPanel === 'categories') setFocusedPanel('channels');
        else if (focusedPanel === 'channels') setFocusedPanel('player');
      } else if (e.key === 'ArrowUp') {
        if (focusedPanel === 'channels') {
          const currentIndex = filteredChannels.findIndex(c => c.id === currentChannel?.id);
          if (currentIndex > 0) {
            onSelectChannel(filteredChannels[currentIndex - 1]);
          }
        }
      } else if (e.key === 'ArrowDown') {
        if (focusedPanel === 'channels') {
          const currentIndex = filteredChannels.findIndex(c => c.id === currentChannel?.id);
          if (currentIndex >= 0 && currentIndex < filteredChannels.length - 1) {
            onSelectChannel(filteredChannels[currentIndex + 1]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedPanel, filteredChannels, currentChannel, onSelectChannel]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: channels.length };
    CATEGORIES.forEach(cat => {
      counts[cat.id] = channels.filter(
        ch => ch.category.toLowerCase().replace(/\s+/g, '_') === cat.id.toLowerCase().replace(/\s+/g, '_')
      ).length;
    });
    return counts;
  }, [channels]);

  return (
    <div className="ptv-container">
      {/* =========================================================================
          PANEL 1: CATEGORIES LIST (KATEGORI)
          ========================================================================= */}
      <div className={`ptv-panel ptv-panel-categories ${focusedPanel === 'categories' ? 'is-focused' : ''}`}>
        <div className="ptv-panel-header">
          <Radio size={18} className="ptv-header-icon" />
          <span>KATEGORI</span>
        </div>

        <div className="ptv-categories-scroll">
          <button
            className={`ptv-category-item ${selectedCategory === 'all' ? 'is-active' : ''}`}
            onClick={() => {
              setSelectedCategory('all');
              setFocusedPanel('channels');
            }}
          >
            <span className="ptv-cat-name">⭐ SEMUA SALURAN</span>
            <span className="ptv-cat-badge">{channels.length}</span>
          </button>

          {CATEGORIES.map(cat => {
            const count = categoryCounts[cat.id] || 0;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                className={`ptv-category-item ${selectedCategory === cat.id ? 'is-active' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setFocusedPanel('channels');
                }}
              >
                <span className="ptv-cat-name">{cat.label}</span>
                <span className="ptv-cat-badge">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          PANEL 2: CHANNELS LIST (SENARAI SALURAN)
          ========================================================================= */}
      <div className={`ptv-panel ptv-panel-channels ${focusedPanel === 'channels' ? 'is-focused' : ''}`}>
        <div className="ptv-panel-header">
          <div className="ptv-header-left">
            <Tv size={18} className="ptv-header-icon" />
            <span>SALURAN ({filteredChannels.length})</span>
          </div>
          <input
            type="text"
            className="ptv-channel-quick-search"
            placeholder="Cari..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
          />
        </div>

        <div className="ptv-channels-scroll" ref={channelListRef}>
          {filteredChannels.length === 0 ? (
            <div className="ptv-empty-channels">Tiada saluran</div>
          ) : (
            filteredChannels.map((ch, idx) => {
              const isActive = currentChannel?.id === ch.id;
              const chNumber = String(idx + 1).padStart(3, '0');
              return (
                <div
                  key={ch.id}
                  className={`ptv-channel-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => onSelectChannel(ch)}
                  tabIndex={0}
                  onFocus={() => setFocusedPanel('channels')}
                >
                  <div className="ptv-ch-num">{chNumber}</div>
                  
                  <div className="ptv-ch-logo-box">
                    {ch.thumbnail ? (
                      <img
                        src={ch.thumbnail}
                        alt={ch.name}
                        className="ptv-ch-logo"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Tv size={18} className="ptv-ch-logo-fallback" />
                    )}
                  </div>

                  <div className="ptv-ch-details">
                    <div className="ptv-ch-title">{ch.name}</div>
                    <div className="ptv-ch-cat">{ch.category}</div>
                  </div>

                  {isActive && (
                    <div className="ptv-ch-live-indicator">
                      <span className="ptv-live-pulse-dot"></span>
                      <span>LIVE</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          PANEL 3: LIVE PREVIEW PLAYER & CHANNEL INFO
          ========================================================================= */}
      <div className={`ptv-panel ptv-panel-preview ${focusedPanel === 'player' ? 'is-focused' : ''}`}>
        <div className="ptv-preview-player-box">
          {currentChannel ? (
            <Player channel={currentChannel} />
          ) : (
            <div className="ptv-preview-placeholder">
              <Tv size={48} />
              <p>Sila pilih saluran</p>
            </div>
          )}
        </div>

        {currentChannel && (
          <div className="ptv-channel-info-card">
            <div className="ptv-info-header">
              <div className="ptv-info-title-group">
                <h2 className="ptv-info-title">{currentChannel.name}</h2>
                <div className="ptv-info-badges">
                  <span className="ptv-badge-fhd">1080p FHD</span>
                  <span className="ptv-badge-cat">{currentChannel.category}</span>
                  <span className="ptv-badge-live">🔴 LIVE</span>
                </div>
              </div>
            </div>

            {currentChannel.description && (
              <p className="ptv-info-desc">{currentChannel.description}</p>
            )}

            <div className="ptv-specs-grid">
              <div className="ptv-spec-item">
                <span className="ptv-spec-label">Resolusi Video</span>
                <span className="ptv-spec-val">1920x1080 (60fps)</span>
              </div>
              <div className="ptv-spec-item">
                <span className="ptv-spec-label">Audio Codec</span>
                <span className="ptv-spec-val">Stereo AAC HD</span>
              </div>
              <div className="ptv-spec-item">
                <span className="ptv-spec-label">Enjin Penstriman</span>
                <span className="ptv-spec-val">Zero-Buffer Engine</span>
              </div>
              <div className="ptv-spec-item">
                <span className="ptv-spec-label">Nyah-Kunci DRM</span>
                <span className="ptv-spec-val">ClearKey AES-128</span>
              </div>
            </div>

            {/* Remote Navigation Guide */}
            <div className="ptv-remote-legend">
              <div className="ptv-legend-item">
                <kbd>[OK] / [F]</kbd> Skrin Penuh
              </div>
              <div className="ptv-legend-item">
                <kbd>[▲] [▼]</kbd> Tukar Saluran
              </div>
              <div className="ptv-legend-item">
                <kbd>[◀] [▶]</kbd> Tukar Panel
              </div>
              <div className="ptv-legend-item">
                <kbd>[ESC]</kbd> Keluar
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
