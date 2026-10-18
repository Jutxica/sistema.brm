import React, { useEffect, useMemo, useState } from 'react';
import { 
  Cake, 
  Sparkles, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  User, 
  MapPin, 
  Loader2,
  Medal,
  Heart
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export interface AniversarioItem {
  id: string;
  religiosoId: string;
  nome: string;
  grau?: string;
  comunidade?: string;
  fotoUrl?: string | null;
  tipo: 'natalicio' | 'votos' | 'ordenacao';
  dia: number;
  dataOriginal: string;
  anos?: number;
  jubileu?: {
    tipo: 'prata' | 'ouro' | 'diamante' | 'platina' | 'outro';
    label: string;
    icone: string;
    badgeClass: string;
  } | null;
  descricaoDetalhe?: string;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getJubileuInfo(anos: number) {
  if (anos === 25) {
    return {
      tipo: 'prata' as const,
      label: 'Jubileu de Prata (25 anos)',
      icone: '🥈',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600',
    };
  }
  if (anos === 50) {
    return {
      tipo: 'ouro' as const,
      label: 'Jubileu de Ouro (50 anos)',
      icone: '🥇',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700',
    };
  }
  if (anos === 60) {
    return {
      tipo: 'diamante' as const,
      label: 'Jubileu de Diamante (60 anos)',
      icone: '💎',
      badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-700',
    };
  }
  if (anos === 70) {
    return {
      tipo: 'platina' as const,
      label: 'Jubileu de Platina (70 anos)',
      icone: '🌟',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700',
    };
  }
  return null;
}

interface AniversariosJubileusCardProps {
  className?: string;
  variant?: 'dashboard' | 'portal';
}

export const AniversariosJubileusCard: React.FC<AniversariosJubileusCardProps> = ({
  className = '',
  variant = 'dashboard',
}) => {
  const [dataAtual, setDataAtual] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState<AniversarioItem[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'todos' | 'natalicio' | 'votos' | 'ordenacao'>('todos');

  const mesAtual = dataAtual.getMonth(); // 0 a 11
  const anoAtual = dataAtual.getFullYear();

  const proximoMes = () => {
    setDataAtual(new Date(anoAtual, mesAtual + 1, 1));
  };

  const mesAnterior = () => {
    setDataAtual(new Date(anoAtual, mesAtual - 1, 1));
  };

  const hoje = () => {
    setDataAtual(new Date());
  };

  useEffect(() => {
    let cancelado = false;

    async function carregarAniversariantes() {
      setLoading(true);
      try {
        // Busca religiosos ativos
        const { data: relData, error: relError } = await supabase
          .from('religiosos')
          .select('id, nome_civil, nome_religioso, nome_elenco, data_nascimento, foto_url, foto_path, grau, comunidade_atual_nome, status')
          .in('status', ['ativo', 'Ativo', 'estudos', 'missao', 'saude', 'ano_sabatico']);

        if (relError) throw relError;

        // Busca votos (primeiros e perpétuos)
        const { data: votosData } = await supabase
          .from('religiosos_profissoes_votos')
          .select('religioso_id, tipo, data')
          .not('data', 'is', null);

        // Busca ordens sacras
        const { data: ordensData } = await supabase
          .from('religiosos_ministerios_ordens')
          .select('religioso_id, tipo, data')
          .not('data', 'is', null);

        if (cancelado) return;

        const relMap = new Map((relData || []).map(r => [r.id, r]));
        const listaColetada: AniversarioItem[] = [];

        // 1. Aniversários Natalícios
        for (const rel of relData || []) {
          if (!rel.data_nascimento) continue;
          const [anoNasc, mesNasc, diaNasc] = rel.data_nascimento.split('-').map(Number);
          if (mesNasc === mesAtual + 1) {
            const idade = anoAtual - anoNasc;
            const nomeFormatado = rel.nome_elenco || rel.nome_religioso || rel.nome_civil || 'Confrade';
            listaColetada.push({
              id: `natalicio-${rel.id}`,
              religiosoId: rel.id,
              nome: nomeFormatado,
              grau: rel.grau,
              comunidade: rel.comunidade_atual_nome || undefined,
              fotoUrl: rel.foto_url,
              tipo: 'natalicio',
              dia: diaNasc,
              dataOriginal: rel.data_nascimento,
              anos: idade > 0 ? idade : undefined,
              descricaoDetalhe: idade > 0 ? `Comemora ${idade} anos de vida` : 'Aniversário natalício',
            });
          }
        }

        // 2. Profissão Religiosa (Votos)
        for (const voto of votosData || []) {
          const rel = relMap.get(voto.religioso_id);
          if (!rel || !voto.data) continue;
          const [anoVoto, mesVoto, diaVoto] = voto.data.split('-').map(Number);
          if (mesVoto === mesAtual + 1) {
            const anosProfissao = anoAtual - anoVoto;
            const tipoLower = (voto.tipo || '').toLowerCase();
            const isPerpetuo = tipoLower.includes('perp');
            const rotuloTipo = isPerpetuo ? 'Votos Perpétuos' : 'Primeiros Votos';
            const jubileu = getJubileuInfo(anosProfissao);
            const nomeFormatado = rel.nome_elenco || rel.nome_religioso || rel.nome_civil || 'Confrade';

            listaColetada.push({
              id: `voto-${rel.id}-${voto.data}`,
              religiosoId: rel.id,
              nome: nomeFormatado,
              grau: rel.grau,
              comunidade: rel.comunidade_atual_nome || undefined,
              fotoUrl: rel.foto_url,
              tipo: 'votos',
              dia: diaVoto,
              dataOriginal: voto.data,
              anos: anosProfissao,
              jubileu,
              descricaoDetalhe: anosProfissao > 0 
                ? `${anosProfissao} anos de Consagração (${rotuloTipo})` 
                : rotuloTipo,
            });
          }
        }

        // 3. Ordenações Sacras (Presbiteral, Diaconal, Episcopal)
        for (const ordem of ordensData || []) {
          const rel = relMap.get(ordem.religioso_id);
          if (!rel || !ordem.data) continue;
          const [anoOrd, mesOrd, diaOrd] = ordem.data.split('-').map(Number);
          if (mesOrd === mesAtual + 1) {
            const anosOrdenacao = anoAtual - anoOrd;
            const tipoLower = (ordem.tipo || '').toLowerCase();
            let rotuloOrdem = 'Ordenação Presbiteral';
            if (tipoLower.includes('diacon')) rotuloOrdem = 'Ordenação Diaconal';
            else if (tipoLower.includes('episcop') || tipoLower.includes('bispo')) rotuloOrdem = 'Ordenação Episcopal';

            const jubileu = getJubileuInfo(anosOrdenacao);
            const nomeFormatado = rel.nome_elenco || rel.nome_religioso || rel.nome_civil || 'Confrade';

            listaColetada.push({
              id: `ordem-${rel.id}-${ordem.data}`,
              religiosoId: rel.id,
              nome: nomeFormatado,
              grau: rel.grau,
              comunidade: rel.comunidade_atual_nome || undefined,
              fotoUrl: rel.foto_url,
              tipo: 'ordenacao',
              dia: diaOrd,
              dataOriginal: ordem.data,
              anos: anosOrdenacao,
              jubileu,
              descricaoDetalhe: anosOrdenacao > 0
                ? `${anosOrdenacao} anos de Ministério (${rotuloOrdem})`
                : rotuloOrdem,
            });
          }
        }

        // Ordena por dia do mês crescente
        listaColetada.sort((a, b) => a.dia - b.dia);
        setItens(listaColetada);
      } catch (err) {
        console.error('Erro ao carregar aniversários:', err);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    void carregarAniversariantes();
    return () => { cancelado = true; };
  }, [mesAtual, anoAtual]);

  const filtrados = useMemo(() => {
    if (abaAtiva === 'todos') return itens;
    return itens.filter(i => i.tipo === abaAtiva);
  }, [itens, abaAtiva]);

  const contagemNatalicios = useMemo(() => itens.filter(i => i.tipo === 'natalicio').length, [itens]);
  const contagemVotos = useMemo(() => itens.filter(i => i.tipo === 'votos').length, [itens]);
  const contagemOrdenacoes = useMemo(() => itens.filter(i => i.tipo === 'ordenacao').length, [itens]);
  const jubileusDestaque = useMemo(() => itens.filter(i => i.jubileu !== null && i.jubileu !== undefined), [itens]);

  const isPortal = variant === 'portal';

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 ${className}`}>
      {/* Header com Navegação de Mês */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 p-4 sm:px-6 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
              <Cake className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                Jubileus & Aniversários do Mês
                {jubileusDestaque.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                    <Sparkles className="h-3 w-3" />
                    {jubileusDestaque.length} Jubileu{jubileusDestaque.length > 1 ? 's' : ''}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Celebração da vida, vocação e consagração dos confrades da Província BRM
              </p>
            </div>
          </div>
        </div>

        {/* Controles de Navegação de Mês */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
          <button
            type="button"
            onClick={mesAnterior}
            title="Mês anterior"
            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={hoje}
            className="px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded transition"
          >
            {MESES[mesAtual]} {anoAtual}
          </button>
          <button
            type="button"
            onClick={proximoMes}
            title="Próximo mês"
            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Destaque para Jubileus se houver */}
      {jubileusDestaque.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-200/60 dark:border-amber-800/40 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            Jubilares em Destaque neste Mês:
          </div>
          <div className="flex flex-wrap gap-2">
            {jubileusDestaque.map(jub => (
              <div 
                key={`jubileu-pill-${jub.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white/90 px-3 py-1.5 shadow-xs dark:border-amber-700 dark:bg-slate-800/90 text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                <span>{jub.jubileu?.icone}</span>
                <span className="font-semibold">{jub.nome}</span>
                <span className="text-amber-800 dark:text-amber-300 font-bold">
                  {jub.jubileu?.label}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  (Dia {String(jub.dia).padStart(2, '0')})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Abas de Filtro de Categoria */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900/30">
        <button
          type="button"
          onClick={() => setAbaAtiva('todos')}
          className={`flex items-center gap-1.5 border-b-2 py-3 px-3 text-xs font-semibold transition ${
            abaAtiva === 'todos'
              ? 'border-[#226380] text-[#17485b] dark:border-sky-400 dark:text-sky-300'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span>Todos</span>
          <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-700 dark:text-slate-300">
            {itens.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('natalicio')}
          className={`flex items-center gap-1.5 border-b-2 py-3 px-3 text-xs font-semibold transition ${
            abaAtiva === 'natalicio'
              ? 'border-rose-500 text-rose-700 dark:border-rose-400 dark:text-rose-300'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Cake className="h-3.5 w-3.5" />
          <span>Natalícios</span>
          <span className="rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 px-1.5 py-0.2 text-[10px]">
            {contagemNatalicios}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('votos')}
          className={`flex items-center gap-1.5 border-b-2 py-3 px-3 text-xs font-semibold transition ${
            abaAtiva === 'votos'
              ? 'border-indigo-500 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Heart className="h-3.5 w-3.5" />
          <span>Profissão Religiosa</span>
          <span className="rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 px-1.5 py-0.2 text-[10px]">
            {contagemVotos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('ordenacao')}
          className={`flex items-center gap-1.5 border-b-2 py-3 px-3 text-xs font-semibold transition ${
            abaAtiva === 'ordenacao'
              ? 'border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          <span>Ordenações</span>
          <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-1.5 py-0.2 text-[10px]">
            {contagemOrdenacoes}
          </span>
        </button>
      </div>

      {/* Conteúdo da Lista */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#226380]" />
            Consultando aniversariantes e jubilares de {MESES[mesAtual]}...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-10 text-center">
            <Calendar className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Nenhuma comemoração registrada para {MESES[mesAtual]} nesta categoria.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Navegue pelos meses acima para conferir as próximas celebrações provinciais.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map(item => {
              const ehJubileu = Boolean(item.jubileu);
              return (
                <div
                  key={item.id}
                  className={`relative flex items-start gap-3.5 rounded-xl border p-3.5 transition hover:shadow-md ${
                    ehJubileu
                      ? 'border-amber-300 bg-amber-50/40 dark:border-amber-800/80 dark:bg-amber-950/20 shadow-xs'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40 hover:border-slate-300'
                  }`}
                >
                  {/* Badge de Dia do Mês */}
                  <div className="flex flex-col items-center justify-center shrink-0 w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold">
                    <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 leading-tight">
                      {MESES[mesAtual].slice(0, 3)}
                    </span>
                    <span className="text-base text-slate-900 dark:text-white leading-tight font-bold">
                      {String(item.dia).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Informações do Confrade */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {item.nome}
                      </span>
                      {item.jubileu && (
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${item.jubileu.badgeClass}`}>
                          <span>{item.jubileu.icone}</span>
                          <span>{item.jubileu.label}</span>
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      {item.tipo === 'natalicio' && (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                          <Cake className="h-3 w-3" /> Aniversário Natalício
                        </span>
                      )}
                      {item.tipo === 'votos' && (
                        <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                          <Heart className="h-3 w-3" /> Profissão Religiosa
                        </span>
                      )}
                      {item.tipo === 'ordenacao' && (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                          <Award className="h-3 w-3" /> Ordenação Presbiteral
                        </span>
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-normal">
                      {item.descricaoDetalhe}
                    </p>

                    {item.comunidade && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{item.comunidade}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AniversariosJubileusCard;
