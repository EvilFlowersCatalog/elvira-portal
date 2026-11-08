// On an https page the browser blocks every http:// XHR/fetch as mixed content.
// Since dev moved to k8s (2026-11-07) the backend sometimes hands out http://
// links (e.g. the viewer's /api/v1/user-acquisitions/ calls), so upgrade them
// here instead of letting them fail. Images are already auto-upgraded by the
// browser; this covers XHR (axios, the viewer) and fetch.
const upgrade = (url: string): string =>
  url.startsWith('http://') ? `https://${url.slice('http://'.length)}` : url;

if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    return (open as (...args: unknown[]) => void).call(this, method, upgrade(String(url)), ...rest);
  } as typeof XMLHttpRequest.prototype.open;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' || input instanceof URL) {
      return nativeFetch(upgrade(String(input)), init);
    }
    if (input.url.startsWith('http://')) {
      return nativeFetch(new Request(upgrade(input.url), input), init);
    }
    return nativeFetch(input, init);
  };
}

export {};
