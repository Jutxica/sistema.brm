import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Search, Users, Church, Cake, Phone, Mail, 
  MessageCircle, MapPin, Building, Loader2, RefreshCw, X 
} from 'lucide-react';
import { atribuirNomeReligioso, formatarComunidadeReligiosa } from '../lib/religiosoNome';

interface Confrade {
  id: string;
  nome_civil: string;
  nome_religioso: string | null;
  grau: string | null;
  comunidade_atual_nome: string | null;
  comunidade_atual_id?: string | null;
  obra_atual_id?: string | null;
  obra_atual_nome?: string | null;
  etapa_formativa_atual?: string | null;
  ano_configuracao?: number | string | null;
  ano_referencia_etapa?: number | string | null;
  email_institucional: string | null;
  email_pessoal: string | null;
  telefone_celular: string | null;
  whatsapp: string | null;
  data_nascimento: string | null;
  status: string;
}

interface ObraRef {
  id: string;
  nome: string;
  tipo: string;
  localidade: string | null;
  uf: string | null;
  comunidade_id: string | null;
}

interface ComunidadeData {
  id: string;
  nome: string;
  regiao: string | null;
  obras: ObraRef[];
  membros: Confrade[];
}

export const AnuarioBRM: React.FC = () => {
  const [confrades, setConfrades] = useState<Confrade[]>([]);
  const [comunidadesRaw, setComunidadesRaw] = useState<Array<{ id: string; nome: string; regiao: string | null }>>([]);
  const [obrasRaw, setObrasRaw] = useState<ObraRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [grauFilter, setGrauFilter] = useState('Todos');
  const [regiaoFilter, setRegiaoFilter] = useState('Todas');
  const [activeTab, setActiveTab] = useState<'confrades' | 'comunidades' | 'aniversariantes'>('confrades');

  const currentMonth = new Date().getMonth() + 1; // 1-12

  const loadAnuario = async () => {
    setLoading(true);
    try {
      const [relRes, comRes, obrasRes] = await Promise.all([
        supabase
          .from('religiosos')
          .select('id, nome_civil, nome_religioso, grau, etapa_formativa_atual, ano_configuracao, ano_referencia_etapa, comunidade_atual_nome, comunidade_atual_id, obra_atual_id, obra_atual_nome, email_institucional, email_pessoal, telefone_celular, whatsapp, data_nascimento, status')
          .eq('status', 'Ativo')
          .order('grau', { ascending: true })
          .order('nome_civil', { ascending: true }),
        supabase
          .from('comunidades')
          .select('id, nome, regiao')
          .order('nome', { ascending: true }),
        supabase
          .from('religiosos_obras_referencia')
          .select('id, nome, tipo, localidade, uf, comunidade_id')
          .order('nome', { ascending: true })
      ]);

      if (relRes.data) setConfrades(relRes.data as Confrade[]);
      if (comRes.data) setComunidadesRaw(comRes.data);
      if (obrasRes.data) setObrasRaw(obrasRes.data as ObraRef[]);
    } catch (err) {
      console.error('Erro ao carregar anuário:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnuario();
  }, []);

  const uniqueRegioes = useMemo(() => {
    const set = new Set<string>();
    comunidadesRaw.forEach(c => {
      if (c.regiao) set.add(c.regiao);
    });
    return Array.from(set).sort();
  }, [comunidadesRaw]);

  const getFraterSubtipo = (c: Confrade): 'Frater (Configuração)' | 'Frater (Tirocinante)' => {
    const etapa = (c.etapa_formativa_atual || '').toLowerCase();
    const com = (c.comunidade_atual_nome || '').toLowerCase();
    if (etapa.includes('tiroc') || (!etapa && com && !com.includes('conventinho'))) {
      return 'Frater (Tirocinante)';
    }
    return 'Frater (Configuração)';
  };

  // Filtragem dos confrades
  const filteredConfrades = useMemo(() => {
    return confrades.filter(c => {
      const nomeCompleto = `${c.nome_religioso || ''} ${c.nome_civil}`.toLowerCase();
      const comunidade = (c.comunidade_atual_nome || '').toLowerCase();
      const obra = (c.obra_atual_nome || '').toLowerCase();
      const query = search.toLowerCase();

      const matchesSearch = !search || nomeCompleto.includes(query) || comunidade.includes(query) || obra.includes(query);
      const matchesGrau = grauFilter === 'Todos'
        ? true
        : grauFilter === 'Diácono (Transitório)'
          ? ((c.grau || '').includes('Diácono') || (c.grau || '').includes('Diacono'))
          : grauFilter === 'Frater'
            ? c.grau === 'Frater'
            : grauFilter === 'Frater (Configuração)'
              ? (c.grau === 'Frater' && getFraterSubtipo(c) === 'Frater (Configuração)')
              : grauFilter === 'Frater (Tirocinante)'
                ? (c.grau === 'Frater' && getFraterSubtipo(c) === 'Frater (Tirocinante)')
                : c.grau === grauFilter;

      let matchesRegiao = true;
      if (regiaoFilter !== 'Todas') {
        const linkedCom = comunidadesRaw.find(com => 
          com.id === c.comunidade_atual_id || 
          (c.comunidade_atual_nome && (com.nome.toLowerCase().includes(c.comunidade_atual_nome.toLowerCase()) || c.comunidade_atual_nome.toLowerCase().includes(com.nome.toLowerCase())))
        );
        matchesRegiao = linkedCom?.regiao === regiaoFilter;
      }

      return matchesSearch && matchesGrau && matchesRegiao;
    });
  }, [confrades, search, grauFilter, regiaoFilter, comunidadesRaw]);

  // Agrupamento por Comunidade Territorial e suas Obras Integrantes
  const comunidadesList: ComunidadeData[] = useMemo(() => {
    return comunidadesRaw.map(com => {
      const obras = obrasRaw.filter(o => o.comunidade_id === com.id);
      const membros = confrades.filter(c => {
        if (c.comunidade_atual_id === com.id) return true;
        if (c.comunidade_atual_nome) {
          const cName = c.comunidade_atual_nome.toLowerCase().trim();
          const comName = com.nome.toLowerCase().trim();
          return cName === comName || cName.includes(comName) || comName.includes(cName);
        }
        return false;
      });
      return {
        id: com.id,
        nome: com.nome,
        regiao: com.regiao,
        obras,
        membros
      };
    }).filter(com => {
      if (regiaoFilter === 'Todas') return true;
      return com.regiao === regiaoFilter;
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [comunidadesRaw, obrasRaw, confrades, regiaoFilter]);

  // Aniversariantes do Mês
  const aniversariantesMes = confrades.filter(c => {
    if (!c.data_nascimento) return false;
    const parts = c.data_nascimento.split('-');
    if (parts.length >= 2) {
      const mes = parseInt(parts[1], 10);
      return mes === currentMonth;
    }
    return false;
  }).sort((a, b) => {
    const diaA = parseInt(a.data_nascimento!.split('-')[2] || '0', 10);
    const diaB = parseInt(b.data_nascimento!.split('-')[2] || '0', 10);
    return diaA - diaB;
  });

  const formatBirthday = (dateStr: string | null) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  const hasActiveFilters = Boolean(search.trim()) || grauFilter !== 'Todos' || regiaoFilter !== 'Todas';

  const clearFilters = () => {
    setSearch('');
    setGrauFilter('Todos');
    setRegiaoFilter('Todas');
  };

  return (
    <div className="space-y-5">
      
      {/* Masthead Oficial */}
      <div className="bg-white dark:bg-[#161617] rounded-xl border border-[#d6d6d6]/60 dark:border-white/10 p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center shrink-0">
            <img src="/logo-sistema.png" alt="Província BRM" className="h-12 w-auto object-contain dark:hidden" />
            <img src="/logo-branco.png" alt="Província BRM" className="h-12 w-auto object-contain hidden dark:block" />
          </div>
          <div>
            <span className="text-[10px] font-cinzel uppercase tracking-[0.2em] text-[#226380] dark:text-[#A3C3C7] block font-semibold">
              Província BRM • Comunhão Fraterna
            </span>
            <h1 className="font-cinzel text-lg sm:text-xl font-bold text-[#113240] dark:text-white mt-0.5">
              Elenco BRM · Diretório Provincial
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={loadAnuario}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#d6d6d6]/80 dark:border-white/10 bg-[#f5f5f7] dark:bg-[#262628] text-[#113240] dark:text-slate-200 hover:bg-[#e8eef0] dark:hover:bg-[#323236] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto rounded-xl border border-[#d6d6d6]/60 dark:border-white/10 bg-white dark:bg-[#161617] px-2 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <button
          type="button"
          onClick={() => setActiveTab('confrades')}
          className={`flex shrink-0 items-center gap-2 px-4 sm:px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'confrades'
              ? 'border-[#226380] text-[#113240] dark:border-[#A3C3C7] dark:text-white'
              : 'border-transparent text-slate-500 hover:text-[#113240] dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Confrades</span>
          <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
            {filteredConfrades.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comunidades')}
          className={`flex shrink-0 items-center gap-2 px-4 sm:px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'comunidades'
              ? 'border-[#226380] text-[#113240] dark:border-[#A3C3C7] dark:text-white'
              : 'border-transparent text-slate-500 hover:text-[#113240] dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Church className="w-3.5 h-3.5" />
          <span>Casas & Paróquias</span>
          <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
            {comunidadesList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('aniversariantes')}
          className={`flex shrink-0 items-center gap-2 px-4 sm:px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'aniversariantes'
              ? 'border-[#226380] text-[#113240] dark:border-[#A3C3C7] dark:text-white'
              : 'border-transparent text-slate-500 hover:text-[#113240] dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Cake className="w-3.5 h-3.5" />
          <span>Aniversariantes do Mês</span>
          <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
            {aniversariantesMes.length}
          </span>
        </button>
      </div>

      {/* ABA 1: CONFRADES */}
      {activeTab === 'confrades' && (
        <div className="space-y-4">
          
          {/* Barra de Busca e Filtros */}
          <div className="bg-white dark:bg-[#161617] rounded-xl border border-[#d6d6d6]/60 dark:border-white/10 p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3">
            {/* Linha 1: Campo de Busca + Seletor de Região */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 min-w-0">
                <Search
                  className="w-4 h-4 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Pesquisar confrade, comunidade ou obra"
                  placeholder="Pesquisar por nome do confrade, comunidade ou obra..."
                  className="h-9 w-full rounded-lg pl-9 pr-8 bg-[#f5f5f7] dark:bg-[#222225] text-xs text-slate-900 dark:text-[#f5f5f7] border border-slate-200/80 dark:border-white/10 focus:border-[#226380] focus:bg-white dark:focus:bg-[#161617] focus:ring-2 focus:ring-[#226380]/15 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Limpar pesquisa"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="relative sm:w-52 shrink-0">
                <MapPin
                  className="w-3.5 h-3.5 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#226380] dark:text-[#A3C3C7]"
                  aria-hidden="true"
                />
                <select
                  value={regiaoFilter}
                  onChange={e => setRegiaoFilter(e.target.value)}
                  aria-label="Filtrar por região"
                  className="h-9 w-full rounded-lg pl-8 pr-7 text-xs font-medium border border-slate-200/80 dark:border-white/10 bg-[#f5f5f7] dark:bg-[#222225] text-slate-700 dark:text-slate-200 focus:border-[#226380] focus:bg-white dark:focus:bg-[#161617] outline-none cursor-pointer transition-all"
                >
                  <option value="Todas">Região: Todas ({uniqueRegioes.length})</option>
                  {uniqueRegioes.map((r: string) => (
                    <option key={r} value={r}>Região: {r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linha 2: Chips Compactos de Grau */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-white/5">
              <div className="flex flex-wrap items-center gap-1.5">
                {['Todos', 'Padre', 'Diácono (Transitório)', 'Frater (Configuração)', 'Frater (Tirocinante)', 'Irmão', 'Bispo'].map(grau => {
                  const ativo = grauFilter === grau;
                  return (
                    <button
                      key={grau}
                      type="button"
                      onClick={() => setGrauFilter(grau)}
                      aria-pressed={ativo}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium leading-tight transition-all cursor-pointer ${
                        ativo
                          ? 'bg-[#113240] text-white shadow-xs dark:bg-[#226380] dark:text-white'
                          : 'bg-[#f5f5f7] text-slate-600 hover:bg-slate-200/80 hover:text-[#113240] dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                      }`}
                    >
                      {grau}
                    </button>
                  );
                })}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#226380] dark:text-[#A3C3C7] hover:underline cursor-pointer shrink-0"
                >
                  <X className="w-3 h-3" />
                  <span>Limpar filtros</span>
                </button>
              )}
            </div>
          </div>

          {/* Grid de Cards dos Confrades */}
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500 font-mono">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#226380]" />
              <span>Carregando anuário oficial...</span>
            </div>
          ) : filteredConfrades.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-[#161617] rounded-xl border border-[#d6d6d6]/60 dark:border-white/10 text-xs text-slate-500 font-sans space-y-2">
              <p>Nenhum religioso localizado para os filtros selecionados.</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#226380] dark:text-[#A3C3C7] hover:underline cursor-pointer"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConfrades.map((c: Confrade) => {
                const displayName = atribuirNomeReligioso(c.grau, c.nome_civil) || c.nome_religioso || c.nome_civil;
                const telClean = (c.whatsapp || c.telefone_celular || '').replace(/\D/g, '');

                return (
                  <div 
                    key={c.id}
                    className="bg-white dark:bg-[#161617] rounded-xl border border-[#d6d6d6]/60 dark:border-white/10 p-4 sm:p-5 flex flex-col justify-between hover:border-[#226380]/40 hover:shadow-[0_6px_20px_rgba(17,50,64,0.05)] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f5f5f7] text-[#113240] dark:bg-white/10 dark:text-slate-200">
                            {c.grau || 'Grau não informado'}
                          </span>
                          {c.grau === 'Frater' && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              getFraterSubtipo(c) === 'Frater (Tirocinante)'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-sky-50 text-[#226380] border-sky-200 dark:bg-sky-950/40 dark:text-[#A3C3C7] dark:border-sky-800'
                            }`}>
                              {getFraterSubtipo(c) === 'Frater (Tirocinante)' 
                                ? 'Tirocinante' 
                                : (c.ano_configuracao ? `${c.ano_configuracao}º Ano Teologia` : 'Configuração')}
                            </span>
                          )}
                        </div>
                        {c.data_nascimento && (
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 shrink-0">
                            <Cake className="w-3 h-3 text-slate-400" />
                            {formatBirthday(c.data_nascimento)}
                          </span>
                        )}
                      </div>

                      <h3 className="font-cinzel text-sm font-bold text-[#113240] dark:text-white leading-snug">
                        {displayName}
                      </h3>

                      {c.nome_religioso && c.nome_civil !== c.nome_religioso && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                          {c.nome_civil}
                        </p>
                      )}

                      {/* Comunidade e Obra onde reside ou trabalha */}
                      <div className="mt-3 space-y-1 text-xs font-sans">
                        <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1 font-medium">{formatarComunidadeReligiosa(c.comunidade_atual_nome) || 'Comunidade a designar'}</span>
                        </div>
                        {(() => {
                          const obraNome = c.obra_atual_nome || obrasRaw.find(o => o.id === c.obra_atual_id)?.nome;
                          const comFormatada = formatarComunidadeReligiosa(c.comunidade_atual_nome);
                          if (!obraNome || obraNome === comFormatada) return null;
                          return (
                            <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400 text-[11.5px]">
                              <Church className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7] shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{obraNome}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Contatos do Confrade */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                      <div className="text-[11px] font-mono text-slate-500 truncate">
                        {c.telefone_celular || c.whatsapp || c.email_institucional || 'Sem contato público'}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {telClean && (
                          <a
                            href={`https://wa.me/55${telClean}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-[#226380]/40 hover:bg-[#226380]/5 hover:text-[#226380] dark:hover:text-[#A3C3C7] transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {(c.telefone_celular || c.whatsapp) && (
                          <a
                            href={`tel:${telClean}`}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-[#226380]/40 hover:bg-[#226380]/5 hover:text-[#226380] dark:hover:text-[#A3C3C7] transition-colors"
                            title="Ligar"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {(c.email_institucional || c.email_pessoal) && (
                          <a
                            href={`mailto:${c.email_institucional || c.email_pessoal}`}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-[#226380]/40 hover:bg-[#226380]/5 hover:text-[#226380] dark:hover:text-[#A3C3C7] transition-colors"
                            title="Enviar e-mail"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ABA 2: COMUNIDADES & OBRAS INTEGRANTES */}
      {activeTab === 'comunidades' && (
        <div className="space-y-4">
          {/* Filtro por Região */}
          <div className="bg-white dark:bg-[#161617] rounded-xl border border-[#d6d6d6]/60 dark:border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-cinzel flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7]" />
              <span>Região</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['Todas', ...uniqueRegioes].map(reg => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setRegiaoFilter(reg)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                    regiaoFilter === reg
                      ? 'bg-[#113240] text-white dark:bg-[#226380] dark:text-white shadow-xs'
                      : 'bg-[#f5f5f7] dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {comunidadesList.map(com => (
              <div 
                key={com.id || com.nome}
                className="bg-white dark:bg-[#161617] rounded-xl border border-[#d6d6d6]/60 dark:border-white/10 p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
              >
                <div>
                  {/* Cabeçalho da Comunidade */}
                  <div className="border-l-2 border-[#226380] dark:border-[#A3C3C7] pl-3 mb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-cinzel text-base font-bold text-[#113240] dark:text-white">
                        {formatarComunidadeReligiosa(com.nome)}
                      </h3>
                      {com.regiao && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium border border-[#226380]/20 dark:border-[#A3C3C7]/25 bg-[#226380]/5 dark:bg-[#226380]/20 text-[#226380] dark:text-[#A3C3C7]">
                          {com.regiao}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mt-1">
                      {com.obras.length} obra(s) integrante(s) • {com.membros.length} confrade(s) residente(s)
                    </span>
                  </div>

                  {/* Seção 1: Obras e Instituições Integrantes (Separadas) */}
                  <div className="mb-4 bg-[#f8f9fa] dark:bg-white/[0.03] rounded-lg p-3 border border-slate-100 dark:border-white/5 space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-cinzel block">
                      Obras e Instituições Integrantes ({com.obras.length})
                    </span>
                    {com.obras.length > 0 ? (
                      <div className="space-y-1.5">
                        {com.obras.map((obra, idx) => (
                          <div 
                            key={obra.id || obra.nome}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-[#1c1c1e] border border-slate-200/70 dark:border-white/10 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-[10px] text-[#226380] dark:text-[#A3C3C7] font-bold shrink-0">
                                {idx + 1}.
                              </span>
                              <span className="font-medium text-slate-900 dark:text-white truncate">
                                {obra.nome}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0">
                              {obra.tipo}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Nenhuma obra ou paróquia especificamente associada.
                      </p>
                    )}
                  </div>

                  {/* Seção 2: Confrades Residentes / Atuantes */}
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-cinzel block mb-2">
                      Confrades Residentes / Atuantes ({com.membros.length})
                    </span>
                    {com.membros.length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {com.membros.map(m => (
                          <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0">
                              <span className="font-semibold text-[#113240] dark:text-white block truncate">
                                {atribuirNomeReligioso(m.grau, m.nome_civil) || m.nome_religioso || m.nome_civil}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {m.grau || 'Grau não informado'}
                                {m.grau === 'Frater' && (
                                  getFraterSubtipo(m) === 'Frater (Tirocinante)'
                                    ? ' (Tirocinante)'
                                    : (m.ano_configuracao ? ` (${m.ano_configuracao}º Ano Teologia)` : ' (Configuração)')
                                )}
                                {m.obra_atual_nome ? ` • ${m.obra_atual_nome}` : ''}
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                              {m.telefone_celular || m.whatsapp || m.email_institucional || ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Nenhum confrade atualmente registrado nesta comunidade.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: ANIVERSARIANTES */}
      {activeTab === 'aniversariantes' && (
        <div className="bg-white dark:bg-[#161617] rounded-xl border border-[#d6d6d6]/60 dark:border-white/10 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="border-l-2 border-[#226380] dark:border-[#A3C3C7] pl-3 mb-5">
            <h2 className="font-cinzel text-base font-bold text-[#113240] dark:text-white uppercase">
              Aniversários do Mês Atual (Mês {currentMonth})
            </h2>
          </div>

          {aniversariantesMes.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-sans">
              Nenhum aniversário de confrade registrado para este mês.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {aniversariantesMes.map(a => (
                <div key={a.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2.5 py-1 rounded-lg text-center font-mono font-bold text-xs bg-[#f5f5f7] dark:bg-white/10 text-[#113240] dark:text-white shrink-0">
                      Dia {a.data_nascimento?.split('-')[2]}
                    </span>
                    <div className="min-w-0">
                      <span className="font-semibold text-[#113240] dark:text-white block truncate">
                        {atribuirNomeReligioso(a.grau, a.nome_civil) || a.nome_religioso || a.nome_civil}
                      </span>
                      <span className="text-slate-500 text-[11px] font-sans block truncate">
                        {a.grau || 'Grau não informado'} • {formatarComunidadeReligiosa(a.comunidade_atual_nome) || 'Província BRM'}
                        {a.obra_atual_nome && a.obra_atual_nome !== formatarComunidadeReligiosa(a.comunidade_atual_nome) ? ` • ${a.obra_atual_nome}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {a.whatsapp && (
                      <a
                        href={`https://wa.me/55${a.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-full border border-[#d6d6d6]/80 dark:border-white/10 text-[#113240] dark:text-slate-200 hover:bg-[#f5f5f7] dark:hover:bg-white/10 text-[11px] font-medium transition-colors flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7]" />
                        <span>Felicitar</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AnuarioBRM;
