import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const Layout = ({ children }: { children?: React.ReactNode }) => (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row text-white font-sans transition-colors duration-300">
        {/* Sidebar for Desktop - Now sharper and darker */}
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
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
