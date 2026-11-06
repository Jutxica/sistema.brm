import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Calendar, Video, Plus, Copy, Check, 
  ExternalLink, Clock, Sparkles, BookOpen, MapPin, X, 
  Image as ImageIcon, Share2, Award, ChevronRight, ArrowLeft,
  Mail, Phone, Church, Heart, FileText, CheckCircle2
} from 'lucide-react';
import type { 
  ReligiosoConteudo, 
  ComunicacaoPost, 
  ComunicacaoCaptacao, 
  ComunicacaoPauta,
  HistoricoConteudoItem 
} from '../../types/comunicacao';
import { getHistoricoConteudoReligioso } from '../../services/comunicacaoService';

interface ReligiososConteudoViewProps {
  religiosos: ReligiosoConteudo[];
  posts: ComunicacaoPost[];
  captacoes: ComunicacaoCaptacao[];
  pautas: ComunicacaoPauta[];
  onCriarPostComReligioso: (religioso: ReligiosoConteudo) => void;
  onAgendarCaptacaoComReligioso: (religioso: ReligiosoConteudo) => void;
}

export const ReligiososConteudoView: React.FC<ReligiososConteudoViewProps> = ({
  religiosos,
  posts,
  captacoes,
  pautas,
  onCriarPostComReligioso,
  onAgendarCaptacaoComReligioso
}) => {
  const [busca, setBusca] = useState('');
  const [filtroGrau, setFiltroGrau] = useState<string>('todos');
  const [religiosoSelecionado, setReligiosoSelecionado] = useState<ReligiosoConteudo | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const copiarLemaEBio = (rel: ReligiosoConteudo) => {
    const texto = `${rel.nome_religioso} · ${rel.cargo_funcao || 'Religioso Dehoniano'} na ${rel.obra_atual_nome || rel.comunidade_atual_nome || 'Província BRM'}.\nLema: "${rel.lema_destacado || 'Ecce Venio'}"\nBio: ${rel.biografia || ''}`;
    navigator.clipboard.writeText(texto);
    setCopiadoId(rel.id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const calcularAnos = (dataIso?: string | null): number | null => {
    if (!dataIso) return null;
    const ano = parseInt(String(dataIso).slice(0, 4), 10);
    if (isNaN(ano)) return null;
    return new Date().getFullYear() - ano;
  };

  const formatarDataCompleta = (dataIso?: string | null): string => {
    if (!dataIso) return '—';
    try {
      const d = new Date(dataIso.includes('T') ? dataIso : `${dataIso}T12:00:00Z`);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dataIso;
    }
  };

  // Filtragem da Lista
  const listaFiltrada = useMemo(() => {
    return religiosos.filter(r => {
      const termo = busca.toLowerCase().trim();
      const bateBusca = !termo ||
        r.nome_religioso.toLowerCase().includes(termo) ||
        r.nome_civil.toLowerCase().includes(termo) ||
        (r.comunidade_atual_nome && r.comunidade_atual_nome.toLowerCase().includes(termo)) ||
        (r.obra_atual_nome && r.obra_atual_nome.toLowerCase().includes(termo)) ||
        (r.cargo_funcao && r.cargo_funcao.toLowerCase().includes(termo));

      const bateGrau = filtroGrau === 'todos' || 
        (filtroGrau === 'padre' && r.grau.toLowerCase().includes('presb')) ||
        (filtroGrau === 'bispo' && r.grau.toLowerCase().includes('bisp')) ||
        (filtroGrau === 'irmao' && (r.grau.toLowerCase().includes('irm') || r.grau.toLowerCase().includes('frat')));

      return bateBusca && bateGrau;
    });
  }, [religiosos, busca, filtroGrau]);

  // Histórico de Conteúdo do Religioso Selecionado
  const historicoDoSelecionado = useMemo(() => {
    if (!religiosoSelecionado) return [];
    return getHistoricoConteudoReligioso(
      religiosoSelecionado.id,
      religiosoSelecionado.nome_religioso,
      posts,
      captacoes,
      pautas
    );
  }, [religiosoSelecionado, posts, captacoes, pautas]);

  // =========================================================================
  // VIEW 1: Página Completa do Religioso (Estilo Perfil Institucional - Imagem 5)
  // =========================================================================
  if (religiosoSelecionado) {
    const rel = religiosoSelecionado;
    const anosIdade = calcularAnos(rel.data_nascimento);
    const anosOrdenacao = calcularAnos(rel.ordenacao_data);
    const anosProfissao = calcularAnos(rel.profissao_perpetua_data);

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Barra Superior de Navegação & Ações da Comunicação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dce4e2] dark:border-[#354246]">
          <button
            type="button"
            onClick={() => setReligiosoSelecionado(null)}
            className="flex items-center gap-2 text-xs font-semibold text-[#226380] dark:text-[#A3C3C7] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para lista de religiosos</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => copiarLemaEBio(rel)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-50 text-[#113240] dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiadoId === rel.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bio copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#52636a]" />
                  <span>Copiar lema & bio</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onAgendarCaptacaoComReligioso(rel)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-50 text-[#113240] dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Video className="w-3.5 h-3.5 text-amber-600" />
              <span>Agendar gravação</span>
            </button>

            <button
              type="button"
              onClick={() => onCriarPostComReligioso(rel)}
              className="px-4 py-2 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Criar post / homenagem</span>
            </button>
          </div>
        </div>

        {/* Layout de 2 Colunas (Exatamente como na Imagem 5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-3xl p-6 sm:p-8">
          {/* COLUNA ESQUERDA: Foto Oficial + Conteúdos Produzidos */}
          <div className="lg:col-span-5 space-y-6">
            {/* Foto Oficial em Alta Resolução com Bordas Arredondadas Nobres */}
            <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] relative flex items-center justify-center">
              {rel.foto_url || (rel.foto_path && rel.foto_path.startsWith('http')) ? (
                <img
                  src={rel.foto_url || rel.foto_path || ''}
                  alt={rel.nome_religioso}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#113240]/10 dark:bg-white/10 flex items-center justify-center text-3xl font-bold text-[#113240] dark:text-white">
                    {rel.nome_religioso.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-[#66777b] dark:text-[#a0aeaf] block">
                    Foto oficial da Província BRM
                  </span>
                </div>
              )}
            </div>

            {/* SEÇÃO: Conteúdos Produzidos com este Confrade (Substitui Notícias Relacionadas) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#dce4e2] dark:border-[#354246]">
                <h3 className="text-xs font-bold text-[#113240] dark:text-white tracking-wide">
                  Conteúdos produzidos ({historicoDoSelecionado.length})
                </h3>
                <span className="text-xs text-[#86868b]">Linha do tempo</span>
              </div>

              {historicoDoSelecionado.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#86868b] bg-[#f8faf9] dark:bg-[#141a1c] border border-dashed border-[#dce4e2] dark:border-[#354246] rounded-xl space-y-2">
                  <p>Nenhum conteúdo produzido ainda com este confrade.</p>
                  <button
                    type="button"
                    onClick={() => onCriarPostComReligioso(rel)}
                    className="px-3 py-1.5 rounded-lg bg-[#226380] text-white text-xs font-semibold hover:bg-[#1a4f66] transition-colors"
                  >
                    + Criar primeiro post
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {historicoDoSelecionado.map(item => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] space-y-1.5 hover:border-[#226380] transition-colors"
                    >
                      <div className="w-full h-20 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative">
                        {(item.imagem_url || item.url) ? (
                          <img src={item.imagem_url || item.url} alt={item.titulo} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-400" />
                        )}
                        <span className="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded bg-black/60 text-white font-medium">
                          {item.formato}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-[#113240] dark:text-white line-clamp-2" title={item.titulo}>
                        {item.titulo}
                      </h4>

                      <span className="text-xs text-[#86868b] block">
                        {new Date(item.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: Dados Canônicos, Lema, Biografia & Contatos */}
          <div className="lg:col-span-7 space-y-6">
            {/* Título & Lema Sacerdotal */}
            <div className="space-y-1.5 pb-4 border-b border-[#dce4e2] dark:border-[#354246]">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#113240] dark:text-white tracking-tight">
                {rel.nome_religioso.toUpperCase()}
              </h2>

              <p className="text-xs sm:text-sm font-semibold italic text-[#226380] dark:text-[#A3C3C7] leading-relaxed">
                "{rel.lema_destacado || 'Ecce Venio — Eis que venho para fazer a tua vontade'}"
              </p>
            </div>

            {/* Blocos de Informações Canônicas e Pastorais */}
            <div className="space-y-4 text-xs">
              {/* Aniversário de Vida */}
              <div className="p-3.5 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] space-y-1">
                <span className="font-bold text-[#113240] dark:text-white block">
                  Aniversário de vida / Natalício
                </span>
                <p className="text-[#52636a] dark:text-[#a0aeaf]">
                  Data: <strong>{formatarDataCompleta(rel.data_nascimento)}</strong>
                  {anosIdade ? ` (${anosIdade} anos)` : ''}
                </p>
                <p className="text-[#52636a] dark:text-[#a0aeaf]">
                  Local: <strong>{rel.naturalidade_cidade || 'Santa Catarina'} / {rel.naturalidade_uf || 'SC'}</strong>
                </p>
              </div>

              {/* Ordenação Presbiteral */}
              <div className="p-3.5 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] space-y-1">
                <span className="font-bold text-[#113240] dark:text-white block">
                  Ordenação presbiteral / Jubileu
                </span>
                <p className="text-[#52636a] dark:text-[#a0aeaf]">
                  Data: <strong>{formatarDataCompleta(rel.ordenacao_data)}</strong>
                  {anosOrdenacao ? ` (${anosOrdenacao} anos de sacerdócio)` : ''}
                </p>
              </div>

              {/* Primeira Profissão Religiosa */}
              <div className="p-3.5 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] space-y-1">
                <span className="font-bold text-[#113240] dark:text-white block">
                  Primeira profissão religiosa (votos perpétuos)
                </span>
                <p className="text-[#52636a] dark:text-[#a0aeaf]">
                  Data: <strong>{formatarDataCompleta(rel.profissao_perpetua_data)}</strong>
                  {anosProfissao ? ` (${anosProfissao} anos de consagração dehoniana)` : ''}
                </p>
              </div>

              {/* Funções Atuais na Província BRM */}
              <div className="p-3.5 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] space-y-1">
                <span className="font-bold text-[#113240] dark:text-white block">
                  Funções atuais na Província
                </span>
                <p className="text-[#52636a] dark:text-[#a0aeaf]">
                  Comunidade / Obra: <strong>{rel.obra_atual_nome || rel.comunidade_atual_nome}</strong>
                </p>
                <p className="text-[#52636a] dark:text-[#a0aeaf]">
                  Ofício canônico: <strong>{rel.cargo_funcao || 'Religioso Dehoniano'}</strong>
                </p>
              </div>

              {/* Contatos para a Comunicação */}
              <div className="p-3.5 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] space-y-1.5">
                <span className="font-bold text-[#113240] dark:text-white block">
                  Contatos diretos para agendamento
                </span>
                <div className="flex flex-wrap items-center gap-4 text-[#52636a] dark:text-[#a0aeaf] pt-0.5">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#226380]" />
                    <span>{rel.email_institucional || 'comunicacao@dehonianosbrm.org.br'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{rel.telefone_whatsapp || rel.telefone_celular || '(47) 99123-8899'}</span>
                  </span>
                </div>
              </div>

              {/* Biografia & Histórico Pastoral */}
              <div className="p-4 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] space-y-2">
                <span className="font-bold text-[#113240] dark:text-white block">
                  Biografia & histórico
                </span>
                <p className="text-[#52636a] dark:text-[#a0aeaf] leading-relaxed text-xs">
                  {rel.biografia || `${rel.nome_religioso} é sacerdote dehoniano com sólida dedicação pastoral e administrativa na Província Brasil Meridional (BRM), exercendo funções de animação litúrgica, formação e presença evangélica.`}
                </p>
              </div>
            </div>

            {/* Rodapé da Página */}
            <div className="pt-4 border-t border-[#dce4e2] dark:border-[#354246] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#86868b] gap-2">
              <button
                type="button"
                onClick={() => setReligiosoSelecionado(null)}
                className="text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para lista de religiosos</span>
              </button>
              <span>Província dos Padres Dehonianos · BRM</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: Diretório de Religiosos (Grid de Confrades da Província)
  // =========================================================================
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
            Religiosos da Província.
          </h1>
          <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
            Perfis biográficos, lemas de ordenação, contatos e histórico de conteúdos produzidos com cada confrade da BRM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] font-semibold text-[#113240] dark:text-white">
            {religiosos.length} religiosos cadastrados
          </span>
        </div>
      </div>

      {/* Barra de Filtros & Busca */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, paróquia, lema..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#226380]"
          />
        </div>

        {/* Abas de Filtro por Grau */}
        <div className="flex items-center gap-1.5 p-1 bg-[#f0f4f3] dark:bg-[#141a1c] rounded-xl border border-[#dce4e2] dark:border-[#354246] w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'padre', label: 'Padres' },
            { id: 'bispo', label: 'Bispos' },
            { id: 'irmao', label: 'Irmãos / Fratres' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroGrau(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                filtroGrau === tab.id
                  ? 'bg-[#113240] text-white'
                  : 'text-[#66777b] dark:text-[#a0aeaf] hover:text-[#113240]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Cards de Confrades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {listaFiltrada.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-12 text-center text-xs text-[#86868b]">
            Nenhum confrade encontrado com os termos de busca informados.
          </div>
        ) : (
          listaFiltrada.map(rel => {
            return (
              <div
                key={rel.id}
                className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-[#226380] transition-colors group cursor-pointer"
                onClick={() => setReligiosoSelecionado(rel)}
              >
                {/* Topo do Card: Foto 4x4 + Grau + Nome */}
                <div className="flex items-start gap-3.5">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] overflow-hidden shrink-0 flex items-center justify-center">
                    {rel.foto_url || (rel.foto_path && rel.foto_path.startsWith('http')) ? (
                      <img src={rel.foto_url || rel.foto_path || ''} alt={rel.nome_religioso} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-lg text-[#113240] dark:text-white bg-[#113240]/10">
                        {rel.nome_religioso.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#52636a] dark:text-[#a0aeaf] font-semibold border border-[#dce4e2] dark:border-[#354246]">
                      {rel.grau}
                    </span>
                    <h2 className="text-sm font-bold text-[#113240] dark:text-white truncate pt-0.5">
                      {rel.nome_religioso}
                    </h2>
                    <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] truncate">
                      {rel.cargo_funcao || 'Religioso Dehoniano'}
                    </p>
                  </div>
                </div>

                {/* Comunidade / Obra & Lema */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[#52636a] dark:text-[#a0aeaf] truncate">
                    <Church className="w-3.5 h-3.5 text-[#226380] shrink-0" />
                    <span className="truncate">{rel.obra_atual_nome || rel.comunidade_atual_nome}</span>
                  </div>

                  {rel.lema_destacado && (
                    <p className="text-xs italic text-[#66777b] dark:text-[#a0aeaf] line-clamp-2 bg-[#f8faf9] dark:bg-[#141a1c] p-2 rounded-lg border border-[#dce4e2] dark:border-[#354246]">
                      "{rel.lema_destacado}"
                    </p>
                  )}
                </div>

                {/* Rodapé do Card: Botão para Abrir Perfil Completo */}
                <div className="pt-3 border-t border-[#dce4e2] dark:border-[#354246] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#226380] dark:text-[#A3C3C7] group-hover:underline flex items-center gap-1">
                    <span>Ver perfil & conteúdos</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>

                  <span className="text-xs text-[#86868b]">
                    {rel.total_conteudos || 0} mídias
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
