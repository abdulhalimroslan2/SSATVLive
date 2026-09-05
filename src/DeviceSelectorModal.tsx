import React, { useState } from 'react';
import { Smartphone, Monitor, Tv, CheckCircle2, X, ArrowRight, ShieldCheck, PlayCircle } from 'lucide-react';

export type DeviceType = 'ios' | 'android' | 'desktop';

interface DeviceSelectorModalProps {
  currentDevice: DeviceType | null;
  onSelectDevice: (device: DeviceType) => void;
  onClose?: () => void;
  isDismissable?: boolean;
}

export const DeviceSelectorModal: React.FC<DeviceSelectorModalProps> = ({
  currentDevice,
  onSelectDevice,
  onClose,
  isDismissable = false,
}) => {
  const [selected, setSelected] = useState<DeviceType>(() => {
    if (currentDevice) return currentDevice;
    // Auto-detect hint
    if (typeof navigator !== 'undefined') {
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return 'ios';
      if (/Android/i.test(navigator.userAgent)) return 'android';
    }
    return 'ios';
  });

  const deviceOptions = [
    {
      id: 'ios' as DeviceType,
      title: 'Apple iOS',
      subtitle: 'iPhone & iPad',
      icon: Smartphone,
      badge: 'Integrasi VLC',
      badgeColor: '#0071e3',
      description: 'Siaran HLS (VOD Melayu/Viu) dimainkan secara natif. Siaran Live TV & DASH dibuka pantas melalui aplikasi percuma VLC Player.',
      perks: ['Pemain Luaran VLC', 'HLS Natif Safari', 'Pantas & Jimat Bateri'],
    },
    {
      id: 'android' as DeviceType,
      title: 'Android',
      subtitle: 'Telefon, Tablet & TV Box',
      icon: Tv,
      badge: 'Pemain Terbina Penuh',
      badgeColor: '#34c759',
      description: 'Sokongan perkakasan penuh untuk enjin Shaka Player, DASH, MSE dan penyahsulitan kunci ClearKey terus dalam pelayar.',
      perks: ['Pemain Web Terbina', 'DASH & ClearKey Penuh', 'Live TV Siaran Langsung'],
    },
    {
      id: 'desktop' as DeviceType,
      title: 'PC & Komputer Riba',
      subtitle: 'Windows, Mac & Linux',
      icon: Monitor,
      badge: 'Definisi Tinggi 4K',
      badgeColor: '#af52de',
      description: 'Pengalaman paparan skrin lebar pawagam maksimum dengan kualiti resolusi tinggi dan kawalan papan kekunci pintas.',
      perks: ['Skrin Widescreen HDR', 'Kawalan Penuh Tetikus/Papan Kekunci', 'Sokongan Penuh 1080p/4K'],
    },
  ];

  const handleConfirm = () => {
    onSelectDevice(selected);
  };

  return (
    <div className="apple-tv-device-modal-backdrop">
      <div className="apple-tv-device-modal-card">
        {isDismissable && onClose && (
          <button 
            className="apple-tv-device-modal-close-btn"
            onClick={onClose}
            aria-label="Tutup"
            type="button"
          >
            <X size={20} />
          </button>
        )}

        <div className="apple-tv-device-modal-header">
          <div className="apple-tv-device-header-icon-wrap">
            <PlayCircle size={32} color="#0071e3" />
          </div>
          <h2 className="apple-tv-device-modal-title">Pilih Peranti Anda</h2>
          <p className="apple-tv-device-modal-subtitle">
            Sistem akan mengkonfigurasikan enjin pemain media yang paling lancar dan serasi dengan peranti anda.
          </p>
        </div>

        <div className="apple-tv-device-grid">
          {deviceOptions.map((opt) => {
            const isChosen = selected === opt.id;
            const IconComp = opt.icon;
            return (
              <div
                key={opt.id}
                className={`apple-tv-device-option-card ${isChosen ? 'selected' : ''}`}
                onClick={() => setSelected(opt.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelected(opt.id);
                  }
                }}
              >
                <div className="apple-tv-device-card-top">
                  <div className="apple-tv-device-icon-box">
                    <IconComp size={24} />
                  </div>
                  <div className="apple-tv-device-card-status">
                    <span 
                      className="apple-tv-device-badge"
                      style={{ backgroundColor: `${opt.badgeColor}22`, color: opt.badgeColor, borderColor: `${opt.badgeColor}44` }}
                    >
                      {opt.badge}
                    </span>
                    <div className={`apple-tv-device-radio ${isChosen ? 'active' : ''}`}>
                      {isChosen && <CheckCircle2 size={18} color="#0071e3" />}
                    </div>
                  </div>
                </div>

                <div className="apple-tv-device-card-body">
                  <h3 className="apple-tv-device-name">{opt.title}</h3>
                  <span className="apple-tv-device-subname">{opt.subtitle}</span>
                  <p className="apple-tv-device-desc">{opt.description}</p>
                </div>

                <div className="apple-tv-device-perks-list">
                  {opt.perks.map((perk, i) => (
                    <div key={i} className="apple-tv-device-perk-item">
                      <ShieldCheck size={14} className="apple-tv-perk-icon" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="apple-tv-device-modal-footer">
          <p className="apple-tv-device-footer-hint">
            💡 Anda boleh menukar jenis peranti ini pada bila-bila masa melalui butang peranti di bahagian atas header.
          </p>
          <button
            className="apple-tv-device-confirm-btn"
            onClick={handleConfirm}
            type="button"
          >
            <span>Teruskan ke Aplikasi</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
