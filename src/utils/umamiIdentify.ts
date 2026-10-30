// @types/umami has no `identify` yet, so type it here.
type UmamiWithIdentify = {
  identify: (id: string, data?: { [key: string]: any }) => void;
};

const getUmami = () =>
  (window as unknown as { umami?: UmamiWithIdentify }).umami;

/**
 * Identifies the logged-in user in Umami. The tracker script is appended to the
 * head after mount, so retry for a few seconds until it is available.
 * Returns a cleanup function.
 * https://docs.umami.is/docs/guides/identify-logged-in-users
 */
export const umamiIdentify = (
  id: string,
  data?: { [key: string]: any },
): (() => void) => {
  const tryIdentify = () => {
    const tracker = getUmami();
    if (!tracker?.identify) return false;
    tracker.identify(id, data);
    return true;
  };

  if (tryIdentify()) return () => {};

  let attempts = 0;
  const interval = setInterval(() => {
    attempts += 1;
    if (tryIdentify() || attempts >= 20) clearInterval(interval);
  }, 500);

  return () => clearInterval(interval);
};
