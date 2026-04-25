'use client';

interface RewardSplitChartProps {
  userPercent: number;
  creatorsPercent: number;
  platformPercent: number;
}

const SEGMENTS = [
  { key: 'user', color: '#6366f1', label: 'You' },
  { key: 'creators', color: '#10b981', label: 'Creators' },
  { key: 'platform', color: '#f59e0b', label: 'Platform' },
] as const;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export default function RewardSplitChart({
  userPercent,
  creatorsPercent,
  platformPercent,
}: RewardSplitChartProps) {
  const percents = [userPercent, creatorsPercent, platformPercent];
  const cx = 80;
  const cy = 80;
  const r = 60;
  const strokeWidth = 20;
  const innerR = r - strokeWidth / 2;

  let cumulative = 0;
  const arcs = percents.map((pct, i) => {
    const startDeg = (cumulative / 100) * 360;
    cumulative += pct;
    const endDeg = (cumulative / 100) * 360;
    return { ...SEGMENTS[i], pct, startDeg, endDeg };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={160} height={160} viewBox="0 0 160 160">
        {arcs.map(({ key, color, startDeg, endDeg }) =>
          endDeg - startDeg > 0 ? (
            <path
              key={key}
              d={describeArc(cx, cy, innerR, startDeg, endDeg)}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
            />
          ) : null
        )}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize={18} fontWeight="bold">
          {userPercent}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={10}>
          to you
        </text>
      </svg>

      <div className="flex gap-4 text-sm">
        {arcs.map(({ key, color, label, pct }) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-white/70">
              {label} {pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
