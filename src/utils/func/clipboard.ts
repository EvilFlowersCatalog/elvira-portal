import { toast } from 'react-toastify';

/**
 * Writes text to the clipboard. `navigator.clipboard` exists only in a secure context (HTTPS or localhost);
 * the intranet portals are plain HTTP (#62), so fall back to a hidden textarea and `execCommand('copy')`,
 * which browsers still allow from a click. Rejects when neither works.
 */
export const writeClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Blocked or denied: try the fallback below.
    }
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  area.style.pointerEvents = 'none';
  document.body.appendChild(area);
  area.select();
  try {
    // Deprecated but still the only clipboard write outside a secure context.
    if (!document.execCommand('copy')) throw new Error('copy rejected');
  } finally {
    area.remove();
  }
};

/** Copies text and confirms with a toast; a blocked clipboard is silently ignored. */
export const copyText = async (text: string, okMessage: string) => {
  try {
    await writeClipboard(text);
    toast.success(okMessage);
  } catch {
    /* clipboard blocked: nothing to do */
  }
};
