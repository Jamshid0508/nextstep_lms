import { brand } from '../theme/brand';

const Mark = ({ size = 40 }: { size: number }) => (
  <div
    style={{
      position: 'relative',
      width: size,
      height: size,
      borderRadius: size * 0.26,
      background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(23,140,140,0.2) 50%, rgba(18,59,103,0.3) 100%)',
      border: '1.5px solid rgba(255, 255, 255, 0.25)',
      boxShadow: '0 8px 24px -4px rgba(18, 59, 103, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      cursor: 'pointer',
      padding: size * 0.1,
    }}
    className="glass-logo-badge"
  >
    <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 240 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ns3dGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#123B67" />
          <stop offset="45%" stopColor="#178C8C" />
          <stop offset="100%" stopColor="#2ECC71" />
        </linearGradient>
        <linearGradient id="arrowGlow" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#178C8C" />
          <stop offset="100%" stopColor="#2ECC71" />
        </linearGradient>
        <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Stepped 3D bars */}
      <rect x="25" y="140" width="34" height="55" rx="8" fill="url(#ns3dGrad)" />
      <rect x="68" y="105" width="34" height="90" rx="8" fill="url(#ns3dGrad)" />
      <rect x="111" y="65" width="34" height="130" rx="8" fill="url(#ns3dGrad)" />

      {/* Sweeping 3D Arrow Curve */}
      <path
        d="M25 185 C 65 175, 115 135, 185 45"
        stroke="url(#arrowGlow)"
        strokeWidth={20}
        strokeLinecap="round"
        filter="url(#glowFilter)"
      />
      {/* Arrow tip polygon */}
      <polygon points="215,22 178,35 198,72" fill="url(#arrowGlow)" filter="url(#glowFilter)" />
    </svg>
  </div>
);

type LogoProps = {
  variant?: 'full' | 'icon';
  size?: number;
  theme?: 'light' | 'dark';
};

export function Logo({ variant = 'full', size = 40, theme = 'light' }: LogoProps) {
  if (variant === 'icon') {
    return <Mark size={size} />;
  }

  const isDarkText = theme === 'dark';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        userSelect: 'none',
        cursor: 'pointer',
      }}
      className="logo-full-container"
    >
      <Mark size={size} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <span
          style={{
            fontSize: size * 0.58,
            fontWeight: 900,
            letterSpacing: 0.5,
            background: 'linear-gradient(90deg, #123B67 0%, #178C8C 50%, #2ECC71 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: isDarkText ? 'undefined' : 'transparent',
            color: isDarkText ? '#FFFFFF' : 'transparent',
          }}
        >
          NEXTSTEP
        </span>
        <span
          style={{
            fontSize: size * 0.24,
            fontWeight: 700,
            letterSpacing: 2,
            color: isDarkText ? '#94A3B8' : brand.blue,
            textTransform: 'uppercase',
            marginTop: 2,
          }}
        >
          O'QUV MARKAZI
        </span>
      </div>
    </div>
  );
}
