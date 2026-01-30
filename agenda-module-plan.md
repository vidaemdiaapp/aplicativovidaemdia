# Plano de Implementação: Módulo Agenda 🗓️

Este documento detalha o plano de orquestração para a criação do módulo modular de Agenda no app "Vida em Dia".

## 🛠️ Stack Técnica Selecionada
- **Data/Hora:** `date-fns` (versatilidade e suporte a timezones).
- **Recorrência:** `rrule` JS (compatibilidade iCal).
- **Backend:** Supabase (PostgreSQL + Edge Functions local).
- **Notificações:** Expo Push API.

---

## 🏗️ Fases de Orquestração

### Fase 1: Product/UX (Draft de Componentes & Fluxo)
- **Agente:** `product-manager` + `frontend-specialist`
- Criar a estrutura visual (mockup mental das telas Mês, Semana e Lista).
- Definir os estados de UI para o Modal de Criação Rápida.

### Fase 2: Backend/DB (Dados & Segurança)
- **Agente:** `database-architect` + `backend-specialist`
- Criar migrations para `calendar_tags`, `calendar_events` e `event_reminders`.
- Configurar Políticas RLS (Row Level Security).
- Criar função de banco para inicializar tags padrão para novos usuários.

### Fase 3: Mobile/Web UI (Implementação Responsiva)
- **Agente:** `frontend-specialist`
- Criar a camada `AgendaService.ts`.
- Implementar tela principal `AgendaScreen.tsx` (Tabs: Mês, Semana, Lista).
- Implementar Modal de Criação/Edição `EventModal.tsx`.
- Componentes de UI: `TagChip`, `TimeSelector`, `EventCard`.

### Fase 4: Scheduler/Infra (Dispatcher de Lembretes)
- **Agente:** `backend-specialist` + `devops-engineer`
- Criar Edge Function `agenda_reminder_dispatcher`.
- Implementar a lógica de busca de lembretes `scheduled` e envio via Expo Push.
- Abstração para futuro canal WhatsApp (Campo `channel` no schema).
- Registro de logs e tratamento de retries.

### Fase 5: QA & Finalização (Testes & Checklist)
- **Agente:** `test-engineer`
- Validar as regras de `end_at > start_at`.
- Testar a geração de eventos recorrentes no range visível.
- Verificação visual (Checklist UX Premium).

---

## 📑 Agenda de Trabalho Imediata
1. **Migrations das Tabelas.**
2. **AgendaService (CRUD básico).**
3. **Tela de Visão Mensal.**

---
Status: ⏳ Aguardando Início da Fase 1/2.
