import React, { useRef, useState, useEffect } from 'react';
import type { Channel } from './mockData';
import { ChannelCard } from './ChannelCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ChannelRowProps {
  label: string;
  count: number;
  channels: Channel[];
  activeChannelId?: string;
  onSelectChannel: (channel: Channel) => void;
  onViewAll: () => void;
}

export const ChannelRow: React.FC<ChannelRowProps> = ({
  label,
  count,
  channels,
  activeChannelId,
  onSelectChannel,
  onViewAll,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [channels]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="channel-row-section">
      <div className="section-header">
        <h3 className="section-title">
          <span style={{ color: 'var(--accent-red)' }}>•</span> {label}{' '}
          <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
            ({count} saluran)
          </span>
        </h3>
        <span className="section-link" onClick={onViewAll}>
          Lihat Semua ({count}) <ChevronRight size={16} />
        </span>
      </div>

      <div className="channel-row-carousel-container">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            className="carousel-nav-btn nav-btn-left"
            onClick={() => handleScroll('left')}
            aria-label="Skrol ke kiri"
            title="Skrol ke kiri"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Scrollable Channels Container rendering ALL channels */}
        <div className="channels-scroll" ref={scrollRef}>
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              isActive={activeChannelId === channel.id}
              onSelect={onSelectChannel}
            />
          ))}
        </div>

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            className="carousel-nav-btn nav-btn-right"
            onClick={() => handleScroll('right')}
            aria-label="Skrol ke kanan"
            title="Skrol ke kanan"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </section>
  );
};
