import React, { useState } from 'react';
import { TimelineStage } from '../constants/playbooks';

interface ConsequenceTrackProps {
    stages: TimelineStage[];
    dueDate: string;
}

export const ConsequenceTrack: React.FC<ConsequenceTrackProps> = ({ stages, dueDate }) => {
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    // Calculate current stage
    const getActiveStageIndex = () => {
        if (!dueDate) return 0;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

        let activeIdx = 0;
        for (let i = 0; i < stages.length; i++) {
            if (diffDays >= stages[i].days_offset) {
                activeIdx = i;
            }
        }
        return activeIdx;
    };

    const activeIdx = getActiveStageIndex();

    return (
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl overflow-hidden relative">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
                Simulador de Consequências
            </h4>

            <div className="relative pt-2 pb-8">
                {/* Connecting Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-800"></div>
                <div
                    className="absolute top-5 left-0 h-0.5 bg-primary-500 transition-all duration-1000"
                    style={{ width: `${(activeIdx / (stages.length - 1)) * 100}%` }}
                ></div>

                {/* Stages */}
                <div className="relative flex justify-between items-center">
                    {stages.map((stage, idx) => {
                        const isPast = idx < activeIdx;
                        const isActive = idx === activeIdx;
                        const isFuture = idx > activeIdx;

                        const dotColors = {
                            green: 'bg-emerald-500',
                            yellow: 'bg-amber-400',
                            orange: 'bg-orange-500',
                            red: 'bg-rose-500'
                        };

                        return (
                            <div key={idx} className="flex flex-col items-center group relative cursor-pointer" onClick={() => setSelectedIdx(idx)}>
                                {/* The Dot */}
                                <div className={`w-6 h-6 rounded-full border-4 border-slate-900 z-10 transition-all duration-500 ${isActive ? 'scale-150 ring-4 ring-primary-500/20 ' + dotColors[stage.color] :
                                        isPast ? dotColors[stage.color] + ' opacity-40' :
                                            'bg-slate-700'
                                    }`}></div>

                                {/* Label */}
                                <span className={`absolute top-8 text-[10px] font-bold whitespace-nowrap transition-colors ${isActive ? 'text-white' : 'text-slate-500'
                                    }`}>
                                    {stage.label}
                                </span>

                                {/* Tooltip (Inline logic for simplicity in this artifact) */}
                                {selectedIdx === idx && (
                                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-32 bg-white text-slate-900 p-3 rounded-2xl shadow-2xl z-20 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-200">
                                        <p className="text-[11px] font-black uppercase leading-tight mb-1">{stage.label}</p>
                                        <p className="text-[9px] font-medium leading-snug opacity-80">{stage.description}</p>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45"></div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedIdx(null); }}
                                            className="absolute -top-1 -right-1 bg-slate-200 rounded-full p-0.5"
                                        >
                                            <div className="w-2 h-2 text-slate-500">×</div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Current Stage Indicator */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Status Atual</p>
                    <p className="text-sm font-black">{stages[activeIdx].description}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${stages[activeIdx].color === 'green' ? 'bg-emerald-500/10 text-emerald-400' :
                        stages[activeIdx].color === 'yellow' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-rose-500/10 text-rose-400'
                    }`}>
                    Fase {activeIdx + 1}
                </div>
            </div>

            {/* Decor blur */}
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>
    );
};
