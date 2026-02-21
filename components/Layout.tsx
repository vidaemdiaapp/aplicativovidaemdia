import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Menu, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans transition-colors duration-300">
            {/* Sidebar - Handles both Desktop and Mobile (Drawer) */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
                {/* Mobile Top Header - Sharper and Premium */}
                <header className="lg:hidden h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2.5 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <img
                            src="/assets/logo.png"
                            alt="Logo"
                            className="h-7 w-auto object-contain cursor-pointer"
                            onClick={() => navigate('/home')}
                        />
                    </div>

                    <button className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-primary-500 transition-all">
                        <Bell className="w-5 h-5" />
                    </button>
                </header>

                {/* Content wrapper with fluid grid behavior */}
                <main className="flex-1 overflow-y-auto no-scrollbar pb-24 lg:pb-0">
                    <div className="w-full max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in-up">
                        {children}
                    </div>
                </main>

                {/* Bottom Nav for Mobile/Tablet */}
                <BottomNav />
            </div>
        </div>
    );
};
