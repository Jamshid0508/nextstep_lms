import { brand } from '../theme/brand';

const Mark = ({ size }: { size: number }) => (
  <svg width={size} height={size * (220 / 240)} viewBox="0 0 240 220" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="nsGrad" x1="10%" y1="100%" x2="95%" y2="5%">
        <stop offset="0%" stopColor={brand.blue} />
        <stop offset="55%" stopColor={brand.teal} />
        <stop offset="100%" stopColor={brand.green} />
      </linearGradient>
    </defs>
    <rect x="30" y="150" width="30" height="48" rx="7" fill="url(#nsGrad)" />
    <rect x="70" y="118" width="30" height="80" rx="7" fill="url(#nsGrad)" />
    <rect x="110" y="80" width="30" height="118" rx="7" fill="url(#nsGrad)" />
    <path d="M46 198 L190 44" stroke="url(#nsGrad)" strokeWidth={16} strokeLinecap="round" />
    <polygon points="209,24 202,55 178,33" fill="url(#nsGrad)" />
  </svg>
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

  const wordmarkStyle =
    theme === 'dark'
      ? { color: '#ffffff' }
      : {
          backgroundImage: brand.gradient,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        };

  const subtitleColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.75)' : brand.blue;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Mark size={size} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span
          style={{
            fontSize: size * 0.55,
            fontWeight: 800,
            letterSpacing: 0.5,
            ...wordmarkStyle,
          }}
        >
          NextStep
        </span>
        <span
          style={{
            fontSize: size * 0.24,
            fontWeight: 600,
            letterSpacing: 1.5,
            color: subtitleColor,
            textTransform: 'uppercase',
          }}
        >
          O'quv markazi
        </span>
      </div>
    </div>
  );
}
