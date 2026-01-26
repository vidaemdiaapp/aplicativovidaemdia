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
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                <Users className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Nós</span>
            </div>
        );
    }

    if (isUnassigned) {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                <Users className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Em Aberto</span>
            </div>
        );
    }

    const initials = (ownerName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${isCurrentUser
            ? 'bg-primary-50 text-primary-700 border-primary-100'
            : 'bg-white text-slate-700 border-slate-200'
            }`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${isCurrentUser ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                {initials}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tight">
                {isCurrentUser ? 'Comigo' : (ownerName || 'Parceiro')}
            </span>
        </div>
    );
};
