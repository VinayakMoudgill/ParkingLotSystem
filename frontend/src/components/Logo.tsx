interface LogoProps {
  size?: number;
}

/**
 * ParkFlow brand mark — a bold parking "P" paired with three "flow" speed
 * lines suggesting smooth traffic movement. Drawn in `currentColor` so it
 * inherits the white foreground of the gradient header badge and stays crisp
 * at any size.
 */
export default function Logo({ size = 28 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="ParkFlow logo"
    >
      {/* Flow / motion lines */}
      <rect x="1" y="7.8" width="10" height="2.4" rx="1.2" fill="currentColor" opacity="0.5" />
      <rect x="3" y="14.8" width="8" height="2.4" rx="1.2" fill="currentColor" opacity="0.85" />
      <rect x="1" y="21.8" width="10" height="2.4" rx="1.2" fill="currentColor" opacity="0.5" />

      {/* Parking "P" */}
      <path
        d="M16 27 L16 6 H20.5 A5 5 0 0 1 20.5 16 H16"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
