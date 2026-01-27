import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface Props {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    illustration?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({ icon: Icon, title, description, actionLabel, onAction, illustration }) => {
    return (
        <div className="py-16 px-8 text-center animate-in fade-in duration-700">
            <div className="relative inline-block mb-8">
                <div className="w-24 h-24 bg-white rounded-[40px] shadow-xl shadow-slate-200/50 flex items-center justify-center border border-slate-50">
                    <Icon className="w-10 h-10 text-slate-200" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white">
                    <Plus className="w-4 h-4 text-white" />
                </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-3">{title}</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-[240px] mx-auto mb-10 italic">
                {description}
            </p>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="px-8 py-4 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};
