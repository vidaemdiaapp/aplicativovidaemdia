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
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="pb-8 lg:pb-0 min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md p-6 pt-12 pb-4 flex items-center sticky top-0 z-10 shadow-sm lg:rounded-b-2xl">
                <button onClick={() => navigate(-1)} className="p-2 mr-2 rounded-full hover:bg-slate-100">
                    <ArrowLeft className="w-6 h-6 text-slate-700" />
                </button>
                <h1 className="text-xl font-bold text-slate-900 flex-1">Notificações</h1>
                {notifications.some(n => !n.read_at) && (
                    <button onClick={handleMarkAllAsRead} className="text-sm font-medium text-primary-600 hover:underline">
                        Marcar todas como lidas
                    </button>
                )}
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
