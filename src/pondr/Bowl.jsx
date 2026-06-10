// Bowl.jsx — Hand-drawn bowl illustration + photo variant + decorative plant.
// Ported from the design handoff (pondr-bowl.jsx). The SVG Bowl is the
// illustration fallback; BowlPhoto uses the production PNGs (preferred).

export function Bowl({ withSparkles = true }) {
  return (
    <svg viewBox="0 0 320 320" width="100%" height="100%" aria-label="A glass bowl filled with folded notes">
      <defs>
        {/* Stippled texture used on bowl rim/sides for ink-drawn feel */}
        <pattern id="stipple" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.55" fill="var(--p-bowl-stroke)" />
          <circle cx="4" cy="3" r="0.45" fill="var(--p-bowl-stroke)" />
          <circle cx="2" cy="5" r="0.4" fill="var(--p-bowl-stroke)" />
        </pattern>
        <pattern id="stipple-dense" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="0.8" cy="0.8" r="0.6" fill="var(--p-bowl-stroke)" />
          <circle cx="2.6" cy="2.6" r="0.55" fill="var(--p-bowl-stroke)" />
          <circle cx="1.4" cy="3.2" r="0.45" fill="var(--p-bowl-stroke)" />
        </pattern>
        {/* Paper-note texture */}
        <pattern id="paper-tex" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="3" height="3" fill="var(--p-bowl-paper)" />
          <circle cx="1" cy="1" r="0.35" fill="var(--p-bowl-paper-2)" opacity="0.45" />
          <circle cx="2" cy="2.2" r="0.3" fill="var(--p-bowl-paper-2)" opacity="0.55" />
        </pattern>
        <pattern id="paper-tex-dark" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="3" height="3" fill="var(--p-bowl-paper-2)" />
          <circle cx="1" cy="1" r="0.35" fill="var(--p-bowl-paper)" opacity="0.55" />
          <circle cx="2" cy="2.2" r="0.3" fill="var(--p-bowl-paper)" opacity="0.65" />
        </pattern>

        {/* Bowl clip so notes don't escape the curve */}
        <clipPath id="bowl-inside">
          <path d="M 60 110
                   C 60 125, 50 200, 100 260
                   C 130 285, 190 285, 220 260
                   C 270 200, 260 125, 260 110
                   Z" />
        </clipPath>
      </defs>

      {/* Ground shadow under the bowl */}
      <ellipse cx="160" cy="285" rx="120" ry="14" fill="var(--p-bowl-shadow)" opacity="0.55" />
      <ellipse cx="160" cy="288" rx="80" ry="6" fill="var(--p-bowl-shadow)" opacity="0.75" />

      {/* Bowl outline — rendered as two strokes for a hand-drawn double-line */}
      <g fill="none" stroke="var(--p-bowl-stroke)" strokeLinecap="round" strokeLinejoin="round">
        {/* Rim ellipse — outer */}
        <ellipse cx="160" cy="108" rx="100" ry="14" strokeWidth="2.2" />
        {/* Rim inner shading */}
        <ellipse cx="160" cy="111" rx="92" ry="9" strokeWidth="0.7" opacity="0.6" />
        {/* Rim highlight (top) */}
        <path d="M 80 102 Q 160 92, 240 102" strokeWidth="1.2" opacity="0.7" />

        {/* Bowl body — left side */}
        <path d="M 60 110
                 C 56 130, 50 200, 100 256
                 C 120 274, 150 280, 160 280"
              strokeWidth="2.2" />
        {/* Bowl body — right side */}
        <path d="M 260 110
                 C 264 130, 270 200, 220 256
                 C 200 274, 170 280, 160 280"
              strokeWidth="2.2" />
        {/* Inner hatched shading — left curve */}
        <path d="M 70 130 C 62 170, 64 220, 92 252" strokeWidth="0.8" opacity="0.55" />
        <path d="M 78 145 C 72 180, 74 220, 100 248" strokeWidth="0.55" opacity="0.5" />
        {/* Inner hatched shading — right curve */}
        <path d="M 250 130 C 258 170, 256 220, 228 252" strokeWidth="0.8" opacity="0.55" />
        <path d="M 242 145 C 248 180, 246 220, 220 248" strokeWidth="0.55" opacity="0.5" />
      </g>

      {/* Stippled body shading (gives the textured ink feel) */}
      <g clipPath="url(#bowl-inside)">
        {/* darker stipple along the bottom curve */}
        <path d="M 70 200 C 80 250, 130 280, 160 280 C 190 280, 240 250, 250 200
                 L 250 290 L 70 290 Z" fill="url(#stipple-dense)" opacity="0.55" />
        {/* lighter stipple wash across the body */}
        <path d="M 60 130 C 56 200, 100 270, 160 270 C 220 270, 264 200, 260 130
                 L 260 290 L 60 290 Z" fill="url(#stipple)" opacity="0.25" />
      </g>

      {/* Notes inside the bowl — a tumble of textured paper squares */}
      <g clipPath="url(#bowl-inside)">
        {[
          // x, y, rot, w, h, dark?
          [82,  170, -14, 56, 48, false],
          [128, 156,   8, 60, 50, true],
          [170, 174,  -6, 58, 52, false],
          [98,  208,  18, 54, 46, true],
          [148, 210,  -8, 60, 52, false],
          [196, 200,  12, 56, 50, true],
          [120, 240, -10, 58, 46, false],
          [172, 244,   6, 56, 46, true],
          [88,  142,  20, 44, 38, true],
          [200, 152,  -18, 46, 40, false],
          [142, 138,  -2, 50, 42, true],
          [222, 230,  20, 44, 38, false],
        ].map(([x, y, r, w, h, dark], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="2"
                  fill={dark ? "url(#paper-tex-dark)" : "url(#paper-tex)"} />
            <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="2"
                  fill="none" stroke="var(--p-bowl-stroke)" strokeWidth="0.6" opacity="0.45" />
            {/* fold corner */}
            <path d={`M ${w / 2 - 6} ${-h / 2} L ${w / 2} ${-h / 2 + 6} L ${w / 2 - 6} ${-h / 2 + 6} Z`}
                  fill="var(--p-bowl-paper-2)" opacity="0.55" />
          </g>
        ))}
      </g>

      {/* Highlight on the bowl glass — top-left */}
      <path d="M 78 130 C 70 160, 70 195, 80 220"
            stroke="var(--p-bg)" strokeWidth="3" fill="none" opacity="0.45" strokeLinecap="round" />
      <path d="M 84 138 C 78 168, 78 200, 88 222"
            stroke="var(--p-bg)" strokeWidth="1.2" fill="none" opacity="0.55" strokeLinecap="round" />

      {/* Sparkles floating around */}
      {withSparkles && (
        <g fill="var(--p-bowl-stroke)" opacity="0.55">
          <SparkSm cx={36}  cy={150} />
          <SparkSm cx={290} cy={130} s={0.7} />
          <SparkSm cx={50}  cy={250} s={0.6} />
          <SparkSm cx={282} cy={240} s={0.8} />
          <SparkSm cx={26}  cy={210} s={0.55} />
        </g>
      )}
    </svg>
  );
}

export function SparkSm({ cx, cy, s = 1 }) {
  const d = 6 * s;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <path d={`M 0 ${-d} L ${d / 3} 0 L 0 ${d} L ${-d / 3} 0 Z`} />
      <path d={`M ${-d} 0 L 0 ${d / 3} L ${d} 0 L 0 ${-d / 3} Z`} />
    </g>
  );
}

// The production bowl — PNG artwork, cross-faded between light/dark themes
// via CSS (see .bowl-photo-real in components.css). Assets live in /public.
export function BowlPhoto() {
  return (
    <div className="bowl-photo-real">
      <img className="bowl-img-light" src="/assets/pondr-bowl.png" alt="A glass bowl filled with folded notes" />
      <img className="bowl-img-dark" src="/assets/pondr-bowl-dark.png" alt="" aria-hidden="true" />
    </div>
  );
}

// Decorative plant silhouette (the leafy purple shape on the sides)
export function Plant({ size = 90 }) {
  return (
    <svg viewBox="0 0 90 110" width={size} height={size} aria-hidden="true">
      <defs>
        <pattern id="leaf-tex" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="3" height="3" fill="var(--p-plant)" />
          <circle cx="1.5" cy="1.5" r="0.4" fill="var(--p-plant-2)" opacity="0.6" />
        </pattern>
      </defs>
      <g fill="url(#leaf-tex)">
        {/* central rounded mound */}
        <path d="M 10 100 Q 14 60, 30 60 Q 46 60, 50 100 Z" />
        {/* tall stalks with leaves */}
        <path d="M 30 65 Q 22 45, 26 30 Q 30 45, 36 50 Q 30 50, 30 65 Z" />
        <path d="M 26 30 Q 20 22, 22 14 Q 26 18, 30 18 Q 26 22, 26 30 Z" />

        <path d="M 44 70 Q 50 50, 56 38 Q 56 50, 62 56 Q 54 54, 50 70 Z" />
        <path d="M 56 38 Q 54 28, 58 20 Q 60 26, 64 26 Q 60 30, 56 38 Z" />

        <path d="M 14 80 Q 6 70, 4 56 Q 10 64, 16 62 Q 12 70, 14 80 Z" />
      </g>
    </svg>
  );
}
