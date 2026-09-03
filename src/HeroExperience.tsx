import React, { useState, useEffect } from 'react';
import { Play, Plus, Check } from 'lucide-react';
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

  // Auto slide every 8s
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (!slides || slides.length === 0) return null;
  const current = slides[currentIdx] || slides[0];

  const toggleList = (id: string) => {
    setInList((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="ssatv-hero-section">
      {/* Background Media with Cross-fade */}
      <div className="ssatv-hero-bg-container">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`ssatv-hero-bg-slide ${idx === currentIdx ? 'active' : ''}`}
            style={{ backgroundImage: `url("${slide.backdrop}")` }}
          />
        ))}

        {/* Multi-layer Cinematic Gradients */}
        <div className="ssatv-hero-vignette-left" />
        <div className="ssatv-hero-gradient-bottom" />
        <div className="ssatv-hero-subtle-radial" />
      </div>

      {/* Hero Text & Actions */}
      <div className="ssatv-hero-content">
        {/* Featured Tag */}
        <div className="ssatv-hero-badge">
          {current.badge}
        </div>

        {/* Monumental Stacked Title */}
        <h1 className="ssatv-hero-title">
          {current.titleLines.map((line, lIdx) => (
            <span key={lIdx} className="ssatv-hero-title-line">
              {line}
            </span>
          ))}
        </h1>

        {/* Metadata Line */}
        <div className="ssatv-hero-meta">
          {current.meta}
        </div>

        {/* Synopsis */}
        <p className="ssatv-hero-synopsis">
          {current.synopsis}
        </p>

        {/* Action Buttons */}
        <div className="ssatv-hero-actions">
          {/* Watch Now Button */}
          <button 
            className="ssatv-btn-watch"
            onClick={() => onPlay(current)}
          >
            <Play size={18} fill="#000" color="#000" />
            <span>WATCH NOW</span>
          </button>

          {/* Add to My List Button */}
          <button 
            className={`ssatv-btn-list ${inList[current.id] ? 'in-list' : ''}`}
            onClick={() => toggleList(current.id)}
          >
            {inList[current.id] ? (
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

      {/* Bottom Right Pagination Dots */}
      <div className="ssatv-hero-dots">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            className={`ssatv-hero-dot ${idx === currentIdx ? 'active' : ''}`}
            onClick={() => setCurrentIdx(idx)}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
