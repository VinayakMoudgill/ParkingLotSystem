interface CarProps {
  color: string;
}

// Maps a color name to a nice solid car-body fill
const CAR_FILL: Record<string, string> = {
  white: '#e8eaed',
  black: '#2c2c34',
  red: '#e74c3c',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#facc15',
  silver: '#cbd5e1',
  grey: '#94a3b8',
  gray: '#94a3b8',
  orange: '#fb923c',
  purple: '#a855f7',
  brown: '#a87b51',
  pink: '#ec4899',
};

/**
 * A clean side-view SVG car. The body colour matches the registered car colour.
 * Wheels spin and the headlight pulses via pure CSS (reliable across renders).
 */
export default function Car({ color }: CarProps) {
  const fill = CAR_FILL[color.toLowerCase()] ?? '#8b95a5';

  return (
    <svg width="74" height="40" viewBox="0 0 120 60" aria-label={`${color} car`}>
      {/* ground shadow */}
      <ellipse cx="60" cy="53" rx="48" ry="5" fill="rgba(0,0,0,0.28)" />

      {/* car body */}
      <path
        d="M8 40 L16 40 Q20 24 38 24 L74 24 Q90 24 98 39 L110 41 Q116 42 116 47 L116 48 Q116 50 112 50 L12 50 Q8 50 8 46 Z"
        fill={fill}
      />

      {/* window / cabin glass */}
      <path
        d="M40 26 L72 26 Q84 26 91 38 L42 38 Q40 38 40 36 Z"
        fill="#bfe3ff"
        opacity="0.92"
      />
      <rect x="58" y="26" width="2.5" height="12" fill={fill} opacity="0.6" />

      {/* headlight (CSS pulse) */}
      <circle className="car-headlight" cx="113" cy="44" r="2.6" fill="#fff4b8" />

      {/* rear wheel (CSS spin) */}
      <g className="car-wheel">
        <circle cx="36" cy="50" r="9.5" fill="#16181d" />
        <circle cx="36" cy="50" r="4.2" fill="#cbd5e1" />
        <rect x="35.2" y="46" width="1.6" height="8" fill="#16181d" />
        <rect x="32" y="49.2" width="8" height="1.6" fill="#16181d" />
      </g>

      {/* front wheel (CSS spin) */}
      <g className="car-wheel">
        <circle cx="92" cy="50" r="9.5" fill="#16181d" />
        <circle cx="92" cy="50" r="4.2" fill="#cbd5e1" />
        <rect x="91.2" y="46" width="1.6" height="8" fill="#16181d" />
        <rect x="88" y="49.2" width="8" height="1.6" fill="#16181d" />
      </g>
    </svg>
  );
}
