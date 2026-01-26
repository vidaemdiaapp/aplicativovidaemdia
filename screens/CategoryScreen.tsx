import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, Filter, Search, Home, FileText, Shield, Receipt, DollarSign, ClipboardList } from 'lucide-react';
import { tasksService, Task, Category } from '../services/tasks';

// Icon mapping for categories
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  'Car': Car,
  'Home': Home,
  'FileText': FileText,
  'Shield': Shield,
  'Receipt': Receipt,
  'DollarSign': DollarSign,
  'ClipboardList': ClipboardList
};

export const CategoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [tasksData, categoriesData] = await Promise.all([
      tasksService.getUserTasks(),
      tasksService.getCategories()
    ]);
    setTasks(tasksData);
    setCategories(categoriesData);
    if (categoriesData.length > 0 && !selectedCategory) {
      setSelectedCategory(categoriesData[0].id);
    }
    setLoading(false);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = !selectedCategory || task.category_id === selectedCategory;
    const matchesSearch = !searchTerm || task.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const currentCategory = categories.find(c => c.id === selectedCategory);
  const IconComponent = ICON_MAP[currentCategory?.icon || 'FileText'] || FileText;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pb-8 lg:pb-0">
      <header className="bg-white/80 backdrop-blur-md p-6 pt-12 pb-4 sticky top-0 z-10 shadow-sm lg:rounded-b-2xl lg:px-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full -ml-2">
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">{currentCategory?.label || 'Todas'}</h1>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <div className="flex-1 bg-slate-100 rounded-xl flex items-center px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
            <Search className="w-5 h-5 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent w-full outline-none text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <button className="bg-slate-100 p-2.5 rounded-xl text-slate-700 hover:bg-slate-200 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="p-6">
        {filteredTasks.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-slate-100">
            <p className="text-slate-500 font-medium">Nenhum item encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map(task => {
              const category = categories.find(c => c.id === task.category_id);
              const TaskIcon = ICON_MAP[category?.icon || 'FileText'] || FileText;

              return (
                <div
                  key={task.id}
                  onClick={() => navigate(`/detail/${task.id}`)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 active:scale-[0.99] transition-all cursor-pointer hover:border-primary-100 hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${category?.color || 'bg-slate-100 text-slate-600'}`}>
                        <TaskIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 line-clamp-1">{task.title}</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">{category?.label}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${task.status === 'completed' ? 'bg-success-100 text-success-700' :
                      task.health_status === 'risk' ? 'bg-danger-100 text-danger-700' :
                        task.health_status === 'attention' ? 'bg-warning-100 text-warning-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                      {task.status === 'completed' ? 'Pago' :
                        task.health_status === 'risk' ? 'Risco' :
                          task.health_status === 'attention' ? 'Atenção' : 'Ok'}
                    </span>
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-50 pt-3 mt-1">
                    <div>
                      <p className="text-xs text-slate-400 mb-1 font-medium">Vencimento</p>
                      <p className="text-sm font-semibold text-slate-600">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : 'Sem data'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1 font-medium">Valor</p>
                      <p className="text-lg font-bold text-slate-900">{task.amount || 'R$ 0,00'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
