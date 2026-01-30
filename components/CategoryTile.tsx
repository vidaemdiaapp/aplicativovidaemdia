import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CategoryTileProps {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    color: string; // We might ignore this or remap it if it passes 'bg-orange-50'
    onClick: () => void;
}

export const CategoryTile: React.FC<CategoryTileProps> = ({ title, subtitle, icon: Icon, color, onClick }) => {
    // Extract color intent if possible, or just default to Primary/White styling for consistency
    // logic: If 'color' prop has 'text-orange-600', we want 'text-orange-400' in dark mode.
    // For now, let's normalize to the Liquid Obsidian Theme

    return (
        <button
            onClick={onClick}
            className="bg-surface border border-border p-5 rounded-sm hover:border-primary/50 transition-all active:scale-[0.98] text-left group relative overflow-hidden"
        >
            <div className={`w-10 h-10 rounded-sm bg-surface-highlight flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-black transition-colors text-white`}>
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm tracking-tight">{title}</h3>
            <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-1 group-hover:text-primary transition-colors">{subtitle}</p>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </button>
    );
};
