/**
 * Simple radar (spider) chart for Style DNA: MINIMAL, STRUCT, BOLD, COMFORT.
 * Values 0–1 per axis; polygon is drawn from center.
 */
interface StyleDNARadarChartProps {
  /** Order: minimal, struct, bold, comfort (0–1 each) */
  values: [number, number, number, number];
  size?: number;
  className?: string;
}

const AXES = ['MINIMAL', 'STRUCT', 'BOLD', 'COMFORT'] as const;

export function StyleDNARadarChart({
  values,
  size = 160,
  className = '',
}: StyleDNARadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const step = (Math.PI * 2) / 4;
  const axisAngle = (i: number) => -Math.PI / 2 + i * step;

  const axisEnd = (i: number, scale: number) => {
    const a = axisAngle(i);
    return { x: cx + r * scale * Math.cos(a), y: cy + r * scale * Math.sin(a) };
  };

  const polygonPoints = values
    .map((v, i) => axisEnd(i, Math.max(0.1, Math.min(1, v))))
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  const gridPoints = [0.25, 0.5, 0.75, 1].map((scale) =>
    AXES.map((_, i) => axisEnd(i, scale))
      .map((p) => `${p.x},${p.y}`)
      .join(' ')
  );

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden>
      {gridPoints.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={1}
        />
      ))}
      {AXES.map((_, i) => {
        const end = axisEnd(i, 1);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeWidth={1}
          />
        );
      })}
      <polygon
        points={polygonPoints}
        fill="var(--primary)"
        fillOpacity={0.25}
        stroke="var(--primary)"
        strokeWidth={1.5}
        strokeOpacity={0.8}
      />
      {AXES.map((label, i) => {
        const end = axisEnd(i, 1.08);
        return (
          <text
            key={label}
            x={end.x}
            y={end.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground text-[10px] font-medium uppercase tracking-wider"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

export function getRadarValuesFromPersonal(
  identity: { kibbe?: Record<string, number>; color_season?: string } | undefined,
  _lifestyle?: string
): [number, number, number, number] {
  const k = identity?.kibbe;
  const natural = (k && typeof k === 'object' && (k.Natural ?? (k as Record<string, number>)['Soft Natural'] ?? 0)) as number;
  const classic = (k && typeof k === 'object' && (k.Classic ?? 0)) as number;
  const minimal = 0.4 + (classic ?? 0) * 0.4;
  const struct = 0.3 + (classic ?? 0) * 0.5;
  const bold = 0.2 + (1 - (natural ?? 0)) * 0.3;
  const comfort = 0.5 + (natural ?? 0) * 0.4;
  return [
    Math.min(1, minimal),
    Math.min(1, struct),
    Math.min(1, bold),
    Math.min(1, comfort),
  ];
}
