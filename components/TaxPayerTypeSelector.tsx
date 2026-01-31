import React from 'react';
import { User, Briefcase, Calculator, Building2 } from 'lucide-react';
import { TaxpayerType } from '../services/tax_calculator';

interface TaxPayerTypeSelectorProps {
    value: TaxpayerType;
    onChange: (type: TaxpayerType) => void;
}

const TYPES: { id: TaxpayerType; label: string; icon: any; description: string }[] = [
    {
        id: 'CLT',
        label: 'CLT / Assalariado',
        icon: User,
        description: 'Imposto retido na fonte pela empresa.'
    },
    {
        id: 'MEI',
        label: 'MEI',
        icon: Building2,
        description: 'Microempreendedor Individual (SIMEI).'
    },
    {
        id: 'AUTONOMO',
        label: 'Autônomo (RPA)',
        icon: Briefcase,
        description: 'Profissional liberal com Carnê-Leão.'
    },
    {
        id: 'MIXED',
        label: 'Misto',
        icon: Calculator,
        description: 'Rendas de CLT e PJ simultâneas.'
    }
];

export const TaxPayerTypeSelector: React.FC<TaxPayerTypeSelectorProps> = ({ value, onChange }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = value === type.id;

                return (
                    <button
                        key={type.id}
                        onClick={() => onChange(type.id)}
                        className={`
                            flex flex-col items-center p-4 rounded-2xl border transition-all text-center
                            ${isSelected
                                ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm'
                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                            }
                        `}
                    >
                        <div className={`
                            p-3 rounded-xl mb-3 transition-all
                            ${isSelected ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-400'}
                        `}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider mb-1">{type.label}</span>
                        <p className={`text-[9px] leading-tight ${isSelected ? 'text-primary-600/70' : 'text-slate-400'}`}>
                            {type.description}
                        </p>
                    </button>
                );
            })}
        </div>
    );
};
