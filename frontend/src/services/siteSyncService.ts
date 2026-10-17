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

    // 2. Busca sacramentos, votos e ordens
    const [
      { data: votosData },
      { data: ordensData },
      { data: docsData },
    ] = await Promise.all([
      supabase.from('religiosos_profissoes_votos').select('*').eq('religioso_id', religiosoId).order('data', { ascending: true }),
      supabase.from('religiosos_ordens').select('*').eq('religioso_id', religiosoId).order('data', { ascending: true }),
      supabase.from('religiosos_documentos').select('*').eq('religioso_id', religiosoId).eq('status', 'Ativo'),
    ]);

    const votos = votosData || [];
    const ordens = ordensData || [];
    const documentos = docsData || [];

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
    const comunidadeNome = rel.comunidade_atual?.nome || rel.obra_atual?.nome || 'Província BRM';
    const cargoNome = rel.cargo || (categoria === 'padres' ? 'Sacerdote Dehoniano' : categoria === 'fratres' ? 'Frater Dehoniano' : 'Religioso Dehoniano');

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
      subcategoria: null,
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

    return {
      success: true,
      message: `Religioso ${finalItem.nome} publicado com sucesso no Site Oficial!`,
      slug: finalItem.id,
    };
  },
};
