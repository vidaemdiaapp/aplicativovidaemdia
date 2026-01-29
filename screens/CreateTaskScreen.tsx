import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Calendar, FileText, Check, DollarSign, Tag, Loader2,
    Zap, ShoppingBag, Utensils, Shield, Heart, Plane, Car, Home,
    MoreHorizontal, Repeat, Info, AlertCircle, Landmark, CreditCard, Coins
} from 'lucide-react';
import { tasksService, Category, Task } from '../services/tasks';
import { Button } from '../components/Button';
import { toast } from 'react-hot-toast';

export const CreateTaskScreen: React.FC = () => {
    const navigate = useNavigate();
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
                    setEntryType(task.entry_type || 'bill');
                    setTitle(task.title);
                    setAmount(task.amount?.toString() || '');
                    setDate(task.entry_type === 'immediate' ? task.purchase_date || '' : task.due_date || '');
                    setSelectedCategory(task.category_id || 'outros');
                    setIsRecurring(task.is_recurring || false);
                    setDescription(task.description || '');
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

        const taskData: Partial<Task> = {
            title,
            category_id: selectedCategory,
            amount: amount ? parseFloat(cleanAmount) : undefined,
            status: entryType === 'immediate' ? 'completed' : 'pending',
            is_recurring: entryType === 'immediate' ? false : isRecurring,
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
            } else {
                result = await tasksService.createTask(taskData as Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>);
            }

            if (result) {
                toast.success(isEditMode ? 'Registro atualizado!' : 'Registro adicionado com sucesso!');
                navigate(isEditMode ? `/detail/${id}` : '/financial-dashboard');
            } else {
                toast.error('Ocorreu um erro ao salvar.');
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
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header Sticky */}
            <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-12 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight">
                            {isEditMode ? 'Editar Registro' : entryType === 'immediate' ? 'Gasto do Dia' : 'Nova Conta'}
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gestão de Patrimônio</p>
                    </div>
                </div>
            </header>

            <div className="pt-32 pb-32 px-6 max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Amount Input Large */}
                    <div className="text-center py-8">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Valor do Lançamento</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl font-black text-slate-600">R$</span>
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="0,00"
                                className="bg-transparent text-5xl md:text-6xl font-black outline-none placeholder:text-slate-800 text-white w-full text-center"
                                value={amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Descrição do Item</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Ex: Aluguel do Mês, Supermercado..."
                                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Category Selector Grid */}
                        <div className="space-y-3">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Categoria de Gasto</label>
                            <div className="grid grid-cols-3 gap-2">
                                {categories.map(cat => {
                                    const Icon = CATEGORY_ICONS[cat.id] || MoreHorizontal;
                                    const isActive = selectedCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${isActive
                                                ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02]'
                                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-800'}`}>
                                                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                                {cat.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Payment Method (Immediate Only) */}
                        {entryType === 'immediate' && (
                            <div className="space-y-3">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Forma de Pagamento</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'pix', label: 'PIX', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
                                        { id: 'debit', label: 'Débito', icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                                        { id: 'cash', label: 'Dinheiro', icon: Coins, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                                    ].map(method => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setPaymentMethod(method.id as any)}
                                            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${paymentMethod === method.id
                                                ? 'border-white/20 bg-white/10 scale-[1.02] shadow-lg'
                                                : 'border-slate-800 bg-slate-900/50 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                                                }`}
                                        >
                                            <method.icon className={`w-6 h-6 ${method.color}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Date & Recurrence */}
                        <div className={`grid ${entryType === 'immediate' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">
                                    {entryType === 'immediate' ? 'Data do Gasto' : 'Vencimento'}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 transition-all font-medium text-white appearance-none"
                                        style={{ colorScheme: 'dark' }}
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            {entryType === 'bill' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Repetir Mensal</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsRecurring(!isRecurring)}
                                        className={`w-full h-[58px] rounded-2xl border flex items-center justify-center gap-3 transition-all ${isRecurring
                                            ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                            : 'bg-slate-900 border-slate-800 text-slate-500'
                                            }`}
                                    >
                                        <Repeat className={`w-5 h-5 ${isRecurring ? 'animate-spin-slow' : ''}`} />
                                        <span className="text-xs font-black uppercase tracking-widest">{isRecurring ? 'ATIVO' : 'OFF'}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Extra Notes */}
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Observações (Opcional)</label>
                            <textarea
                                placeholder="Informações adicionais..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-4 outline-none focus:border-blue-500/50 transition-all font-medium min-h-[100px] resize-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                        <Button
                            type="submit"
                            fullWidth
                            disabled={loading}
                            className={`h-16 rounded-2xl text-base font-black uppercase tracking-widest transition-all ${loading ? 'bg-slate-800 opacity-50' :
                                entryType === 'immediate'
                                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-500/20 active:scale-95'
                                    : 'bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/20 active:scale-95'
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
                                    <span>{isEditMode ? 'Salvar Alterações' : 'Concluir Lançamento'}</span>
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
