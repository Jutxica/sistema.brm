import { supabase } from '../lib/supabaseClient';

const fotoCache = new Map<string, string>();

/**
 * Obtém a foto oficial do religioso e converte diretamente para Data URI Base64.
 * Isso garante que o Gotenberg (headless Chromium) e o navegador renderizem a foto com 100% de confiabilidade,
 * sem depender de resolução de storage externa, signed URLs expiradas ou restrições de CORS.
 */
export async function obterFotoReligiosoBase64(
  rel: { id: string; foto_path?: string | null; foto_url?: string | null }
): Promise<string | null> {
  if (!rel?.id) return null;

  if (fotoCache.has(rel.id)) {
    const cached = fotoCache.get(rel.id);
    if (cached) return cached;
  }

  const raw = rel.foto_path || rel.foto_url;
  if (raw && typeof raw === 'string' && raw.startsWith('data:image/')) {
    fotoCache.set(rel.id, raw);
    return raw;
  }

  const candidatePaths: Array<{ bucket: string; path: string }> = [];

  if (raw && typeof raw === 'string' && raw.trim() !== '') {
    // religiosos-documentos é o bucket oficial configurado para uploads de fotos do cadastro
    candidatePaths.push({ bucket: 'religiosos-documentos', path: raw });
    candidatePaths.push({ bucket: 'religiosos-perfil', path: raw });
  }

  // Busca também nos documentos do religioso anexados
  try {
    const { data: docs } = await supabase
      .from('religiosos_documentos')
      .select('caminho_storage, categoria, nome_arquivo')
      .eq('religioso_id', rel.id);

    const docFoto = docs?.find(d => {
      const cat = (d.categoria || '').toLowerCase();
      const nome = (d.nome_arquivo || '').toLowerCase();
      return (
        cat.includes('perfil') ||
        cat.includes('foto') ||
        cat.includes('4x4') ||
        cat.includes('3x4') ||
        /\.(jpe?g|png|webp)$/i.test(nome)
      );
    });

    if (docFoto?.caminho_storage) {
      candidatePaths.push({ bucket: 'religiosos-documentos', path: docFoto.caminho_storage });
      candidatePaths.push({ bucket: 'religiosos-perfil', path: docFoto.caminho_storage });
    }
  } catch (err) {
    console.warn('[FotoReligioso] Erro ao consultar documentos de foto:', err);
  }

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  // 1. Tenta download direto dos buckets autenticado pelo Supabase
  for (const item of candidatePaths) {
    try {
      const { data: blob, error } = await supabase.storage.from(item.bucket).download(item.path);
      if (blob && !error && blob.size > 0) {
        const b64 = await blobToBase64(blob);
        if (b64 && b64.startsWith('data:image/')) {
          fotoCache.set(rel.id, b64);
          return b64;
        }
      }
    } catch {}

    // 2. Tenta signed URL + fetch direto
    try {
      const { data: sUrl } = await supabase.storage.from(item.bucket).createSignedUrl(item.path, 86400);
      if (sUrl?.signedUrl) {
        const res = await fetch(sUrl.signedUrl);
        if (res.ok) {
          const blob = await res.blob();
          const b64 = await blobToBase64(blob);
          if (b64 && b64.startsWith('data:image/')) {
            fotoCache.set(rel.id, b64);
            return b64;
          }
        }
      }
    } catch {}
  }

  // 3. Se for uma URL externa pública
  if (raw && (raw.startsWith('http://') || raw.startsWith('https://'))) {
    try {
      const res = await fetch(raw);
      if (res.ok) {
        const blob = await res.blob();
        const b64 = await blobToBase64(blob);
        if (b64 && b64.startsWith('data:image/')) {
          fotoCache.set(rel.id, b64);
          return b64;
        }
      }
    } catch {}
    fotoCache.set(rel.id, raw);
    return raw;
  }

  return null;
}

/**
 * Obtém uma URL utilizável para <img> ou imagem de perfil.
 * Prioriza Signed URL do bucket 'religiosos-documentos', com fallback para Base64 e URL pública.
 */
export async function obterFotoReligiosoUrl(
  rel: { id: string; foto_path?: string | null; foto_url?: string | null }
): Promise<string | null> {
  if (!rel?.id) return null;

  if (fotoCache.has(rel.id)) {
    const cached = fotoCache.get(rel.id);
    if (cached) return cached;
  }

  const raw = rel.foto_path || rel.foto_url;
  if (raw && typeof raw === 'string') {
    if (raw.startsWith('data:image/')) {
      fotoCache.set(rel.id, raw);
      return raw;
    }
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
  }

  const candidateBuckets = ['religiosos-documentos', 'religiosos-perfil'];

  // Se tiver um caminho direto
  if (raw && typeof raw === 'string' && raw.trim() !== '') {
    for (const b of candidateBuckets) {
      try {
        const { data: sUrl } = await supabase.storage.from(b).createSignedUrl(raw, 86400);
        if (sUrl?.signedUrl) {
          return sUrl.signedUrl;
        }
      } catch {}
    }
  }

  // Tenta via Base64 para garantir carregamento 100% livre de falhas de rede/CORS
  const b64 = await obterFotoReligiosoBase64(rel);
  if (b64) return b64;

  return null;
}
