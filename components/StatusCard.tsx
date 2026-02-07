import React from 'react';
import { StatusLevel } from '../types';
import { STATUS_CONFIG } from '../constants';
import { ShieldCheck, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';

interface StatusCardProps {
  status: StatusLevel;
  percentage: number;
}

export const StatusCard: React.FC<StatusCardProps> = ({ status, percentage }) => {
  const config = STATUS_CONFIG[status];

  const themeConfig = {
    safe: {
      color: '#10b981', // emerald-500
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />
    },
    warning: {
      color: '#f59e0b', // amber-500
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />
    },
    risk: {
      color: '#ef4444', // rose-500
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      icon: <XCircle className="w-6 h-6 text-rose-600" />
    }
  };

  const statusKey = status === StatusLevel.SAFE ? 'safe' : status === StatusLevel.WARNING ? 'warning' : 'risk';
  const theme = themeConfig[statusKey];

  // SVG Radial constants
  const size = 100;
  const strokeWidth = 8;
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="card-premium p-6 relative overflow-hidden group active:scale-[0.99] transition-all cursor-pointer">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:scale-110"></div>

      <div className="flex items-center gap-6">
        {/* Radial Progress */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg className="transform -rotate-90 w-full h-full">
            {/* Background Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-slate-100"
            />
            {/* Progress Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Percentage Text Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-text-primary leading-none">{percentage}</span>
            <span className="text-[10px] font-bold text-text-muted uppercase">Health</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${theme.bg} ${theme.text}`}>
              {statusKey}
            </span>
            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Status Geral</span>
          </div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight mb-1 truncate">
            {config.label}
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
            {config.description}
          </p>
        </div>

        {/* Action Icon */}
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 group-hover:text-primary-500 group-hover:bg-primary-50 transition-all">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
