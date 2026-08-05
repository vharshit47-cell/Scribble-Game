import { useEffect, useState } from "react";

interface Props {
  endsAt: number | null;
  totalSeconds: number;
}

export default function CircularTimer({ endsAt, totalSeconds }: Props) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(secondsLeft);
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [endsAt]);

  const pct = Math.max(0, Math.min(1, remaining / totalSeconds));
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const isUrgent = remaining <= 10;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="5" fill="none" />
        <circle
          cx="30"
          cy="30"
          r={radius}
          stroke={isUrgent ? "#EF4444" : "#6366F1"}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          className={`transition-all duration-300 ${isUrgent ? "animate-pulse" : ""}`}
        />
      </svg>
      <span className={`absolute font-bold text-sm ${isUrgent ? "text-danger" : "text-ink"}`}>
        {remaining}
      </span>
    </div>
  );
}
