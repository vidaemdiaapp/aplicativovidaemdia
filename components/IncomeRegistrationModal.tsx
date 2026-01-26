import React, { useState, useEffect } from 'react';
import { X, DollarSign, Wallet, Users, Bell, CheckCircle2 } from 'lucide-react';
import { incomesService, Income, IncomeType } from '../services/incomes';
import { useAuth } from '../hooks/useAuth';
import { tasksService } from '../services/tasks';
import { Household } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const IncomeRegistrationModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [household, setHousehold] = useState<Household | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [myIncome, setMyIncome] = useState<{
        amount: string;
        type: IncomeType;
        shared: boolean;
    }>({ amount: '', type: 'clt', shared: true });

    const [partnerIncome, setPartnerIncome] = useState < {
        amount: string;
        user_id?: string;
        const [initialPartnerAmount, setInitialPartnerAmount] = useState('');

        useEffect(() => {
    if (isOpen) {
        loadInitialData();
    }
}, [isOpen]);

const loadInitialData = async () => {
    setLoading(true);
    const [hh, incomes] = await Promise.all([
        tasksService.getHousehold(),
        incomesService.getIncomes()
    ]);

    setHousehold(hh);

    const mine = incomes.find(i => i.user_id === user?.id);
    if (mine) {
        setMyIncome({
            amount: mine.amount_monthly.toString(),
            type: mine.income_type,
            shared: mine.is_shared
        });
    }

    const partner = hh?.members?.find(m => m.user_id !== user?.id);
    if (partner) {
        const pIncome = incomes.find(i => i.user_id === partner.user_id);
        const amt = pIncome?.amount_monthly.toString() || '';
        setPartnerIncome({
            amount: amt,
            user_id: partner.user_id
        });
        setInitialPartnerAmount(amt);
    }
    setLoading(false);
};

const handleSave = async () => {
    setSaving(true);
    try {
        // 1. Save my income (Direct)
        await incomesService.upsertIncome({
            amount_monthly: parseFloat(myIncome.amount) || 0,
            income_type: myIncome.type,
            is_shared: myIncome.shared
        });

        // 2. Handle partner's income (Request Authorization if changed)
        if (partnerIncome.user_id && partnerIncome.amount !== initialPartnerAmount) {
            await incomesService.requestIncomeChange(
                partnerIncome.user_id,
                parseFloat(partnerIncome.amount) || 0
            );
            alert('Solicitação de alteração enviada para aprovação do parceiro(a)!');
        }

        onSuccess();
        onClose();
    } catch (error) {
        console.error('Error saving incomes:', error);
    } finally {
        setSaving(false);
    }
};

const handleNotifyPartner = async () => {
    if (partnerIncome.user_id) {
        const success = await incomesService.notifyPartner(partnerIncome.user_id);
        if (success) {
            alert('Notificação enviada para seu parceiro(a)!');
        }
    }
};

if (!isOpen) return null;

return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <Wallet className="w-6 h-6 text-primary-600" />
                            Gestão de Renda
                        </h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">Configure as entradas do mês</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 flex justify-center">
                        <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* My Income Section */}
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <DollarSign className="w-3 h-3" /> Sua Renda Líquida
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                    <input
                                        type="number"
                                        value={myIncome.amount}
                                        onChange={e => setMyIncome({ ...myIncome, amount: e.target.value })}
                                        placeholder="0,00"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-black text-lg focus:border-primary-500 outline-none transition-colors"
                                    />
                                </div>
                                <select
                                    value={myIncome.type}
                                    onChange={e => setMyIncome({ ...myIncome, type: e.target.value as IncomeType })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-4 font-bold text-slate-700 focus:border-primary-500 outline-none appearance-none transition-colors"
                                >
                                    <option value="clt">CLT</option>
                                    <option value="pj">PJ</option>
                                    <option value="autonomo">Autônomo</option>
                                    <option value="outros">Outros</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700">Compartilhar na vida a dois</span>
                                </div>
                                <button
                                    onClick={() => setMyIncome({ ...myIncome, shared: !myIncome.shared })}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${myIncome.shared ? 'bg-primary-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${myIncome.shared ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>

                        {/* Partner Income Section */}
                        {household && partnerIncome.user_id && (
                            <div className="pt-8 border-t border-slate-100 space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Users className="w-3 h-3" /> Renda do Parceiro(a)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                    <input
                                        type="number"
                                        value={partnerIncome.amount}
                                        onChange={e => setPartnerIncome({ ...partnerIncome, amount: e.target.value })}
                                        placeholder="0,00"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-black text-lg focus:border-primary-500 outline-none transition-colors"
                                    />
                                </div>
                                {(!partnerIncome.amount || partnerIncome.amount === '0') && (
                                    <button
                                        onClick={handleNotifyPartner}
                                        className="w-full py-3 rounded-2xl border-2 border-dashed border-primary-200 text-primary-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors"
                                    >
                                        <Bell className="w-4 h-4" /> Enviar convite para preenchimento
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-6 h-6" />
                                        Salvar Alterações
                                    </>
                                )}
                            </button>
                            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                                Configuração rápida em menos de 30 segundos ⚡
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
);
};
