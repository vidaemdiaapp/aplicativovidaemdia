import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Award, Sparkles, X } from 'lucide-react';

interface CelebrationData {
    title: string;
    description: string;
    icon?: React.ElementType;
    points?: number;
}

interface CelebrationContextType {
    celebrate: (data: CelebrationData) => void;
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);

export const useCelebration = () => {
    const context = useContext(CelebrationContext);
    if (!context) throw new Error('useCelebration must be used within a CelebrationProvider');
    return context;
};

export const CelebrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [active, setActive] = useState<CelebrationData | null>(null);

    const celebrate = (data: CelebrationData) => {
        setActive(data);
        // Auto-close after 5 seconds
        setTimeout(() => setActive(null), 6000);
    };

    return (
        <CelebrationContext.Provider value={{ celebrate }}>
            {children}
            {active && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 overflow-hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500"
                        onClick={() => setActive(null)}
                    />

                    {/* Confetti Particles (CSS Only) */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(50)].map((_, i) => (
                            <div
                                key={i}
                                className="confetti absolute opacity-0"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    backgroundColor: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'][Math.floor(Math.random() * 5)],
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${2 + Math.random() * 3}s`,
                                    width: `${5 + Math.random() * 10}px`,
                                    height: `${5 + Math.random() * 10}px`,
                                    borderRadius: Math.random() > 0.5 ? '50%' : '2px'
                                }}
                            />
                        ))}
                    </div>

                    {/* Celebration Card */}
                    <div className="relative bg-white rounded-[48px] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-700 flex flex-col items-center text-center">
                        <button
                            onClick={() => setActive(null)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-24 h-24 rounded-3xl bg-primary-500 text-white flex items-center justify-center shadow-xl shadow-primary-500/40 mb-6 scale-up-center">
                            {active.icon ? <active.icon className="w-12 h-12" /> : <Award className="w-12 h-12" />}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Conquista Desbloqueada!</h2>
                            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                        </div>

                        <h3 className="text-xl font-bold text-primary-600 mb-2">{active.title}</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                            {active.description}
                        </p>

                        {active.points && (
                            <div className="bg-amber-50 border border-amber-100 px-6 py-2 rounded-full flex items-center gap-2 mb-8">
                                <span className="text-amber-600 font-black text-lg">+{active.points}</span>
                                <span className="text-amber-700 text-[10px] font-bold uppercase tracking-widest">Pontos Vida em Dia Pro</span>
                            </div>
                        )}

                        <button
                            onClick={() => setActive(null)}
                            className="w-full bg-slate-900 text-white h-16 rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                        >
                            Incrível!
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .confetti {
                    animation: confetti-fall ease-in forwards;
                }
                @keyframes confetti-fall {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
                .scale-up-center {
                    animation: scale-up-center 0.6s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
                }
                @keyframes scale-up-center {
                    0% { transform: scale(0.5); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </CelebrationContext.Provider>
    );
};
