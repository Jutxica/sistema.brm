import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, CheckSquare, Calendar, FolderPlus, Kanban, 
  Palette, Video, Mail, Gift, CheckCircle2, Send, Grid3X3, 
  BarChart2, Search, Plus, UserCheck, Layers, FileText, Users,
  Clock, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as servico from '../services/comunicacaoService';
import type { 
  ComunicacaoPauta, 
  ComunicacaoPost, 
  ComunicacaoTarefa, 
  ComunicacaoCaptacao,
  ComunicacaoEmailEquipe,
  ComunicacaoBrandAsset,
  ComunicacaoBenchmarking,
  ComunicacaoMetrica,
  ReligiosoConteudo,
  ObraResumoComunicacao,
  AniversarianteProvincia
} from '../types/comunicacao';

// Subvisões Modulares
import { VisaoGeralView } from './comunicacao/VisaoGeralView';
import { BancoPautasView } from './comunicacao/BancoPautasView';
import { ProducaoKanbanView } from './comunicacao/ProducaoKanbanView';
import { AprovacaoView } from './comunicacao/AprovacaoView';
import { CronogramaView } from './comunicacao/CronogramaView';
import { TarefasView } from './comunicacao/TarefasView';
import { EstudioArteView } from './comunicacao/EstudioArteView';
import { CaptacaoView } from './comunicacao/CaptacaoView';
import { AniversariantesView } from './comunicacao/AniversariantesView';
import { ProgramarPostsView } from './comunicacao/ProgramarPostsView';
import { PreviaFeedView } from './comunicacao/PreviaFeedView';
import { InstagramAnalyticsView } from './comunicacao/InstagramAnalyticsView';
import { BenchmarkingView } from './comunicacao/BenchmarkingView';
import { EmailsEquipeView } from './comunicacao/EmailsEquipeView';
import { ReligiososConteudoView } from './comunicacao/ReligiososConteudoView';

// Modais
import { ArtCraftModal } from './comunicacao/ArtCraftModal';
import { NovoConteudoModal } from './comunicacao/NovoConteudoModal';

interface ItemNavegacao {
  id: string;
  label: string;
  icon: any;
  badge?: number;
  badgeColor?: string;
}

interface GrupoNavegacao {
  titulo: string;
  itens: ItemNavegacao[];
}

export const ComunicacaoAdmin: React.FC = () => {
  const { user } = useAuth();
  const usuarioNome = user?.nome || 'Talita';

  const [activeTab, setActiveTab] = useState<string>('visao_geral');
  const [buscaTexto, setBuscaTexto] = useState<string>('');

  // Estados de Dados Principais
  const [pautas, setPautas] = useState<ComunicacaoPauta[]>([]);
  const [posts, setPosts] = useState<ComunicacaoPost[]>([]);
  const [tarefas, setTarefas] = useState<ComunicacaoTarefa[]>([]);
  const [captacoes, setCaptacoes] = useState<ComunicacaoCaptacao[]>([]);
  const [metricas, setMetricas] = useState<ComunicacaoMetrica | null>(null);
  const [emails, setEmails] = useState<ComunicacaoEmailEquipe[]>([]);
  const [brandAssets, setBrandAssets] = useState<ComunicacaoBrandAsset[]>([]);
  const [benchmarks, setBenchmarks] = useState<ComunicacaoBenchmarking[]>([]);
  const [aniversariantes, setAniversariantes] = useState<AniversarianteProvincia[]>([]);
  const [religiosos, setReligiosos] = useState<ReligiosoConteudo[]>([]);
  const [obras, setObras] = useState<ObraResumoComunicacao[]>([]);
  const [comentarios, setComentarios] = useState<Record<string, any[]>>({});

  // Estados de Modais
  const [modalNovoConteudo, setModalNovoConteudo] = useState<{
    aberto: boolean;
    tipo: 'pauta' | 'post';
    dataInicial?: string;
    religiosoInicial?: ReligiosoConteudo;
  }>({ aberto: false, tipo: 'post' });

  const [modalArtCraft, setModalArtCraft] = useState<{
    aberto: boolean;
    tipo: 'photocraft' | 'vectorcraft';
    arquivoUrl?: string;
    arquivoNome?: string;
  }>({ aberto: false, tipo: 'photocraft' });

  // Carregamento Inicial
  useEffect(() => {
    async function carregarDados() {
      const [
        pautasData,
        postsData,
        tarefasData,
        captacoesData,
        metricasData,
        emailsData,
        assetsData,
        benchData,
        anivData,
        religiososData,
        obrasData
      ] = await Promise.all([
        servico.getPautas(),
        servico.getPosts(),
        servico.getTarefas(),
        servico.getCaptacoes(),
        servico.getMetricas(),
        servico.getEmailsEquipe(),
        servico.getBrandAssets(),
        servico.getBenchmarking(),
        servico.getReligiososAniversariantes(),
        servico.getReligiososParaConteudo(),
        servico.getObrasParaComunicacao()
      ]);

      setPautas(pautasData);
      setPosts(postsData);
      setTarefas(tarefasData);
      setCaptacoes(captacoesData);
      setMetricas(metricasData);
      setEmails(emailsData);
      setBrandAssets(assetsData);
      setBenchmarks(benchData);
      setAniversariantes(anivData);
      setReligiosos(religiososData);
      setObras(obrasData);

      // Carregar comentários do primeiro post
      if (postsData.length > 0) {
        const coms = await servico.getComentarios(postsData[0].id);
        setComentarios({ [postsData[0].id]: coms });
      }
    }

    carregarDados();
  }, []);

  // Handlers de Pautas e Posts
  const handleCriarPauta = async (novaPauta: Partial<ComunicacaoPauta>) => {
    const criada = await servico.createPauta(novaPauta);
    if (criada) setPautas(prev => [criada, ...prev]);
  };

  const handleCriarPost = async (novoPost: Partial<ComunicacaoPost>) => {
    const criado = await servico.createPost(novoPost);
    if (criado) setPosts(prev => [criado, ...prev]);
  };

  const handleAvancarStatusPost = async (post: ComunicacaoPost) => {
    const proximoStatusMap: Record<string, 'em_producao' | 'aprovacao' | 'aprovado' | 'programado' | 'postado'> = {
      'em_producao': 'aprovacao',
      'aprovacao': 'aprovado',
      'aprovado': 'programado',
      'programado': 'postado'
    };

    const prox = proximoStatusMap[post.status];
    if (prox) {
      const ok = await servico.updatePost(post.id, { status: prox });
      if (ok) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: prox } : p));
      }
    }
  };

  const handleAprovarPost = async (postId: string) => {
    const ok = await servico.updatePost(postId, { 
      status: 'aprovado', 
      aprovado_por_nome: usuarioNome, 
      aprovado_em: new Date().toISOString() 
    });
    if (ok) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'aprovado' } : p));
    }
  };

  const handlePedirAjustes = async (postId: string) => {
    const ok = await servico.updatePost(postId, { status: 'em_producao' });
    if (ok) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'em_producao' } : p));
    }
  };

  const handleAdicionarComentarioPost = async (postId: string, mensagem: string, escopo: string, slideNum?: number) => {
    const criado = await servico.addComentario({
      post_id: postId,
      autor_nome: usuarioNome,
      mensagem,
      escopo,
      slide_numero: slideNum,
      resolvido: false
    });

    if (criado) {
      setComentarios(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), criado]
      }));
    }
  };

  // Handlers de Captação e Comentários de Gravação
  const handleAdicionarComentarioCaptacao = async (captacaoId: string, texto: string) => {
    const ok = await servico.addComentarioCaptacao(captacaoId, usuarioNome, texto);
    if (ok) {
      setCaptacoes(prev => prev.map(c => {
        if (c.id === captacaoId) {
          const novoCom = {
            id: `com-${Date.now()}`,
            autor_nome: usuarioNome,
            mensagem: texto,
            created_at: new Date().toISOString()
          };
          return {
            ...c,
            comentarios: [...(c.comentarios || []), novoCom]
          };
        }
        return c;
      }));
    }
  };

  // Handlers de Tarefas
  const handleCriarTarefa = async (tarefa: Partial<ComunicacaoTarefa>) => {
    const criada = await servico.createTarefa(tarefa);
    if (criada) setTarefas(prev => [criada, ...prev]);
  };

  const handleToggleTarefa = async (id: string, concluida: boolean) => {
    const ok = await servico.toggleTarefa(id, concluida);
    if (ok) {
      setTarefas(prev => prev.map(t => t.id === id ? { ...t, concluida } : t));
    }
  };

  const handleDeletarTarefa = async (id: string) => {
    const ok = await servico.deleteTarefa(id);
    if (ok) {
      setTarefas(prev => prev.filter(t => t.id !== id));
    }
  };

  // Handlers de Brand Assets
  const handleAdicionarBrandAsset = async (novo: Partial<ComunicacaoBrandAsset>) => {
    const criado = await servico.createBrandAsset(novo);
    if (criado) {
      setBrandAssets(prev => [criado, ...prev]);
    }
    return criado;
  };

  const handleExcluirBrandAsset = async (id: string) => {
    const ok = await servico.deleteBrandAsset(id);
    if (ok) {
      setBrandAssets(prev => prev.filter(a => a.id !== id));
    }
    return ok;
  };

  // Contadores para Badges no Menu
  const countAprovacao = posts.filter(p => p.status === 'aprovacao').length;
  const countPautas = pautas.filter(p => p.status === 'ideia').length;
  const countCaptacao = captacoes.filter(c => c.situacao === 'agendada').length;
  const countTarefasMinhas = tarefas.filter(t => {
    if (t.concluida || t.tipo !== 'fazer') return false;
    const resp = (t.responsavel_nome || '').toLowerCase();
    const me = usuarioNome.toLowerCase().split(' ')[0];
    return resp.includes(me) || resp === 'geral';
  }).length;

  // Organização dos Menus por Blocos Lógicos Operacionais
  const gruposNavegacao: GrupoNavegacao[] = [
    {
      titulo: 'Painel Central',
      itens: [
        { id: 'visao_geral', label: 'Visão geral', icon: LayoutDashboard }
      ]
    },
    {
      titulo: 'Planejamento & Confrades',
      itens: [
        { id: 'banco_pautas', label: 'Banco de pautas', icon: FolderPlus, badge: countPautas },
        { id: 'cronograma', label: 'Cronograma editorial', icon: Calendar },
        { id: 'religiosos_conteudo', label: 'Religiosos da Província', icon: Users, badge: religiosos.length },
        { id: 'aniversariantes', label: 'Aniversários & jubileus', icon: Gift }
      ]
    },
    {
      titulo: 'Criação & Mídia',
      itens: [
        { id: 'producao', label: 'Produção (Kanban)', icon: Kanban },
        { id: 'estudio_arte', label: 'Estúdio de arte', icon: Palette },
        { id: 'captacao', label: 'Captações de vídeo', icon: Video, badge: countCaptacao }
      ]
    },
    {
      titulo: 'Aprovação & Publicação',
      itens: [
        { id: 'aprovacao', label: 'Fila de aprovação', icon: CheckCircle2, badge: countAprovacao, badgeColor: 'bg-amber-600' },
        { id: 'previa_feed', label: 'Prévia do feed', icon: Grid3X3 },
        { id: 'programar', label: 'Programar posts', icon: Send }
      ]
    },
    {
      titulo: 'Equipe & Produtividade',
      itens: [
        { id: 'tarefas', label: 'Tarefas & responsáveis', icon: CheckSquare, badge: countTarefasMinhas },
        { id: 'emails_equipe', label: 'Contatos da equipe', icon: Mail }
      ]
    },
    {
      titulo: 'Inteligência & Métricas',
      itens: [
        { id: 'analise_instagram', label: 'Métricas do Instagram', icon: BarChart2 },
        { id: 'benchmarking', label: 'Benchmarking', icon: Search }
      ]
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#f4f6f5] dark:bg-[#141a1c]">
      {/* Navegação Lateral da Central de Comunicação */}
      <aside className="w-64 bg-[#112338] text-white shrink-0 hidden md:flex flex-col justify-between select-none border-r border-[#1a3452]">
        <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-70px)]">
          {/* Logo / Título da Província */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center p-1.5">
              <img src="/logo-branco.png" alt="BRM" className="max-h-full object-contain" />
            </div>
            <div>
              <span className="text-xs font-semibold block text-white">Província BRM</span>
              <span className="text-xs text-white/70 block">Central de Comunicação</span>
            </div>
          </div>

          {/* Menus Agrupados Logicamente */}
          {gruposNavegacao.map((grupo, gIdx) => (
            <div key={gIdx} className={`space-y-1 ${gIdx > 0 ? 'pt-2 border-t border-white/10' : ''}`}>
              <span className="text-xs font-semibold text-white/50 px-3 block mb-1">
                {grupo.titulo}
              </span>

              {grupo.itens.map(item => {
                const Icon = item.icon;
                const ativo = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      ativo
                        ? 'bg-white/15 text-white font-semibold'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 opacity-80 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {Boolean(item.badge && item.badge > 0) && (
                      <span className={`text-xs px-1.5 py-0.2 rounded text-white shrink-0 ml-1 ${item.badgeColor || 'bg-white/20'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-white/10 flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-[#226380] text-white flex items-center justify-center font-semibold text-xs shrink-0">
            {usuarioNome.charAt(0)}
          </div>
          <div className="truncate">
            <span className="text-xs font-semibold block text-white truncate">{usuarioNome}</span>
            <span className="text-xs text-white/60 block">Comunicação BRM</span>
          </div>
        </div>
      </aside>

      {/* Área Central Principal do Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Barra Superior */}
        <header className="h-14 border-b border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#1c2427] px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-medium text-[#52636a] dark:text-[#a0aeaf]">
            <span>Central de Comunicação</span>
            <span>/</span>
            <span className="text-[#113240] dark:text-white font-semibold capitalize">
              {activeTab.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Campo de Busca Rápida */}
            <div className="relative hidden sm:block w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={buscaTexto}
                onChange={e => setBuscaTexto(e.target.value)}
                placeholder="Buscar pautas, legendas..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#226380]"
              />
            </div>

            <button
              type="button"
              onClick={() => setModalNovoConteudo({ aberto: true, tipo: 'post' })}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo conteúdo</span>
            </button>
          </div>
        </header>

        {/* View Ativa */}
        <div className="p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'visao_geral' && (
            <VisaoGeralView
              usuarioNome={usuarioNome}
              posts={posts}
              tarefas={tarefas}
              captacoes={captacoes}
              aniversariantes={aniversariantes}
              religiosos={religiosos}
              onNavegarTab={tab => setActiveTab(tab)}
              onAbrirNovoConteudo={(tipo, dataIso) => setModalNovoConteudo({ aberto: true, tipo: tipo || 'post', dataInicial: dataIso })}
              onAprovarPost={handleAprovarPost}
              onPedirAjustes={handlePedirAjustes}
              onToggleTarefa={handleToggleTarefa}
              onCriarHomenagemReligioso={rel => {
                setModalNovoConteudo({
                  aberto: true,
                  tipo: 'post',
                  dataInicial: new Date().toISOString().split('T')[0],
                  religiosoInicial: rel
                });
              }}
            />
          )}

          {activeTab === 'banco_pautas' && (
            <BancoPautasView
              pautas={pautas}
              onCriarPauta={handleCriarPauta}
              onEnviarParaProducao={pauta => {
                handleCriarPost({
                  pauta_id: pauta.id,
                  titulo: pauta.titulo,
                  area: pauta.area,
                  formato: pauta.formato,
                  canais: pauta.canais,
                  status: 'em_producao',
                  arte_entregue: false,
                  texto_entregue: false,
                  arquivos_arte: []
                });
                setActiveTab('producao');
              }}
            />
          )}

          {activeTab === 'religiosos_conteudo' && (
            <ReligiososConteudoView
              religiosos={religiosos}
              posts={posts}
              captacoes={captacoes}
              pautas={pautas}
              onCriarPostComReligioso={rel => {
                setModalNovoConteudo({
                  aberto: true,
                  tipo: 'post',
                  dataInicial: new Date().toISOString().split('T')[0],
                  religiosoInicial: rel
                });
              }}
              onAgendarCaptacaoComReligioso={() => {
                setActiveTab('captacao');
              }}
            />
          )}

          {activeTab === 'producao' && (
            <ProducaoKanbanView
              posts={posts}
              onAvancarStatus={handleAvancarStatusPost}
              onAbrirPost={post => {
                if (post.status === 'aprovacao') setActiveTab('aprovacao');
                else if (post.status === 'aprovado') setActiveTab('programar');
              }}
            />
          )}

          {activeTab === 'aprovacao' && (
            <AprovacaoView
              posts={posts}
              comentarios={comentarios}
              onAprovar={handleAprovarPost}
              onPedirAjustes={handlePedirAjustes}
              onAdicionarComentario={handleAdicionarComentarioPost}
              onAbrirPhotoCraft={(url, nome) => setModalArtCraft({
                aberto: true,
                tipo: 'photocraft',
                arquivoUrl: url,
                arquivoNome: nome
              })}
            />
          )}

          {activeTab === 'cronograma' && (
            <CronogramaView
              posts={posts}
              captacoes={captacoes}
              aniversariantes={aniversariantes}
              onAbrirNovoConteudo={dataIso => setModalNovoConteudo({ aberto: true, tipo: 'post', dataInicial: dataIso })}
              onAbrirPost={() => setActiveTab('producao')}
            />
          )}

          {activeTab === 'tarefas' && (
            <TarefasView
              tarefas={tarefas}
              equipe={emails}
              usuarioNome={usuarioNome}
              onCriarTarefa={handleCriarTarefa}
              onToggleTarefa={handleToggleTarefa}
              onDeletarTarefa={handleDeletarTarefa}
            />
          )}

          {activeTab === 'estudio_arte' && (
            <EstudioArteView
              assets={brandAssets}
              onAbrirPhotoCraft={(url, nome) => setModalArtCraft({ aberto: true, tipo: 'photocraft', arquivoUrl: url, arquivoNome: nome })}
              onAbrirVectorCraft={(url, nome) => setModalArtCraft({ aberto: true, tipo: 'vectorcraft', arquivoUrl: url, arquivoNome: nome })}
              onAdicionarAsset={handleAdicionarBrandAsset}
              onExcluirAsset={handleExcluirBrandAsset}
            />
          )}

          {activeTab === 'captacao' && (
            <CaptacaoView
              captacoes={captacoes}
              religiosos={religiosos}
              obras={obras}
              equipe={emails}
              usuarioNome={usuarioNome}
              onCriarCaptacao={async c => {
                const criada = await servico.createCaptacao(c);
                if (criada) setCaptacoes(prev => [...prev, criada]);
              }}
              onAtualizarChecklist={async (capId, idx, val) => {
                const cap = captacoes.find(c => c.id === capId);
                if (cap) {
                  const novoCheck = [...cap.checklist_equipamentos];
                  novoCheck[idx].checado = val;
                  await servico.updateCaptacao(capId, { checklist_equipamentos: novoCheck });
                  setCaptacoes(prev => prev.map(c => c.id === capId ? { ...c, checklist_equipamentos: novoCheck } : c));
                }
              }}
              onMarcarComoGravada={async capId => {
                await servico.updateCaptacao(capId, { situacao: 'gravada' });
                setCaptacoes(prev => prev.map(c => c.id === capId ? { ...c, situacao: 'gravada' } : c));
              }}
              onAdicionarComentario={handleAdicionarComentarioCaptacao}
            />
          )}

          {activeTab === 'aniversariantes' && (
            <AniversariantesView
              aniversariantes={aniversariantes}
              onCriarStory={() => {
                setModalNovoConteudo({
                  aberto: true,
                  tipo: 'post',
                  dataInicial: new Date().toISOString().split('T')[0]
                });
              }}
            />
          )}

          {activeTab === 'programar' && (
            <ProgramarPostsView
              posts={posts}
              onProgramarPost={async (postId, dataHora) => {
                await servico.updatePost(postId, { status: 'programado', data_cronograma: dataHora });
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'programado' } : p));
              }}
            />
          )}

          {activeTab === 'previa_feed' && (
            <PreviaFeedView
              posts={posts}
              onAbrirPost={post => {
                if (post.status === 'aprovacao') setActiveTab('aprovacao');
                else if (post.status === 'aprovado') setActiveTab('programar');
              }}
            />
          )}

          {activeTab === 'analise_instagram' && metricas && (
            <InstagramAnalyticsView metricas={metricas} />
          )}

          {activeTab === 'benchmarking' && (
            <BenchmarkingView
              benchmarks={benchmarks}
              onAdicionarBenchmark={async b => {
                setBenchmarks(prev => [{ 
                  id: `bm-${Date.now()}`, 
                  perfil_nome: b.perfil_nome || '', 
                  canal: 'Instagram', 
                  created_at: new Date().toISOString(), 
                  ...b 
                }, ...prev]);
              }}
            />
          )}

          {activeTab === 'emails_equipe' && (
            <EmailsEquipeView emails={emails} />
          )}
        </div>
      </div>

      {/* Modal ArtCraft (PhotoCraft / VectorCraft) */}
      <ArtCraftModal
        isOpen={modalArtCraft.aberto}
        onClose={() => setModalArtCraft(prev => ({ ...prev, aberto: false }))}
        tipo={modalArtCraft.tipo}
        arquivoUrl={modalArtCraft.arquivoUrl}
        arquivoNome={modalArtCraft.arquivoNome}
        onSalvar={() => {}}
      />

      {/* Modal Novo Conteúdo / Pauta com Conexão ao Banco */}
      <NovoConteudoModal
        isOpen={modalNovoConteudo.aberto}
        onClose={() => setModalNovoConteudo(prev => ({ ...prev, aberto: false }))}
        tipoInicial={modalNovoConteudo.tipo}
        dataInicial={modalNovoConteudo.dataInicial}
        religiosoInicial={modalNovoConteudo.religiosoInicial}
        religiosos={religiosos}
        obras={obras}
        equipe={emails}
        onPautaCriada={handleCriarPauta}
        onPostCriado={handleCriarPost}
      />
    </div>
  );
};

export default ComunicacaoAdmin;
