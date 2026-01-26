import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid, Plus, MessageSquare, Settings, ShieldCheck, UploadCloud, Wallet } from 'lucide-react';

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) => location.pathname === path;

    const NavItem = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => (
        <button
            onClick={() => navigate(path)}
            className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all duration-200 group ${isActive(path)
                ? 'bg-primary-50 text-primary-600 shadow-sm border border-primary-100'
                : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }`}
        >
            <Icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${isActive(path) ? 'fill-primary-100' : ''}`} />
            <span className="font-semibold text-sm">{label}</span>
        </button>
    );

    // Don't show sidebar on auth/onboarding screens
    if (['/', '/login', '/register', '/recover', '/onboarding'].includes(location.pathname)) {
        return null;
    }

    return (
        <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-100 min-h-screen sticky top-0 p-6">
            {/* Brand Header */}
            <div className="mb-10 px-2 cursor-pointer" onClick={() => navigate('/home')}>
                <img src="/assets/logo.png" alt="Vida em Dia" className="w-32 h-auto" />
            </div>

            {/* Main Nav */}
            <nav className="flex-1 space-y-2">
                <NavItem path="/home" icon={Home} label="Início" />
                <NavItem path="/financial-dashboard" icon={Wallet} label="Financeiro" />
                <NavItem path="/categories" icon={Grid} label="Categorias" />
                <NavItem path="/assistant" icon={MessageSquare} label="Assistente" />
                <NavItem path="/settings" icon={Settings} label="Ajustes" />
            </nav>

            {/* Actions */}
            <div className="mt-8 border-t border-slate-50 pt-8 space-y-3">
                <button
                    onClick={() => navigate('/upload')}
                    className="w-full bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-lg hover:bg-slate-800 transition-all duration-200 active:scale-95 group"
                >
                    <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="font-bold">Analisar Doc</span>
                </button>

                <button
                    onClick={() => navigate('/new-task')}
                    className="w-full bg-primary-600 text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all duration-200 active:scale-95 group"
                >
                    <div className="bg-white/20 p-1.5 rounded-lg group-hover:rotate-90 transition-transform">
                        <Plus className="w-5 h-5" />
                    </div>
                    <span className="font-bold">Novo Item</span>
                </button>
            </div>

            {/* Footer Info */}
            <div className="mt-10 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 text-center font-medium">Tudo em dia, Diego! 🚀</p>
            </div>
        </aside>
    );
};
