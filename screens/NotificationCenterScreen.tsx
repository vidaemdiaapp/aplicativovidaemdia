import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, CheckCircle2, AlertCircle, Info, ChevronRight, Check } from 'lucide-react';
import { notificationsService, AppNotification } from '../services/notifications';
import { tasksService } from '../services/tasks';

export const NotificationCenterScreen: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        const household = await tasksService.getHousehold();
        if (household) {
            const data = await notificationsService.getNotifications(household.id);
            setNotifications(data);
        }
        setLoading(false);
    };

    const handleMarkAsRead = async (id: string, relatedTaskId?: string | null) => {
        await notificationsService.markAsRead(id);
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));

        if (relatedTaskId) {
            navigate(`/detail/${relatedTaskId}`);
        }
    };

    const handleMarkAllAsRead = async () => {
        const unread = notifications.filter(n => !n.read_at);
        await Promise.all(unread.map(n => notificationsService.markAsRead(n.id)));
        setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'risk': return <AlertCircle className="w-5 h-5 text-danger-600" />;
            case 'attention': return <Info className="w-5 h-5 text-warning-600" />;
            default: return <CheckCircle2 className="w-5 h-5 text-success-600" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'risk': return 'bg-danger-50';
            case 'attention': return 'bg-warning-50';
            default: return 'bg-success-50';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface pb-24">
                <header className="bg-primary-500 pt-14 pb-6 px-6 relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/20 animate-pulse" />
                        <div className="w-32 h-8 rounded bg-white/20 animate-pulse" />
                    </div>
                </header>
                <div className="px-4 py-8">
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100" />
                                    <div className="flex-1 space-y-2">
                                        <div className="w-3/4 h-4 bg-slate-100 rounded" />
                                        <div className="w-full h-3 bg-slate-100 rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-8 lg:pb-0 min-h-screen bg-slate-50">
            {/* ═══════════════════════════════════════════════════════════════
                HERO: Blue Gradient Header
            ═══════════════════════════════════════════════════════════════ */}
            <header className="bg-primary-500 pt-14 pb-6 px-6 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-20 w-48 h-48 bg-primary-600/20 rounded-full blur-2xl" />

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest">Central</p>
                            <h1 className="text-white text-2xl font-bold">Notificações</h1>
                        </div>
                    </div>
                    {notifications.some(n => !n.read_at) && (
                        <button onClick={handleMarkAllAsRead} className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white text-xs font-bold hover:bg-white/30 transition-all">
                            Marcar todas
                        </button>
                    )}
                </div>
            </header>

            <div className="p-6 space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">Nenhuma notificação por aqui.</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div
                            key={notif.id}
                            onClick={() => handleMarkAsRead(notif.id, notif.related_task_id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 ${notif.read_at
                                ? 'bg-white border-slate-100 opacity-75'
                                : 'bg-white border-primary-100 shadow-sm ring-1 ring-primary-50'
                                }`}
                        >
                            <div className={`p-3 rounded-xl h-fit ${getBgColor(notif.type)}`}>
                                {getIcon(notif.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`font-bold ${notif.read_at ? 'text-slate-700' : 'text-slate-900'}`}>
                                        {notif.title}
                                    </h4>
                                    {!notif.read_at && <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5"></span>}
                                </div>
                                <p className="text-sm text-slate-600 leading-snug mb-2">{notif.body}</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                    {new Date(notif.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            {notif.related_task_id && (
                                <ChevronRight className="w-5 h-5 text-slate-300 self-center" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
