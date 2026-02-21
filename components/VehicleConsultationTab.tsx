import React, { useState } from 'react';
import { Search, Car, AlertCircle, CheckCircle, Smartphone, Activity, Info, FileText, MapPin, Hash, Shield, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { vehicleConsultationService } from '../services/vehicleConsultation';

type EndpointType = 'basic' | 'v1' | 'v2';

interface NormalizedData {
    vehicle: { brand: string; model: string; yearFab: string; yearMod: string; color: string; fuel: string; };
    identification: { plate: string; chassis: string; renavam: string; engine: string; };
    legal: { situation: string; city: string; state: string; owner: string; restrictions: string[]; debts: string[]; };
    fipe?: { value: string; reference: string; };
    raw: any;
}

const normalizeData = (raw: any, endpoint: EndpointType): NormalizedData => {
    const norm: NormalizedData = {
        vehicle: { brand: '-', model: '-', yearFab: '-', yearMod: '-', color: '-', fuel: '-' },
        identification: { plate: '-', chassis: '-', renavam: '-', engine: '-' },
        legal: { situation: '-', city: '-', state: '-', owner: '-', restrictions: [], debts: [] },
        raw
    };

    try {
        if (endpoint === 'basic') {
            // A API básica retorna { "data": { "data": { ... }, "extra": { ... } } }
            // Ou às vezes apenas { "data": { ... }, "extra": { ... } }
            const rootData = raw?.data || raw;
            const d = rootData?.data || rootData;
            const ex = rootData?.extra || d?.extra || {};

            norm.vehicle.brand = d.MARCA || d.marca || '-';
            norm.vehicle.model = d.MODELO || d.modelo || d.marcamodelo || '-';
            norm.vehicle.yearFab = d.ano || ex.ano_fabricacao || '-';
            norm.vehicle.yearMod = d.anoModelo || ex.ano_modelo || '-';
            norm.vehicle.color = d.cor || '-';
            norm.vehicle.fuel = ex.combustivel || '-';

            norm.identification.plate = d.placa || ex.placa || '-';
            norm.identification.chassis = d.chassi || ex.chassi || '-';
            norm.identification.renavam = ex.renavam || '-';
            norm.identification.engine = ex.motor || '-';

            norm.legal.situation = d.codigoSituacao === "0" ? 'REGULAR' : (d.situacao || ex.situacao_veiculo || '-');
            norm.legal.city = d.municipio || ex.municipio || '-';
            norm.legal.state = d.uf || ex.uf || '-';

            // Tratamento de restrições (separa e adiciona se válido)
            if (ex.restricao_1 && ex.restricao_1 !== 'N/A' && ex.restricao_1 !== '') norm.legal.restrictions.push(ex.restricao_1);
            if (ex.restricao_2 && ex.restricao_2 !== 'N/A' && ex.restricao_2 !== '') norm.legal.restrictions.push(ex.restricao_2);
            if (ex.restricao_3 && ex.restricao_3 !== 'N/A' && ex.restricao_3 !== '') norm.legal.restrictions.push(ex.restricao_3);
            if (ex.restricao_4 && ex.restricao_4 !== 'N/A' && ex.restricao_4 !== '') norm.legal.restrictions.push(ex.restricao_4);

            // Adiciona outros débitos ou restrições genéricas da raiz se houver
            if (d.restricao && d.restricao !== 'N/A') norm.legal.restrictions.push(d.restricao);
            if (d.restricaoFinanciadeira) norm.legal.restrictions.push(`Financiamento: ${d.restricaoFinanciadeira}`);
            if (d.restricaoArrendatario) norm.legal.restrictions.push(`Arrendatário: ${d.restricaoArrendatario}`);

            if (d.multas) norm.legal.debts.push(`Multas: ${d.multas}`);
            if (d.autuacoes) norm.legal.debts.push(`Autuações: ${d.autuacoes}`);
            if (d.licenciamento) norm.legal.debts.push(`Licenciamento: ${d.licenciamento}`);
            if (d.dpvat) norm.legal.debts.push(`DPVAT: ${d.dpvat}`);
            if (d.ipva) norm.legal.debts.push(`IPVA: ${d.ipva}`);

            const fipeData = d.fipe?.dados?.[0] || d.tabelaFipe?.[0];
            if (fipeData) {
                norm.fipe = { value: fipeData.texto_valor || fipeData.valor || '-', reference: fipeData.mes_referencia || '-' };
            }

        } else if (endpoint === 'v1') {
            const d = raw.items?.[0] || {};
            const gen = d.general || {};
            const mech = d.mechanics || {};
            const yrs = d.years || {};
            const loc = d.licensePlate || {};
            const own = d.owner || {};

            norm.vehicle.brand = gen.model ? gen.model.split(' ')[0] : '-';
            norm.vehicle.model = gen.model || '-';
            norm.vehicle.yearFab = yrs.manufacture || '-';
            norm.vehicle.yearMod = yrs.model || '-';
            norm.vehicle.color = gen.color || '-';
            norm.vehicle.fuel = gen.fuelType || '-';

            norm.identification.plate = gen.plate || raw.placa || '-';
            norm.identification.chassis = gen.chassis || '-';
            norm.identification.renavam = gen.renavam || '-';
            norm.identification.engine = d.identifiers?.motor || '-';

            norm.legal.situation = d.hasAlert ? 'COM ALERTA' : 'REGULAR';
            norm.legal.city = loc.city || '-';
            norm.legal.state = loc.state || '-';
            norm.legal.owner = own.name || '-';
            if (d.alerts?.length > 0) norm.legal.restrictions.push(...d.alerts);
            if (d.debts?.length > 0) norm.legal.debts.push(...d.debts);

        } else if (endpoint === 'v2') {
            // Semelhante ao basic, o layout pode vir aninhado em data -> data
            const rootData = raw?.data || raw;
            const d = rootData?.data || rootData?.response || rootData;

            norm.vehicle.brand = d.marca_mod ? d.marca_mod.split('/')[0] : (d.marca || '-');
            norm.vehicle.model = d.marca_mod || d.modelo || '-';
            norm.vehicle.yearFab = d.ano_fab || d.ano || '-';
            norm.vehicle.yearMod = d.ano_mod || d.anoModelo || '-';
            norm.vehicle.color = d.cor || '-';
            norm.vehicle.fuel = d.combustivel || '-';

            norm.identification.plate = d.placa || '-';
            norm.identification.chassis = d.chassi || '-';
            norm.identification.renavam = d.renavam || '-';
            norm.identification.engine = d.n_motor || d.motor || '-';

            norm.legal.situation = d.situacao || '-';
            norm.legal.city = d.municipio || '-';
            norm.legal.state = d.uf || '-';
            norm.legal.owner = d.proprietario?.nome || d.proprietario || '-';

            if (d.restricoes && d.restricoes !== 'N/A' && d.restricoes !== 'NENHUMA' && d.restricoes !== '') norm.legal.restrictions.push(d.restricoes);
            if (d.restricao_1 && d.restricao_1 !== 'N/A' && d.restricao_1 !== '') norm.legal.restrictions.push(d.restricao_1);
            if (d.debitos && d.debitos !== 'N/A' && d.debitos !== '') norm.legal.debts.push(d.debitos);
        }
    } catch (e) {
        console.error('Normalization error', e);
    }

    return norm;
};

const ResultViewer: React.FC<{ data: NormalizedData, endpoint: string }> = ({ data, endpoint }) => {
    const [showRaw, setShowRaw] = useState(false);

    const DataItem = ({ label, value, strong = false }: { label: string, value: string, strong?: boolean }) => (
        <div className="flex flex-col mb-3 last:mb-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{label}</span>
            <span className={`text-sm text-slate-900 ${strong ? 'font-black' : 'font-medium'}`}>{value || '-'}</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header / Resumo */}
            <div className="bg-slate-900 rounded-[32px] p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                <div className="flex items-start justify-between relative z-10 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                                <CheckCircle className="w-3 h-3" />
                                Consulta Realizada
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-mono bg-slate-800 px-2 py-1 rounded-lg">
                                {endpoint}
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-white truncate max-w-[280px] md:max-w-full">
                            {data.vehicle.model}
                        </h2>
                        <p className="text-slate-400 text-sm font-medium mt-1">
                            {data.vehicle.brand} • {data.vehicle.yearFab}/{data.vehicle.yearMod} • {data.vehicle.color}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Placa</p>
                        <p className="text-lg font-black text-white">{data.identification.plate}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Chassi</p>
                        <p className="text-[13px] font-black text-white truncate">{data.identification.chassis}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Situação</p>
                        <p className={`text-sm font-black ${data.legal.situation.includes('ROUBO') || data.legal.situation.includes('ALERTA') ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {data.legal.situation}
                        </p>
                    </div>
                    {data.fipe && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                            <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest mb-1">Tab. FIPE ({data.fipe.reference})</p>
                            <p className="text-base font-black text-emerald-400 truncate">{data.fipe.value}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Cards de Detalhes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Características */}
                <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
                    <h3 className="text-xs font-black text-slate-900 mb-5 flex items-center gap-2 uppercase tracking-widest">
                        <Car className="w-4 h-4 text-primary-500" />
                        Características
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <DataItem label="Marca" value={data.vehicle.brand} strong />
                        <DataItem label="Modelo" value={data.vehicle.model} strong />
                        <DataItem label="Ano Fabricação" value={data.vehicle.yearFab} />
                        <DataItem label="Ano Modelo" value={data.vehicle.yearMod} />
                        <DataItem label="Cor Predominante" value={data.vehicle.color} />
                        <DataItem label="Combustível" value={data.vehicle.fuel} />
                    </div>
                </div>

                {/* Identificação & Legal */}
                <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
                    <h3 className="text-xs font-black text-slate-900 mb-5 flex items-center gap-2 uppercase tracking-widest">
                        <Hash className="w-4 h-4 text-primary-500" />
                        Identificação e Legal
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <DataItem label="Renavam" value={data.identification.renavam} />
                        <DataItem label="Motor" value={data.identification.engine} />
                        <DataItem label="Município/UF" value={`${data.legal.city} - ${data.legal.state}`} />
                        <DataItem label="Proprietário" value={data.legal.owner} strong />
                    </div>

                    {data.legal.restrictions.length > 0 && (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <AlertCircle className="w-3 h-3" /> Restrições / Alertas
                            </p>
                            <ul className="list-disc list-inside text-xs font-bold text-amber-700 space-y-1">
                                {data.legal.restrictions.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                    )}

                    {data.legal.debts.length > 0 && (
                        <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                            <p className="text-[10px] font-bold text-rose-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <DollarSign className="w-3 h-3" /> Débitos Identificados
                            </p>
                            <ul className="list-disc list-inside text-xs font-bold text-rose-700 space-y-1">
                                {data.legal.debts.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Dados Brutos Toggle */}
            <div className="bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden">
                <button
                    onClick={() => setShowRaw(!showRaw)}
                    className="w-full px-6 py-4 flex items-center justify-between text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Ver Resposta Completa (JSON)
                    </span>
                    {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showRaw && (
                    <div className="p-6 pt-0 bg-slate-950 border-t border-slate-200">
                        <div className="mt-4 overflow-x-auto custom-scrollbar">
                            <pre className="text-[11px] font-mono text-emerald-400/80 leading-relaxed">
                                {JSON.stringify(data.raw, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const VehicleConsultationTab: React.FC = () => {
    const [plate, setPlate] = useState('');
    const [endpoint, setEndpoint] = useState<EndpointType>('basic');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<NormalizedData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const formatPlate = (value: string) => {
        let formatted = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (formatted.length > 3) {
            formatted = formatted.substring(0, 3) + '-' + formatted.substring(3, 7);
        }
        return formatted.substring(0, 8);
    };

    const handleConsult = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!plate || plate.length < 7) {
            setError('Por favor, insira uma placa válida.');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const cleanPlate = plate.replace('-', '');

        try {
            let data;
            switch (endpoint) {
                case 'basic':
                    data = await vehicleConsultationService.consultBasic(cleanPlate);
                    break;
                case 'v1':
                    data = await vehicleConsultationService.consultV1(cleanPlate);
                    break;
                case 'v2':
                    data = await vehicleConsultationService.consultV2(cleanPlate);
                    break;
            }
            setResult(normalizeData(data, endpoint));
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar a consulta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Formulário de Consulta */}
            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Search className="w-5 h-5 text-primary-500" />
                    Nova Consulta
                </h3>

                <form onSubmit={handleConsult} className="space-y-5">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                            Tipo de Consulta
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <label className={`
                relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all
                ${endpoint === 'basic' ? 'border-primary-500 bg-primary-50' : 'border-slate-100 bg-white hover:border-slate-200'}
              `}>
                                <input
                                    type="radio"
                                    name="endpoint"
                                    value="basic"
                                    checked={endpoint === 'basic'}
                                    onChange={() => setEndpoint('basic')}
                                    className="sr-only"
                                />
                                <span className={`text-sm font-black mb-1 ${endpoint === 'basic' ? 'text-primary-600' : 'text-slate-700'}`}>Básica</span>
                                <span className="text-[11px] text-slate-400 font-medium">Dados completos e FIPE</span>
                                {endpoint === 'basic' && <CheckCircle className="absolute top-4 right-4 w-4 h-4 text-primary-500" />}
                            </label>

                            <label className={`
                relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all
                ${endpoint === 'v1' ? 'border-primary-500 bg-primary-50' : 'border-slate-100 bg-white hover:border-slate-200'}
              `}>
                                <input
                                    type="radio"
                                    name="endpoint"
                                    value="v1"
                                    checked={endpoint === 'v1'}
                                    onChange={() => setEndpoint('v1')}
                                    className="sr-only"
                                />
                                <span className={`text-sm font-black mb-1 ${endpoint === 'v1' ? 'text-primary-600' : 'text-slate-700'}`}>Completa V1</span>
                                <span className="text-[11px] text-slate-400 font-medium">Restrições e proprietário</span>
                                {endpoint === 'v1' && <CheckCircle className="absolute top-4 right-4 w-4 h-4 text-primary-500" />}
                            </label>

                            <label className={`
                relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all
                ${endpoint === 'v2' ? 'border-primary-500 bg-primary-50' : 'border-slate-100 bg-white hover:border-slate-200'}
              `}>
                                <input
                                    type="radio"
                                    name="endpoint"
                                    value="v2"
                                    checked={endpoint === 'v2'}
                                    onChange={() => setEndpoint('v2')}
                                    className="sr-only"
                                />
                                <span className={`text-sm font-black mb-1 ${endpoint === 'v2' ? 'text-primary-600' : 'text-slate-700'}`}>Completa V2</span>
                                <span className="text-[11px] text-slate-400 font-medium">Dados extras</span>
                                {endpoint === 'v2' && <CheckCircle className="absolute top-4 right-4 w-4 h-4 text-primary-500" />}
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                            Placa do Veículo
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Car className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="ABC-1234"
                                value={plate}
                                onChange={(e) => setPlate(formatPlate(e.target.value))}
                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-black focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:font-medium placeholder:text-slate-400 uppercase text-lg"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || plate.length < 7}
                        className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-primary-200"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Consultando e Processando...
                            </>
                        ) : (
                            <>
                                <Search className="w-5 h-5" />
                                Consultar Veículo
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Mensagem de Erro */}
            {error && (
                <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-rose-900 mb-1">Falha na consulta</h4>
                        <p className="text-[13px] text-rose-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Resultado Visual Profissional */}
            {result && <ResultViewer data={result} endpoint={endpoint} />}
        </div>
    );
};
