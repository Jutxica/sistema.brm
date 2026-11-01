import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Search, BookOpen, Users, Church, Cake, Phone, Mail, 
  MessageCircle, MapPin, Building, Loader2, RefreshCw 
} from 'lucide-react';
import { atribuirNomeReligioso, formatarComunidadeReligiosa } from '../lib/religiosoNome';

interface Confrade {
  id: string;
  nome_civil: string;
  nome_religioso: string | null;
  grau: string | null;
  comunidade_atual_nome: string | null;
  comunidade_atual_id?: string | null;
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
          .select('id, nome_civil, nome_religioso, grau, comunidade_atual_nome, comunidade_atual_id, email_institucional, email_pessoal, telefone_celular, whatsapp, data_nascimento, status')
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

  // Filtragem dos confrades
  const filteredConfrades = useMemo(() => {
    return confrades.filter(c => {
      const nomeCompleto = `${c.nome_religioso || ''} ${c.nome_civil}`.toLowerCase();
      const comunidade = (c.comunidade_atual_nome || '').toLowerCase();
      const query = search.toLowerCase();

      const matchesSearch = !search || nomeCompleto.includes(query) || comunidade.includes(query);
      const matchesGrau = grauFilter === 'Todos'
        ? true
        : grauFilter === 'Diácono (Transitório)'
          ? ((c.grau || '').includes('Diácono') || (c.grau || '').includes('Diacono'))
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

  return (
    <div className="space-y-6">
      
      {/* Masthead Oficial */}
      <div className="bg-white dark:bg-[#12151e] border border-slate-200 dark:border-slate-800 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center shrink-0">
            <img src="/logo-sistema.png" alt="Província BRM" className="h-14 w-auto object-contain dark:hidden" />
            <img src="/logo-branco.png" alt="Província BRM" className="h-14 w-auto object-contain hidden dark:block" />
          </div>
          <div>
            <span className="text-[10px] font-cinzel uppercase tracking-[0.2em] text-[#226380] dark:text-[#A3C3C7] block font-semibold">
              Província BRM • Comunhão Fraterna
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Elenco BRM · Diretório Provincial
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={loadAnuario}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12151e]">
        <button
          type="button"
          onClick={() => setActiveTab('confrades')}
          className={`flex shrink-0 items-center gap-2 px-4 sm:px-6 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'confrades'
              ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Confrades ({filteredConfrades.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comunidades')}
          className={`flex shrink-0 items-center gap-2 px-4 sm:px-6 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'comunidades'
              ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Church className="w-3.5 h-3.5" />
          <span>Casas & Paróquias ({comunidadesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('aniversariantes')}
          className={`flex shrink-0 items-center gap-2 px-4 sm:px-6 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'aniversariantes'
              ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Cake className="w-3.5 h-3.5" />
          <span>Aniversariantes do Mês ({aniversariantesMes.length})</span>
        </button>
      </div>

      {/* ABA 1: CONFRADES */}
      {activeTab === 'confrades' && (
        <div className="space-y-4">
          
          {/* Barra de Filtros */}
          <div className="bg-white dark:bg-[#12151e] border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por nome do confrade ou comunidade..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#090a0f] text-xs text-slate-900 dark:text-[#f5f5f7] border border-slate-200 dark:border-slate-700 outline-none font-sans text-xs"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={regiaoFilter}
                onChange={e => setRegiaoFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#090a0f] text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="Todas">Região: Todas ({uniqueRegioes.length})</option>
                {uniqueRegioes.map((r: string) => (
                  <option key={r} value={r}>Região: {r}</option>
                ))}
              </select>

              {['Todos', 'Padre', 'Diácono (Transitório)', 'Frater', 'Irmão', 'Bispo'].map(grau => (
                <button
                  key={grau}
                  type="button"
                  onClick={() => setGrauFilter(grau)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors border cursor-pointer ${
                    grauFilter === grau
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {grau}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Cards dos Confrades */}
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500 font-mono">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              <span>Carregando anuário oficial...</span>
            </div>
          ) : filteredConfrades.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#12151e] border border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-sans">
              Nenhum religioso localizado para os filtros selecionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConfrades.map((c: Confrade) => {
                const displayName = atribuirNomeReligioso(c.grau, c.nome_civil) || c.nome_religioso || c.nome_civil;
                const telClean = (c.whatsapp || c.telefone_celular || '').replace(/\D/g, '');

                return (
                  <div 
                    key={c.id}
                    className="bg-white dark:bg-[#12151e] border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 text-[9px] font-mono uppercase font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {c.grau || 'Grau não informado'}
                        </span>
                        {c.data_nascimento && (
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Cake className="w-3 h-3 text-slate-400" />
                            {formatBirthday(c.data_nascimento)}
                          </span>
                        )}
                      </div>

                      <h3 className="font-cinzel text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {displayName}
                      </h3>

                      {c.nome_religioso && c.nome_civil !== c.nome_religioso && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                          {c.nome_civil}
                        </p>
                      )}

                      <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-sans">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{formatarComunidadeReligiosa(c.comunidade_atual_nome) || 'Comunidade a designar'}</span>
                      </div>
                    </div>

                    {/* Contatos do Confrade */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div className="text-[11px] font-mono text-slate-500">
                        {c.telefone_celular || c.whatsapp || c.email_institucional || 'Sem contato público'}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {telClean && (
                          <a
                            href={`https://wa.me/55${telClean}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {(c.telefone_celular || c.whatsapp) && (
                          <a
                            href={`tel:${telClean}`}
                            className="p-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Ligar"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {(c.email_institucional || c.email_pessoal) && (
                          <a
                            href={`mailto:${c.email_institucional || c.email_pessoal}`}
                            className="p-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
          <div className="bg-white dark:bg-[#12151e] border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-cinzel">
              Filtrar por Região:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['Todas', ...uniqueRegioes].map(reg => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setRegiaoFilter(reg)}
                  className={`px-3 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                    regiaoFilter === reg
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161b22] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {comunidadesList.map(com => (
              <div 
                key={com.id || com.nome}
                className="bg-white dark:bg-[#12151e] border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between space-y-5"
              >
                <div>
                  {/* Cabeçalho da Comunidade */}
                  <div className="border-l-2 border-slate-900 dark:border-slate-400 pl-3 mb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-cinzel text-base font-bold text-slate-900 dark:text-white">
                        {formatarComunidadeReligiosa(com.nome)}
                      </h3>
                      {com.regiao && (
                        <span className="px-2 py-0.5 text-[10px] font-mono border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300">
                          {com.regiao}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mt-1">
                      {com.obras.length} obra(s) integrante(s) • {com.membros.length} confrade(s) residente(s)
                    </span>
                  </div>

                  {/* Seção 1: Obras e Instituições Integrantes (Separadas) */}
                  <div className="mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 border border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-cinzel block">
                      Obras e Instituições Integrantes ({com.obras.length})
                    </span>
                    {com.obras.length > 0 ? (
                      <div className="space-y-1.5">
                        {com.obras.map((obra, idx) => (
                          <div 
                            key={obra.id || obra.nome}
                            className="flex items-center justify-between p-2 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-sky-700 dark:text-sky-400 font-bold">
                                {idx + 1}.
                              </span>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {obra.nome}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
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
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {com.membros.map(m => (
                          <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {atribuirNomeReligioso(m.grau, m.nome_civil) || m.nome_religioso || m.nome_civil}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">{m.grau || 'Grau não informado'}</span>
                            </div>
                            <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
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
        <div className="bg-white dark:bg-[#12151e] border border-slate-200 dark:border-slate-800 p-6">
          <div className="border-l-2 border-slate-900 dark:border-slate-400 pl-3 mb-6">
            <h2 className="font-cinzel text-base font-bold text-slate-900 dark:text-white uppercase">
              Aniversários do Mês Atual (Mês {currentMonth})
            </h2>
          </div>

          {aniversariantesMes.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-sans">
              Nenhum aniversário de confrade registrado para este mês.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {aniversariantesMes.map(a => (
                <div key={a.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-12 py-1 text-center font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                      Dia {a.data_nascimento?.split('-')[2]}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {atribuirNomeReligioso(a.grau, a.nome_civil) || a.nome_religioso || a.nome_civil}
                      </span>
                      <span className="text-slate-500 text-[11px] font-sans">
                        {a.grau || 'Grau não informado'} • {formatarComunidadeReligiosa(a.comunidade_atual_nome) || 'Província BRM'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {a.whatsapp && (
                      <a
                        href={`https://wa.me/55${a.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-cinzel text-[10px] uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3 h-3" />
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
