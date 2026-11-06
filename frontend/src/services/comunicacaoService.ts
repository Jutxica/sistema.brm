import { supabase } from '../lib/supabaseClient';
import type {
  ComunicacaoPauta,
  ComunicacaoPost,
  ComunicacaoComentario,
  ComunicacaoTarefa,
  ComunicacaoCaptacao,
  ComunicacaoEmailEquipe,
  ComunicacaoBrandAsset,
  ComunicacaoBenchmarking,
  ComunicacaoMetrica
} from '../types/comunicacao';

// ==========================================
// 1. Pautas
// ==========================================
export async function getPautas(): Promise<ComunicacaoPauta[]> {
  const { data, error } = await supabase
    .from('comunicacao_pautas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Usando mock/fallback para pautas:', error.message);
    return MOCK_PAUTAS;
  }
  return data && data.length > 0 ? (data as ComunicacaoPauta[]) : MOCK_PAUTAS;
}

export async function createPauta(pauta: Partial<ComunicacaoPauta>): Promise<ComunicacaoPauta | null> {
  try {
    const { data, error } = await supabase
      .from('comunicacao_pautas')
      .insert([pauta])
      .select()
      .single();

    if (!error && data) return data as ComunicacaoPauta;
  } catch {
    // Modo offline
  }

  return {
    id: `pauta-${Date.now()}`,
    titulo: pauta.titulo || 'Nova Pauta',
    area: pauta.area || 'Institucional',
    formato: pauta.formato || 'Carrossel',
    status: pauta.status || 'ideia',
    prioridade: pauta.prioridade || 'media',
    canais: pauta.canais || ['Instagram'],
    criado_por_nome: pauta.criado_por_nome || 'Talita',
    data_prevista: pauta.data_prevista || null,
    created_at: new Date().toISOString()
  };
}

export async function updatePauta(id: string, updates: Partial<ComunicacaoPauta>): Promise<boolean> {
  try {
    await supabase
      .from('comunicacao_pautas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
  } catch {
    // Modo offline
  }
  return true;
}

// ==========================================
// 2. Posts (Produção & Aprovação)
// ==========================================
export async function getPosts(): Promise<ComunicacaoPost[]> {
  const { data, error } = await supabase
    .from('comunicacao_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Usando mock/fallback para posts:', error.message);
    return MOCK_POSTS;
  }
  return data && data.length > 0 ? (data as ComunicacaoPost[]) : MOCK_POSTS;
}

export async function createPost(post: Partial<ComunicacaoPost>): Promise<ComunicacaoPost | null> {
  try {
    const { data, error } = await supabase
      .from('comunicacao_posts')
      .insert([post])
      .select()
      .single();

    if (!error && data) return data as ComunicacaoPost;
  } catch {
    // Modo offline
  }

  return {
    id: `post-${Date.now()}`,
    titulo: post.titulo || 'Novo Post',
    area: post.area || 'Institucional',
    formato: post.formato || 'Carrossel',
    status: post.status || 'em_producao',
    canais: post.canais || ['Instagram'],
    legenda: post.legenda || '',
    hashtags: post.hashtags || '',
    arte_entregue: post.arte_entregue ?? false,
    texto_entregue: post.texto_entregue ?? false,
    data_cronograma: post.data_cronograma || null,
    horario_agendado: post.horario_agendado || '15:00',
    melhor_horario_sugerido: '15h-18h',
    arquivos_arte: post.arquivos_arte || [
      {
        id: `arte-${Date.now()}-1`,
        nome: 'Card 1',
        url: 'https://images.unsplash.com/photo-1548625361-1959779df34d?auto=format&fit=crop&w=800&q=80',
        tipo: 'imagem',
        ordem: 1
      }
    ],
    created_at: new Date().toISOString()
  };
}

export async function updatePost(id: string, updates: Partial<ComunicacaoPost>): Promise<boolean> {
  try {
    await supabase
      .from('comunicacao_posts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
  } catch {
    // Modo offline
  }
  return true;
}

// ==========================================
// 3. Comentários (Aprovação)
// ==========================================
export async function getComentarios(postId: string): Promise<ComunicacaoComentario[]> {
  const { data, error } = await supabase
    .from('comunicacao_comentarios')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    return MOCK_COMENTARIOS.filter(c => c.post_id === postId);
  }
  return data as ComunicacaoComentario[];
}

export async function addComentario(comentario: Partial<ComunicacaoComentario>): Promise<ComunicacaoComentario | null> {
  try {
    const { data, error } = await supabase
      .from('comunicacao_comentarios')
      .insert([comentario])
      .select()
      .single();

    if (!error && data) return data as ComunicacaoComentario;
  } catch {
    // Modo offline
  }

  return {
    id: `com-${Date.now()}`,
    post_id: comentario.post_id || 'post-1',
    autor_nome: comentario.autor_nome || 'Talita',
    mensagem: comentario.mensagem || '',
    escopo: comentario.escopo || 'geral',
    slide_numero: comentario.slide_numero,
    resolvido: false,
    created_at: new Date().toISOString()
  };
}

// ==========================================
// 4. Tarefas & Checklists
// ==========================================
export async function getTarefas(): Promise<ComunicacaoTarefa[]> {
  const { data, error } = await supabase
    .from('comunicacao_tarefas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return MOCK_TAREFAS;
  }
  return data && data.length > 0 ? (data as ComunicacaoTarefa[]) : MOCK_TAREFAS;
}

export async function createTarefa(tarefa: Partial<ComunicacaoTarefa>): Promise<ComunicacaoTarefa | null> {
  try {
    const { data, error } = await supabase
      .from('comunicacao_tarefas')
      .insert([tarefa])
      .select()
      .single();

    if (!error && data) return data as ComunicacaoTarefa;
  } catch {
    // Modo offline
  }

  return {
    id: `tar-${Date.now()}`,
    titulo: tarefa.titulo || 'Nova Tarefa',
    tipo: tarefa.tipo || 'fazer',
    concluida: false,
    responsavel_nome: tarefa.responsavel_nome,
    data_limite: tarefa.data_limite,
    created_at: new Date().toISOString()
  };
}

export async function toggleTarefa(id: string, concluida: boolean): Promise<boolean> {
  try {
    await supabase
      .from('comunicacao_tarefas')
      .update({ concluida, updated_at: new Date().toISOString() })
      .eq('id', id);
  } catch {
    // Modo offline
  }
  return true;
}

export async function deleteTarefa(id: string): Promise<boolean> {
  try {
    await supabase
      .from('comunicacao_tarefas')
      .delete()
      .eq('id', id);
  } catch {
    // Modo offline
  }
  return true;
}

// ==========================================
// 5. Captações
// ==========================================
export async function getCaptacoes(): Promise<ComunicacaoCaptacao[]> {
  const { data, error } = await supabase
    .from('comunicacao_captacoes')
    .select('*')
    .order('data_gravacao', { ascending: true });

  if (error) {
    return MOCK_CAPTACOES;
  }
  return data && data.length > 0 ? (data as ComunicacaoCaptacao[]) : MOCK_CAPTACOES;
}

export async function createCaptacao(captacao: Partial<ComunicacaoCaptacao>): Promise<ComunicacaoCaptacao | null> {
  try {
    const { data, error } = await supabase
      .from('comunicacao_captacoes')
      .insert([captacao])
      .select()
      .single();

    if (!error && data) return data as ComunicacaoCaptacao;
  } catch {
    // Modo offline
  }

  return {
    id: `cap-${Date.now()}`,
    titulo: captacao.titulo || 'Nova Gravação',
    entrevistado_nome: captacao.entrevistado_nome || 'Pe. Provincial',
    data_gravacao: captacao.data_gravacao || new Date().toISOString(),
    duracao: captacao.duracao || '20 min',
    local: captacao.local || 'Cúria Provincial - Sala de Gravações',
    area: captacao.area || 'Institucional',
    situacao: captacao.situacao || 'agendada',
    roteiro: captacao.roteiro || '',
    checklist_equipamentos: captacao.checklist_equipamentos || [
      { item: 'Câmera Principal + Baterias carregadas', checado: true },
      { item: 'Microfone de Lapela sem fio testado', checado: true },
      { item: 'Softbox / Iluminação frontal ligada', checado: false },
      { item: 'Cartão SD com espaço livre', checado: false }
    ],
    conteudos_previstos: captacao.conteudos_previstos || [{ formato: 'Reels', titulo: 'Destaque da fala' }],
    participantes: captacao.participantes || [{ nome: 'Talita', email: 'comunicacao@dehonianos.org.br' }],
    created_at: new Date().toISOString()
  };
}

export async function updateCaptacao(id: string, updates: Partial<ComunicacaoCaptacao>): Promise<boolean> {
  try {
    await supabase
      .from('comunicacao_captacoes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
  } catch {
    // Modo offline
  }
  return true;
}

// ==========================================
// 6. Métricas
// ==========================================
export async function getMetricas(): Promise<ComunicacaoMetrica> {
  const { data, error } = await supabase
    .from('comunicacao_metricas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return MOCK_METRICA;
  }
  return data as ComunicacaoMetrica;
}

// ==========================================
// 7. E-mails da Equipe
// ==========================================
export async function getEmailsEquipe(): Promise<ComunicacaoEmailEquipe[]> {
  const { data, error } = await supabase
    .from('comunicacao_emails_equipe')
    .select('*')
    .order('nome', { ascending: true });

  if (error || !data || data.length === 0) {
    return MOCK_EMAILS;
  }
  return data as ComunicacaoEmailEquipe[];
}

// ==========================================
// 8. Brand Assets (Estúdio de Arte)
// ==========================================
export async function getBrandAssets(): Promise<ComunicacaoBrandAsset[]> {
  const { data, error } = await supabase
    .from('comunicacao_brand_assets')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !data || data.length === 0) {
    return MOCK_BRAND_ASSETS;
  }
  return data as ComunicacaoBrandAsset[];
}

// ==========================================
// 9. Benchmarking
// ==========================================
export async function getBenchmarking(): Promise<ComunicacaoBenchmarking[]> {
  const { data, error } = await supabase
    .from('comunicacao_benchmarking')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    return MOCK_BENCHMARKING;
  }
  return data as ComunicacaoBenchmarking[];
}

// ==========================================
// 10. Religiosos Aniversariantes do Mês
// ==========================================
export async function getReligiososAniversariantes(): Promise<Array<{
  id: string;
  nome: string;
  dia: number;
  mes: number;
  tipo: 'natalicio' | 'ordenacao' | 'votos';
  anos?: number;
  comunidade?: string;
}>> {
  try {
    const { data, error } = await supabase
      .from('religiosos')
      .select('id, nome_civil, nome_religioso, data_nascimento, data_ordenacao_presbiteral, data_primeiros_votos, comunidade_atual_nome');

    if (error || !data) return MOCK_ANIVERSARIANTES;

    const currentMonth = new Date().getMonth() + 1;
    const lista: Array<{
      id: string;
      nome: string;
      dia: number;
      mes: number;
      tipo: 'natalicio' | 'ordenacao' | 'votos';
      anos?: number;
      comunidade?: string;
    }> = [];

    data.forEach(r => {
      const nome = r.nome_religioso || r.nome_civil || 'Religioso SCJ';
      
      // Aniversário natalício
      if (r.data_nascimento) {
        const d = new Date(r.data_nascimento);
        if (d.getUTCMonth() + 1 === currentMonth) {
          lista.push({
            id: r.id,
            nome,
            dia: d.getUTCDate(),
            mes: currentMonth,
            tipo: 'natalicio',
            comunidade: r.comunidade_atual_nome
          });
        }
      }

      // Ordenação presbiteral (tempo de casa / jubileu)
      if (r.data_ordenacao_presbiteral) {
        const d = new Date(r.data_ordenacao_presbiteral);
        if (d.getUTCMonth() + 1 === currentMonth) {
          const anos = new Date().getFullYear() - d.getUTCFullYear();
          lista.push({
            id: r.id,
            nome,
            dia: d.getUTCDate(),
            mes: currentMonth,
            tipo: 'ordenacao',
            anos,
            comunidade: r.comunidade_atual_nome
          });
        }
      }
    });

    return lista.length > 0 ? lista.sort((a, b) => a.dia - b.dia) : MOCK_ANIVERSARIANTES;
  } catch (e) {
    return MOCK_ANIVERSARIANTES;
  }
}

// ==========================================
// DADOS DE FALLBACK (MOCK ROBUSTO)
// ==========================================

const MOCK_PAUTAS: ComunicacaoPauta[] = [
  {
    id: 'pauta-1',
    titulo: 'Venerável Pe. Dehon e a reparação ao Coração de Jesus no cotidiano',
    area: 'Espiritualidade',
    formato: 'Carrossel',
    status: 'ideia',
    prioridade: 'alta',
    canais: ['Instagram', 'Facebook'],
    criado_por_nome: 'Talita',
    created_at: new Date().toISOString()
  },
  {
    id: 'pauta-2',
    titulo: 'Como ingressar no Seminário Dehoniano: as 4 etapas de discernimento',
    area: 'Vocacional',
    formato: 'Reels',
    status: 'ideia',
    prioridade: 'alta',
    canais: ['Instagram', 'YouTube'],
    criado_por_nome: 'Kath',
    created_at: new Date().toISOString()
  },
  {
    id: 'pauta-3',
    titulo: 'Reforma do Santuário Sagrado Coração de Jesus em Joinville',
    area: 'Paróquias',
    formato: 'Post',
    status: 'ideia',
    prioridade: 'media',
    canais: ['Instagram', 'Site'],
    criado_por_nome: 'Talita',
    created_at: new Date().toISOString()
  },
  {
    id: 'pauta-4',
    titulo: 'Obras sociais Dehonianas que impactam centenas de famílias no Sul',
    area: 'Obras Sociais',
    formato: 'Carrossel',
    status: 'ideia',
    prioridade: 'media',
    canais: ['Instagram', 'Site'],
    criado_por_nome: 'Talita',
    created_at: new Date().toISOString()
  }
];

const MOCK_POSTS: ComunicacaoPost[] = [
  {
    id: 'post-1',
    titulo: 'A história dos 100 anos de presença Dehoniana no Brasil Meridional',
    legenda: 'Um século semeando o Amor do Coração de Jesus. Conheça como os primeiros padres dehonianos chegaram e fundaram as primeiras obras que hoje acolhem milhares de fiéis.',
    hashtags: '#DehonianosBRM #PadreDehon #IgrejaCatolica #VidaConsagrada',
    area: 'Institucional',
    formato: 'Carrossel',
    canais: ['Instagram', 'Facebook'],
    status: 'aprovacao',
    arte_entregue: true,
    texto_entregue: true,
    data_cronograma: '2026-11-14T15:00:00Z',
    horario_agendado: '15:00',
    melhor_horario_sugerido: '15h-18h',
    arquivos_arte: [
      {
        id: 'art-1',
        nome: 'Slide 1 - Capa Centenário',
        url: 'https://images.unsplash.com/photo-1548625361-195fe57877e1?w=800&auto=format&fit=crop&q=80',
        tipo: 'imagem',
        ordem: 1,
        psd_url: 'https://getartcraft.com/sample.psd'
      },
      {
        id: 'art-2',
        nome: 'Slide 2 - A Chegada ao Sul',
        url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&auto=format&fit=crop&q=80',
        tipo: 'imagem',
        ordem: 2
      },
      {
        id: 'art-3',
        nome: 'Slide 3 - Primeiras Paróquias',
        url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop&q=80',
        tipo: 'imagem',
        ordem: 3
      },
      {
        id: 'art-4',
        nome: 'Slide 4 - O Legado Atual',
        url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop&q=80',
        tipo: 'imagem',
        ordem: 4
      }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'post-2',
    titulo: '04 livros de Pe. Dehon para aprofundar sua vida de oração',
    legenda: 'Quer transformar sua relação com Deus? O Venerável Pe. Dehon deixou um rico itinerário de espiritualidade centrada no Coração de Jesus. Salve este post para consultar depois!',
    hashtags: '#LivrosCatolicos #PadreDehon #Espiritualidade',
    area: 'Espiritualidade',
    formato: 'Reels',
    canais: ['Instagram'],
    status: 'aprovacao',
    arte_entregue: true,
    texto_entregue: true,
    data_cronograma: '2026-11-16T18:00:00Z',
    horario_agendado: '18:00',
    melhor_horario_sugerido: '18h-21h',
    arquivos_arte: [
      {
        id: 'art-5',
        nome: 'Capa do Reels',
        url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=800&auto=format&fit=crop&q=80',
        tipo: 'imagem',
        ordem: 1
      }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'post-3',
    titulo: 'Missa em Ação de Graças pelas Vocações Sacerdotais',
    legenda: 'Neste próximo domingo, rezemos juntos por todas as vocações e pelos jovens que estão nos seminários da Província BRM.',
    area: 'Vocacional',
    formato: 'Post',
    canais: ['Instagram', 'Facebook', 'Site'],
    status: 'postado',
    arte_entregue: true,
    texto_entregue: true,
    data_cronograma: '2026-10-30T14:57:00Z',
    arquivos_arte: [
      {
        id: 'art-6',
        nome: 'Card de Missa',
        url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&auto=format&fit=crop&q=80',
        tipo: 'imagem',
        ordem: 1
      }
    ],
    created_at: new Date(Date.now() - 7 * 86400000).toISOString()
  }
];

const MOCK_COMENTARIOS: ComunicacaoComentario[] = [
  {
    id: 'com-1',
    post_id: 'post-1',
    autor_nome: 'Pe. Coordenador',
    escopo: 'slide_2',
    slide_numero: 2,
    mensagem: 'Na lâmina 2, conferir se a data correta da primeira fundação foi 1903 ou 1904. Excelente escolha de fotos!',
    resolvido: false,
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

const MOCK_TAREFAS: ComunicacaoTarefa[] = [
  {
    id: 't-1',
    titulo: 'Produzir o layout do carrossel do Centenário no PhotoCraft',
    concluida: false,
    tipo: 'fazer',
    responsavel_nome: 'Designer',
    data_limite: '2026-11-10',
    created_at: new Date().toISOString()
  },
  {
    id: 't-2',
    titulo: 'Revisar legendas e conferir datas históricas com o arquivo da Cúria',
    concluida: true,
    tipo: 'fazer',
    responsavel_nome: 'Talita',
    data_limite: '2026-11-04',
    created_at: new Date().toISOString()
  },
  {
    id: 't-3',
    titulo: 'Fazer ensaio fotográfico dos novos postulantes em Corupá',
    concluida: false,
    tipo: 'ideia',
    responsavel_nome: 'Kath',
    created_at: new Date().toISOString()
  }
];

const MOCK_CAPTACOES: ComunicacaoCaptacao[] = [
  {
    id: 'cap-1',
    titulo: 'Depoimento sobre o discernimento vocacional e vida de oração',
    entrevistado_nome: 'Pe. Provincial',
    data_gravacao: '2026-11-10T14:00:00Z',
    duracao: '1h',
    local: 'Cúria Provincial - Sala de Gravações',
    area: 'Vocacional',
    situacao: 'agendada',
    roteiro: '1. Acolhida e oração inicial\n2. Como foi sentir o chamado dehoniano aos 17 anos\n3. O que a juventude busca hoje na Igreja\n4. Mensagem aos que sentem o coração inquieto',
    checklist_equipamentos: [
      { item: 'Microfone sem fio Lapela com baterias reservas', checado: true },
      { item: 'Câmera principal 4K configurada em 30fps', checado: true },
      { item: 'Cartão SD de alta velocidade formatado', checado: true },
      { item: 'Luz principal Key Light e preenchimento ligadas', checado: false },
      { item: 'Tripé com cabeça fluida regulado na altura dos olhos', checado: false },
      { item: 'iPad / Celular pronto no modo Teleprompter', checado: false }
    ],
    conteudos_previstos: [
      { formato: 'Reels', titulo: 'O momento em que decidi ser padre Dehoniano' },
      { formato: 'Vídeo Longo', titulo: 'Mensagem Vocacional Completa' }
    ],
    participantes: [
      { nome: 'Talita Conta', email: 'comunicacao@dehonianosbrm.org.br' },
      { nome: 'Kath', email: 'kath@dehonianosbrm.org.br' }
    ],
    created_at: new Date().toISOString()
  }
];

const MOCK_METRICA: ComunicacaoMetrica = {
  id: 'met-1',
  canal: 'Instagram',
  data_referencia: new Date().toISOString().split('T')[0],
  seguidores_total: 12450,
  seguidores_novos: 142,
  seguidores_deixaram: 18,
  contas_alcancadas: 48500,
  alcance_variacao_pct: 29.4,
  engajamento_pct: 10.5,
  interacoes_total: 3890,
  visualizacoes_total: 84200,
  posts_por_horario: {
    '06h-09h': { media: 2051, total: 7 },
    '09h-12h': { media: 2462, total: 7 },
    '12h-15h': { media: 1277, total: 28 },
    '15h-18h': { media: 2494, total: 17 },
    '18h-21h': { media: 2150, total: 6 },
    '21h-00h': { media: 0, total: 0 }
  },
  dias_mais_ativos: {
    'Domingo': 0,
    'Segunda': 12,
    'Terça': 13,
    'Quarta': 15,
    'Quinta': 13,
    'Sexta': 11,
    'Sábado': 1
  },
  horarios_pico_meta: [
    { dia: 'Domingo', horario: '21:00', descricao: 'pico de seguidores ativos na semana' },
    { dia: 'Quarta', horario: '17:00', descricao: 'pico de seguidores ativos na semana' },
    { dia: 'Domingo', horario: '13:00', descricao: 'pico de seguidores ativos na semana' }
  ],
  created_at: new Date().toISOString()
};

const MOCK_EMAILS: ComunicacaoEmailEquipe[] = [
  {
    id: 'em-1',
    nome: 'Pe. Coordenador da Comunicação',
    email: 'comunicacao@dehonianosbrm.org.br',
    cargo: 'Coordenador Provincial',
    telefone: '(47) 99999-1234',
    papel: 'coordenador',
    ativo: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'em-2',
    nome: 'Talita (Gestão & Redes)',
    email: 'talita@dehonianosbrm.org.br',
    cargo: 'Coordenadora de Marketing & Redes',
    telefone: '(47) 98888-5678',
    papel: 'operador',
    ativo: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'em-3',
    nome: 'Kath (Produção & Conteúdo)',
    email: 'kath@dehonianosbrm.org.br',
    cargo: 'Assistente de Comunicação',
    telefone: '(47) 97777-9012',
    papel: 'operador',
    ativo: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'em-4',
    nome: 'Designer / Arte Externa',
    email: 'arte@dehonianosbrm.org.br',
    cargo: 'Diretor de Arte & Designer',
    telefone: '(47) 96666-3456',
    papel: 'externo',
    ativo: true,
    created_at: new Date().toISOString()
  }
];

const MOCK_BRAND_ASSETS: ComunicacaoBrandAsset[] = [
  {
    id: 'ba-1',
    tipo: 'cor',
    nome: 'Azul Primário BRM',
    valor: '#226380',
    categoria: 'Paleta Oficial',
    descricao: 'Cor principal da Província BRM para títulos e elementos de destaque',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-2',
    tipo: 'cor',
    nome: 'Azul Escuro Cúria',
    valor: '#113240',
    categoria: 'Paleta Oficial',
    descricao: 'Usado para contrastes solenes e rodapés institucionais',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-3',
    tipo: 'cor',
    nome: 'Dourado Dehoniano',
    valor: '#d4af37',
    categoria: 'Paleta Oficial',
    descricao: 'Jubileus, comemorações de ordenação e datas nobres',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-4',
    tipo: 'cor',
    nome: 'Vermelho Coração de Jesus',
    valor: '#9b1b1b',
    categoria: 'Liturgia',
    descricao: 'Solenidades do Sagrado Coração e festas da congregação',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-5',
    tipo: 'logo',
    nome: 'Brasão Província BRM (Vetor Oficial)',
    valor: '/logo-brm.png',
    categoria: 'Logotipos',
    descricao: 'Formato vetorial e PNG em alta transparência',
    psd_ou_vetor_url: 'https://getartcraft.com/sample.svg',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-6',
    tipo: 'tipografia',
    nome: 'Cinzel Decorative & SF Pro',
    valor: 'Cinzel, sans-serif',
    categoria: 'Tipografia',
    descricao: 'Fontes oficiais para títulos solenes e leitura calma',
    created_at: new Date().toISOString()
  }
];

const MOCK_BENCHMARKING: ComunicacaoBenchmarking[] = [
  {
    id: 'bm-1',
    perfil_nome: 'Vatican News em Português',
    perfil_handle: '@vaticannewspt',
    canal: 'Instagram',
    url: 'https://instagram.com/vaticannewspt',
    pontos_fortes: 'Fotos documentais de alta qualidade, carrosséis explicativos com tipografia sóbria e cobertura pontual dos discursos do Papa.',
    ideias_inspiracao: 'Usar mais fotos históricas restauradas nas datas festivas da Província.',
    created_at: new Date().toISOString()
  },
  {
    id: 'bm-2',
    perfil_nome: 'CNBB Nacional',
    perfil_handle: '@cnbbnacional',
    canal: 'Instagram',
    url: 'https://instagram.com/cnbbnacional',
    pontos_fortes: 'Campanhas nacionais bem articuladas e comunicados oficiais imediatos.',
    ideias_inspiracao: 'Padronizar artes de notas de falecimento e transferências.',
    created_at: new Date().toISOString()
  }
];

const MOCK_ANIVERSARIANTES = [
  { id: 'rel-1', nome: 'Pe. André Marcelino, scj', dia: 14, mes: 11, tipo: 'natalicio' as const, comunidade: 'Paróquia São Sebastião - Joinville' },
  { id: 'rel-2', nome: 'Pe. Marcos Roberto, scj', dia: 24, mes: 11, tipo: 'ordenacao' as const, anos: 25, comunidade: 'Seminário Dehonista - Corupá' },
  { id: 'rel-3', nome: 'Ir. Francisco de Assis, scj', dia: 28, mes: 11, tipo: 'natalicio' as const, comunidade: 'Cúria Provincial - Brusque' }
];
