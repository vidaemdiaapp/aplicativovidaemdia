import React from 'react';

type ResponsibilityFilter = 'me' | 'partner' | 'unassigned';

interface CouplePanelProps {
    activeFilter: ResponsibilityFilter;
    onFilterChange: (filter: ResponsibilityFilter) => void;
    partnerName: string;
}

export const CouplePanel: React.FC<CouplePanelProps> = ({ activeFilter, onFilterChange, partnerName }) => {
    return (
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-3xl mb-6">
            <button
                onClick={() => onFilterChange('me')}
                className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-black transition-all ${activeFilter === 'me'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-slate-500 hover:bg-white/50'
                    }`}
            >
                Comigo
            </button>
            <button
                onClick={() => onFilterChange('partner')}
                className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-black transition-all ${activeFilter === 'partner'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-slate-500 hover:bg-white/50'
                    }`}
            >
                Com {partnerName.split(' ')[0] || 'Parceiro'}
            </button>
            <button
                onClick={() => onFilterChange('unassigned')}
                className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-black transition-all ${activeFilter === 'unassigned'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-slate-500 hover:bg-white/50'
                    }`}
            >
                Em Aberto
            </button>
        </div>
    );
};
