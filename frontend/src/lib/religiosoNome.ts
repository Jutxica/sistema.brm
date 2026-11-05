/**
 * Utilitário Canônico de Atribuição de Nomes Religiosos da Província BRM
 * Regra Dehoniana:
 * - Frater -> "Fr. [nome e sobrenome], scj"
 * - Bispo / Dom -> "Dom [nome e sobrenome], scj"
 * - Diácono -> "Diác. [nome e sobrenome], scj"
 * - Irmão -> "Ir. [nome e sobrenome], scj"
 * - Padre / Presbítero -> "P. [nome e sobrenome], scj"
 * 
 * Nomes religiosos são atribuídos e não inscritos livremente.
 */

/**
 * Limpa o nome civil retirando títulos, prefixos ou sufixos congregacionais prévios.
 * Ex: "Pe. Carlos Eduardo, SCJ" -> "Carlos Eduardo"
 *     "Fr. Daugmar Zeitz Kraus, scj" -> "Daugmar Zeitz Kraus"
 */
export function limparNomeCivil(nome?: string | null): string {
  if (!nome) return '';
  let clean = nome.trim();

  // Remove sufixos congregacionais no final (ex: , scj / , SCJ / SCJ / , s.c.j. / dehoniano)
  clean = clean.replace(/(?:,\s*|\s+)(?:scj|s\.c\.j\.|dehoniano|dehonianos)\.?$/i, '').trim();

  // Remove títulos e prefixos comuns no início sucessivamente
  let prev = '';
  while (prev !== clean) {
    prev = clean;
    clean = clean.replace(/^(dom|diác\.|diac\.|diácono|diacono|fr\.|frater|ir\.|irmão|irmao|pe\.|p\.|padre|presbítero|presbitero)\s+/i, '').trim();
  }

  return clean;
}

/**
 * Retorna o prefixo canônico oficial correspondente ao grau religioso.
 */
export function obterPrefixoPorGrau(grau?: string | null): string {
  const g = (grau || '').trim().toLowerCase();

  if (g.includes('frater')) {
    return 'Fr.';
  }
  if (g.includes('bispo') || g.includes('dom')) {
    return 'Dom';
  }
  if (g.includes('diác') || g.includes('diac')) {
    return 'Diác.';
  }
  if (g.includes('irmã') || g.includes('irma')) {
    return 'Ir.';
  }
  // Padre / Presbítero / SCJ default
  return 'P.';
}

/**
 * Atribui o Nome Religioso oficial Dehoniano a partir do Grau e Nome:
 * - se uma pessoa é Frater: Fr. (nome e sobrenome), scj
 * - se for Bispo: Dom (nome e sobrenome), scj
 * - se for Diacono: Diác. (nome e sobrenome), scj
 * - se for Irmão: Ir. (nome e sobrenome), scj
 * - se for Padre: P. (nome e sobrenome), scj
 */
export function atribuirNomeReligioso(grau?: string | null, nomeCivil?: string | null): string {
  const nomeLimpo = limparNomeCivil(nomeCivil);
  if (!nomeLimpo) return '';

  const prefixo = obterPrefixoPorGrau(grau);
  return `${prefixo} ${nomeLimpo}, scj`;
}

/**
 * Retorna o nome formatado de exibição para cards, listas e diretórios.
 */
export function formatarNomeApresentacao(
  grau?: string | null,
  nomeCivil?: string | null,
  fallback = 'Confrade Dehoniano'
): string {
  const atribuido = atribuirNomeReligioso(grau, nomeCivil);
  if (atribuido) return atribuido;
  const limpo = limparNomeCivil(nomeCivil);
  if (limpo) return limpo;
  return fallback;
}

/**
 * Formata o nome canônico de exibição da Comunidade Religiosa onde o confrade reside/atua.
 * Elimina rótulos administrativos territoriais ("Territorial ...", "Local ...")
 * e exibe o nome concreto da Comunidade / Casa / Paróquia Dehoniana.
 */
export function formatarComunidadeReligiosa(
  comunidadeOuTerritorio?: string | null,
  obraOuCasa?: string | null
): string {
  let target = (comunidadeOuTerritorio || '').trim();
  if (obraOuCasa && obraOuCasa.trim() && !target) {
    target = obraOuCasa.trim();
  }
  if (!target) {
    return '';
  }

  // Caso específico de Rondônia
  if (/^territorial\s+(?:de\s+)?rond[ôo]nia/i.test(target)) {
    return 'Comunidade Dehoniana de Rondônia';
  }

  // Caso específico de Rio Grande do Sul
  if (/^territorial\s+s[ãa]o\s+miguel/i.test(target)) {
    return 'Comunidade Dehoniana do Rio Grande do Sul';
  }

  // Casos territoriais gerais: converte "Territorial X" em "Comunidade X"
  if (/^territorial\s*[-–:]*\s*/i.test(target)) {
    return target.replace(/^territorial\s*[-–:]*\s*/i, 'Comunidade ');
  }

  // Casos "Local X": converte para "Comunidade X"
  if (/^local\s*[-–:]*\s*/i.test(target)) {
    return target.replace(/^local\s*[-–:]*\s*/i, 'Comunidade ');
  }

  return target;
}
