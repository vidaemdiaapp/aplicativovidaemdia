import React, { useState, useEffect } from 'react';
import {
    Plus, Calendar as CalendarIcon, List, Clock,
    ChevronLeft, ChevronRight, Search, Filter,
    MoreVertical, Bell, MapPin, Link as LinkIcon,
    Tag as TagIcon, Check, X, Sparkles, Smartphone,
    Repeat
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    format, addMonths, subMonths, startOfMonth,
    endOfMonth, eachDayOfInterval, isSameMonth,
    isSameDay, addDays, startOfWeek, endOfWeek,
    isToday, parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { agendaService } from '../services/agenda';

export const AgendaScreen: React.FC = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<'month' | 'week' | 'list'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, [currentDate]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const start = startOfMonth(currentDate);
            const end = endOfMonth(currentDate);
            const [fetchedEvents, fetchedTags] = await Promise.all([
                agendaService.getEvents(start, end),
                agendaService.getTags()
            ]);

            // Expand recurring events
            const expandedEvents = fetchedEvents.flatMap(e =>
                agendaService.generateOccurrences(e, start, end)
            );

            setEvents(expandedEvents);
            setTags(fetchedTags);
        } catch (e) {
            console.error('Error loading agenda data:', e);
        } finally {
            setLoading(false);
        }
    };

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
        end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
    });

    const filteredEvents = events.filter(e => {
        const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (e.description?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesTags = selectedTags.length === 0 || selectedTags.includes(e.tag_id);
        return matchesSearch && matchesTags;
    });

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            {/* ═══════════════════════════════════════════════════════════════
                HERO: Blue Gradient Header
            ═══════════════════════════════════════════════════════════════ */}
            <header className="bg-primary-500 pt-14 pb-6 px-6 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-20 w-48 h-48 bg-primary-600/20 rounded-full blur-2xl" />

                <div className="flex items-center justify-between relative z-10 mb-4">
                    <div>
                        <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest mb-1">Calendário</p>
                        <h1 className="text-white text-2xl font-bold">Agenda</h1>
                        <p className="text-white/70 text-xs font-medium mt-1">
                            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2.5 rounded-xl transition-all ${showFilters ? 'bg-white/30 text-white' : 'bg-white/10 text-white/80'}`}
                        >
                            <Filter className="w-5 h-5" />
                        </button>
                        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2.5 bg-white/10 rounded-xl text-white/80 hover:bg-white/20 transition-all">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2.5 bg-white/10 rounded-xl text-white/80 hover:bg-white/20 transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* VIEW SELECTOR TABS */}
                <div className="flex bg-white/10 p-1 rounded-2xl relative z-10">
                    <ViewTab active={view === 'month'} onClick={() => setView('month')} icon={<CalendarIcon className="w-4 h-4" />} label="Mês" />
                    <ViewTab active={view === 'week'} onClick={() => setView('week')} icon={<Clock className="w-4 h-4" />} label="Semana" />
                    <ViewTab active={view === 'list'} onClick={() => setView('list')} icon={<List className="w-4 h-4" />} label="Lista" />
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════════
                SEARCH & FILTERS
            ═══════════════════════════════════════════════════════════════ */}
            {showFilters && (
                <div className="px-6 py-4 bg-white border-b border-slate-100 animate-in slide-in-from-top duration-300">
                    <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar compromisso..."
                            className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-100"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <button
                                key={tag.id}
                                onClick={() => setSelectedTags(prev =>
                                    prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]
                                )}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${selectedTags.includes(tag.id)
                                    ? 'bg-slate-900 border-slate-900 text-white'
                                    : 'bg-white border-slate-100 text-slate-400'
                                    }`}
                            >
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }}></div>
                                {tag.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                CALENDAR GRID (MONTH VIEW)
            ═══════════════════════════════════════════════════════════════ */}
            <div className="px-4 mt-6">
                {view === 'month' && (
                    <div className="bg-white rounded-[2.5rem] p-4 shadow-premium border border-slate-50 overflow-hidden">
                        {/* Weekday Labels */}
                        <div className="grid grid-cols-7 mb-4">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                                <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase py-2">{d}</div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-y-1">
                            {days.map((day, idx) => {
                                const dayEvents = filteredEvents.filter(e => isSameDay(parseISO(e.start_at), day));
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => setView('list')}
                                        className={`aspect-square flex flex-col items-center justify-start pt-2 relative rounded-2xl transition-all cursor-pointer ${!isSameMonth(day, currentDate) ? 'opacity-20' : ''
                                            } ${isToday(day) ? 'bg-primary-50' : 'hover:bg-slate-50'}`}
                                    >
                                        <span className={`text-xs font-bold ${isToday(day) ? 'text-primary-600' : 'text-slate-700'}`}>
                                            {format(day, 'd')}
                                        </span>
                                        <div className="flex flex-wrap justify-center gap-0.5 mt-1 px-1">
                                            {dayEvents.slice(0, 4).map((e, i) => (
                                                <div
                                                    key={i}
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{ backgroundColor: e.calendar_tags?.color || '#cbd5e1' }}
                                                />
                                            ))}
                                            {dayEvents.length > 4 && <div className="w-1 h-1 rounded-full bg-slate-300"></div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    LIST VIEW
                ═══════════════════════════════════════════════════════════════ */}
                {/* ═══════════════════════════════════════════════════════════════
                WEEK VIEW
            ═══════════════════════════════════════════════════════════════ */}
                {view === 'week' && (
                    <div className="space-y-4">
                        {eachDayOfInterval({
                            start: startOfWeek(currentDate, { weekStartsOn: 0 }),
                            end: endOfWeek(currentDate, { weekStartsOn: 0 })
                        }).map((day, idx) => {
                            const dayEvents = filteredEvents.filter(e => isSameDay(parseISO(e.start_at), day));
                            // Sort events by time
                            dayEvents.sort((a, b) => parseISO(a.start_at).getTime() - parseISO(b.start_at).getTime());

                            return (
                                <div key={idx} className={`bg-white rounded-[2rem] p-5 shadow-sm border ${isToday(day) ? 'border-primary-200 bg-primary-50/30' : 'border-slate-100'}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center ${isToday(day) ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            <span className="text-[9px] font-black uppercase">{format(day, 'EEE', { locale: ptBR })}</span>
                                            <span className="text-sm font-black">{format(day, 'd')}</span>
                                        </div>
                                        <div className="flex-1 h-px bg-slate-100"></div>
                                    </div>

                                    <div className="space-y-3">
                                        {dayEvents.length === 0 ? (
                                            <p className="text-xs text-slate-300 font-medium italic pl-2">Sem compromissos</p>
                                        ) : (
                                            dayEvents.map(event => (
                                                <EventCard key={event.id} event={event} navigate={navigate} />
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    LIST VIEW
                ═══════════════════════════════════════════════════════════════ */}
                {view === 'list' && (
                    <div className="space-y-6">
                        {filteredEvents.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] p-12 shadow-premium border border-slate-50 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <CalendarIcon className="w-8 h-8 text-slate-200" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Nenhum compromisso</h3>
                                <p className="text-slate-400 text-sm font-medium mt-1">Sua agenda está livre para este período.</p>
                            </div>
                        ) : (
                            filteredEvents
                                .sort((a, b) => parseISO(a.start_at).getTime() - parseISO(b.start_at).getTime())
                                .map(event => (
                                    <div key={event.id} className="flex gap-4 items-start group">
                                        <div className="w-12 pt-2 flex flex-col items-center flex-shrink-0">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                                                {format(parseISO(event.start_at), 'EEE', { locale: ptBR })}
                                            </span>
                                            <span className={`text-xl font-black ${isToday(parseISO(event.start_at)) ? 'text-primary-600' : 'text-slate-900'}`}>
                                                {format(parseISO(event.start_at), 'd')}
                                            </span>
                                        </div>
                                        <EventCard event={event} navigate={navigate} className="flex-1" />
                                    </div>
                                ))
                        )}
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                FLOATING ACTION BUTTON
            ═══════════════════════════════════════════════════════════════ */}
            <div className="fixed bottom-10 right-6 z-50">
                <button
                    onClick={() => navigate('/agenda/new')}
                    className="flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all hover:bg-slate-800"
                >
                    <Plus className="w-5 h-5" />
                    Novo Compromisso
                </button>
            </div>
        </div>
    );
};


const EventCard = ({ event, navigate, className = "" }: { event: any, navigate: any, className?: string }) => {
    // Helper to extract URL from text if it's not a raw URL
    const getMapLink = (loc: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;

    // Helper to ensure link has protocol
    const getMeetingLink = (l: string) => l.startsWith('http') ? l : `https://${l}`;

    return (
        <div
            onClick={() => navigate(`/agenda/${event.id}`)}
            className={`bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group active:scale-[0.99] transition-all cursor-pointer ${className}`}
        >
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: event.calendar_tags?.color || '#cbd5e1' }}
            ></div>

            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {event.all_day ? 'Dia Inteiro' : format(parseISO(event.start_at), 'HH:mm')}
                        {!event.all_day && ` - ${format(parseISO(event.end_at), 'HH:mm')}`}
                    </span>
                    {event.recurrence_rrule && (
                        <Repeat className="w-3 h-3 text-primary-400" />
                    )}
                </div>
                <button className="text-slate-300 hover:text-slate-600">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

            <h4 className="text-base font-black text-slate-900 tracking-tight leading-tight mb-2">
                {event.title}
            </h4>

            {(event.location || event.link) && (
                <div className="flex flex-wrap gap-3 mt-4 text-[11px] font-bold text-slate-400" onClick={e => e.stopPropagation()}>
                    {event.location && (
                        <a
                            href={getMapLink(event.location)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary-600 transition-colors bg-slate-50 px-2 py-1 rounded-lg border border-transparent hover:border-primary-100"
                        >
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location}
                        </a>
                    )}
                    {event.link && (
                        <a
                            href={getMeetingLink(event.link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary-500 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-lg border border-primary-100 hover:border-primary-200"
                        >
                            <LinkIcon className="w-3.5 h-3.5" />
                            Link da Reunião
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};

const ViewTab = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-white/70 hover:text-white'
            }`}
    >
        {icon}
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
    </button>
);
