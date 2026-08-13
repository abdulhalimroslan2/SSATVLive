// React import removed for vite
import { Lock, CreditCard, X } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onSubscribe }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass-panel animate-fade-in" style={{
        padding: '2.5rem',
        maxWidth: '450px',
        width: '90%',
        textAlign: 'center',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <X size={24} />
        </button>

        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(255, 107, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: 'var(--accent-color)'
        }}>
          <Lock size={32} />
        </div>

        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
          Unlock access to Unifi TV channels
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Your free preview has ended or you are trying to access premium content.
          Unlock this with a Unifi TV pack to enjoy unlimited entertainment!
        </p>

        <button 
          className="btn btn-primary" 
          onClick={onSubscribe}
          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
        >
          <CreditCard size={20} />
          Subscribe Now
        </button>
        
        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          *Terms and conditions apply. Billed monthly.
        </p>
      </div>
    </div>
  );
};
