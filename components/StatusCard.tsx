import React from 'react';
import { StatusLevel } from '../types';
import { STATUS_CONFIG } from '../constants';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface StatusCardProps {
  status: StatusLevel;
  percentage: number;
}

export const StatusCard: React.FC<StatusCardProps> = ({ status, percentage }) => {
  const config = STATUS_CONFIG[status];
  
  const renderIcon = () => {
    switch (status) {
      case StatusLevel.SAFE: return <CheckCircle2 className="w-8 h-8 text-white" />;
      case StatusLevel.WARNING: return <AlertTriangle className="w-8 h-8 text-white" />;
      case StatusLevel.RISK: return <XCircle className="w-8 h-8 text-white" />;
    }
  };

  return (
    <div className={`${config.color} rounded-3xl p-6 text-white shadow-xl transition-all duration-500`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">Status Geral</p>
          <h2 className="text-2xl font-bold">{config.label}</h2>
        </div>
        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
          {renderIcon()}
        </div>
      </div>
      
      <p className="text-white/90 text-sm mb-6 leading-relaxed">
        {config.description}
      </p>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium text-white/80">
          <span>Saúde Documental</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-2 bg-black/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
