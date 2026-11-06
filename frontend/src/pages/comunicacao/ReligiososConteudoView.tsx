import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Calendar, Video, Plus, Copy, Check, 
  ExternalLink, Clock, Sparkles, BookOpen, MapPin, X, 
  Image as ImageIcon, Share2, Award, ChevronRight
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
    const texto = `${rel.nome_religioso} · ${rel.cargo_funcao || 'Religioso Dehoniano'} na ${rel.obra_atual_nome || rel.comunidade_atual_nome || 'Província BRM'}.\nLema: "${rel.lema_destacado || 'Sint unum'}"`;
    navigator.clipboard.writeText(texto);
    setCopiadoId(rel.id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const calcularIdadeOuAnos = (dataIso?: string | null): number | null => {
    if (!dataIso) return null;
    const ano = parseInt(String(dataIso).slice(0, 4), 10);
    if (isNaN(ano)) return null;
    return new Date().getFullYear() - ano;
  };

  const formatarData = (dataIso?: string | null): string => {
    if (!dataIso) return '—';
    try {
      const d = new Date(dataIso.includes('T') ? dataIso : `${dataIso}T12:00:00Z`);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch {
      return dataIso;
    }
  };

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

  // Histórico do religioso aberto na gaveta
  const historicoSelecionado = useMemo(() => {
    if (!religiosoSelecionado) return [];
    return getHistoricoConteudoReligioso(
      religiosoSelecionado.id,
      religiosoSelecionado.nome_religioso,
      posts,
      captacoes,
      pautas
    );
  }, [religiosoSelecionado, posts, captacoes, pautas]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#113240] dark:text-white tracking-tight">
            Religiosos da Província
          </h1>
          <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] mt-1">
            Diretório oficial de confrades para criação de conteúdos, matérias, homenagens e captações de vídeo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
            Total cadastrado: <strong>{religiosos.length} confrades</strong>
          </span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFiltroGrau('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroGrau === 'todos'
                ? 'bg-[#113240] text-white'
                : 'text-[#52636a] dark:text-[#a0aeaf] hover:bg-slate-100 dark:hover:bg-[#253034]'
            }`}
          >
            Todos os graus ({religiosos.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroGrau('padre')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroGrau === 'padre'
                ? 'bg-[#113240] text-white'
                : 'text-[#52636a] dark:text-[#a0aeaf] hover:bg-slate-100 dark:hover:bg-[#253034]'
            }`}
          >
            Padres / Presbíteros
          </button>

          <button
            type="button"
            onClick={() => setFiltroGrau('bispo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroGrau === 'bispo'
                ? 'bg-[#113240] text-white'
                : 'text-[#52636a] dark:text-[#a0aeaf] hover:bg-slate-100 dark:hover:bg-[#253034]'
            }`}
          >
            Bispos
          </button>

          <button
            type="button"
            onClick={() => setFiltroGrau('irmao')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroGrau === 'irmao'
                ? 'bg-[#113240] text-white'
                : 'text-[#52636a] dark:text-[#a0aeaf] hover:bg-slate-100 dark:hover:bg-[#253034]'
            }`}
          >
            Fráteres & Irmãos
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, paróquia ou cargo..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:border-[#226380]"
          />
        </div>
      </div>

      {/* Grid de Cartões de Religiosos */}
      {listaFiltrada.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#52636a] dark:text-[#a0aeaf] bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl">
          Nenhum religioso encontrado com os filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listaFiltrada.map(rel => {
            const anosOrdenacao = calcularIdadeOuAnos(rel.ordenacao_data);
            const idade = calcularIdadeOuAnos(rel.data_nascimento);

            return (
              <div
                key={rel.id}
                className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-4 flex flex-col justify-between gap-3.5 hover:border-[#226380] transition-colors group"
              >
                {/* Topo do Cartão: Foto e Identificação */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#f4f6f5] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] overflow-hidden flex items-center justify-center shrink-0">
                      {rel.foto_url ? (
                        <img src={rel.foto_url} alt={rel.nome_religioso} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[#226380] dark:text-[#A3C3C7]">
                          {rel.nome_religioso.slice(0, 2)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs px-2 py-0.2 rounded bg-[#113240] text-white font-medium">
                          {rel.grau}
                        </span>
                        {anosOrdenacao && [10, 25, 40, 50, 60].includes(anosOrdenacao) && (
                          <span className="text-xs px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-800">
                            Jubileu {anosOrdenacao} anos
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-[#113240] dark:text-white truncate mt-1">
                        {rel.nome_religioso}
                      </h3>
                      <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] truncate">
                        {rel.cargo_funcao || 'Presbítero Dehoniano'}
                      </p>
                    </div>
                  </div>

                  {/* Informações de Localização e Datas */}
                  <div className="text-xs text-[#52636a] dark:text-[#a0aeaf] space-y-1 pt-2 border-t border-[#dce4e2] dark:border-[#354246]">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{rel.obra_atual_nome || rel.comunidade_atual_nome}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span>Aniversário: <strong>{formatarData(rel.data_nascimento)}</strong> {idade ? `(${idade} anos)` : ''}</span>
                      {anosOrdenacao ? (
                        <span>Ordenação: <strong>{anosOrdenacao} anos</strong></span>
                      ) : null}
                    </div>
                  </div>

                  {/* Lema Sacerdotal em Destaque */}
                  {rel.lema_destacado && (
                    <div className="p-2.5 rounded-lg bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] text-xs">
                      <span className="text-[#52636a] dark:text-[#a0aeaf] block text-[11px]">
                        Lema sacerdotal:
                      </span>
                      <p className="text-[#113240] dark:text-white italic line-clamp-2 mt-0.5">
                        "{rel.lema_destacado}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Ações Rápidas no Rodapé */}
                <div className="pt-2.5 border-t border-[#dce4e2] dark:border-[#354246] flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReligiosoSelecionado(rel)}
                    className="flex-1 py-1.5 px-2 rounded bg-white dark:bg-[#253034] hover:bg-slate-100 dark:hover:bg-[#354246] border border-[#dce4e2] dark:border-[#354246] text-[#113240] dark:text-white text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                    title="Ver histórico de conteúdos produzidos com este religioso"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#226380]" />
                    <span>Histórico</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCriarPostComReligioso(rel)}
                    className="py-1.5 px-2.5 rounded bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-medium flex items-center gap-1 transition-colors"
                    title="Criar novo post com os dados deste religioso"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAgendarCaptacaoComReligioso(rel)}
                    className="py-1.5 px-2.5 rounded bg-white dark:bg-[#253034] hover:bg-slate-100 dark:hover:bg-[#354246] border border-[#dce4e2] dark:border-[#354246] text-[#113240] dark:text-white text-xs font-medium flex items-center gap-1 transition-colors"
                    title="Agendar gravação de vídeo com este religioso"
                  >
                    <Video className="w-3.5 h-3.5 text-amber-600" />
                    <span>Gravar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => copiarLemaEBio(rel)}
                    className="p-1.5 rounded border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-100 dark:hover:bg-[#354246] text-[#52636a] dark:text-[#a0aeaf] transition-colors"
                    title="Copiar biografia e lema para a legenda"
                  >
                    {copiadoId === rel.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gaveta Lateral de Histórico & Linha do Tempo de Conteúdos */}
      {religiosoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 p-0 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1c2427] border-l border-[#dce4e2] dark:border-[#354246] h-full w-full max-w-lg p-6 flex flex-col justify-between overflow-y-auto shadow-none">
            <div className="space-y-5">
              {/* Topo da Gaveta */}
              <div className="flex items-start justify-between pb-4 border-b border-[#dce4e2] dark:border-[#354246]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#f4f6f5] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] flex items-center justify-center font-bold text-xs text-[#226380]">
                    {religiosoSelecionado.nome_religioso.slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#113240] dark:text-white">
                      {religiosoSelecionado.nome_religioso}
                    </h2>
                    <p className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
                      {religiosoSelecionado.cargo_funcao} · {religiosoSelecionado.obra_atual_nome}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReligiosoSelecionado(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Informações Resumidas */}
              <div className="p-3.5 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#52636a] dark:text-[#a0aeaf]">Nome Civil:</span>
                  <span className="font-medium text-[#113240] dark:text-white">{religiosoSelecionado.nome_civil || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#52636a] dark:text-[#a0aeaf]">E-mail Institucional:</span>
                  <span className="font-medium text-[#113240] dark:text-white">{religiosoSelecionado.email_institucional || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#52636a] dark:text-[#a0aeaf]">Lema:</span>
                  <span className="font-medium text-[#113240] dark:text-white truncate max-w-[260px]">"{religiosoSelecionado.lema_destacado}"</span>
                </div>
              </div>

              {/* Linha do Tempo de Conteúdos Criados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#226380]" />
                    <h3 className="text-xs font-semibold text-[#113240] dark:text-white">
                      Linha do Tempo de Conteúdos Produzidos
                    </h3>
                  </div>
                  <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
                    {historicoSelecionado.length} registros
                  </span>
                </div>

                {historicoSelecionado.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#52636a] dark:text-[#a0aeaf] border border-dashed border-[#dce4e2] dark:border-[#354246] rounded-xl">
                    Nenhum conteúdo vinculado a este religioso ainda. Use os botões abaixo para criar o primeiro post ou agendar gravação.
                  </div>
                ) : (
                  <div className="space-y-2.5 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#dce4e2] dark:before:bg-[#354246] pl-7">
                    {historicoSelecionado.map(item => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] relative space-y-1"
                      >
                        <span className="absolute -left-5 top-3.5 w-2 h-2 rounded-full bg-[#226380]" />
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold px-2 py-0.2 rounded bg-white dark:bg-[#253034] text-[#113240] dark:text-white border border-[#dce4e2] dark:border-[#354246]">
                            {item.formato}
                          </span>
                          <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
                            {new Date(item.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-[#113240] dark:text-white">
                          {item.titulo}
                        </h4>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ações da Gaveta */}
            <div className="pt-4 border-t border-[#dce4e2] dark:border-[#354246] flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onCriarPostComReligioso(religiosoSelecionado);
                  setReligiosoSelecionado(null);
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar novo post</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAgendarCaptacaoComReligioso(religiosoSelecionado);
                  setReligiosoSelecionado(null);
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-white dark:bg-[#253034] border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-100 text-[#113240] dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Video className="w-3.5 h-3.5 text-amber-600" />
                <span>Agendar vídeo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
