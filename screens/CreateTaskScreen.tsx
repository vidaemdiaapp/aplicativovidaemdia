import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Check, DollarSign, Tag, Loader2 } from 'lucide-react';
import { tasksService, Category, Task } from '../services/tasks';
import { Button } from '../components/Button';

export const CreateTaskScreen: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    useEffect(() => {
        loadInitialData();
    }, [id]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const cats = await tasksService.getCategories();
            setCategories(cats);

            if (isEditMode && id) {
                const task = await tasksService.getTask(id);
                if (task) {
                    setTitle(task.title);
                    setAmount(task.amount?.toString() || '');
                    setDate(task.due_date || '');
                    setSelectedCategory(task.category_id);
                }
            } else if (cats.length > 0) {
                setSelectedCategory(cats[0].id);
            }
        } catch (error) {
            console.error('[CreateTask] Error loading data:', error);
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !selectedCategory) return;

        setLoading(true);
        const taskData: Partial<Task> = {
            title,
            category_id: selectedCategory,
            amount: amount ? amount.toString() : undefined,
            due_date: date || undefined,
            status: 'pending' as const
        };

        let result;
        if (isEditMode && id) {
            result = await tasksService.updateTask(id, taskData);
        } else {
            result = await tasksService.createTask(taskData as Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>);
        }

        setLoading(false);

        if (result) {
            navigate(isEditMode ? `/detail/${id}` : '/home');
        } else {
            alert(`Erro ao ${isEditMode ? 'atualizar' : 'criar'} tarefa. Tente novamente.`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-6">
            <header className="bg-white p-6 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full -ml-2">
                        <ArrowLeft className="w-6 h-6 text-slate-700" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">{isEditMode ? 'Editar Item' : 'Novo Item'}</h1>
                </div>
            </header>

            <div className="p-6">
                {initialLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Carregando dados...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome do Item</label>
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                                    <FileText className="w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Ex: Aluguel, Condomínio"
                                        className="flex-1 outline-none font-medium text-slate-900 placeholder:text-slate-300"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoria</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`p-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors ${selectedCategory === cat.id
                                                ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            <Tag className="w-4 h-4" />
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valor (Opcional)</label>
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                                    <DollarSign className="w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="R$ 0,00"
                                        className="flex-1 outline-none font-medium text-slate-900 placeholder:text-slate-300"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vencimento (Opcional)</label>
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                    <input
                                        type="date"
                                        className="flex-1 outline-none font-medium text-slate-900 bg-transparent"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                            </div>

                        </div>

                        <Button type="submit" fullWidth disabled={loading}>
                            {loading ? (isEditMode ? 'Salvando...' : 'Criando...') : (isEditMode ? 'Salvar Alterações' : 'Adicionar Item')}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};
