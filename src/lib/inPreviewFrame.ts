/** True when this document runs inside the site viewport preview iframe. */
export function inPreviewFrame(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
