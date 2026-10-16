/**
 * Utilitários para detecção e reprodução de mídias de câmeras (MP4 direto, HLS, WebM e Iframes)
 */

export const isDirectVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const clean = url.trim().toLowerCase().split('?')[0];
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.m3u8') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.ogg') ||
    clean.endsWith('.mov') ||
    clean.includes('.mp4') ||
    clean.includes('.m3u8')
  );
};

export const isDirectImageUrl = (url?: string): boolean => {
  if (!url) return false;
  const clean = url.trim().toLowerCase().split('?')[0];
  return (
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.png') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.gif') ||
    clean.endsWith('.bmp') ||
    clean.endsWith('.svg') ||
    clean.startsWith('data:image/') ||
    clean.includes('/snapshot') ||
    clean.includes('cgi-bin/snapshot')
  );
};

export const extractCleanMediaUrl = (codeOrUrl?: string): string => {
  if (!codeOrUrl) return '';
  let trimmed = codeOrUrl.trim();
  if (trimmed.startsWith('<')) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      trimmed = srcMatch[1].trim();
    }
  }
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be') || trimmed.includes('vimeo.com') || trimmed.includes('rtsp.me')) {
    trimmed = trimmed.replace(/^http:\/\//gi, 'https://');
  }
  return trimmed;
};
