import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

interface HeroBannerProps {
  onWatchLive: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onWatchLive }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 'slide_1',
      badge: 'APPLE ORIGINAL',
      title: 'Get Apple TV free for 1 week.',
      sub: 'Stream hundreds of exclusive shows and movies, with new releases every week.',
      cta: 'Accept Free Trial',
      note: '7 days free, then RM 29.90/month',
      image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&q=80&w=1600'
    },
    {
      id: 'slide_2',
      badge: 'LIVE SPORTS',
      title: 'Live Sports. Any Game. Any Time.',
      sub: 'Tonton siaran langsung sukan terkini di Astro Arena FHD, SPOTV, dan beIN Sports dalam kualiti 60fps tanpa sekatan.',
      cta: 'Watch Live Now',
      note: 'Strim langsung tanpa sebarang buffering',
      image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1600'
    },
    {
      id: 'slide_3',
      badge: 'NEW SEASON',
      title: 'Silo & Dark Matter',
      sub: 'In an underground society, a rebel fights for answers — and the truth will see the light of day.',
      cta: 'Stream Full Episodes',
      note: 'Episod baharu tersedia setiap minggu',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1600'
    }
  ];

  // Auto rotate slides every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const active = slides[currentSlide];

  return (
    <div className="apple-billboard">
      <img 
        src={active.image} 
        alt={active.title} 
        className="apple-billboard-bg"
      />
      <div className="apple-billboard-gradient"></div>

      <div className="apple-billboard-content">
        <div className="apple-billboard-badge">
          <span className="badge-live-dot" style={{ background: '#ff3b30' }}></span>
          {active.badge}
        </div>

        <h1 className="apple-billboard-title">
          {active.title}
        </h1>

        <p className="apple-billboard-sub">
          {active.sub}
        </p>

        <div className="apple-billboard-actions">
          <button className="apple-btn-white" onClick={onWatchLive}>
            <Play size={17} fill="#000" />
            {active.cta}
          </button>
          <button className="apple-btn-glass" onClick={onWatchLive}>
            More Info
          </button>
        </div>

        <div className="apple-billboard-note">
          {active.note}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="apple-dots-indicator">
        {slides.map((s, idx) => (
          <span
            key={s.id}
            className={`apple-dot ${idx === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(idx)}
            title={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
