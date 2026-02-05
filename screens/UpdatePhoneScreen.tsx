import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Phone, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { profilesService } from '../services/profiles';
import { normalizePhoneBR } from '../services/phoneUtils';

export const UpdatePhoneScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        const cleanPhone = normalizePhoneBR(phone);
        if (cleanPhone.length < 12 || cleanPhone.length > 13) {
            setError('Telefone inválido. Informe o DDD e o número.');
            setLoading(false);
            return;
        }

        try {
            await profilesService.updatePhone(user.id, cleanPhone);
            // Navigate to home - the ProtectedRoute will now see the metadata
            navigate('/home');
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar telefone.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col justify-center items-center">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center mb-10 text-center">
                    <img src="/assets/logo.png" alt="Vida em Dia" className="w-48 h-auto mb-6" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Quase lá!</h2>
                    <p className="text-slate-500 text-sm font-medium">
                        Para sua segurança e para usar o WhatsApp do Vida em Dia, precisamos do seu número de telefone.
                    </p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                    {error && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Seu Telefone (DDD + Número)</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <input
                                type="tel"
                                placeholder="(11) 99999-9999"
                                value={phone}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, '');
                                    if (v.length <= 11) {
                                        let masked = v;
                                        if (v.length > 2) masked = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                                        if (v.length > 7) masked = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
                                        setPhone(masked);
                                    }
                                }}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" fullWidth disabled={loading}>
                        {loading ? 'Salvando...' : 'Confirmar Telefone'}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => signOut()}
                        className="text-slate-400 text-sm flex items-center gap-2 mx-auto hover:text-slate-600 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair da conta
                    </button>
                </div>
            </div>
        </div>
    );
};
