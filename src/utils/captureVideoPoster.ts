/** Capture a JPEG poster frame from a local video file (first ~0.5s). */
export async function captureVideoPoster(file: File, seekSeconds = 0.5): Promise<Blob | null> {
  if (!file.type.startsWith('video/')) return null;

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);

    const cleanup = () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    };

    video.onloadeddata = () => {
      const t = Math.min(seekSeconds, Math.max(0.1, (video.duration || 1) * 0.08));
      try {
        video.currentTime = t;
      } catch {
        cleanup();
        resolve(null);
      }
    };

    video.onseeked = () => {
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 360;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        cleanup();
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          cleanup();
          resolve(blob);
        },
        'image/jpeg',
        0.86,
      );
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
    };

    video.src = url;
  });
}
