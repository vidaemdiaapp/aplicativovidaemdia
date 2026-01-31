# 🦁 IRPF Complete Overhaul - Plano de Implementação

> **Data**: 2026-01-30
> **Status**: 🟡 Em Andamento
> **Prioridade**: Alta
> **Tipo**: COMPLEX CODE - Multi-módulo

---

## 📌 Objetivo

Reformular completamente o módulo de Imposto de Renda do Vida em Dia para:

1. **Escaneamento inteligente** de notas fiscais para dedução (OCR via Gemini Vision)
2. **Upload manual** de documentos com pasta fiscal organizada
3. **Diferenciação completa** entre regras IR 2025 vs 2026
4. **Seletor de ano fiscal** no topo da página
5. **Integração total** com Elara (rendas, patrimônios, deduções, cálculos)
6. **Suporte a MEI e Autônomos** (diferenciação tributária)
7. **Geração de PDF consolidado** para download/entrega

---

## 🏗️ Arquitetura de Implementação

### Fase 1: Knowledge Base & Regras Fiscais ✅
- [x] 1.1 Criar `tax_knowledge/2025/` com regras corretas de 2025
- [x] 1.2 Atualizar `tax_knowledge/2026/` com mudanças de 2026
- [x] 1.3 Criar tabelas de alíquotas para ambos os anos
- [x] 1.4 Documentar regras MEI e Autônomos
- [x] 1.5 Criar comparativo 2025 vs 2026

### Fase 2: Schema de Banco de Dados ✅
- [x] 2.1 Criar tabela `tax_documents` para arquivos fiscais
- [x] 2.2 Criar bucket `fiscal-documents` no Storage
- [x] 2.3 Adicionar campo `selected_tax_year` no profile
- [x] 2.4 Adicionar campo `taxpayer_type` no profile
- [x] 2.5 Criar políticas RLS para documentos fiscais

### Fase 3: Backend - Edge Functions ✅
- [x] 3.1 Criar `analyze_tax_document_v1` (OCR + classificação)
- [x] 3.2 Atualizar `smart_chat_v1` com contexto de ano selecionado
- [x] 3.3 Criar tool `compare_tax_years` para Elara
- [x] 3.4 Criar tool `get_mei_tax` para Elara
- [x] 3.5 Criar tool `get_tax_deductible_documents` para Elara

### Fase 4: Frontend - Services & Hooks ✅
- [x] 4.1 Criar `services/tax_documents.ts`
- [x] 4.2 Atualizar `services/tax_calculator.ts` com 2025/2026
- [ ] 4.3 Criar `hooks/useTaxYear.ts` (contexto global) - OPCIONAL
- [x] 4.4 Componentes usam estado local de ano

### Fase 5: Frontend - UI Components ✅
- [x] 5.1 Criar `TaxYearSelector` component
- [x] 5.2 Criar `TaxDocumentUpload` component (OCR inteligente)
- [x] 5.3 Criar `TaxDocumentsList` component (pasta fiscal)
- [x] 5.4 Atualizar `TaxDeclarationScreen` com seletor de ano
- [x] 5.5 Banner de comparação 2025 vs 2026

### Fase 6: Integração Elara ✅
- [x] 6.1 Atualizar SYSTEM_PROMPT com regras 2025/2026
- [x] 6.2 Adicionar tools para cálculo e comparação
- [x] 6.3 Regras fiscais embedded no prompt
- [x] 6.4 Tools para MEI e documentos dedutíveis

---

## 📊 Regras Fiscais - Comparativo

### IR 2025 (Ano-Calendário 2024)
```
Faixa de Isenção: R$ 2.259,20/mês (R$ 27.110,40/ano)
Tabela Progressiva:
- Até R$ 2.259,20: Isento
- R$ 2.259,21 a R$ 2.826,65: 7,5% (dedução R$ 169,44)
- R$ 2.826,66 a R$ 3.751,05: 15% (dedução R$ 381,44)
- R$ 3.751,06 a R$ 4.664,68: 22,5% (dedução R$ 662,77)
- Acima de R$ 4.664,68: 27,5% (dedução R$ 896,00)

Dedução por Dependente: R$ 2.275,08/ano
Limite Educação: R$ 3.561,50/ano
Desconto Simplificado: até R$ 16.754,34
```

### IR 2026 (Ano-Calendário 2025) - NOVAS REGRAS
```
Faixa de Isenção: R$ 2.428,80/mês (R$ 60.000,00/ano - NOVA REGRA!)
Redutor Gradual: R$ 60.000 a R$ 88.200 (faixa de transição)
Tabela Progressiva:
- Até R$ 2.428,80: Isento
- R$ 2.428,81 a R$ 2.826,65: 7,5% (dedução R$ 182,16)
- R$ 2.826,66 a R$ 3.751,05: 15% (dedução R$ 394,16)
- R$ 3.751,06 a R$ 4.664,68: 22,5% (dedução R$ 675,49)
- Acima de R$ 4.664,68: 27,5% (dedução R$ 908,73)

Dedução por Dependente: R$ 2.275,08/ano
Limite Educação: R$ 3.561,50/ano
Desconto Simplificado: até R$ 17.640,00
```

### MEI (Microempreendedor Individual)
```
Faturamento Anual Limite: R$ 81.000,00
Tributação: DAS Fixo (INSS + ICMS/ISS)
Declaração: DASN-SIMEI (até 31 de maio)
IR sobre: Percentual do faturamento conforme atividade
- Comércio: 8% do faturamento
- Indústria: 8% do faturamento  
- Serviços: 32% do faturamento
- Transporte: 16% do faturamento
```

### Autônomo (RPA)
```
Tributação: Carnê-Leão mensal
Alíquotas: Tabela progressiva normal
Deduções: Livro-caixa (despesas profissionais)
```

---

## 📁 Estrutura de Arquivos

```
tax_knowledge/
├── 2025/
│   ├── fundamentals.md
│   ├── brackets.md
│   ├── deductions.md
│   ├── mei_rules.md
│   ├── autonomo_rules.md
│   └── qa_map.json
├── 2026/
│   ├── fundamentals.md (atualizar)
│   ├── brackets.md (criar)
│   ├── deductions.md (atualizar)
│   ├── mei_rules.md (criar)
│   ├── autonomo_rules.md (criar)
│   ├── changes_from_2025.md (criar)
│   └── qa_map.json (atualizar)

components/
├── TaxYearSelector.tsx (criar)
├── TaxDocumentUpload.tsx (criar)
├── TaxDocumentsList.tsx (criar)
├── TaxComparison2025vs2026.tsx (criar)
└── TaxPayerTypeSelector.tsx (criar)

services/
├── tax_documents.ts (criar)
├── tax_calculator.ts (atualizar para multi-ano)
└── tax_deductions.ts (atualizar com ano)

supabase/functions/
├── analyze_tax_document_v1/ (criar)
├── generate_fiscal_pdf_v1/ (criar)
└── smart_chat_v1/ (atualizar)
```

---

## 🔄 Ordem de Execução

1. **Knowledge Base** → Criar arquivos 2025 + atualizar 2026
2. **Database** → Migrations para novas tabelas e campos
3. **Tax Calculator** → Dual-year support (2025/2026)
4. **Edge Function OCR** → analyze_tax_document_v1
5. **Frontend Services** → tax_documents.ts
6. **UI Components** → Seletor de ano + Upload inteligente
7. **TaxDeclarationScreen** → Integração completa
8. **Elara Integration** → smart_chat_v1 com multi-ano
9. **PDF Generation** → generate_fiscal_pdf_v1
10. **Testing & Polish**

---

## ✅ Critérios de Aceite

- [ ] Usuário pode selecionar ano fiscal (2025 ou 2026)
- [ ] Sistema aplica regras corretas conforme ano selecionado
- [ ] Elara responde corretamente sobre diferenças 2025/2026
- [ ] Upload de notas fiscais com OCR que identifica se é dedutível
- [ ] Pasta fiscal com todos os documentos organizados
- [ ] Geração de PDF consolidado para download
- [ ] Suporte a MEI e Autônomos
- [ ] Cálculo integrado com rendas, patrimônios e deduções
- [ ] Comparativo 2025 vs 2026 disponível

---

## 📝 Notas de Implementação

- Usar Gemini Vision para OCR de documentos
- Armazenar documentos no Supabase Storage bucket `fiscal-documents`
- Manter compatibilidade retroativa com dados existentes
- Cache de respostas da Elara por ano fiscal
