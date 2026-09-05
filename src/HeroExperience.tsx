import React, { useState, useEffect } from 'react';
import { Play, Check, ChevronLeft, Share2, Plus } from 'lucide-react';
import { type VodItem } from './vodData';

export interface HeroSlide {
  id: string;
  badge: string;
  titleLines: string[];
  meta: string;
  synopsis: string;
  backdrop: string;
  vodItem?: VodItem;
  channelId?: string;
  cast?: string[];
}

interface HeroExperienceProps {
  slides: HeroSlide[];
  onPlay: (slide: HeroSlide) => void;
}

export const HeroExperience: React.FC<HeroExperienceProps> = ({
  slides,
  onPlay,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inList, setInList] = useState<Record<string, boolean>>({});
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  // Auto slide every 9s
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (!slides || slides.length === 0) return null;
  const current = slides[currentIdx] || slides[0];

  const toggleList = (id: string) => {
    setInList((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: current.titleLines.join(' '),
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const castNames =
    current.vodItem?.cast && current.vodItem.cast.length > 0
      ? current.vodItem.cast.slice(0, 3).join(', ')
      : 'Jason Sudeikis, Hannah Waddingham, Juno Temple';

  return (
    <section className="ssatv-hero-section apple-tv-hero-theme">
      {/* Top Floating Glass Utilities (Apple TV Gambar 1) */}
      <div className="apple-tv-hero-top-bar">
        <button
          className="apple-tv-circle-btn"
          onClick={() => {
            if (slides.length > 1) {
              setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);
            }
          }}
          title="Sebelumnya"
          type="button"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          className="apple-tv-circle-btn"
          onClick={handleShare}
          title="Kongsi"
          type="button"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Background Media with Apple TV Vignettes */}
      <div className="ssatv-hero-bg-container">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`ssatv-hero-bg-slide ${idx === currentIdx ? 'active' : ''}`}
            style={{ backgroundImage: `url("${slide.backdrop}")` }}
          />
        ))}

        {/* Multi-layer Apple TV Cinema Gradients */}
        <div className="ssatv-hero-vignette-left" />
        <div className="ssatv-hero-gradient-bottom" />
        <div className="apple-tv-hero-radial-scrim" />
      </div>

      {/* Hero Text & Actions (Matching Gambar 1 & Apple TV Mobile) */}
      <div className="ssatv-hero-content apple-tv-hero-content">
        {/* Apple TV Badge Pill */}
        <div className="apple-tv-hero-badge-pill">
          {current.badge || 'New Episode Every Wednesday'}
        </div>

        {/* Apple TV Monumental Title */}
        <h1 className="apple-tv-hero-monumental-title">
          {current.titleLines.map((line, lIdx) => (
            <span key={lIdx} className="apple-tv-title-line">
              {line}
            </span>
          ))}
        </h1>

        {/* Apple TV Meta Line with Logo & Tags */}
        <div className="apple-tv-hero-genre-line">
          <span className="apple-tv-inline-logo">tv</span>
          <span className="apple-tv-meta-separator">•</span>
          <span>
            {current.vodItem?.type === 'series'
              ? 'TV Show'
              : 'Filem Pilihan'}
          </span>
          <span className="apple-tv-meta-separator">•</span>
          <span>{current.vodItem?.genre?.[0] || 'Drama'}</span>
          <span className="apple-tv-meta-separator">•</span>
          <span>{current.vodItem?.genre?.[1] || 'Action'}</span>
          <span className="apple-tv-rating-box">
            {current.vodItem?.ageRating || '18+'}
          </span>
        </div>

        {/* Minimalist Mobile Sub-Rank / One-Liner (Matching Apple TV IMG_5148 & IMG_5150) */}
        <div className="apple-tv-hero-minimal-sub">
          {current.vodItem?.type === 'series'
            ? '#1 Show'
            : current.channelId
            ? '#1 Live Channel'
            : '#1 Movie'}
        </div>

        {/* Episode / Synopsis Line with MORE button (Desktop Only - Clean Minimalist on Mobile) */}
        <p className="apple-tv-hero-synopsis-text ssatv-desktop-only">
          <span className="apple-tv-synopsis-prefix">
            {current.vodItem?.type === 'series' ? 'S1, E1 · Pilot: ' : ''}
          </span>
          {showFullSynopsis
            ? current.synopsis
            : current.synopsis.slice(0, 160) + (current.synopsis.length > 160 ? '...' : '')}
          {current.synopsis.length > 160 && (
            <button
              className="apple-tv-more-btn"
              onClick={() => setShowFullSynopsis(!showFullSynopsis)}
              type="button"
            >
              {showFullSynopsis ? ' LESS' : ' MORE'}
            </button>
          )}
        </p>

        {/* Year, Duration & Video Format Badges (Desktop Only) */}
        <div className="apple-tv-formats-row ssatv-desktop-only">
          <span className="apple-tv-format-year">{current.vodItem?.year || 2024}</span>
          <span className="apple-tv-meta-separator">•</span>
          <span className="apple-tv-format-duration">
            {current.vodItem?.duration || '1j 45m'}
          </span>
          <div className="apple-tv-format-badges">
            <span className="apple-tv-spec-badge">4K</span>
            <span className="apple-tv-spec-badge">Dolby Vision</span>
            <span className="apple-tv-spec-badge">Dolby Atmos</span>
            <span className="apple-tv-spec-badge">CC</span>
            <span className="apple-tv-spec-badge">SDH</span>
            <span className="apple-tv-spec-badge">AD</span>
          </div>
        </div>

        {/* Action Buttons (Matching Gambar 1 & Apple TV Mobile) */}
        <div className="apple-tv-actions-row">
          {/* Primary Action: Solid White Pill Button with black text */}
          <button
            className="apple-tv-btn-primary"
            onClick={() => onPlay(current)}
            type="button"
          >
            <span>Tonton Sekarang</span>
          </button>

          {/* Secondary Action: Frosted Translucent Pill Button with Mini Progress (Desktop Only) */}
          <button
            className="apple-tv-btn-secondary ssatv-desktop-only"
            onClick={() => onPlay(current)}
            type="button"
          >
            <Play size={14} fill="currentColor" color="currentColor" />
            <div className="apple-tv-mini-progress-track">
              <div className="apple-tv-mini-progress-fill" style={{ width: '45%' }} />
            </div>
            <span>{current.vodItem?.duration ? current.vodItem.duration.split(' ')[0] : '34m'}</span>
          </button>

          {/* Tertiary Action: Circular Frosted Button with Checkmark / Plus */}
          <button
            className={`apple-tv-btn-circle-action ${inList[current.id] ? 'checked' : ''}`}
            onClick={() => toggleList(current.id)}
            title="Tambah ke Senarai Saya"
            type="button"
          >
            {inList[current.id] ? (
              <Check size={18} strokeWidth={2.5} />
            ) : (
              <Plus size={18} strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Price/Subscription Note Under Buttons */}
        <div className="apple-tv-sub-note">
          {current.channelId
            ? 'Siaran Langsung Tanpa Gangguan Kualiti 1080p FHD'
            : 'Strim Definisi Tinggi Kualiti Apple TV HDR'}
        </div>
      </div>

      {/* Starring Cast Credits (Desktop Only) */}
      <div className="apple-tv-hero-cast-credit ssatv-desktop-only">
        <span className="apple-tv-cast-label">Pelakon / Starring: </span>
        <span className="apple-tv-cast-names">{castNames}</span>
      </div>

      {/* Bottom Pagination Pill Dots */}
      <div className="apple-tv-hero-pagination">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            className={`apple-tv-page-pill ${idx === currentIdx ? 'active' : ''}`}
            onClick={() => setCurrentIdx(idx)}
            aria-label={`Slide ${idx + 1}`}
            type="button"
          />
        ))}
      </div>
    </section>
  );
};
