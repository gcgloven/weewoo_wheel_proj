import { REGISTRY } from './registry';

export interface WheelAction {
  id: string;
  label: string;
}

/** Per-action button style: background, glow, text color. */
export interface WheelButtonStyle {
  bg: string;
  glow: string;
  text: string;
}

/** Icon descriptor — emoji string or image URL. */
export interface WheelIcon {
  type: 'emoji' | 'image';
  value: string;
}

/** Complete wheel visual config provided by the active skin pack. */
export interface WheelSkinConfig {
  icons: Record<string, WheelIcon>;
  colors: Record<string, WheelButtonStyle>;
  fallbackColor: WheelButtonStyle;
  wheelGlow: string;
  centerBg: string;
  centerBorder: string;
  ringBorder: string;
  /** Center button icon. */
  centerIcon: WheelIcon;
  /** Glass effect properties (optional — skin falls back to solid if omitted). */
  glass?: {
    /** Container backdrop-filter blur (e.g. '20px'). */
    containerBlur: string;
    /** Action button backdrop-filter blur (e.g. '12px'). */
    buttonBlur: string;
    /** Semi-transparent background for the wheel container. */
    containerBg: string;
    /** Subtle border for the container circle. */
    containerBorder: string;
  };
}

interface WheelProps {
  slots: string[];
  onPick: (id: string) => void;
  config: WheelSkinConfig;
}

export function Wheel({ slots, onPick, config }: WheelProps) {
  const items = slots.map((id) => {
    const action = REGISTRY[id];
    const style = config.colors[id] ?? config.fallbackColor;
    const icon = config.icons[id] ?? { type: 'emoji' as const, value: '⚡' };
    return {
      id: action?.id ?? id,
      label: action?.label ?? id,
      icon,
      style,
    };
  });

  return (
    <>
      <style>{`
        @keyframes weewoo-wheel-in {
          from { opacity: 0; transform: scale(0.6); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .weewoo-btn, [style*="animation"] {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
        .weewoo-btn { transition: background 150ms ease, box-shadow 150ms ease, transform 100ms ease; }
        .weewoo-btn:hover { box-shadow: 0 0 16px var(--glow, rgba(100,140,255,0.4)) !important; transform: scale(1.05); }
        .weewoo-btn:active { transform: scale(0.95); }
      `}</style>
      <div
        role="menu"
        aria-label="WeeWoo Wheel"
        style={{
          position: 'relative',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: config.glass?.containerBg ?? 'transparent',
          backdropFilter: config.glass ? `blur(${config.glass.containerBlur})` : undefined,
          WebkitBackdropFilter: config.glass ? `blur(${config.glass.containerBlur})` : undefined,
          border: config.glass?.containerBorder ?? 'none',
          boxShadow: config.glass
            ? `0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.15) inset`
            : `0 0 18px ${config.wheelGlow}`,
          animation: 'weewoo-wheel-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
      {/* Subtle ring behind the buttons */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 160,
          height: 160,
          borderRadius: '50%',
          border: config.glass
            ? '1px solid rgba(255,255,255,0.18)'
            : config.ringBorder,
          pointerEvents: 'none',
        }}
      />

      {/* Center button */}
      <button
        aria-label="Close wheel"
        onClick={(e) => e.stopPropagation()}
        title="Close wheel"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: config.centerBg,
          backdropFilter: config.glass ? `blur(${config.glass.buttonBlur})` : undefined,
          WebkitBackdropFilter: config.glass ? `blur(${config.glass.buttonBlur})` : undefined,
          border: config.centerBorder,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          zIndex: 2,
          boxShadow: config.glass
            ? `0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.2) inset`
            : `0 0 12px ${config.wheelGlow}`,
        }}
      >
        {config.centerIcon.type === 'image' ? (
          <img
            src={config.centerIcon.value}
            alt="Close wheel"
            style={{ width: 28, height: 28, objectFit: 'contain', pointerEvents: 'none' }}
          />
        ) : (
          <span style={{ fontSize: 22, lineHeight: 1 }}>{config.centerIcon.value}</span>
        )}
      </button>

      {/* Radial slots */}
      {items.map((item, i) => {
        const angle = (360 / items.length) * i - 90; // start at 12-o-clock
        const radius = 72;
        const x = 50 + (Math.cos((angle * Math.PI) / 180) * radius) / 2;
        const y = 50 + (Math.sin((angle * Math.PI) / 180) * radius) / 2;

        const { style } = item;

        return (
          <button
            key={item.id}
            className="weewoo-btn"
            role="menuitem"
            onClick={() => {
              console.log('🎯 [Wheel] BUTTON CLICKED:', item.id, '|', item.label);
              onPick(item.id);
            }}
            style={{
              '--glow': style.glow,
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: style.bg,
              backdropFilter: config.glass ? `blur(${config.glass.buttonBlur})` : undefined,
              WebkitBackdropFilter: config.glass ? `blur(${config.glass.buttonBlur})` : undefined,
              color: style.text,
              border: config.glass
                ? `1px solid rgba(255,255,255,0.25)`
                : `2px solid ${style.glow}`,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              fontSize: 9,
              fontWeight: 700,
              textAlign: 'center',
              lineHeight: 1.2,
              padding: 4,
              zIndex: 1,
              boxShadow: config.glass
                ? `0 4px 16px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.15) inset`
                : `0 0 14px ${style.glow.replace('0.6', '0.35')}`,
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = 'translate(-50%, -50%) scale(1.12)';
              el.style.boxShadow = config.glass
                ? '0 8px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.25) inset'
                : `0 0 22px ${style.glow}`;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = 'translate(-50%, -50%) scale(1)';
              el.style.boxShadow = config.glass
                ? `0 4px 16px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.15) inset`
                : `0 0 14px ${style.glow.replace('0.6', '0.35')}`;
            }}
          >
            {item.icon.type === 'image' ? (
              <img
                src={item.icon.value}
                alt={item.label}
                style={{ width: 26, height: 26, objectFit: 'contain', pointerEvents: 'none' }}
              />
            ) : (
              <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon.value}</span>
            )}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
    </>
  );
}
