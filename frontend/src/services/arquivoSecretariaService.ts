import { supabase } from '../lib/supabaseClient';

export type TipoDocumentoArquivo =
  | 'testamento'
  | 'documento_pessoal'
  | 'documento_canonico'
  | 'outro';

export type StatusProtocoloArquivo =
  | 'rascunho'
  | 'enviado'
  | 'em_conferencia'
  | 'complementacao_solicitada'
  | 'recebido'
  | 'classificado'
  | 'arquivado';

export interface ProtocoloArquivo {
  id: string;
  numero_protocolo: string;
  religioso_nome: string | null;
  tipo_documento: TipoDocumentoArquivo | null;
  descricao: string | null;
  status: StatusProtocoloArquivo;
  enviado_por_nome: string | null;
  ultima_observacao: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface VersaoArquivo {
  id: string;
  protocolo_id: string;
  numero_versao: number;
  nome_original: string;
  tipo_mime: string;
  tamanho_bytes: number;
  sha256: string;
  caminho_storage: string;
  enviado_por: string;
  criado_em: string;
}

export interface EventoArquivo {
  id: number;
  protocolo_id: string;
  evento: string;
  status_anterior: string | null;
  status_novo: StatusProtocoloArquivo;
  ator_nome: string;
  observacao: string | null;
  criado_em: string;
}

export interface DadosArquivamento {
  protocolo_id: string;
  recebido_por: string | null;
  classificacao: string | null;
  referencia_arquivamento: string | null;
  localizador: string | null;
  arquivado_em: string | null;
  arquivado_por: string | null;
}

export interface ReligiosoArquivo {
  id: string;
  nome_civil: string;
  nome_religioso: string | null;
}

const BUCKET = 'arquivo-religiosos-confidencial';
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
]);

const unwrap = <T,>(result: { data: T; error: { message: string } | null }): T => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};

export const arquivoSecretariaService = {
  async listarReligiosos(): Promise<ReligiosoArquivo[]> {
    const result = await supabase
      .from('religiosos')
      .select('id, nome_civil, nome_religioso')
      .eq('status', 'Ativo')
      .eq('status_cadastro', 'Aprovado')
      .order('nome_civil');
    return unwrap(result) || [];
  },

  async listarProtocolos(): Promise<ProtocoloArquivo[]> {
    const result = await supabase.rpc('arquivo_listar_protocolos_acesso');
    return unwrap(result) || [];
  },

  async listarVersoes(protocoloId: string): Promise<VersaoArquivo[]> {
    const result = await supabase
      .from('secretaria_arquivo_versoes')
      .select('*')
      .eq('protocolo_id', protocoloId)
      .order('numero_versao', { ascending: false });
    return unwrap(result) || [];
  },

  async listarEventos(protocoloId: string): Promise<EventoArquivo[]> {
    const result = await supabase
      .from('secretaria_arquivo_eventos')
      .select('*')
      .eq('protocolo_id', protocoloId)
      .order('criado_em', { ascending: false });
    return unwrap(result) || [];
  },

  async obterDadosArquivamento(protocoloId: string): Promise<DadosArquivamento | null> {
    const result = await supabase
      .from('secretaria_arquivo_dados')
      .select('*')
      .eq('protocolo_id', protocoloId)
      .maybeSingle();
    return unwrap(result);
  },

  async criarProtocolo(
    religiosoId: string,
    tipoDocumento: TipoDocumentoArquivo,
    descricao: string,
  ): Promise<{ id: string; numero_protocolo: string }> {
    const result = await supabase.rpc('arquivo_criar_protocolo', {
      p_religioso_id: religiosoId,
      p_tipo_documento: tipoDocumento,
      p_descricao: descricao,
    });
    return unwrap(result) as { id: string; numero_protocolo: string };
  },

  async anexarVersao(protocoloId: string, file: File): Promise<void> {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new Error('Envie um arquivo PDF, JPEG, PNG ou TIFF.');
    }
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      throw new Error('O arquivo deve ter até 50 MB.');
    }
    if (!crypto.subtle) {
      throw new Error('Este navegador não permite calcular a assinatura de integridade do arquivo.');
    }

    const storagePath = `${protocoloId}/${crypto.randomUUID()}`;
    const bytes = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');

    const upload = await supabase.storage.from(BUCKET).upload(storagePath, file, {
      cacheControl: '0',
      contentType: file.type,
      upsert: false,
    });
    if (upload.error) throw new Error(`Não foi possível enviar o arquivo: ${upload.error.message}`);

    const registration = await supabase.rpc('arquivo_associar_versao', {
      p_protocolo_id: protocoloId,
      p_caminho_storage: storagePath,
      p_nome_original: file.name,
      p_tipo_mime: file.type,
      p_tamanho_bytes: file.size,
      p_sha256: sha256,
    });

    if (registration.error) {
      const cleanup = await supabase.storage.from(BUCKET).remove([storagePath]);
      if (cleanup.error) {
        throw new Error(
          `O arquivo foi enviado, mas não pôde ser registrado: ${registration.error.message}. ` +
          `Também não foi possível limpar o envio incompleto: ${cleanup.error.message}`,
        );
      }
      throw new Error(`Não foi possível registrar o arquivo: ${registration.error.message}`);
    }

  },

  async enviarProtocolo(protocoloId: string): Promise<void> {
    const result = await supabase.rpc('arquivo_enviar_protocolo', {
      p_protocolo_id: protocoloId,
    });
    unwrap(result);
  },

  async avancarProtocolo(
    protocoloId: string,
    acao: string,
    observacao?: string,
    classificacao?: string,
    referencia?: string,
    localizador?: string,
  ): Promise<void> {
    const result = await supabase.rpc('arquivo_avancar_protocolo', {
      p_protocolo_id: protocoloId,
      p_acao: acao,
      p_observacao: observacao || null,
      p_classificacao: classificacao || null,
      p_referencia: referencia || null,
      p_localizador: localizador || null,
    });
    unwrap(result);
  },

  async baixarVersao(storagePath: string, fileName: string): Promise<void> {
    const result = await supabase.storage.from(BUCKET).download(storagePath);
    if (result.error || !result.data) {
      throw new Error(`Não foi possível baixar este documento: ${result.error?.message || 'Arquivo indisponível.'}`);
    }
    const objectUrl = URL.createObjectURL(result.data);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    link.rel = 'noopener noreferrer';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  },
};
