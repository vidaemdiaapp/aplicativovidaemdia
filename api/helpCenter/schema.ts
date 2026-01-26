export interface HelpArticle {
    id: string;
    slug: string;
    title: string;
    category: 'getting_started' | 'features' | 'troubleshooting';
    content: string; // Markdown supported
    tags: string[];
}

export const HELP_CENTER_SCHEMA = {
    version: '1.0',
    categories: [
        { id: 'getting_started', label: 'Primeiros Passos' },
        { id: 'features', label: 'Funcionalidades' },
        { id: 'troubleshooting', label: 'Ajuda' }
    ]
};

// Example content for Agent RAG (Retrieval Augmented Generation)
export const INITIAL_ARTICLES: HelpArticle[] = [
    {
        id: '1',
        slug: 'como-delegar-tarefas',
        title: 'Como delegar uma tarefa?',
        category: 'features',
        tags: ['delegation', 'household', 'tasks'],
        content: 'Para delegar uma tarefa, clique no item desejado, vá até a seção "Responsável" e selecione o membro da casa.'
    },
    {
        id: '2',
        slug: 'como-convidar-parceiro',
        title: 'Como convidar meu parceiro?',
        category: 'getting_started',
        tags: ['invite', 'setup'],
        content: 'Vá em Configurações > Vida a Dois e clique em "Convidar Parceiro". Copie o link e envie para ele.'
    }
];
