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
    FolderOpen,
    Search,
    X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    const handleNavigate = (path: string) => {
        navigate(path);
        if (onClose) onClose();
    };

    const NavItem = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => (
        <button
            onClick={() => handleNavigate(path)}
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
    if (['/', '/login', '/register', '/recover', '/onboarding', '/update-phone'].includes(location.pathname)) {
        return null;
    }

    const userName = user?.user_metadata?.full_name || 'Usuário';
    const userEmail = user?.email || '';

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] lg:hidden animate-fade-in"
                    onClick={onClose}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[101] shadow-2xl transition-all duration-300 lg:shadow-sm lg:translate-x-0 lg:static lg:flex lg:flex-col lg:min-h-screen lg:z-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Brand Header */}
                <div
                    className="p-6 border-b border-slate-100 dark:border-slate-800 cursor-pointer flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3" onClick={() => handleNavigate('/home')}>
                        <img
                            src="/assets/logo.png"
                            alt="Vida em Dia"
                            className="h-9 w-auto object-contain"
                        />
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Vida em Dia</h1>
                            <p className="text-xs text-slate-400">Organize sua vida</p>
                        </div>
                    </div>

                    {/* Close Button Mobile */}
                    <button onClick={onClose} className="p-2 lg:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Main Nav */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto no-scrollbar">
                    <NavItem path="/home" icon={Home} label="Início" />
                    <NavItem path="/financial-dashboard" icon={Wallet} label="Finanças" />
                    <NavItem path="/agenda" icon={Calendar} label="Agenda" />

                    {/* Seção Patrimônio */}
                    <div className="pt-5 pb-2">
                        <p className="px-4 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                            Patrimônio
                        </p>
                        <NavItem path="/assets" icon={Home} label="Meus Bens" />
                        <NavItem path="/vehicle-central" icon={Car} label="Veículos" />
                        <NavItem path="/vehicle-consultation" icon={Search} label="Consulta de Placas" />
                    </div>

                    {/* Seção Fiscal */}
                    <div className="pt-5 pb-2">
                        <p className="px-4 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                            Fiscal & Documentos
                        </p>
                        <NavItem path="/tax-declaration" icon={ShieldCheck} label="Imposto de Renda" />
                        <NavItem path="/fiscal-folder" icon={FolderOpen} label="Pasta Fiscal" />
                    </div>

                    {/* Ferramentas */}
                    <div className="pt-5 pb-2">
                        <p className="px-4 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                            Ferramentas
                        </p>
                        <NavItem path="/assistant" icon={MessageSquare} label="Assistente IA" />
                        <NavItem path="/upload" icon={UploadCloud} label="Upload Documentos" />
                    </div>
                </nav>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <div
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => handleNavigate('/settings')}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{userName}</span>
                                <span className="text-xs text-slate-400 truncate max-w-[120px]">{userEmail}</span>
                            </div>
                        </div>
                        <Settings className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors" />
                    </div>
                </div>
            </aside>
        </>
    );
};
