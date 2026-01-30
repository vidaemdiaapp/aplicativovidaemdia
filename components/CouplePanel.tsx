import React from 'react';

type ResponsibilityFilter = 'me' | 'partner' | 'unassigned' | 'joint';

interface CouplePanelProps {
    activeFilter: ResponsibilityFilter;
    onFilterChange: (filter: ResponsibilityFilter) => void;
    partnerName: string;
}

export const CouplePanel: React.FC<CouplePanelProps> = ({ activeFilter, onFilterChange, partnerName }) => {
    return (
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <FilterButton
                label="Comigo"
                isActive={activeFilter === 'me'}
                onClick={() => onFilterChange('me')}
            />
            <FilterButton
                label={partnerName.split(' ')[0] || 'Parceiro'}
                isActive={activeFilter === 'partner'}
                onClick={() => onFilterChange('partner')}
            />
            <FilterButton
                label="Nós"
                isActive={activeFilter === 'joint'}
                onClick={() => onFilterChange('joint')}
            />
            <FilterButton
                label="Abertos"
                isActive={activeFilter === 'unassigned'}
                onClick={() => onFilterChange('unassigned')}
            />
        </div>
    );
};

const FilterButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${isActive
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
    >
        {label}
    </button>
);
