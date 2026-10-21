import { supabase } from '../lib/supabaseClient';

/**
 * Obtém a foto oficial do religioso e converte diretamente para Data URI Base64.
 * Isso garante que o Gotenberg (headless Chromium) renderize a foto com 100% de confiabilidade,
 * sem depender de resolução de storage externa, signed URLs expiradas ou restrições de CORS.
 */
export async function obterFotoReligiosoBase64(
  rel: { id: string; foto_path?: string | null; foto_url?: string | null }
): Promise<string | null> {
  if (!rel?.id) return null;

  const candidatePaths: Array<{ bucket: string; path: string }> = [];

  const raw = rel.foto_path || rel.foto_url;
  if (raw && typeof raw === 'string' && raw.trim() !== '') {
    if (raw.startsWith('data:image/')) return raw;
    candidatePaths.push({ bucket: 'religiosos-perfil', path: raw });
    candidatePaths.push({ bucket: 'religiosos-documentos', path: raw });
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

  // 1. Tenta download direto dos buckets
  for (const item of candidatePaths) {
    try {
      const { data: blob, error } = await supabase.storage.from(item.bucket).download(item.path);
      if (blob && !error && blob.size > 0) {
        const b64 = await blobToBase64(blob);
        if (b64 && b64.startsWith('data:image/')) {
          return b64;
        }
      }
    } catch {}

    // 2. Tenta signed URL + fetch
    try {
      const { data: sUrl } = await supabase.storage.from(item.bucket).createSignedUrl(item.path, 3600);
      if (sUrl?.signedUrl) {
        const res = await fetch(sUrl.signedUrl);
        if (res.ok) {
          const blob = await res.blob();
          const b64 = await blobToBase64(blob);
          if (b64 && b64.startsWith('data:image/')) {
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
          return b64;
        }
      }
    } catch {}
    return raw;
  }

  return null;
}
