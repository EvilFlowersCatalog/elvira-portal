import { toast } from 'react-toastify';

/** Copies text and confirms with a toast; a blocked clipboard is silently ignored. */
export const copyText = async (text: string, okMessage: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(okMessage);
  } catch {
    /* clipboard blocked: nothing to do */
  }
};
