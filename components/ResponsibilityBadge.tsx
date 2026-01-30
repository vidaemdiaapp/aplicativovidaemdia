import React from 'react';
import { User, Users } from 'lucide-react';

interface ResponsibilityBadgeProps {
    ownerName?: string;
    isCurrentUser: boolean;
    isUnassigned?: boolean;
    isJoint?: boolean;
}

export const ResponsibilityBadge: React.FC<ResponsibilityBadgeProps> = ({ ownerName, isCurrentUser, isUnassigned, isJoint }) => {
    if (isJoint) {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-50 border border-cyan-200 rounded-lg">
                <Users className="w-3.5 h-3.5 text-cyan-600" />
                <span className="text-[10px] font-semibold text-cyan-700">Nós</span>
            </div>
        );
    }

    if (isUnassigned) {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-semibold text-slate-500">Aberto</span>
            </div>
        );
    }

    const initials = (ownerName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${isCurrentUser
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold ${isCurrentUser
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}>
                {initials}
            </div>
            <span className="text-[10px] font-semibold">
                {isCurrentUser ? 'Comigo' : (ownerName?.split(' ')[0] || 'Parceiro')}
            </span>
        </div>
    );
};
