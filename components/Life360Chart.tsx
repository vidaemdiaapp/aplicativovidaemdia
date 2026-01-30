import React from 'react';

interface ChartData {
  label: string;
  percentage: number;
  color: string;
  gradient: [string, string];
}

interface Life360ChartProps {
  data: ChartData[];
  size?: number;
}

export const Life360Chart: React.FC<Life360ChartProps> = ({ data, size = 260 }) => {
  const center = size / 2;
  const strokeWidth = 14;
  const spacing = 22;

  const averageScore = Math.round(data.reduce((acc, curr) => acc + curr.percentage, 0) / (data.length || 1));

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            {data.map((item, index) => (
              <linearGradient key={`grad-${index}`} id={`grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={item.gradient[0]} />
                <stop offset="100%" stopColor={item.gradient[1]} />
              </linearGradient>
            ))}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {data.map((item, index) => {
            const radius = (size / 2) - (index * spacing) - 30;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (item.percentage / 100) * circumference;

            return (
              <React.Fragment key={item.label}>
                {/* Background track */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  className="text-surface-highlight opacity-30"
                  strokeLinecap="round"
                />
                {/* Progress track */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={`url(#grad-${index})`}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: 'drop-shadow(0px 0px 4px rgba(190, 242, 100, 0.2))' }}
                />
              </React.Fragment>
            );
          })}
        </svg>

        {/* Center content - Overall Score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center -mt-1">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted mb-1">Status Global</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-6xl font-black text-white tracking-tighter drop-shadow-lg">{averageScore}</span>
            <span className="text-xl font-black text-muted font-serif">%</span>
          </div>
          <div className="mt-2 px-3 py-1 bg-surface-highlight border border-primary/20 rounded-sm">
            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Excelente</span>
          </div>
        </div>
      </div>

      {/* Modern Legend Grid */}
      <div className="grid grid-cols-3 gap-6 mt-10 w-full max-w-sm">
        {data.map((item, index) => (
          <div key={item.label} className="flex flex-col items-center group">
            <div className="flex items-center gap-2 mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
              <span className="text-[10px] text-muted font-bold uppercase tracking-widest">{item.label}</span>
            </div>
            <div className="text-lg font-black text-white">{item.percentage}%</div>
            <div className={`h-1 w-6 rounded-full mt-1 bg-surface-highlight`}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${item.percentage}%`, background: item.color, opacity: 0.8 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

