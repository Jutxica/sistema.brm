/**
 * Utilitários para tratamento, normalização e deduplicação de obras e comunidades.
 * Evita repetições visuais e inconsistências cadastrais em selects e formulários.
 */

export interface ObraItemBase {
  id: string;
  nome: string;
  tipo?: string | null;
  cidade?: string | null;
  localidade?: string | null;
  uf?: string | null;
  estado?: string | null;
  endereco?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cep?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  diocese?: string | null;
  status?: string | null;
  comunidade_id?: string | null;
  [key: string]: any;
}

/**
 * Normaliza o nome da obra para fins de comparação e deduplicação.
 */
export function normalizarNomeObra(nome?: string | null): string {
  if (!nome) return '';
  return nome
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Calcula a pontuação de completude cadastral de uma obra.
 */
function pontuarCompletude(o: ObraItemBase): number {
  let score = 0;
  if (o.cidade?.trim()) score += 2;
  if (o.localidade?.trim()) score += 1;
  if (o.uf?.trim() || o.estado?.trim()) score += 2;
  if (o.endereco?.trim() || o.logradouro?.trim()) score += 3;
  if (o.cep?.trim()) score += 1;
  if (o.telefone?.trim()) score += 1;
  if (o.whatsapp?.trim()) score += 1;
  if (o.email?.trim()) score += 1;
  if (o.diocese?.trim()) score += 1;
  if (o.comunidade_id?.trim()) score += 2;
  if (o.numero?.trim()) score += 1;
  if (o.bairro?.trim()) score += 1;
  return score;
}

export interface ResultadoProcessamentoObras<T extends ObraItemBase> {
  obrasDeduplicadas: T[];
  aliasMap: Map<string, string>; // Mapeia id antigo/duplicado ou nome normalizado -> id canônico
}

/**
 * Deduplica uma lista de obras, mesclando dados cadastrais mais ricos
 * e gerando um mapa de equivalência de IDs para evitar quebra de chaves estrangeiras.
 */
export function processarObrasReferencia<T extends ObraItemBase>(obras: T[]): ResultadoProcessamentoObras<T> {
  const mapPorNome = new Map<string, T>();
  const aliasMap = new Map<string, string>();

  // Primeiro passo: identificar obras canônicas e mesclar dados
  for (const item of obras) {
    if (!item?.nome) continue;
    const chave = normalizarNomeObra(item.nome);
    if (!chave) continue;

    const existente = mapPorNome.get(chave);
    if (!existente) {
      mapPorNome.set(chave, { ...item });
      aliasMap.set(item.id, item.id);
      aliasMap.set(chave, item.id);
    } else {
      // Comparar qual tem mais informações
      const scoreExistente = pontuarCompletude(existente);
      const scoreNovo = pontuarCompletude(item);

      const [canonico, secundario] = scoreNovo > scoreExistente ? [item, existente] : [existente, item];

      // Mesclar campos complementares no canônico
      const mesclado: T = {
        ...canonico,
        cidade: canonico.cidade || secundario.cidade,
        localidade: canonico.localidade || secundario.localidade || canonico.cidade || secundario.cidade,
        uf: canonico.uf || secundario.uf,
        estado: canonico.estado || secundario.estado || canonico.uf || secundario.uf,
        endereco: canonico.endereco || secundario.endereco,
        logradouro: canonico.logradouro || secundario.logradouro,
        numero: canonico.numero || secundario.numero,
        complemento: canonico.complemento || secundario.complemento,
        bairro: canonico.bairro || secundario.bairro,
        cep: canonico.cep || secundario.cep,
        telefone: canonico.telefone || secundario.telefone,
        whatsapp: canonico.whatsapp || secundario.whatsapp,
        email: canonico.email || secundario.email,
        diocese: canonico.diocese || secundario.diocese,
        comunidade_id: canonico.comunidade_id || secundario.comunidade_id,
        tipo: canonico.tipo || secundario.tipo || 'Obra',
      };

      mapPorNome.set(chave, mesclado);
      aliasMap.set(secundario.id, canonico.id);
      aliasMap.set(canonico.id, canonico.id);
      aliasMap.set(chave, canonico.id);
    }
  }

  const obrasDeduplicadas = Array.from(mapPorNome.values()).sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR')
  );

  return { obrasDeduplicadas, aliasMap };
}

/**
 * Retorna diretamente o array deduplicado de obras ordenado por nome.
 */
export function deduplicarObras<T extends ObraItemBase>(obras: T[]): T[] {
  return processarObrasReferencia(obras).obrasDeduplicadas;
}
