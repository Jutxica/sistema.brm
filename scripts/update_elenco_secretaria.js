const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/ElencoSecretaria.tsx', 'utf8');

// 1. Add state variables after filtroSituacao
const stateAnchor = "  const [filtroSituacao, setFiltroSituacao] = useState<'todos' | SituacaoElenco>('todos');";
const stateNew = `  const [filtroSituacao, setFiltroSituacao] = useState<'todos' | SituacaoElenco>('todos');
  const [filtroRegiao, setFiltroRegiao] = useState<string>('todas');
  const [filtroComunidadeId, setFiltroComunidadeId] = useState<string>('todas');
  const [filtroObraId, setFiltroObraId] = useState<string>('todas');`;

c = c.replace(stateAnchor, stateNew);

// 2. Add memos for regioes, comunidades filtradas, obras da comunidade
const memoAnchor = "  const filtrados = useMemo(() => {";
const memoNew = `  const regioesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    comunidades.forEach(item => {
      if (item.regiao && item.regiao.trim()) set.add(item.regiao.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [comunidades]);

  const comunidadesFiltradas = useMemo(() => {
    if (filtroRegiao === 'todas') return comunidades;
    return comunidades.filter(item => item.regiao === filtroRegiao);
  }, [comunidades, filtroRegiao]);

  const obrasDaComunidade = useMemo(() => {
    if (filtroComunidadeId === 'todas') return [];
    return obras.filter(item => item.comunidade_id === filtroComunidadeId);
  }, [obras, filtroComunidadeId]);

  const filtrados = useMemo(() => {
    const termo = query.trim().toLocaleLowerCase('pt-BR');
    return religiosos.filter(religioso => {
      if (filtroSituacao !== 'todos' && religioso.situacao_elenco !== filtroSituacao) return false;
      const relacoes = designacoesPorReligioso.get(religioso.id) || [];

      // Filtro por Região
      if (filtroRegiao !== 'todas') {
        const pertenceRegiao = relacoes.some(item => {
          if (item.comunidade_id) {
            return mapaComunidades.get(item.comunidade_id)?.regiao === filtroRegiao;
          }
          if (item.obra_id) {
            const obra = mapaObras.get(item.obra_id);
            if (obra?.comunidade_id) {
              return mapaComunidades.get(obra.comunidade_id)?.regiao === filtroRegiao;
            }
          }
          return false;
        });
        if (!pertenceRegiao) return false;
      }

      // Filtro por Comunidade
      if (filtroComunidadeId !== 'todas') {
        const pertenceComunidade = relacoes.some(item => {
          if (item.comunidade_id === filtroComunidadeId) return true;
          if (item.obra_id) {
            const obra = mapaObras.get(item.obra_id);
            return obra?.comunidade_id === filtroComunidadeId;
          }
          return false;
        });
        if (!pertenceComunidade) return false;
      }

      // Filtro por Obra específica
      if (filtroObraId !== 'todas') {
        const pertenceObra = relacoes.some(item => item.obra_id === filtroObraId);
        if (!pertenceObra) return false;
      }

      if (!termo) return true;
      const nomes = [religioso.nome_elenco || '', religioso.nome_civil || '', religioso.nome_religioso || '', religioso.grau];
      const lugares = relacoes.flatMap(item => [
        item.funcao,
        mapaComunidades.get(item.comunidade_id || '')?.nome || '',
        mapaObras.get(item.obra_id || '')?.nome || '',
      ]);
      return [...nomes, ...lugares].join(' ').toLocaleLowerCase('pt-BR').includes(termo);
    });
  }, [religiosos, query, filtroSituacao, filtroRegiao, filtroComunidadeId, filtroObraId, designacoesPorReligioso, mapaComunidades, mapaObras]);`;

// Replace original filtrados block
const originalFiltrados = `  const filtrados = useMemo(() => {
    const termo = query.trim().toLocaleLowerCase('pt-BR');
    return religiosos.filter(religioso => {
      if (filtroSituacao !== 'todos' && religioso.situacao_elenco !== filtroSituacao) return false;
      if (!termo) return true;
      const nomes = [religioso.nome_elenco || '', religioso.nome_civil || '', religioso.nome_religioso || '', religioso.grau];
      const relacoes = designacoesPorReligioso.get(religioso.id) || [];
      const lugares = relacoes.flatMap(item => [
        item.funcao,
        mapaComunidades.get(item.comunidade_id || '')?.nome || '',
        mapaObras.get(item.obra_id || '')?.nome || '',
      ]);
      return [...nomes, ...lugares].join(' ').toLocaleLowerCase('pt-BR').includes(termo);
    });
  }, [religiosos, query, filtroSituacao, designacoesPorReligioso, mapaComunidades, mapaObras]);`;

c = c.replace(originalFiltrados, memoNew);

// 3. Update the filter bar in the UI
const filterBarOld = `        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Pesquisar religioso, comunidade, obra ou função..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          <label className="relative flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500">Situação</span>
            <select value={filtroSituacao} onChange={event => setFiltroSituacao(event.target.value as typeof filtroSituacao)} className="appearance-none bg-transparent pr-5 text-sm outline-none">
              <option value="todos">Todas</option>
              <option value="Ativo">Ativos</option>
              <option value="Ausente">Ausentes</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-slate-400" />
          </label>
        </div>`;

const filterBarNew = `        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Pesquisar religioso, comunidade, obra ou função..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>

            <label className="relative flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 shrink-0">
              <span className="text-xs font-medium text-slate-500">Região</span>
              <select
                value={filtroRegiao}
                onChange={event => {
                  setFiltroRegiao(event.target.value);
                  setFiltroComunidadeId('todas');
                  setFiltroObraId('todas');
                }}
                className="appearance-none bg-transparent pr-5 text-xs outline-none font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="todas">Todas as regiões</option>
                {regioesDisponiveis.map(regiao => (
                  <option key={regiao} value={regiao}>{regiao}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
            </label>

            <label className="relative flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 shrink-0">
              <span className="text-xs font-medium text-slate-500">Comunidade</span>
              <select
                value={filtroComunidadeId}
                onChange={event => {
                  setFiltroComunidadeId(event.target.value);
                  setFiltroObraId('todas');
                }}
                className="appearance-none bg-transparent pr-5 text-xs outline-none font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate"
              >
                <option value="todas">Todas as comunidades</option>
                {comunidadesFiltradas.map(com => (
                  <option key={com.id} value={com.id}>{com.nome}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
            </label>

            <label className="relative flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 shrink-0">
              <span className="text-xs font-medium text-slate-500">Situação</span>
              <select value={filtroSituacao} onChange={event => setFiltroSituacao(event.target.value as typeof filtroSituacao)} className="appearance-none bg-transparent pr-5 text-xs outline-none">
                <option value="todos">Todas</option>
                <option value="Ativo">Ativos</option>
                <option value="Ausente">Ausentes</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
            </label>
          </div>

          {/* Painel de Obras e Instituições Integrantes da Comunidade Selecionada */}
          {filtroComunidadeId !== 'todas' && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-white/[0.02] p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#226380] dark:text-[#A3C3C7]" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {mapaComunidades.get(filtroComunidadeId)?.nome}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    • {mapaComunidades.get(filtroComunidadeId)?.regiao || 'Região'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {obrasDaComunidade.length} obra(s) / instituição(ões) integrante(s)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">
                  Filtrar por instituição:
                </span>
                <button
                  type="button"
                  onClick={() => setFiltroObraId('todas')}
                  className={\`rounded-md border px-2.5 py-1 text-xs transition-colors cursor-pointer \${
                    filtroObraId === 'todas'
                      ? 'border-[#113240] bg-[#113240] text-white font-medium dark:border-white dark:bg-white dark:text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-slate-800'
                  }\`}
                >
                  Todas ({religiosos.filter(r => {
                    const relacoes = designacoesPorReligioso.get(r.id) || [];
                    return relacoes.some(item => item.comunidade_id === filtroComunidadeId || (item.obra_id && mapaObras.get(item.obra_id)?.comunidade_id === filtroComunidadeId));
                  }).length})
                </button>

                {obrasDaComunidade.map((obra, idx) => {
                  const numConfrades = religiosos.filter(r => {
                    const relacoes = designacoesPorReligioso.get(r.id) || [];
                    return relacoes.some(item => item.obra_id === obra.id);
                  }).length;

                  return (
                    <button
                      key={obra.id}
                      type="button"
                      onClick={() => setFiltroObraId(obra.id)}
                      className={\`rounded-md border px-2.5 py-1 text-xs transition-colors cursor-pointer flex items-center gap-1.5 \${
                        filtroObraId === obra.id
                          ? 'border-[#226380] bg-[#226380] text-white font-medium'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-slate-800'
                      }\`}
                    >
                      <span className="font-semibold text-[11px] opacity-75">{idx + 1}.</span>
                      <span>{obra.nome}</span>
                      <span className="ml-1 rounded px-1 text-[10px] bg-black/10 dark:bg-white/10 font-mono">
                        {numConfrades}
                      </span>
                    </button>
                  );
                })}

                {obrasDaComunidade.length === 0 && (
                  <span className="text-xs text-slate-400 italic">Nenhuma obra cadastrada nesta comunidade.</span>
                )}
              </div>
            </div>
          )}
        </div>`;

c = c.replace(filterBarOld, filterBarNew);

fs.writeFileSync('frontend/src/pages/ElencoSecretaria.tsx', c, 'utf8');
console.log('ElencoSecretaria.tsx updated successfully with cascading filters and separated works panel!');
