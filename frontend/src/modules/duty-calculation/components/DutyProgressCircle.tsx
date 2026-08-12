import { useEffect, useState } from "react";

interface DutyProgressCircleProps {
  /** 0–100. Clamped defensively. */
  percentage: number;
  completed: number;
  target: number;
  /** Colour class for the arc, e.g. "text-emerald-500". */
  colorClass?: string;
  /** Diameter in px. */
  size?: number;
  /** Ring thickness in px. */
  strokeWidth?: number;
}

/**
 * SVG circular progress with an animated stroke sweep and a completed/target
 * label at the centre. Pure presentational — parent supplies the numbers.
 */
export default function DutyProgressCircle({
  percentage,
  completed,
  target,
  colorClass = "text-emerald-500",
  size = 140,
  strokeWidth = 10,
}: DutyProgressCircleProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Ease-in from 0 → target% so the arc animates on mount.
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(clamped));
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  const offset = circumference - (animated / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${completed} of ${target} duties completed (${clamped}%)`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClass} transition-[stroke-dashoffset] duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{completed}</span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
          of {target}
        </span>
        <span className="mt-0.5 text-xs font-semibold text-emerald-600">
          {clamped}%
        </span>
      </div>
    </div>
  );
}
