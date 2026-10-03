import { supabase } from '../lib/supabaseClient';

export interface StorageUploadResult {
  url: string;
  storagePath?: string;
  isSigned: boolean;
  tamanhoBytes: number;
  formato: string;
}

export const storageService = {
  BUCKET_NAME: 'patrimonio-documentos',
  FALLBACK_BUCKET: 'documentos-provincia',

  /**
   * Converte um arquivo em Data URL (base64) para contingência offline.
   */
  async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Sanitiza nomes de arquivos para evitar caracteres especiais no S3/Supabase Storage.
   */
  sanitizarNomeArquivo(nomeOriginal: string): string {
    return nomeOriginal
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
  },

  /**
   * Faz upload seguro de um arquivo para o bucket de patrimônio.
   * Gera caminho estruturado por entidade e identificador único.
   */
  async uploadArquivo(
    arquivo: File,
    entidadeTipo: string = 'geral',
    entidadeId: string = 'avulso'
  ): Promise<StorageUploadResult> {
    const fileId = crypto.randomUUID();
    const nomeLimpo = this.sanitizarNomeArquivo(arquivo.name);
    const extensao = arquivo.name.split('.').pop()?.toLowerCase() || '';
    const storagePath = `${entidadeTipo}/${entidadeId}/${fileId}_${nomeLimpo}`;

    let urlFinal = '';
    let storageSalvo = false;
    let isSigned = false;

    // 1. Tenta upload no bucket principal (privado com signed url)
    try {
      const { error: err1 } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(storagePath, arquivo, {
          cacheControl: '3600',
          upsert: true
        });

      if (!err1) {
        storageSalvo = true;
        // Tenta obter Signed URL (válida por 24 horas = 86400s)
        const { data: signedData, error: signedErr } = await supabase.storage
          .from(this.BUCKET_NAME)
          .createSignedUrl(storagePath, 86400);

        if (!signedErr && signedData?.signedUrl) {
          urlFinal = signedData.signedUrl;
          isSigned = true;
        } else {
          // Se signed URL falhar, obtém URL pública
          const { data: pubData } = supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(storagePath);
          urlFinal = pubData.publicUrl;
        }
      } else {
        // Tentativa de contingência no bucket secundário
        const { error: err2 } = await supabase.storage
          .from(this.FALLBACK_BUCKET)
          .upload(storagePath, arquivo, { upsert: true });

        if (!err2) {
          storageSalvo = true;
          const { data: pubData } = supabase.storage
            .from(this.FALLBACK_BUCKET)
            .getPublicUrl(storagePath);
          urlFinal = pubData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Supabase Storage indisponível, recorrendo ao buffer de contingência local:', err);
    }

    // 2. Se falhar o upload na nuvem (offline ou quota), gera Data URL resiliente
    if (!storageSalvo || !urlFinal) {
      urlFinal = await this.fileToDataUrl(arquivo);
    }

    return {
      url: urlFinal,
      storagePath: storageSalvo ? storagePath : undefined,
      isSigned,
      tamanhoBytes: arquivo.size,
      formato: extensao
    };
  },

  /**
   * Obtém URL atualizada e segura (assinada) para visualização ou download.
   */
  async obterUrlSegura(storagePath?: string, fallbackUrl?: string): Promise<string> {
    if (!storagePath) {
      return fallbackUrl || '';
    }

    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(storagePath, 7200); // 2 horas

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch (_) {}

    return fallbackUrl || '';
  },

  /**
   * Remove arquivo do storage se existir caminho cadastrado.
   */
  async excluirArquivo(storagePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([storagePath]);
      return !error;
    } catch (_) {
      return false;
    }
  }
};
