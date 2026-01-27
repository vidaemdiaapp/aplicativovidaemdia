import { supabase } from './supabase';
import { tasksService } from './tasks';
import { taxService } from './tax';
import { documentsService } from './documents';
import { taxDeductionsService, DeductionType } from './tax_deductions';
import { AssistantIntent, Message, PendingAction, OperationalAction } from '../types';
import { knowledgeService } from './knowledge';

// Sprint 19: Real Q&A Map Loader (Entrega 3) - Updated to 2026 FAQ
import irFaq from '../tax_knowledge/2026/ir_faq_1-200.json';

/**
 * Sprint 19: Especialista em Imposto de Renda (Expert AI)
 * Knowledge base following the Module A-H Curriculum.
 */
const DISCLAIMER = "\n\n*Este é um guia educativo baseado na Base de Conhecimento Oficial IR 2026. O Vida em Dia não realiza o envio oficial nem substitui um contador.*";

export const assistantService = {
    /**
     * Finds the best matching question in the 2026 FAQ (ir_faq_1-200.json)
     * Optimized for Brazilian slang, abbreviations and regionalisms.
     */
    findBestMatchingQA: (text: string) => {
        const normalize = (str: string) => {
            return str.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
                .replace(/[^\w\s]/gi, '') // Remove punctuation
                // Common Brazilian abbreviations and slang
                .replace(/\bpra\b/g, 'para')
                .replace(/\btá\b/g, 'esta')
                .replace(/\btava\b/g, 'estava')
                .replace(/\bvc\b/g, 'voce')
                .replace(/\bnd\b/g, 'nada')
                .replace(/\bmt\b/g, 'muito')
                .replace(/\bblz\b/g, 'beleza')
                .replace(/\bp\b/g, 'para')
                .replace(/\bq\b/g, 'que')
                .replace(/\btu\b/g, 'voce') // Regionalism: 'tu' often used as 'voce'
                .replace(/\bce\b/g, 'voce')
                .replace(/\s+/g, ' ') // Normalize spaces
                .trim();
        };

        const normalizedInput = normalize(text);
        const faqItems = (irFaq as any).items || [];

        // Priority 1: Exact normalized match
        let match = faqItems.find((item: any) => normalize(item.question) === normalizedInput);
        if (match) return match;

        // Priority 2: Keyword overlap (score-based)
        const inputWords = normalizedInput.split(' ').filter(w => w.length > 2);
        if (inputWords.length === 0) return null;

        const scoredMatches = faqItems.map((item: any) => {
            const qaNormalized = normalize(item.question);
            const qaWords = qaNormalized.split(' ');
            const score = inputWords.filter(word => qaWords.includes(word)).length;

            // Check if input is contained in question or vice versa
            let bonus = 0;
            if (qaNormalized.includes(normalizedInput) || normalizedInput.includes(qaNormalized)) {
                bonus = 2;
            }

            return { item, score: score + bonus };
        }).filter((m: any) => m.score > 0).sort((a: any, b: any) => b.score - a.score);

        // Stricter threshold: Must match at least 60% of keywords OR have a strong bonus
        const threshold = Math.max(inputWords.length * 0.6, 2.5);
        if (scoredMatches.length > 0 && scoredMatches[0].score >= threshold) {
            return scoredMatches[0].item;
        }

        return null;
    },

    classifyIntent: (text: string): AssistantIntent => {
        const lower = text.toLowerCase();

        // Traffic & Fines (New Domains)
        if (lower.includes('multa') || lower.includes('pontos') || lower.includes('cnh') || lower.includes('detran') || lower.includes('senatran')) return 'TRAFFIC_ANALYSIS';

        // IR Master Class Módulos A-H
        if (lower.includes('o que é') || lower.includes('por que existe') || lower.includes('isento') || lower.includes('diferença entre pagar') || lower.includes('retenção') || lower.includes('ajuste anual') || lower.includes('malha fina')) return 'IR_BASICS';
        if (lower.includes('salário') || lower.includes('aluguel') || lower.includes('pensão') || lower.includes('clt') || lower.includes('autônomo') || lower.includes('pró-labore') || lower.includes('vale-refeição') || lower.includes('13º') || lower.includes('plr')) return 'IR_INCOME';
        if (lower.includes('dedução') || lower.includes('abater') || lower.includes('psicólogo') || lower.includes('escola') || lower.includes('dentista') || lower.includes('academia') || lower.includes('material escolar') || lower.includes('curso') || lower.includes('estética')) return 'IR_DEDUCTIONS';
        if (lower.includes('dependente') || lower.includes('filho') || lower.includes('cônjuge') || lower.includes('vale a pena')) return 'IR_DEPENDENTS';
        if (lower.includes('investimento') || lower.includes('ação') || lower.includes('cdb') || lower.includes('tesouro') || lower.includes('prejuízo') || lower.includes('dividendo')) return 'IR_INVESTMENTS';
        if (lower.includes('carro') || lower.includes('imóvel') || lower.includes('patrimônio') || lower.includes('financiamento') || lower.includes('vendi') || lower.includes('comprei')) return 'IR_PATRIMONY';
        if (lower.includes('restituição') || lower.includes('lote') || lower.includes('prioridade') || lower.includes('quando recebo')) return 'IR_REFUND';
        if (lower.includes('como faço para declarar') || lower.includes('checklist') || lower.includes('passo a passo') || lower.includes('pronto para declarar')) return 'IR_CHECKLIST';

        // Hub Shortcuts & Operational
        if (lower.includes('hoje') && (lower.includes('como tá') || lower.includes('status') || lower.includes('resumo'))) return 'STATUS_REPORT';
        if (lower.includes('resumo rápido') || (lower.includes('financeiro') && lower.includes('ir'))) return 'STATUS_REPORT';
        if (lower.includes('tudo certo') || lower.includes('saúde') || lower.includes('geral')) return 'GENERAL_HEALTH';
        if (lower.includes('paga') || lower.includes('resolv') || lower.includes('conclu') || lower.includes('feito') || lower.includes('quit')) return 'ACTION_PROPOSAL';
        if (lower.includes('pass') || lower.includes('deleg') || lower.includes('manda') || lower.includes('transf')) return 'ACTION_PROPOSAL';
        if (lower.includes('lembr') || lower.includes('reagend') || lower.includes('adi') || lower.includes('muda') || lower.includes('posterg')) return 'ACTION_PROPOSAL';
        if (lower.includes('preço') || lower.includes('valor') || lower.includes('quanto') || lower.includes('é')) return 'ACTION_PROPOSAL';
        if (lower.includes('dinheiro') || lower.includes('finança') || lower.includes('saldo') || lower.includes('conta') || lower.includes('gast') || lower.includes('econom')) return 'FINANCIAL_STATUS';
        if (lower.includes('risco') || lower.includes('atraso') || lower.includes('problema') || lower.includes('vence') || lower.includes('urgente')) return 'RISK_STATUS';
        if (lower.includes('anexa') || lower.includes('manda') || lower.includes('upload') || lower.includes('arquivo') || lower.includes('recibo') || lower.includes('foto')) return 'UPLOAD_INTENT';

        return 'UNKNOWN';
    },

    getKnowledgeDomain: (intent: AssistantIntent): string => {
        if (intent === 'UPLOAD_INTENT' || intent === 'TRAFFIC_ANALYSIS') return 'documents';
        return 'general';
    },

    getKnowledgeCategory: (intent: AssistantIntent, text: string): string => {
        const lower = text.toLowerCase();
        if (intent.startsWith('IR_')) {
            if (lower.includes('praz') || lower.includes('ate quando')) return 'irpf_deadlines';
            return 'irpf_2026';
        }
        if (lower.includes('multa') || lower.includes('pontos') || lower.includes('cnh')) return 'traffic_general';
        if (intent === 'UPLOAD_INTENT') return 'docs_portals';
        return 'general';
    },

    getInitialSuggestions: async (): Promise<{ label: string; text: string }[]> => {
        const suggestions: { label: string; text: string }[] = [];
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return [{ label: '📊 Status Geral', text: 'Tudo certo com minha vida adulta?' }];

            const householdStatus = await tasksService.computeHouseholdStatus();
            if (householdStatus && householdStatus.counts.risk > 0) suggestions.push({ label: '🚨 Resolver Riscos', text: 'Como estão meus riscos hoje?' });
            const financialStatus = await tasksService.computeFinancialStatus();
            if (financialStatus && financialStatus.status === 'deficit') suggestions.push({ label: '💰 Alerta de Saldo', text: 'Resumo financeiro rápido' });
            const tasks = await tasksService.getUserTasks();
            const today = new Date().toISOString().split('T')[0];
            const dueToday = tasks.filter(t => t.status === 'pending' && t.due_date === today);
            if (dueToday.length > 0) suggestions.push({ label: '📅 Vencendo hoje', text: 'O que vence hoje?' });
            const taxReady = await taxService.getIRPFEstimate();
            if (!taxReady || taxReady.confidence === 'low') suggestions.push({ label: '🦁 Economizar no IR', text: 'Como posso diminuir meu imposto?' });
        } catch (e) {
            console.error('[Assistant] Suggestions failed:', e);
        }
        if (suggestions.length < 2) {
            suggestions.push({ label: '📊 Status Geral', text: 'Tudo certo com minha vida adulta?' });
            suggestions.push({ label: '💸 Meu Saldo', text: 'Como tá meu saldo hoje?' });
        }
        return suggestions.slice(0, 3);
    },

    processChatMessageUpload: async (file: File): Promise<Partial<Message>> => {
        const uploadResult = await documentsService.uploadAndProcess(file);
        if (!uploadResult) return { text: "Não consegui subir o arquivo. Verifique sua conexão." };
        const household = await tasksService.getHousehold();
        if (!household) return { text: "Erro ao identificar sua casa." };

        try {
            const analysis = await documentsService.processDocument(uploadResult.document_id, uploadResult.storage_path, household.id);
            const docLower = (analysis.doc_type || "").toLowerCase();
            const catLower = (analysis.category || "").toLowerCase();

            const isMedical = catLower === 'medical' || docLower.includes('médico') || docLower.includes('notafiscal') || docLower.includes('clínica') || docLower.includes('hospital');
            const isEducation = catLower === 'education' || docLower.includes('escola') || docLower.includes('faculdade') || docLower.includes('mensalidade') || docLower.includes('curso');
            const isHealthPlan = catLower === 'health_plan' || docLower.includes('unimed') || docLower.includes('plano de saúde');
            const isTraffic = catLower === 'traffic' || docLower.includes('multa') || docLower.includes('detran') || docLower.includes('autuação');

            if (isTraffic) {
                return assistantService.processTrafficFine(uploadResult, household.id);
            }

            let deductionType: DeductionType | null = null;
            if (isHealthPlan) deductionType = 'health_plan';
            else if (isMedical) deductionType = 'medical';
            else if (isEducation) deductionType = 'education';

            const catName = deductionType === 'education' ? 'educação' : 'saúde';

            if (deductionType && analysis.confidence > 0.6) {
                const payload = {
                    doc_id: uploadResult.document_id,
                    expense_type: deductionType,
                    provider_name: analysis.issuer || 'Identificado via Chat',
                    amount: analysis.amount || 0,
                    date: analysis.due_date || new Date().toISOString().split('T')[0],
                    confidence_score: analysis.confidence,
                    is_shared: true
                };

                if (!analysis.amount) return { text: `Identifiquei um comprovante de **${catName}** (${analysis.doc_type}), mas o valor não está nítido. \n\n**Qual o valor total deste documento?**`, intent: 'UPLOAD_INTENT' };

                const now = new Date();
                const expires = new Date(now.getTime() + 5 * 60000);
                return {
                    text: `Identifiquei um comprovante de **${catName}** no valor de **R$ ${analysis.amount}**. Quer que eu salve na sua Pasta Fiscal?`,
                    intent: 'UPLOAD_INTENT',
                    pendingAction: {
                        id: crypto.randomUUID(),
                        type: 'SAVE_DEDUCTION',
                        taskId: uploadResult.document_id,
                        payload,
                        summary: `Salvar ${analysis.doc_type} (${catName}) de R$ ${analysis.amount}`,
                        created_at: now.toISOString(),
                        expires_at: expires.toISOString()
                    }
                };
            }

            if (docLower.includes('pdf') || analysis.confidence > 0.2) {
                return {
                    text: `Recebi o arquivo **${file.name}**. Não consegui identificar se ele abate o imposto. \n\n**Este é um recibo de saúde ou educação?**`,
                    intent: 'UPLOAD_INTENT',
                    suggestions: [{ id: '1', title: 'Saúde' }, { id: '2', title: 'Educação' }, { id: '3', title: 'Não, arquivo comum' }]
                };
            }

            return { text: `Recebi o arquivo: **${analysis.doc_type || 'Documento'}**. Ele foi salvo, mas não parece ser uma despesa dedutível.`, intent: 'UPLOAD_INTENT' };
        } catch (error) {
            return { text: "O documento foi salvo, mas não consegui analisar agora.", intent: 'UPLOAD_INTENT' };
        }
    },

    processTrafficFine: async (uploadResult: any, householdId: string): Promise<Partial<Message>> => {
        try {
            const { data: analysis, error } = await supabase.functions.invoke('analyze_traffic_notice_v1', {
                body: {
                    document_id: uploadResult.document_id,
                    storage_path: uploadResult.storage_path,
                    household_id: householdId
                }
            });

            if (error || !analysis) throw new Error(error?.message || "Erro na análise da multa");

            const now = new Date();
            const expires = new Date(now.getTime() + 5 * 60000);

            let text = `${analysis.summary_human}\n\n**Detalhes extraídos:**\n• Placa: ${analysis.plate}\n• Natureza: ${analysis.nature} (${analysis.points} pontos)\n• Valor: R$ ${analysis.amount}\n• Local: ${analysis.location}\n\n💡 **Recomendação:** ${analysis.recommendation_text}`;

            if (analysis.recommendation === 'pay') {
                text += `\n\nVocê pode pagar com 40% de desconto (R$ ${analysis.sne_discount_40}) se usar o SNE e renunciar à defesa, ou 20% (R$ ${analysis.sne_discount_20}) até o vencimento.`;
            }

            return {
                text,
                intent: 'TRAFFIC_ANALYSIS',
                answer_json: {
                    domain: 'traffic',
                    key_facts: [
                        { label: 'Placa', value: analysis.plate },
                        { label: 'Pontos', value: analysis.points.toString() },
                        { label: 'Valor Base', value: `R$ ${analysis.amount}` }
                    ],
                    suggested_next_actions: analysis.recommendation === 'pay'
                        ? ['Agendar Pagamento', 'Ver no SNE']
                        : ['Analisar Defesa', 'Agendar Pagamento']
                },
                pendingAction: {
                    id: crypto.randomUUID(),
                    type: analysis.recommendation === 'pay' ? 'ADD_TRAFFIC_FINE' : 'ANALYZE_DEFENSE',
                    taskId: uploadResult.document_id,
                    payload: analysis,
                    summary: analysis.recommendation === 'pay' ? 'Pagar multa com desconto' : 'Analisar inconsistências para defesa',
                    created_at: now.toISOString(),
                    expires_at: expires.toISOString()
                }
            };
        } catch (e) {
            return { text: "Consegui subir a multa, mas tive um problema ao analisar os detalhes agora." };
        }
    },

    saveTrafficFine: async (analysis: any, defenseData?: { answers: any, markdown: string }): Promise<boolean> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return false;
        const user = session.user;
        const household = await tasksService.getHousehold();

        const { error } = await supabase
            .from('traffic_fines')
            .upsert({
                document_id: analysis.document_id,
                user_id: user.id,
                household_id: household?.id,
                plate: analysis.plate,
                infraction_date: analysis.date,
                infraction_time: analysis.time,
                location: analysis.location,
                nature: analysis.nature,
                points: analysis.points,
                amount: analysis.amount,
                issuer: analysis.issuer,
                infraction_code: analysis.infraction_code,
                description: analysis.description,
                recommendation: analysis.recommendation,
                analysis_checklist: analysis.formal_checklist || [],
                user_answers: defenseData?.answers || null,
                defense_markdown: defenseData?.markdown || null,
                updated_at: new Date().toISOString()
            }, { onConflict: 'document_id' });

        return !error;
    },

    generateTrafficDefense: async (fineDetails: any, userAnswers: any): Promise<string | null> => {
        const { data, error } = await supabase.functions.invoke('generate_traffic_defense_v1', {
            body: { fine_details: fineDetails, user_answers: userAnswers }
        });

        if (error || !data) {
            console.error('[Assistant] Defense generation failed:', error);
            return null;
        }

        // Save everything
        await assistantService.saveTrafficFine(fineDetails, { answers: userAnswers, markdown: data.markdown });

        return data.markdown;
    },


    getResponse: async (text: string): Promise<Partial<Message>> => {
        const intent = assistantService.classifyIntent(text);
        const domain = assistantService.getKnowledgeDomain(intent);

        // PRIORIDADE 1: Cérebro Centralizado (Edge Function + SQL Cache)
        try {
            console.log('[Assistant] Calling smart_chat_v1...');
            const { data, error } = await supabase.functions.invoke('smart_chat_v1', {
                body: { question: text, domain }
            });

            if (error) {
                console.error('[Assistant] Edge Function invocation error:', error);
                // If it's a CORS error or connection error, we catch it here or in the catch block
            }

            if (data) {
                if (data.answer_text) {
                    console.log('[Assistant] Smart Chat success:', data.is_cached ? 'CACHE' : 'AI');
                    return {
                        text: data.answer_text,
                        intent: intent,
                        actions: data.answer_json?.suggested_next_actions?.map((a: string) => ({ label: a, text: a })),
                        sources: data.sources,
                        confidence_level: data.confidence_level,
                        is_cached: data.is_cached,
                        answer_json: data.answer_json
                    };
                }
                if (data.error) {
                    console.warn('[Assistant] Smart Chat returned logic error:', data.error);
                }
            }
        } catch (e) {
            console.error('[Assistant] Smart Chat Function exception:', e);
        }


        // PRIORIDADE 2: Local FAQ Match (2026 JSON) - With high strictness
        const directMatch = assistantService.findBestMatchingQA(text);
        if (directMatch) {
            const greetings = ["Entendi!", "Claro, olha só:", "Boa pergunta!", "Isso é importante saber:"];
            const greeting = greetings[Math.floor(Math.random() * greetings.length)];
            return {
                text: `${greeting}\n\n${directMatch.answer}${DISCLAIMER}`,
                intent: directMatch.category === 'fundamentals' ? 'IR_BASICS' : 'IR_INCOME'
            };
        }

        // PRIORIDADE 3: Operational Intents (Tasks, Financials, Uploads)
        switch (intent) {
            // IR modules removed - handled by Smart Chat Edge Function

            case 'STATUS_REPORT': {
                const household = await tasksService.computeHouseholdStatus();
                const financial = await tasksService.computeFinancialStatus();
                let report = "Aqui está seu resumo rápido:\n";
                if (household) report += `• ${household.counts.risk} riscos e ${household.counts.attention} itens em atenção.\n`;
                if (financial) report += `• Saldo previsto: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financial.balance)}.\n`;
                return { text: report + "\nQuer detalhes de algum destes pontos?", intent, actions: [{ label: 'Ver Painel Completo', path: '/home' }] };
            }

            case 'ACTION_PROPOSAL': {
                const lowerText = text.toLowerCase();
                const tasks = await tasksService.getUserTasks();
                const rankedTasks = tasks
                    .filter(t => t.status !== 'completed')
                    .map(t => ({ task: t, score: t.title.toLowerCase().includes(lowerText) ? 100 : 0 }))
                    .filter(t => t.score > 0)
                    .sort((a, b) => b.score - a.score);

                let targetTask = rankedTasks[0]?.task;
                if (!targetTask) return { text: "Identifiquei sua intenção, mas qual tarefa você quer tratar exatamente?", intent: 'UNKNOWN' };

                const now = new Date();
                const expires = new Date(now.getTime() + 5 * 60000);
                return {
                    text: `Posso marcar "${targetTask.title}" como concluído. Confirma?`,
                    intent,
                    pendingAction: {
                        id: crypto.randomUUID(), type: 'COMPLETE_TASK', taskId: targetTask.id, payload: { status: 'completed' }, summary: `Concluir "${targetTask.title}"`, created_at: now.toISOString(), expires_at: expires.toISOString()
                    }
                };
            }

            case 'FINANCIAL_STATUS': {
                const report = await tasksService.computeFinancialStatus();
                if (!report) return { text: "Ainda não tenho acesso aos seus dados financeiros." };
                return { text: `Seu saldo este mês está em ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(report.balance)}.`, intent, actions: [{ label: 'Minhas Finanças', path: '/financial-dashboard' }] };
            }

            case 'UPLOAD_INTENT':
                return { text: "Pronto para receber! Suba um recibo médico ou escolar e eu analiso se ele abate seu imposto.", intent };

            case 'UNKNOWN':
            default: {
                const unknownResponses = [
                    "Ainda estou aprendendo sobre esse ponto específico.",
                    "Essa dúvida é bem específica e eu ainda não tenho todos os detalhes.",
                    "Puxa, ainda não sei te responder isso com precisão baseada nas regras atuais."
                ];
                const unknownResponse = unknownResponses[Math.floor(Math.random() * unknownResponses.length)];
                return {
                    text: `${unknownResponse}\n\nQue tal detalharmos seu caso ou verificarmos as regras gerais no painel?`,
                    intent: 'UNKNOWN'
                };
            }
        }
    }
};
