import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Home,
    Plus,
    MessageSquare,
    Settings,
    ShieldCheck,
    UploadCloud,
    Wallet,
    Calendar,
    ChevronRight,
    Car,
    FileText,
    FolderOpen
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    const NavItem = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => (
        <button
            onClick={() => navigate(path)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(path)
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
        >
            <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 ${isActive(path) ? 'text-white' : 'text-slate-400 group-hover:text-primary-500'
                }`} />
            <span className="font-medium text-sm">{label}</span>
            {isActive(path) && (
                <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
            )}
        </button>
    );

    // Don't show sidebar on auth/onboarding screens
    if (['/', '/login', '/register', '/recover', '/onboarding'].includes(location.pathname)) {
        return null;
    }

    const userName = user?.user_metadata?.full_name || 'Usuário';
    const userEmail = user?.email || '';

    return (
        <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 min-h-screen sticky top-0 shadow-sm">
            {/* Brand Header */}
            <div
                className="p-6 border-b border-slate-100 cursor-pointer flex items-center gap-3 hover:bg-slate-50 transition-colors"
                onClick={() => navigate('/home')}
            >
                <img
                    src="/assets/logo.png"
                    alt="Vida em Dia"
                    className="h-8 w-auto object-contain"
                />
                <div>
                    <h1 className="text-lg font-bold text-slate-900">
                        Vida em Dia
                    </h1>
                    <p className="text-xs text-slate-400">Organize sua vida</p>
                </div>
            </div>

            {/* Main Nav */}
            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                <NavItem path="/home" icon={Home} label="Início" />
                <NavItem path="/financial-dashboard" icon={Wallet} label="Finanças" />
                <NavItem path="/agenda" icon={Calendar} label="Agenda" />

                {/* Seção Patrimônio */}
                <div className="pt-5 pb-2">
                    <p className="px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Patrimônio
                    </p>
                    <NavItem path="/vehicle-central" icon={Car} label="Veículos" />
                </div>

                {/* Seção Fiscal */}
                <div className="pt-5 pb-2">
                    <p className="px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Fiscal & Documentos
                    </p>
                    <NavItem path="/tax-declaration" icon={ShieldCheck} label="Imposto de Renda" />
                    <NavItem path="/fiscal-folder" icon={FolderOpen} label="Pasta Fiscal" />
                </div>

                {/* Ferramentas */}
                <div className="pt-5 pb-2">
                    <p className="px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Ferramentas
                    </p>
                    <NavItem path="/assistant" icon={MessageSquare} label="Assistente IA" />
                    <NavItem path="/upload" icon={UploadCloud} label="Upload Documentos" />
                </div>
            </nav>



            {/* User Profile Footer */}
            <div className="p-4 border-t border-slate-100">
                <div
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate('/settings')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900">{userName}</span>
                            <span className="text-xs text-slate-400 truncate max-w-[120px]">{userEmail}</span>
                        </div>
                    </div>
                    <Settings className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
                </div>
            </div>
        </aside>
    );
};
