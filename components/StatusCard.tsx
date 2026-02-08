import React from 'react';
import { StatusLevel } from '../types';
import { STATUS_CONFIG } from '../constants';
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';

interface StatusCardProps {
  status: StatusLevel;
  percentage: number;
}

export const StatusCard: React.FC<StatusCardProps> = ({ status, percentage }) => {
  const config = STATUS_CONFIG[status];

  const themeConfig = {
    safe: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-600',
      progressBg: 'bg-emerald-200',
      progress: 'bg-emerald-500'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-600',
      progressBg: 'bg-amber-200',
      progress: 'bg-amber-500'
    },
    risk: {
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      textColor: 'text-rose-600',
      progressBg: 'bg-rose-200',
      progress: 'bg-rose-500'
    }
  };

  const statusKey = status === StatusLevel.SAFE ? 'safe' : status === StatusLevel.WARNING ? 'warning' : 'risk';
  const theme = themeConfig[statusKey];

  const renderIcon = () => {
    const iconClass = `w-6 h-6 ${theme.iconColor}`;
    switch (status) {
      case StatusLevel.SAFE: return <CheckCircle2 className={iconClass} />;
      case StatusLevel.WARNING: return <AlertTriangle className={iconClass} />;
      case StatusLevel.RISK: return <XCircle className={iconClass} />;
    }
  };

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Status Geral</p>
          <h2 className={`text-2xl font-bold ${theme.textColor}`}>
            {config.label}
          </h2>
        </div>
        <div className={`p-3 rounded-xl ${theme.iconBg}`}>
          {renderIcon()}
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-600 text-sm mb-5 leading-relaxed">
        {config.description}
      </p>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">Saúde Documental</span>
          <span className={`font-bold ${theme.textColor}`}>{percentage}%</span>
        </div>
        <div className={`h-2 ${theme.progressBg} rounded-full overflow-hidden`}>
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${theme.progress}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
