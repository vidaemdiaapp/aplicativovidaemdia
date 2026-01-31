import React from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

interface TaxYearSelectorProps {
    selectedYear: number;
    onYearChange: (year: number) => void;
    availableYears?: number[];
}

export const TaxYearSelector: React.FC<TaxYearSelectorProps> = ({
    selectedYear,
    onYearChange,
    availableYears = [2025, 2026]
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getYearLabel = (year: number) => {
        if (year === 2026) return 'IR 2026 (Novas Regras)';
        if (year === 2025) return 'IR 2025';
        return `IR ${year}`;
    };

    const getYearDescription = (year: number) => {
        if (year === 2026) return 'Ano-Calendário 2025 • Isenção R$ 60k';
        if (year === 2025) return 'Ano-Calendário 2024 • Isenção R$ 27k';
        return `Ano-Calendário ${year - 1}`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all
                    ${isOpen
                        ? 'bg-primary-50 border-primary-200 text-primary-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-primary-200 hover:bg-slate-50'
                    }
                    shadow-sm active:scale-[0.98]
                `}
            >
                <Calendar className="w-4 h-4 text-primary-500" />
                <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">
                        Exercício Fiscal
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {getYearLabel(selectedYear)}
                    </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 py-2">
                            Selecione o Ano Fiscal
                        </p>

                        {availableYears.map((year) => (
                            <button
                                key={year}
                                onClick={() => {
                                    onYearChange(year);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full flex items-center justify-between p-4 rounded-xl transition-all
                                    ${selectedYear === year
                                        ? 'bg-primary-50 border border-primary-100'
                                        : 'hover:bg-slate-50'
                                    }
                                `}
                            >
                                <div className="text-left">
                                    <p className={`font-bold ${selectedYear === year ? 'text-primary-700' : 'text-slate-900'}`}>
                                        {getYearLabel(year)}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {getYearDescription(year)}
                                    </p>
                                    {year === 2026 && (
                                        <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-md">
                                            Novas Regras
                                        </span>
                                    )}
                                </div>
                                {selectedYear === year && (
                                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Info Footer */}
                    <div className="bg-slate-50 p-4 border-t border-slate-100">
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            <span className="font-bold text-slate-600">💡 Dica:</span> Em 2026 houve mudança significativa na faixa de isenção. Compare os dois anos para ver sua economia.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
