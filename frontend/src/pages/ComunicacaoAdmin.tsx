import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  LayoutDashboard, CheckSquare, Calendar, FolderPlus, Kanban, 
  Palette, Video, Mail, Gift, CheckCircle2, Send, Grid3X3, 
  BarChart2, Search, Plus, UserCheck, Layers, FileText, Users,
  Clock, Sparkles, ArrowLeft
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
  const usuarioNome = user?.nome || 'Comunicação BRM';

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'visao_geral';

  const handleMudarTab = (tab: string) => {
    if (tab === 'visao_geral') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };
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

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Cabeçalho Institucional do Módulo (Padrão Sistema BRM) */}
      {/* Cabeçalho Institucional do Módulo (exibido exclusivamente na Visão Geral) */}
      {activeTab === 'visao_geral' && (
        <header className="space-y-3">
          <div className="rounded-[10px] bg-white dark:bg-[#161b22] p-5 md:p-6 border border-slate-200/90 dark:border-slate-800 border-t-2 border-t-[#226380] shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center shrink-0">
                <img src="/logo-sistema.png" alt="Brasão SCJ BRM" className="h-11 w-auto object-contain dark:hidden" />
                <img src="/logo-branco.png" alt="Brasão SCJ BRM" className="h-11 w-auto object-contain hidden dark:block" />
              </div>
              <div>
                <span className="font-cinzel text-[11px] font-bold tracking-[0.16em] text-[#226380] dark:text-[#A3C3C7] uppercase">
                  Província BRM
                </span>
                <h1 className="font-cinzel text-2xl md:text-3xl font-bold tracking-tight text-[#113240] dark:text-white mt-1">
                  Comunicação & Mídia
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Central de produtividade, pautas, aprovação de posts, cronograma, captações, roteiros e banco de mídias.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setModalNovoConteudo({ aberto: true, tipo: 'pauta' })}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] text-[#113240] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#226380]" />
                <span>Nova pauta</span>
              </button>

              <button
                type="button"
                onClick={() => setModalNovoConteudo({ aberto: true, tipo: 'post' })}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#226380] text-white hover:bg-[#1a4f66] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo post</span>
              </button>
            </div>
          </div>
        </div>
        </header>
      )}

      {/* Conteúdo da Aba Ativa */}
      <div>
        {activeTab === 'visao_geral' && (
          <VisaoGeralView
            usuarioNome={usuarioNome}
            posts={posts}
            tarefas={tarefas}
            captacoes={captacoes}
            aniversariantes={aniversariantes}
            religiosos={religiosos}
            onNavegarTab={tab => handleMudarTab(tab)}
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
              handleMudarTab('producao');
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
              handleMudarTab('captacao');
            }}
          />
        )}

        {activeTab === 'producao' && (
          <ProducaoKanbanView
            posts={posts}
            onAvancarStatus={handleAvancarStatusPost}
            onAbrirPost={post => {
              if (post.status === 'aprovacao') handleMudarTab('aprovacao');
              else if (post.status === 'aprovado') handleMudarTab('programar');
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
            onAbrirPost={() => handleMudarTab('producao')}
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
            onAtualizarRoteiro={async (capId, roteiro, tags, mencoes) => {
              await servico.updateCaptacao(capId, { roteiro, tags, mencoes });
              setCaptacoes(prev => prev.map(c => c.id === capId ? { ...c, roteiro, tags, mencoes } : c));
            }}
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
              if (post.status === 'aprovacao') handleMudarTab('aprovacao');
              else if (post.status === 'aprovado') handleMudarTab('programar');
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
