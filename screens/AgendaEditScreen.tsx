import React, { useState, useEffect } from 'react';
import {
    X, Check, Calendar, Clock, MapPin,
    AlignLeft, Tag as TagIcon, Repeat,
    Bell, Link as LinkIcon, Trash2, Copy
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    format, addHours, parseISO,
    formatISO, startOfHour, addMinutes
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { agendaService } from '../services/agenda';
import { CalendarTag } from '../types';
import { toast } from 'react-hot-toast';

export const AgendaEditScreen: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id && id !== 'new';

    const [loading, setLoading] = useState(false);
    const [tags, setTags] = useState<CalendarTag[]>([]);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [link, setLink] = useState('');
    const [startDate, setStartDate] = useState(format(startOfHour(addHours(new Date(), 1)), "yyyy-MM-dd'T'HH:mm"));
    const [endDate, setEndDate] = useState(format(startOfHour(addHours(new Date(), 2)), "yyyy-MM-dd'T'HH:mm"));
    const [allDay, setAllDay] = useState(false);
    const [tagId, setTagId] = useState('');
    const [recurrence, setRecurrence] = useState('');
    const [reminders, setReminders] = useState<number[]>([]);

    useEffect(() => {
        loadTags();
        if (isEdit) {
            // Load event data (Mock or API fetch handled in service)
        }
    }, [id]);

    const loadTags = async () => {
        try {
            const data = await agendaService.getTags();
            setTags(data);
            if (data.length > 0 && !tagId) setTagId(data[0].id);
        } catch (e) {
            console.error('Error loading tags:', e);
        }
    };

    const handleSave = async () => {
        if (!title || !tagId) {
            toast.error('Preencha o título e a categoria!');
            return;
        }

        setLoading(true);
        try {
            const eventData = {
                title,
                description,
                location,
                link,
                start_at: formatISO(parseISO(startDate)),
                end_at: formatISO(parseISO(endDate)),
                all_day: allDay,
                tag_id: tagId,
                recurrence_rrule: recurrence || undefined,
                status: 'active' as const
            };

            await agendaService.createEvent(eventData, reminders);

            toast.success('Compromisso criado!', {
                icon: '🗓️',
                style: { borderRadius: '1rem', background: '#334155', color: '#fff' }
            });
            navigate('/agenda');
        } catch (e) {
            console.error('Save error:', e);
            toast.error('Erro ao salvar compromisso');
        } finally {
            setLoading(false);
        }
    };

    const reminderOptions = [
        { label: 'Na hora', value: 0 },
        { label: '10 min', value: 10 },
        { label: '30 min', value: 30 },
        { label: '1 hora', value: 60 },
        { label: '1 dia', value: 1440 },
    ];

    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const [newTagName, setNewTagName] = useState('');

    const uniqueTags = React.useMemo(() => {
        const seen = new Set();
        return tags.filter(tag => {
            const duplicate = seen.has(tag.name);
            seen.add(tag.name);
            return !duplicate;
        });
    }, [tags]);

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;

        try {
            const colors = ['#0ea5e9', '#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#f43f5e'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            const newTag = await agendaService.createTag({
                name: newTagName,
                color: randomColor
            });

            setTags(prev => [...prev, newTag]);
            setTagId(newTag.id);
            setIsCreatingTag(false);
            setNewTagName('');
            toast.success('Categoria criada!');
        } catch (e) {
            console.error('Error creating tag:', e);
            toast.error('Erro ao criar categoria');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* ... HEADER ... */}
            <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-xl z-50">
                <button onClick={() => navigate(-1)} className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <X className="w-6 h-6 text-slate-400" />
                </button>
                <h1 className="font-black text-slate-900 tracking-tight">
                    {isEdit ? 'Editar Compromisso' : 'Novo Compromisso'}
                </h1>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="p-2.5 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-200 active:scale-95 transition-all disabled:opacity-50"
                >
                    <Check className="w-6 h-6" />
                </button>
            </header>

            <div className="px-6 space-y-8">
                {/* ═══════════════════════════════════════════════════════════════
                    MAIN INPUTS
                ═══════════════════════════════════════════════════════════════ */}
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Título do compromisso"
                        className="w-full bg-transparent border-none p-0 text-2xl font-black text-slate-900 placeholder:text-slate-400 focus:ring-0"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />

                    <div className="flex flex-wrap gap-2">
                        {uniqueTags.map(tag => (
                            <button
                                key={tag.id}
                                onClick={() => setTagId(tag.id)}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${tagId === tag.id
                                    ? 'bg-slate-900 border-slate-900 text-white'
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                                    }`}
                            >
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }}></div>
                                {tag.name}
                            </button>
                        ))}

                        {/* New Tag Input or Button */}
                        {isCreatingTag ? (
                            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-full border border-primary-200 shadow-sm animate-in fade-in zoom-in">
                                <input
                                    type="text"
                                    className="bg-transparent border-none p-0 text-[10px] font-bold w-20 focus:ring-0"
                                    placeholder="Nome..."
                                    value={newTagName}
                                    onChange={e => setNewTagName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateTag()}
                                    autoFocus
                                />
                                <button onClick={handleCreateTag} className="text-primary-600 hover:text-primary-700">
                                    <Check className="w-3 h-3" />
                                </button>
                                <button onClick={() => setIsCreatingTag(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsCreatingTag(true)}
                                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
                            >
                                <span className="text-lg font-light leading-none relative -top-0.5">+</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-slate-50 space-y-8">
                    {/* DATE & TIME SECTION */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Início</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-sm font-bold"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fim</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-sm font-bold"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pl-14">
                            <span className="text-sm font-bold text-slate-600">Dia Inteiro</span>
                            <button
                                onClick={() => setAllDay(!allDay)}
                                className={`w-12 h-6 rounded-full transition-all relative ${allDay ? 'bg-primary-500' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${allDay ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>

                    <Divider />

                    {/* LOCATION & LINK */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-primary-500 transition-colors">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Adicionar local"
                                className="flex-1 bg-transparent border-none p-0 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-0"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-primary-500 transition-colors">
                                <LinkIcon className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Link da reunião (Zoom, Meet...)"
                                className="flex-1 bg-transparent border-none p-0 text-sm font-bold text-primary-600 placeholder:text-slate-300 focus:ring-0"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                            />
                        </div>
                    </div>

                    <Divider />

                    {/* DESCRIPTION */}
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mt-1">
                            <AlignLeft className="w-5 h-5" />
                        </div>
                        <textarea
                            placeholder="Notas e observações..."
                            rows={3}
                            className="flex-1 bg-transparent border-none p-0 text-sm font-medium text-slate-600 placeholder:text-slate-300 focus:ring-0 resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    REMINDERS & RECURRENCE
                ═══════════════════════════════════════════════════════════════ */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <Bell className="w-4 h-4 text-primary-500" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Lembretes</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {reminderOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setReminders(prev =>
                                        prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                                    )}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${reminders.includes(opt.value)
                                        ? 'bg-primary-50 border-primary-200 text-primary-600'
                                        : 'bg-slate-50 border-transparent text-slate-400'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Repeat className="w-4 h-4 text-primary-500" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Repetir</h3>
                        </div>
                        <select
                            className="bg-transparent border-none text-xs font-black text-primary-600 focus:ring-0 text-right pr-0"
                            value={recurrence}
                            onChange={(e) => setRecurrence(e.target.value)}
                        >
                            <option value="">Nunca</option>
                            <option value="FREQ=DAILY">Diariamente</option>
                            <option value="FREQ=WEEKLY">Semanalmente</option>
                            <option value="FREQ=MONTHLY">Mensalmente</option>
                        </select>
                    </div>
                </div>

                {/* DELETE ACTION IF EDIT */}
                {isEdit && (
                    <button className="w-full flex items-center justify-center gap-2 text-rose-500 font-black text-xs uppercase tracking-[0.2em] py-8 active:scale-95 transition-all">
                        <Trash2 className="w-4 h-4" />
                        Excluir Compromisso
                    </button>
                )}
            </div>
        </div>
    );
};

const Divider = () => <div className="h-px bg-slate-50 -mx-8"></div>;
