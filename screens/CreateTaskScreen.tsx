import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Calendar, FileText, Check, DollarSign, Tag, Loader2,
    Zap, ShoppingBag, Utensils, Shield, Heart, Plane, Car, Home,
    MoreHorizontal, Repeat, Info, AlertCircle, Landmark, CreditCard, Coins, Receipt
} from 'lucide-react';
import { tasksService, Category, Task } from '../services/tasks';
import { subscriptionIntelligence } from '../services/subscriptionIntelligence';
import { useCelebration } from '../contexts/CelebrationContext';
import { Button } from '../components/Button';
import { toast } from 'react-hot-toast';

export const CreateTaskScreen: React.FC = () => {
    const navigate = useNavigate();
    const { celebrate } = useCelebration();
    const { id } = useParams();
    const location = useLocation();
    const isEditMode = !!id;

    const forcedType = (location.state as any)?.type as 'bill' | 'immediate' | undefined;

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);

    const [entryType, setEntryType] = useState<'bill' | 'immediate'>(forcedType || 'bill');
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(entryType === 'bill' ? '' : new Date().toISOString().split('T')[0]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [description, setDescription] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'debit'>('pix');
    const [originalStatus, setOriginalStatus] = useState<string>('pending');
    const [isSubscription, setIsSubscription] = useState((location.state as any)?.is_subscription || false);
    const [subscriptionDetected, setSubscriptionDetected] = useState(false);

    const CATEGORY_ICONS: Record<string, any> = {
        'vehicle': Car,
        'home': Home,
        'documents': FileText,
        'taxes': Landmark,
        'contracts': Shield,
        'leisure': Plane,
        'food': Utensils,
        'shopping': ShoppingBag,
        'health': Heart,
        'utilities': Zap,
        'transport': Car,
        'outros': MoreHorizontal
    };

    useEffect(() => {
        loadInitialData();
    }, [id]);

    // Subscription Intelligence
    useEffect(() => {
        if (title.length > 3) {
            const isSub = subscriptionIntelligence.checkIsSubscription(title);
            if (isSub && !isSubscription && !subscriptionDetected) {
                setIsSubscription(true);
                setSubscriptionDetected(true);
                // Auto-select recurring if it's a bill
                if (entryType === 'bill') {
                    setIsRecurring(true);
                }
            }
        }
    }, [title]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const cats = await tasksService.getCategories();

            // Add some missing standard financial categories if not present
            const standardCats: Partial<Category>[] = [
                { id: 'food', label: 'Alimentação', icon: 'Utensils' },
                { id: 'shopping', label: 'Compras', icon: 'ShoppingBag' },
                { id: 'health', label: 'Saúde', icon: 'Heart' },
                { id: 'utilities', label: 'Contas Fixas', icon: 'Zap' },
                { id: 'transport', label: 'Transporte', icon: 'Car' },
                { id: 'leisure', label: 'Lazer', icon: 'Plane' },
                { id: 'taxes', label: 'Impostos', icon: 'Landmark' },
                { id: 'vehicle', label: 'Veículo', icon: 'Car' },
                { id: 'home', label: 'Casa/Moradia', icon: 'Home' },
                { id: 'documents', label: 'Documentos', icon: 'FileText' },
                { id: 'contracts', label: 'Contratos', icon: 'Shield' },
                { id: 'outros', label: 'Outros', icon: 'MoreHorizontal' }
            ];

            const combinedCats = [...cats];
            standardCats.forEach(sc => {
                if (!combinedCats.find(c => c.id === sc.id)) {
                    combinedCats.push(sc as Category);
                }
            });

            setCategories(combinedCats);

            if (isEditMode && id) {
                const task = await tasksService.getTask(id);
                if (task) {
                    const type = (task.entry_type === 'immediate' || task.entry_type === 'expense') ? 'immediate' : 'bill';
                    setEntryType(type);
                    setTitle(task.title);
                    setAmount(task.amount?.toString() || '');
                    setDate(type === 'immediate' ? task.purchase_date || '' : task.due_date || '');
                    setSelectedCategory(task.category_id || 'outros');
                    setIsRecurring(task.is_recurring || false);
                    setDescription(task.description || '');
                    setOriginalStatus(task.status || 'pending');
                    setIsSubscription(task.is_subscription || false);
                    if (task.payment_method) setPaymentMethod(task.payment_method as any);
                }
            } else if (combinedCats.length > 0) {
                // If we are adding an immediate expense, prioritize specific categories if they exist
                if (entryType === 'immediate') {
                    const foodCat = combinedCats.find(c => c.id === 'food');
                    setSelectedCategory(foodCat?.id || combinedCats[0].id);
                } else {
                    setSelectedCategory(combinedCats[0].id);
                }
            }
        } catch (error) {
            console.error('[CreateTask] Error loading data:', error);
            toast.error('Erro ao carregar categorias.');
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    };

    const handleAmountChange = (val: string) => {
        // Simple numeric formatting
        const clean = val.replace(/\D/g, '');
        if (!clean) {
            setAmount('');
            return;
        }
        const numeric = parseInt(clean) / 100;
        setAmount(numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !selectedCategory) {
            toast.error('Preencha os campos obrigatórios.');
            return;
        }

        setLoading(true);

        // Convert "1.234,56" back to "1234.56"
        const cleanAmount = amount.replace(/\./g, '').replace(',', '.');

        // Logic for status:
        // 1. Immediate expenses are ALWAYS 'completed'
        // 2. If editing, preserve original status unless it's a type change to immediate
        // 3. For new bills, default to 'pending'
        let finalStatus = originalStatus;
        if (entryType === 'immediate') {
            finalStatus = 'completed';
        } else if (!isEditMode) {
            finalStatus = 'pending';
        }

        const taskData: Partial<Task> = {
            title,
            category_id: selectedCategory,
            amount: amount ? parseFloat(cleanAmount) : undefined,
            status: finalStatus as any,
            is_recurring: entryType === 'immediate' ? false : isRecurring,
            is_subscription: isSubscription,
            description: description || undefined,
            entry_type: entryType,
        };

        if (entryType === 'immediate') {
            taskData.purchase_date = date || new Date().toISOString().split('T')[0];
            taskData.payment_method = paymentMethod;
        } else {
            taskData.due_date = date || undefined;
        }

        try {
            let result;
            if (isEditMode && id) {
                result = await tasksService.updateTask(id, taskData);
                if (result) {
                    toast.success('Registro atualizado!');
                    navigate(`/detail/${id}`);
                }
            } else {
                const { task, achievement } = await tasksService.createTask(taskData as Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>);
                if (task) {
                    toast.success('Registro adicionado!');
                    if (achievement) {
                        try {
                            const { Zap, Trophy, Rocket, Star, Target, ShieldCheck, Heart } = await import('lucide-react');
                            const ICON_MAP: any = { Zap, Trophy, Rocket, Star, Target, ShieldCheck, Heart };
                            celebrate({
                                title: achievement.title,
                                description: achievement.description,
                                points: achievement.points_reward,
                                icon: ICON_MAP[achievement.icon] || Trophy
                            });
                        } catch (e) {
                            console.error('Error triggering celebration:', e);
                        }
                    }
                    navigate('/financial-dashboard');
                } else {
                    toast.error('Ocorreu um erro ao salvar.');
                }
            }
        } catch (err) {
            console.error(err);
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setLoading(false);
        }
    };


    if (initialLoading) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                    <p className="text-slate-400 text-sm font-medium animate-pulse uppercase tracking-widest">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface text-slate-900 font-sans">
            {/* Header Sticky */}
            <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 pt-12 pb-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100 active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="space-y-0.5">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                            {isEditMode ? 'Editar' : entryType === 'immediate' ? 'Lançar Gasto' : 'Nova Conta'}
                        </h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Registo Financeiro</p>
                    </div>
                </div>
            </header>

            <div className="pt-32 pb-32 px-6 max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Amount Input Large */}
                    <div className="text-center py-6">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Valor do Lançamento</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl font-bold text-slate-300">R$</span>
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="0,00"
                                className="bg-transparent text-5xl md:text-6xl font-bold outline-none placeholder:text-slate-400 text-slate-900 w-full text-center tracking-tight"
                                value={amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Descrição do Item</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Ex: Aluguel do Mês, Supermercado..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all font-medium text-slate-900 placeholder:text-slate-300"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Category Selector Grid */}
                        <div className="space-y-3">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Categoria de Gasto</label>
                            <div className="grid grid-cols-3 gap-2">
                                {categories.map(cat => {
                                    const Icon = CATEGORY_ICONS[cat.id] || MoreHorizontal;
                                    const isActive = selectedCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all shadow-sm ${isActive
                                                ? 'bg-primary-500 border-primary-500 shadow-primary-500/20 scale-[1.02] text-white'
                                                : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-50'}`}>
                                                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                                {cat.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Proactive Deduction Suggestion */}
                        {(selectedCategory === 'health' || selectedCategory === 'taxes' || selectedCategory === 'education') && (
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-amber-900 leading-tight">Dica Fiscal de Elara</p>
                                    <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
                                        Este gasto tem potencial de **reduzir seu Imposto de Renda**. Lembre-se de anexar a nota fiscal na sua **Pasta Fiscal** para garantir sua restituição!
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/fiscal-folder')}
                                        className="mt-2 text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline"
                                    >
                                        Ir para Pasta Fiscal
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Payment Method (Immediate Only) */}
                        {entryType === 'immediate' && (
                            <div className="space-y-3">
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Forma de Pagamento</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'pix', label: 'PIX', icon: Zap, color: 'text-cyan-500', bg: 'bg-cyan-50' },
                                        { id: 'debit', label: 'Débito', icon: CreditCard, color: 'text-primary-500', bg: 'bg-primary-50' },
                                        { id: 'cash', label: 'Dinheiro', icon: Coins, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                    ].map(method => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setPaymentMethod(method.id as any)}
                                            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all shadow-sm ${paymentMethod === method.id
                                                ? 'border-primary-100 bg-white scale-[1.05] shadow-md ring-2 ring-primary-500/5'
                                                : 'border-slate-100 bg-slate-50/50 grayscale opacity-60 hover:opacity-100'
                                                }`}
                                        >
                                            <method.icon className={`w-6 h-6 ${method.color}`} />
                                            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Date & Recurrence */}
                        <div className={`grid ${entryType === 'immediate' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">
                                    {entryType === 'immediate' ? 'Data do Gasto' : 'Vencimento'}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary-500/50 transition-all font-medium text-slate-900 appearance-none shadow-sm"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            {entryType === 'bill' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Repetir Mensal</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsRecurring(!isRecurring)}
                                            className={`w-full h-[58px] rounded-2xl border flex items-center justify-center gap-3 transition-all shadow-sm ${isRecurring
                                                ? 'bg-primary-50 border-primary-100 text-primary-600 shadow-inner'
                                                : 'bg-white border-slate-100 text-slate-400'
                                                }`}
                                        >
                                            <Repeat className={`w-5 h-5 ${isRecurring ? 'animate-spin-slow text-primary-500' : ''}`} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{isRecurring ? 'ATIVO' : 'OFF'}</span>
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Assinatura</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsSubscription(!isSubscription)}
                                            className={`w-full h-[58px] rounded-2xl border flex items-center justify-center gap-3 transition-all shadow-sm ${isSubscription
                                                ? 'bg-indigo-50 border-indigo-100 text-indigo-600 shadow-inner'
                                                : 'bg-white border-slate-100 text-slate-400'
                                                }`}
                                        >
                                            <Receipt className={`w-5 h-5 ${isSubscription ? 'text-indigo-500' : ''}`} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{isSubscription ? 'SIM' : 'NÃO'}</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Extra Notes */}
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Observações (Opcional)</label>
                            <textarea
                                placeholder="Informações adicionais..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 outline-none focus:border-primary-500/50 transition-all font-medium min-h-[100px] resize-none text-slate-900 placeholder:text-slate-300 shadow-sm"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-white via-white/90 to-transparent">
                        <Button
                            type="submit"
                            fullWidth
                            disabled={loading}
                            className={`h-16 rounded-3xl text-sm font-bold uppercase tracking-widest transition-all ${loading ? 'bg-slate-100 text-slate-300' :
                                entryType === 'immediate'
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95'
                                    : 'bg-primary-500 hover:bg-primary-600 text-white shadow-xl shadow-primary-500/20 active:scale-95'
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Salvando...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Check className="w-5 h-5" />
                                    <span>{isEditMode ? 'Salvar Alterações' : 'Concluir Registro'}</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            <style>{`
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
