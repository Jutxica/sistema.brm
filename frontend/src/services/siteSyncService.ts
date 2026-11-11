import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export interface SiteConfig {
  site_url: string;
  site_supabase_url: string;
  site_supabase_key: string;
}

export interface SiteReligiosoItem {
  id: string; // slug único, ex: p-ari-joao-erthal-66ba63c168f5d
  nome: string;
  cargo: string;
  comunidade: string;
  cidade: string;
  categoria: 'padres' | 'bispos' | 'fratres' | 'irmaos';
  subcategoria?: string | null;
  nascimento?: string | null;
  profissao?: string | null;
  profissaoperpetua?: string | null;
  ordenacao?: string | null;
  ordenacaodiaconal?: string | null;
  ordenacaopresbiteral?: string | null;
  ordenacaoepiscopal?: string | null;
  falecimento?: string | null;
  dataFalecimento?: string | null;
  lema?: string | null;
  bio?: string | null;
  foto?: string | null;
  primeiraProfissao?: string | null;
  profissaoPerpetua?: string | null;
  localTrabalho?: string | null;
  localTrabalhoId?: string | null;
}

export interface SiteEquipeMembro {
  foto: string;
  nome: string;
  cargo: string;
  link_perfil: string;
  religioso_id: string;
}

export interface SiteLocalItem {
  id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  equipe?: SiteEquipeMembro[];
}

export const OFFICIAL_SITE_SYNC_URL = 'https://testes.scj.org.br/api/sync/religioso';
export const OFFICIAL_SITE_SYNC_TOKEN = 'brm-curia-sync-2026';

export interface OfficialSiteSyncPayload {
  // Identificadores e compatibilidade
  id?: string;
  slug?: string;
  religioso_id?: string;
  numero_cadastro?: number | null;

  // Campos exigidos na integração
  nome: string;
  data_nascimento?: string | null;
  nascimento?: string | null;
  cidade_nascimento?: string | null;
  naturalidade?: string | null;
  foto?: string | null;
  foto_url?: string | null;
  lema?: string | null;
  lema_sacerdotal?: string | null;
  grau?: string;
  categoria?: string;
  comunidade?: string;
  paroquia?: string;
  cidade?: string;
  cargo?: string;
  funcao?: string;
  primeira_profissao?: string | null;
  profissao_perpetua?: string | null;
  ordenacao_diaconal?: string | null;
  ordenacao_presbiteral?: string | null;
  ordenacao?: string | null;
  ordenacao_episcopal?: string | null;
  biografia?: string | null;
  bio?: string | null;

  [key: string]: any;
}

const DEFAULT_CONFIG: SiteConfig = {
  site_url: 'https://scj-brm.onrender.com',
  site_supabase_url: '',
  site_supabase_key: '',
};

const LOCAL_STORAGE_KEY = 'scj_site_integration_config';

export const siteSyncService = {
  /**
   * Obtém as configurações do site salvas (banco de dados ou cache local)
   */
  async getConfig(): Promise<SiteConfig> {
    try {
      const { data, error } = await supabase
        .from('religiosos_configuracoes')
        .select('site_url, site_supabase_url, site_supabase_key')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .maybeSingle();

      if (!error && data) {
        return {
          site_url: data.site_url || DEFAULT_CONFIG.site_url,
          site_supabase_url: data.site_supabase_url || '',
          site_supabase_key: data.site_supabase_key || '',
        };
      }
    } catch (e) {
      console.warn('Não foi possível ler configurações do banco, tentando storage local:', e);
    }

    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(cached) };
      }
    } catch {
      // Ignora erro no parse do localStorage
    }

    return DEFAULT_CONFIG;
  },

  /**
   * Salva configurações de integração
   */
  async saveConfig(config: Partial<SiteConfig>): Promise<void> {
    const current = await this.getConfig();
    const updated: SiteConfig = { ...current, ...config };

    // Sempre salva no localStorage para contingência
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // Tenta persistir no banco de dados
    try {
      await supabase.from('religiosos_configuracoes').upsert({
        id: '00000000-0000-0000-0000-000000000001',
        site_url: updated.site_url,
        site_supabase_url: updated.site_supabase_url,
        site_supabase_key: updated.site_supabase_key,
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Banco não possui colunas de site ou erro no salvamento do banco:', e);
    }
  },

  /**
   * Formata data para DD/MM/AAAA
   */
  formatDateBr(value?: string | null): string | null {
    if (!value) return null;
    const clean = value.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return value;
  },

  /**
   * Gera slug canônico consistente para o religioso no site oficial
   */
  generateSlug(nome: string, grau?: string, existingSlug?: string | null): string {
    if (existingSlug && existingSlug.trim()) {
      return existingSlug.trim();
    }

    const n = (nome || '').trim();
    const lower = n.toLowerCase();

    let prefix = 'p-';
    if (grau === 'Bispo' || lower.includes('bispo') || lower.startsWith('dom ')) prefix = 'dom-';
    else if (grau === 'Frater' || lower.includes('frater') || lower.startsWith('fr. ') || lower.startsWith('frater ')) prefix = 'fr-';
    else if (grau === 'Irmão' || lower.includes('irmao') || lower.includes('irmão') || lower.startsWith('ir. ') || lower.startsWith('irmao ')) prefix = 'ir-';

    const cleanName = n
      .replace(/^(Pe\.|Padre|Fr\.|Frater|Ir\.|Irmão|Dom|SCJ|,|\.)\s*/gi, '')
      .replace(/,\s*SCJ$/gi, '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Sufixo breve determinístico baseado no nome para evitar colisões
    const hash = Math.abs(
      cleanName.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
    ).toString(16).substring(0, 6);

    return `${prefix}${cleanName}-${hash}`;
  },

  /**
   * Instancia cliente Supabase para o projeto do site oficial
   */
  getSiteSupabaseClient(config: SiteConfig) {
    if (!config.site_supabase_url || !config.site_supabase_key) {
      return null;
    }
    return createClient(config.site_supabase_url, config.site_supabase_key);
  },

  /**
   * Testa a conectividade com o site (via Supabase ou API HTTP)
   */
  async testConnection(config?: Partial<SiteConfig>): Promise<{ success: boolean; message: string; mode: 'supabase' | 'api' }> {
    const current = config ? { ...(await this.getConfig()), ...config } : await this.getConfig();

    // 1. Testa via Supabase direto se credenciais estiverem preenchidas
    if (current.site_supabase_url && current.site_supabase_key) {
      try {
        const client = createClient(current.site_supabase_url, current.site_supabase_key);
        const { count, error } = await client.from('religiosos').select('*', { count: 'exact', head: true });
        if (error) {
          throw new Error(error.message);
        }
        return {
          success: true,
          message: `Conectado com sucesso ao Supabase do site! Tabela de religiosos acessível (${count || 0} registros encontrados).`,
          mode: 'supabase',
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Falha ao conectar no Supabase do site: ${err.message || 'Verifique a URL e a API Key.'}`,
          mode: 'supabase',
        };
      }
    }

    // 2. Fallback: Testa endpoint público do site via HTTP
    if (current.site_url) {
      try {
        const targetUrl = current.site_url.replace(/\/$/, '') + '/api/religiosos?limit=1';
        const res = await fetch(targetUrl);
        if (!res.ok) {
          throw new Error(`Status HTTP ${res.status} (${res.statusText})`);
        }
        const json = await res.json();
        const total = json?.meta?.total ?? json?.items?.length ?? 0;
        return {
          success: true,
          message: `Conexão bem-sucedida via API do site (${total} religiosos listados). Para permitir gravação direta, informe também as chaves do Supabase.`,
          mode: 'api',
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Falha ao conectar na URL do site (${current.site_url}): ${err.message}`,
          mode: 'api',
        };
      }
    }

    return {
      success: false,
      message: 'Nenhuma URL configurada para o site.',
      mode: 'api',
    };
  },

  /**
   * Testa a conectividade com o endpoint oficial de sincronização automática
   */
  async testSyncEndpoint(
    endpointUrl: string = OFFICIAL_SITE_SYNC_URL,
    token: string = OFFICIAL_SITE_SYNC_TOKEN
  ): Promise<{ success: boolean; message: string; status?: number }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sync-token': token,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ping: true, teste_conexao: true }),
        signal: controller.signal,
      });

      if (res.status === 200) {
        return {
          success: true,
          message: `Endpoint de sincronização oficial online e autenticado (HTTP 200 OK em ${endpointUrl})!`,
          status: 200,
        };
      } else {
        return {
          success: false,
          message: `Endpoint respondeu com status HTTP ${res.status} (${res.statusText}).`,
          status: res.status,
        };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return {
          success: false,
          message: `Timeout ao testar o endpoint (${endpointUrl}) após 8s. O site pode estar em deploy ou com alta latência.`,
        };
      }
      return {
        success: false,
        message: `Falha ao conectar no endpoint oficial (${endpointUrl}): ${err?.message || err}`,
      };
    } finally {
      clearTimeout(timer);
    }
  },

  /**
   * Busca as comunidades (locais) cadastradas no site oficial
   */
  async fetchSiteLocais(config?: SiteConfig): Promise<SiteLocalItem[]> {
    const cfg = config || (await this.getConfig());
    const client = this.getSiteSupabaseClient(cfg);

    if (client) {
      try {
        const { data, error } = await client.from('locais').select('id, nome, cidade, estado, equipe').order('nome');
        if (!error && data) return data as SiteLocalItem[];
      } catch (e) {
        console.warn('Erro ao buscar locais via Supabase:', e);
      }
    }

    // Fallback: busca via API
    try {
      const url = cfg.site_url.replace(/\/$/, '') + '/api/locais?limit=100';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return (json.items || json || []) as SiteLocalItem[];
      }
    } catch (e) {
      console.warn('Erro ao buscar locais via API:', e);
    }

    return [];
  },

  /**
   * Prepara o payload canônico para envio ao site oficial
   */
  async buildSitePayload(religiosoId: string): Promise<{
    item: SiteReligiosoItem;
    fotoUrl: string | null;
    comunidadeNome: string;
    cargoNome: string;
  }> {
    // 1. Busca dados do religioso
    const { data: rel, error: relError } = await supabase
      .from('religiosos')
      .select(`
        *,
        comunidade_atual:comunidades(id, nome, cidade, estado),
        obra_atual:obras(id, nome, cidade, estado)
      `)
      .eq('id', religiosoId)
      .single();

    if (relError || !rel) {
      throw new Error(`Religioso não encontrado: ${relError?.message || 'ID inválido'}`);
    }

    // 2. Busca sacramentos, votos, ordens e designações canônicas
    const [
      { data: votosData },
      { data: ordensData },
      { data: docsData },
      { data: desigData },
    ] = await Promise.all([
      supabase.from('religiosos_profissoes_votos').select('*').eq('religioso_id', religiosoId).order('data', { ascending: true }),
      supabase.from('religiosos_ministerios_ordens').select('*').eq('religioso_id', religiosoId).order('data', { ascending: true }),
      supabase.from('religiosos_documentos').select('*').eq('religioso_id', religiosoId).eq('status', 'Ativo'),
      supabase.from('religiosos_designacoes').select('funcao, tipo_vinculo, ano_referencia, vigencia_inicio, comunidades(nome)').eq('religioso_id', religiosoId).order('vigencia_inicio', { ascending: false }).limit(1),
    ]);

    const votos = votosData || [];
    const ordens = ordensData || [];
    const documentos = docsData || [];
    const desigAtiva = (desigData || [])[0];
    const funcaoDesignada = desigAtiva?.funcao || null;

    // 3. Determina a foto oficial (perfil 4x4)
    let fotoUrl: string | null = null;
    const docPerfil = documentos.find(d => (d.categoria || '').includes('Perfil') || (d.categoria || '').includes('4x4'));
    const docFoto = docPerfil || documentos.find(d => (d.categoria || '').includes('Foto'));
    const rawFotoPath = rel.foto_path || docFoto?.caminho_storage;

    if (rawFotoPath) {
      if (rawFotoPath.startsWith('http://') || rawFotoPath.startsWith('https://')) {
        fotoUrl = rawFotoPath;
      } else {
        const { data: publicData } = supabase.storage.from('religiosos-documentos').getPublicUrl(rawFotoPath);
        if (publicData?.publicUrl) {
          fotoUrl = publicData.publicUrl;
        }
      }
    }

    // 4. Determina datas canônicas
    const primVotos = votos.find(v => (v.tipo || '').toLowerCase().includes('primeir') || (v.tipo || '').toLowerCase().includes('tempor'));
    const perpVotos = votos.find(v => (v.tipo || '').toLowerCase().includes('perp'));
    const ordPresb = ordens.find(o => (o.tipo || '').toLowerCase().includes('presb') || (o.tipo || '').toLowerCase().includes('sacerd'));
    const ordDiac = ordens.find(o => (o.tipo || '').toLowerCase().includes('diac'));
    const ordEpisc = ordens.find(o => (o.tipo || '').toLowerCase().includes('episc') || (o.tipo || '').toLowerCase().includes('bispo'));

    // 5. Determina categoria canônica no site
    let categoria: 'padres' | 'bispos' | 'fratres' | 'irmaos' = 'padres';
    const grau = rel.grau || '';
    if (grau === 'Bispo' || ordEpisc) {
      categoria = 'bispos';
    } else if (grau === 'Frater') {
      categoria = 'fratres';
    } else if (grau === 'Irmão') {
      categoria = 'irmaos';
    } else {
      categoria = 'padres';
    }

    // 6. Determina comunidade e cargo
    const comObj = desigAtiva?.comunidades;
    const comDesignada = Array.isArray(comObj) ? (comObj[0] as any)?.nome : (comObj as any)?.nome;
    const comunidadeNome = comDesignada || rel.comunidade_atual?.nome || rel.obra_atual?.nome || 'Província BRM';

    // Se cadastrado ou designado como Superior de comunidade, garante identificação no perfil público
    const isSuperior = (funcaoDesignada || '').toLowerCase().includes('superior') ||
                       (rel.cargo || '').toLowerCase().includes('superior') ||
                       (rel.oficio_atual || '').toLowerCase().includes('superior');

    let cargoNome = funcaoDesignada || rel.cargo;
    if (isSuperior && (!cargoNome || !cargoNome.toLowerCase().includes('superior'))) {
      cargoNome = 'Superior da Comunidade';
    }
    if (!cargoNome) {
      cargoNome = categoria === 'padres' ? 'Sacerdote Dehoniano' : categoria === 'fratres' ? 'Frater Dehoniano' : 'Religioso Dehoniano';
    }

    // 7. Determina cidade
    const cidadeFormatada = rel.municipio_nascimento && rel.estado_nascimento 
      ? `${rel.municipio_nascimento} / ${rel.estado_nascimento}`
      : (rel.comunidade_atual?.cidade ? `${rel.comunidade_atual.cidade} / ${rel.comunidade_atual.estado || 'SC'}` : 'Santa Catarina / Paraná');

    // 8. Determina slug único
    const slug = this.generateSlug(rel.nome_religioso || rel.nome_civil, rel.grau, rel.publicado_site_id);

    // 9. Nome formatado com título
    let nomeFormatado = rel.nome_religioso || rel.nome_civil;
    if (!nomeFormatado.toLowerCase().includes('pe.') && !nomeFormatado.toLowerCase().includes('fr.') && !nomeFormatado.toLowerCase().includes('ir.') && !nomeFormatado.toLowerCase().includes('dom ')) {
      if (categoria === 'padres') nomeFormatado = `Pe. ${nomeFormatado}`;
      else if (categoria === 'fratres') nomeFormatado = `Fr. ${nomeFormatado}`;
      else if (categoria === 'irmaos') nomeFormatado = `Ir. ${nomeFormatado}`;
      else if (categoria === 'bispos') nomeFormatado = `Dom ${nomeFormatado}`;
    }
    if (!nomeFormatado.includes('SCJ')) {
      nomeFormatado = `${nomeFormatado}, SCJ`;
    }

    const item: SiteReligiosoItem = {
      id: slug,
      nome: nomeFormatado,
      cargo: cargoNome,
      comunidade: comunidadeNome,
      cidade: cidadeFormatada,
      categoria,
      subcategoria: isSuperior ? 'Superior da Comunidade' : null,
      nascimento: this.formatDateBr(rel.data_nascimento),
      profissao: this.formatDateBr(primVotos?.data),
      primeiraProfissao: this.formatDateBr(primVotos?.data),
      profissaoperpetua: this.formatDateBr(perpVotos?.data),
      profissaoPerpetua: this.formatDateBr(perpVotos?.data),
      ordenacao: this.formatDateBr(ordPresb?.data || ordens[0]?.data),
      ordenacaodiaconal: this.formatDateBr(ordDiac?.data),
      ordenacaopresbiteral: this.formatDateBr(ordPresb?.data),
      ordenacaoepiscopal: this.formatDateBr(ordEpisc?.data),
      lema: rel.lema || ordPresb?.lema || 'Ecce Venio — Eis que venho para fazer a Tua vontade',
      bio: rel.observacoes || `${nomeFormatado} é religioso consagrado da Congregação dos Sacerdotes do Sagrado Coração de Jesus (Dehonianos), atuando no serviço pastoral, comunitário e educacional da Província BRM em ${comunidadeNome}.`,
      foto: fotoUrl,
      localTrabalho: comunidadeNome,
      localTrabalhoId: rel.comunidade_atual?.id || rel.obra_atual?.id || null,
    };

    return {
      item,
      fotoUrl,
      comunidadeNome,
      cargoNome,
    };
  },

  /**
   * Publica o religioso e atualiza a comunidade/equipe no site oficial
   */
  async publishToSite(
    religiosoId: string,
    payloadOverride?: Partial<SiteReligiosoItem>,
    targetLocalId?: string,
    atorNome: string = 'Secretaria Provincial'
  ): Promise<{ success: boolean; message: string; slug: string }> {
    const config = await this.getConfig();
    const { item: defaultItem, fotoUrl } = await this.buildSitePayload(religiosoId);
    const finalItem: SiteReligiosoItem = { ...defaultItem, ...payloadOverride };

    const client = this.getSiteSupabaseClient(config);

    if (client) {
      // 1. Grava no Supabase do site (tabela 'religiosos')
      const { error: upsertError } = await client
        .from('religiosos')
        .upsert(finalItem, { onConflict: 'id' });

      if (upsertError) {
        throw new Error(`Erro ao salvar na tabela 'religiosos' do site: ${upsertError.message}`);
      }

      // 2. Atualiza tabela 'locais' (equipe da comunidade)
      try {
        const { data: locaisData } = await client.from('locais').select('id, nome, equipe');
        if (locaisData && locaisData.length > 0) {
          const membroEquipe: SiteEquipeMembro = {
            foto: finalItem.foto || '/assets/religiosos/avatar-padrao.jpg',
            nome: finalItem.nome,
            cargo: finalItem.cargo,
            link_perfil: `/institucional/religioso?id=${finalItem.id}`,
            religioso_id: finalItem.id,
          };

          for (const local of locaisData) {
            const currentEquipe: SiteEquipeMembro[] = Array.isArray(local.equipe) ? local.equipe : [];
            const isTarget = targetLocalId 
              ? local.id === targetLocalId 
              : (local.nome || '').trim().toLowerCase() === (finalItem.comunidade || '').trim().toLowerCase();

            if (isTarget) {
              // Adiciona ou atualiza na equipe deste local
              const idx = currentEquipe.findIndex(m => m.religioso_id === finalItem.id || m.nome === finalItem.nome);
              let novaEquipe: SiteEquipeMembro[];
              if (idx !== -1) {
                novaEquipe = [...currentEquipe];
                novaEquipe[idx] = membroEquipe;
              } else {
                novaEquipe = [...currentEquipe, membroEquipe];
              }
              await client.from('locais').update({ equipe: novaEquipe }).eq('id', local.id);
            } else {
              // Se estava antes em outra comunidade, remove da equipe antiga
              const hasMember = currentEquipe.some(m => m.religioso_id === finalItem.id);
              if (hasMember) {
                const equipeSemEle = currentEquipe.filter(m => m.religioso_id !== finalItem.id);
                await client.from('locais').update({ equipe: equipeSemEle }).eq('id', local.id);
              }
            }
          }
        }
      } catch (e: any) {
        console.warn('Aviso: Não foi possível sincronizar locais.equipe automaticamente:', e?.message);
      }
    } else {
      // Fallback: via API do site se Supabase direto não estiver configurado
      const apiUrl = config.site_url.replace(/\/$/, '') + '/api/religiosos';
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalItem),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Falha na API do site (${res.status}): ${text || res.statusText}`);
      }
    }

    // 3. Atualiza status no Sistema BRM
    const now = new Date().toISOString();
    try {
      await supabase
        .from('religiosos')
        .update({
          publicado_site_em: now,
          publicado_site_id: finalItem.id,
          publicado_site_status: 'publicado',
        })
        .eq('id', religiosoId);
    } catch (e) {
      console.warn('Não foi possível salvar colunas de publicação em religiosos:', e);
    }

    // 4. Registra histórico na secretaria
    try {
      await supabase.from('secretaria_ficha_eventos').insert({
        religioso_id: religiosoId,
        religioso_nome: finalItem.nome,
        status_novo: 'Publicado no Site',
        ator_nome: atorNome,
        observacao: `Perfil oficial publicado com sucesso no site oficial (ID: ${finalItem.id}). Vínculo: ${finalItem.comunidade} (${finalItem.cargo}).`,
      });
    } catch {
      // Ignora erro de evento se tabela tiver restrição
    }

    // 5. Dispara sincronização com o endpoint da API oficial de sync
    this.triggerOfficialSiteSync(religiosoId, payloadOverride as any);

    return {
      success: true,
      message: `Religioso ${finalItem.nome} publicado com sucesso no Site Oficial!`,
      slug: finalItem.id,
    };
  },

  /**
   * Constrói o payload completo exigido pelo endpoint de sincronização do site oficial:
   * https://testes.scj.org.br/api/sync/religioso
   */
  async buildOfficialSitePayload(
    religiosoId: string,
    extraOverrides?: Partial<OfficialSiteSyncPayload>
  ): Promise<OfficialSiteSyncPayload> {
    // 1. Busca dados do religioso com tolerância a relacionamentos opcionais
    let rel: any = null;
    try {
      const { data, error } = await supabase
        .from('religiosos')
        .select(`
          *,
          comunidade_atual:comunidades(id, nome, cidade, estado),
          obra_atual:obras(id, nome, cidade, estado)
        `)
        .eq('id', religiosoId)
        .maybeSingle();

      if (!error && data) {
        rel = data;
      }
    } catch {
      // Fallback se obras não existir no schema cache
    }

    if (!rel) {
      try {
        const { data: relDirect, error: directErr } = await supabase
          .from('religiosos')
          .select(`
            *,
            comunidade_atual:comunidades(id, nome, cidade, estado)
          `)
          .eq('id', religiosoId)
          .maybeSingle();

        if (!directErr && relDirect) {
          rel = relDirect;
        }
      } catch {
        // Fallback básico
      }
    }

    if (!rel) {
      const { data: relFallback } = await supabase
        .from('religiosos')
        .select('*')
        .eq('id', religiosoId)
        .single();
      rel = relFallback;
    }

    if (!rel) {
      throw new Error(`Religioso com ID ${religiosoId} não foi encontrado.`);
    }

    // 2. Busca votos, ordens, documentos e designações
    const [votosRes, ordensRes, ordensAltRes, docsRes, desigRes] = await Promise.all([
      supabase.from('religiosos_profissoes_votos').select('*').eq('religioso_id', religiosoId).order('data', { ascending: true }),
      supabase.from('religiosos_ministerios_ordens').select('*').eq('religioso_id', religiosoId).order('data', { ascending: true }),
      supabase.from('religiosos_ordens').select('*').eq('religioso_id', religiosoId).order('data', { ascending: true }),
      supabase.from('religiosos_documentos').select('*').eq('religioso_id', religiosoId).eq('status', 'Ativo'),
      supabase.from('religiosos_designacoes').select('funcao, tipo_vinculo, ano_referencia, vigencia_inicio, comunidades(nome, cidade, estado)').eq('religioso_id', religiosoId).order('vigencia_inicio', { ascending: false }).limit(1),
    ]);

    const votos = votosRes.data || [];
    const ordens = (ordensRes.data && ordensRes.data.length > 0) ? ordensRes.data : (ordensAltRes.data || []);
    const documentos = docsRes.data || [];
    const desigAtiva = (desigRes.data || [])[0];

    // 3. Determina fotografia oficial (perfil 4x4)
    let fotoUrl: string | null = null;
    if (rel.foto_url && (rel.foto_url.startsWith('http://') || rel.foto_url.startsWith('https://'))) {
      fotoUrl = rel.foto_url;
    } else {
      const docPerfil = documentos.find(d => (d.categoria || '').includes('Perfil') || (d.categoria || '').includes('4x4'));
      const docFoto = docPerfil || documentos.find(d => (d.categoria || '').includes('Foto'));
      const rawFotoPath = rel.foto_path || docFoto?.caminho_storage;

      if (rawFotoPath) {
        if (rawFotoPath.startsWith('http://') || rawFotoPath.startsWith('https://')) {
          fotoUrl = rawFotoPath;
        } else {
          const { data: publicData } = supabase.storage.from('religiosos-documentos').getPublicUrl(rawFotoPath);
          if (publicData?.publicUrl) {
            fotoUrl = publicData.publicUrl;
          }
        }
      }
    }

    // 4. Determina datas canônicas
    const primVotos = votos.find(v => (v.tipo || '').toLowerCase().includes('primeir') || (v.tipo || '').toLowerCase().includes('tempor'));
    const perpVotos = votos.find(v => (v.tipo || '').toLowerCase().includes('perp'));
    const ordPresb = ordens.find(o => (o.tipo || '').toLowerCase().includes('presb') || (o.tipo || '').toLowerCase().includes('sacerd'));
    const ordDiac = ordens.find(o => (o.tipo || '').toLowerCase().includes('diac'));
    const ordEpisc = ordens.find(o => (o.tipo || '').toLowerCase().includes('episc') || (o.tipo || '').toLowerCase().includes('bispo'));

    // 5. Determina categoria e grau
    const grau = rel.grau || (ordEpisc ? 'Bispo' : ordPresb ? 'Padre' : ordDiac ? 'Diácono' : 'Padre');
    let categoria = 'padres';
    if (grau === 'Bispo' || ordEpisc) categoria = 'bispos';
    else if (grau === 'Frater') categoria = 'fratres';
    else if (grau === 'Irmão') categoria = 'irmaos';
    else if (grau === 'Diácono') categoria = 'padres';
    else categoria = 'padres';

    // 6. Determina nome formatado e canônico
    let nomeFormatado = (rel.nome_religioso || rel.nome_civil || '').trim();
    const lowerNome = nomeFormatado.toLowerCase();
    if (
      !lowerNome.startsWith('pe.') &&
      !lowerNome.startsWith('padre ') &&
      !lowerNome.startsWith('dom ') &&
      !lowerNome.startsWith('bispo ') &&
      !lowerNome.startsWith('fr.') &&
      !lowerNome.startsWith('frater ') &&
      !lowerNome.startsWith('ir.') &&
      !lowerNome.startsWith('irmão ') &&
      !lowerNome.startsWith('irmao ') &&
      !lowerNome.startsWith('diác.') &&
      !lowerNome.startsWith('diac.') &&
      !lowerNome.startsWith('diácono ') &&
      !lowerNome.startsWith('diacono ')
    ) {
      if (grau === 'Bispo') nomeFormatado = `Dom ${nomeFormatado}`;
      else if (grau === 'Frater') nomeFormatado = `Fr. ${nomeFormatado}`;
      else if (grau === 'Irmão') nomeFormatado = `Ir. ${nomeFormatado}`;
      else if (grau === 'Diácono') nomeFormatado = `Diác. ${nomeFormatado}`;
      else nomeFormatado = `Pe. ${nomeFormatado}`;
    }
    if (!nomeFormatado.includes('SCJ')) {
      nomeFormatado = `${nomeFormatado}, SCJ`;
    }

    // 7. Determina comunidade e paróquia
    const comObj = desigAtiva?.comunidades;
    const comDesignada = Array.isArray(comObj) ? (comObj[0] as any)?.nome : (comObj as any)?.nome;
    const comunidadeNome = comDesignada || rel.comunidade_atual_nome || rel.comunidade_atual?.nome || 'Província BRM';
    const paroquiaNome = rel.obra_atual_nome || rel.obra_atual?.nome || comunidadeNome;

    // 8. Determina função / cargo
    const funcaoDesignada = desigAtiva?.funcao || null;
    const isSuperior = (funcaoDesignada || '').toLowerCase().includes('superior') ||
                       (rel.cargo || '').toLowerCase().includes('superior') ||
                       (rel.oficio_atual || '').toLowerCase().includes('superior');

    let cargoNome = funcaoDesignada || rel.cargo || rel.oficio_atual;
    if (isSuperior && (!cargoNome || !cargoNome.toLowerCase().includes('superior'))) {
      cargoNome = 'Superior da Comunidade';
    }
    if (!cargoNome) {
      cargoNome = grau === 'Padre' ? 'Vigário Paroquial' :
                  grau === 'Bispo' ? 'Bispo Emérito / Titular' :
                  grau === 'Diácono' ? 'Diácono' :
                  grau === 'Frater' ? 'Frater Dehoniano' :
                  grau === 'Irmão' ? 'Irmão Dehoniano' : 'Religioso Dehoniano';
    }

    // 9. Determina cidade de atuação atual
    let cidadeAtuacao = '';
    if (rel.comunidade_atual?.cidade) {
      cidadeAtuacao = `${rel.comunidade_atual.cidade}${rel.comunidade_atual.estado ? ` - ${rel.comunidade_atual.estado}` : ''}`;
    } else if (rel.obra_atual?.cidade) {
      cidadeAtuacao = `${rel.obra_atual.cidade}${rel.obra_atual.estado ? ` - ${rel.obra_atual.estado}` : ''}`;
    } else {
      const comCidadeObj = Array.isArray(comObj) ? (comObj[0] as any) : (comObj as any);
      if (comCidadeObj?.cidade) {
        cidadeAtuacao = `${comCidadeObj.cidade}${comCidadeObj.estado ? ` - ${comCidadeObj.estado}` : ''}`;
      } else if (rel.municipio_nascimento && rel.estado_nascimento) {
        cidadeAtuacao = `${rel.municipio_nascimento} - ${rel.estado_nascimento}`;
      } else {
        cidadeAtuacao = 'Santa Catarina / Paraná';
      }
    }

    // 10. Naturalidade / Cidade de nascimento
    let cidadeNasc = '';
    if (rel.municipio_nascimento && rel.estado_nascimento) {
      cidadeNasc = `${rel.municipio_nascimento} - ${rel.estado_nascimento}`;
    } else {
      cidadeNasc = rel.municipio_nascimento || rel.local_nascimento || rel.naturalidade || 'Joinville - SC';
    }

    // 11. Lema e Biografia
    const lemaFinal = rel.lema_destacado || rel.lema || ordPresb?.lema || (Array.isArray(rel.lemas) && rel.lemas[0]?.texto) || 'Ecce Venio — Eis que venho para fazer a Tua vontade';
    const bioFinal = rel.biografia || rel.observacoes || rel.historico ||
      `${nomeFormatado} é religioso consagrado da Congregação dos Sacerdotes do Sagrado Coração de Jesus (Dehonianos), atuando no serviço pastoral e comunitário da Província BRM em ${comunidadeNome}.`;

    // 12. Slug canônico determinístico
    const slug = this.generateSlug(rel.nome_religioso || rel.nome_civil, rel.grau, rel.publicado_site_id);

    // 13. Monta o payload canônico para a integração oficial
    const payload: OfficialSiteSyncPayload = {
      id: slug,
      slug,
      religioso_id: rel.id,
      numero_cadastro: rel.numero_cadastro ?? null,
      nome: nomeFormatado,
      data_nascimento: rel.data_nascimento ? rel.data_nascimento.split('T')[0] : null,
      nascimento: this.formatDateBr(rel.data_nascimento),
      cidade_nascimento: cidadeNasc,
      naturalidade: cidadeNasc,
      foto: fotoUrl,
      foto_url: fotoUrl,
      lema: lemaFinal,
      lema_sacerdotal: lemaFinal,
      grau,
      categoria,
      comunidade: comunidadeNome,
      paroquia: paroquiaNome,
      cidade: cidadeAtuacao,
      cargo: cargoNome,
      funcao: cargoNome,
      primeira_profissao: this.formatDateBr(primVotos?.data) || primVotos?.data || null,
      profissao_perpetua: this.formatDateBr(perpVotos?.data) || perpVotos?.data || null,
      ordenacao_diaconal: this.formatDateBr(ordDiac?.data) || ordDiac?.data || null,
      ordenacao_presbiteral: this.formatDateBr(ordPresb?.data) || ordPresb?.data || null,
      ordenacao: this.formatDateBr(ordPresb?.data) || ordPresb?.data || null,
      ordenacao_episcopal: this.formatDateBr(ordEpisc?.data) || ordEpisc?.data || null,
      biografia: bioFinal,
      bio: bioFinal,
      ...extraOverrides,
    };

    return payload;
  },

  /**
   * Sincronização automática com o site oficial da Província BRM (scj.org.br).
   * Chamada HTTP POST não-bloqueante protegida por try/catch com timeout de contingência.
   * Disparada sempre que os dados de um religioso forem salvos ou quando houver transferência.
   */
  async syncReligiosoSiteOficial(
    religiosoIdOrPayload: string | OfficialSiteSyncPayload,
    extraPayload?: Partial<OfficialSiteSyncPayload>,
    options?: { timeoutMs?: number; endpointUrl?: string; token?: string }
  ): Promise<{ success: boolean; status?: number; error?: string }> {
    const timeoutMs = options?.timeoutMs ?? 10000;
    const url = options?.endpointUrl || OFFICIAL_SITE_SYNC_URL;
    const token = options?.token || OFFICIAL_SITE_SYNC_TOKEN;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let payload: OfficialSiteSyncPayload;
      if (typeof religiosoIdOrPayload === 'string') {
        try {
          payload = await this.buildOfficialSitePayload(religiosoIdOrPayload, extraPayload);
        } catch (dbErr: any) {
          console.warn(`[Sync Site Oficial] Consulta detalhada do banco para ID ${religiosoIdOrPayload} retornou aviso (${dbErr?.message || dbErr}). Prosseguindo com payload direto do formulário:`, extraPayload);
          const extraNome = extraPayload?.nome || 'Religioso SCJ';
          const extraGrau = extraPayload?.grau || 'Padre';
          payload = {
            id: this.generateSlug(extraNome, extraGrau),
            religioso_id: religiosoIdOrPayload,
            nome: extraNome,
            grau: extraGrau,
            categoria: extraGrau.toLowerCase().includes('bispo') ? 'bispos' :
                       extraGrau.toLowerCase().includes('frater') ? 'fratres' :
                       extraGrau.toLowerCase().includes('irm') ? 'irmaos' : 'padres',
            comunidade: extraPayload?.comunidade || 'Província BRM',
            paroquia: extraPayload?.paroquia || extraPayload?.comunidade || 'Província BRM',
            cidade: extraPayload?.cidade || 'Santa Catarina / Paraná',
            cargo: extraPayload?.cargo || extraPayload?.funcao || 'Religioso Dehoniano',
            funcao: extraPayload?.funcao || extraPayload?.cargo || 'Religioso Dehoniano',
            ...extraPayload,
          } as OfficialSiteSyncPayload;
        }
      } else {
        payload = { ...religiosoIdOrPayload, ...extraPayload };
      }

      console.log(`[Sync Site Oficial] Enviando dados de "${payload.nome || 'Religioso'}" para ${url}...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sync-token': token,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (response.status === 200) {
        console.log(`[Sync Site Oficial] Sincronização automática com o site oficial retornou 200 OK para o religioso: "${payload.nome}".`);
        return { success: true, status: 200 };
      } else {
        console.warn(`[Sync Site Oficial] O endpoint do site oficial retornou status HTTP ${response.status} (${response.statusText}) para "${payload.nome}".`);
        return { success: false, status: response.status, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.warn(`[Sync Site Oficial] Timeout de ${timeoutMs}ms atingido na sincronização com ${url}. A operação principal do sistema foi concluída sem interrupções.`);
        return { success: false, error: 'Timeout de sincronização com o site oficial' };
      }
      console.warn(`[Sync Site Oficial] Falha não-bloqueante na sincronização com o site oficial (${err?.message || err}). A operação principal do sistema foi preservada.`);
      return { success: false, error: err?.message || String(err) };
    } finally {
      clearTimeout(timer);
    }
  },

  /**
   * Disparo não-bloqueante (fire-and-forget seguro) da sincronização com o site oficial.
   * Não bloqueia a thread de execução do formulário ou o feedback para o secretário.
   */
  triggerOfficialSiteSync(
    religiosoIdOrPayload: string | OfficialSiteSyncPayload,
    extraPayload?: Partial<OfficialSiteSyncPayload>
  ): void {
    void this.syncReligiosoSiteOficial(religiosoIdOrPayload, extraPayload).catch(err => {
      console.warn('[Sync Site Oficial] Erro capturado no wrapper não-bloqueante:', err);
    });
  },
};
