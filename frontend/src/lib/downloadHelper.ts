/**
 * Utilitário robusto para download e leitura de arquivos no navegador.
 * 
 * Funcionalidades:
 * - Trata URLs Base64 (Data URLs) gerando download sem ser barrado pelas políticas de top-frame do Chrome.
 * - Trata Blob URLs locais.
 * - Para URLs remotas (ex: Supabase Storage), realiza fetch -> blob -> download,
 *   garantindo que o arquivo seja realmente baixado com o nome correto especificado,
 *   mesmo quando o navegador ignora o atributo HTML5 download para origens cruzadas (cross-origin).
 */

export async function downloadArquivo(url: string, nomeArquivo: string = 'documento.pdf'): Promise<void> {
  if (!url) {
    throw new Error('URL inválida para download');
  }

  // 1. Caso seja Base64 Data URL
  if (url.startsWith('data:')) {
    try {
      const blob = dataURLtoBlob(url);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return;
    } catch {
      // Fallback simples caso conversão direta falhe
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
  }

  // 2. Caso seja Blob URL já existente
  if (url.startsWith('blob:')) {
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 3. Caso seja URL remota (ex: Supabase Storage)
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Servidor retornou status ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 15000);
  } catch (err) {
    console.warn('Download direto via Blob falhou, tentando fallback em nova aba:', err);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Converte uma Data URL (base64) em um objeto Blob binário nativo.
 */
export function dataURLtoBlob(dataurl: string): Blob {
  const parts = dataurl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
