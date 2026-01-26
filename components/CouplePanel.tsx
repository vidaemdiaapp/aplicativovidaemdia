import React from 'react';

type ResponsibilityFilter = 'me' | 'partner' | 'unassigned' | 'joint';

interface CouplePanelProps {
    activeFilter: ResponsibilityFilter;
    onFilterChange: (filter: ResponsibilityFilter) => void;
    partnerName: string;
}

export const CouplePanel: React.FC<CouplePanelProps> = ({ activeFilter, onFilterChange, partnerName }) => {
    return (
        <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-3xl mb-6">
            <button
                onClick={() => onFilterChange('me')}
                className={`flex-1 py-2.5 px-3 rounded-2xl text-[10px] font-black transition-all ${activeFilter === 'me'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-slate-500 hover:bg-white/50'
                    }`}
            >
                Comigo
            </button>
            <button
                onClick={() => onFilterChange('partner')}
                className={`flex-1 py-2.5 px-3 rounded-2xl text-[10px] font-black transition-all ${activeFilter === 'partner'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-slate-500 hover:bg-white/50'
                    }`}
            >
                {partnerName.split(' ')[0] || 'Parceiro'}
            </button>
            <button
                onClick={() => onFilterChange('joint')}
                className={`flex-1 py-2.5 px-3 rounded-2xl text-[10px] font-black transition-all ${activeFilter === 'joint'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-white/50'
                    }`}
            >
                Nós
            </button>
            <button
                onClick={() => onFilterChange('unassigned')}
                className={`flex-1 py-2.5 px-3 rounded-2xl text-[10px] font-black transition-all ${activeFilter === 'unassigned'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-slate-500 hover:bg-white/50'
                    }`}
            >
                Abertos
            </button>
        </div>
    );
};
