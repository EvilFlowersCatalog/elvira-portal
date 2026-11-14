export const getFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(0)) + ' ' + sizes[i];
};

// Create Base64 file
export const getBase64 = async (fileBase: File | null) => {
  if (!fileBase) return null;
  // func for creating
  const getBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  // file
  const base = await getBase64(fileBase);
  return base;
};

/** An RFC 4122 version 4 UUID from the platform's CSPRNG. */
export const uuid = (): string => crypto.randomUUID();

/** Max length of a feed `url_name` on the catalog side. */
export const SLUG_MAX_LENGTH = 50;

/**
 * URL-safe slug: strips diacritics (`Nové knihy` → `nove-knihy`), lowercases,
 * collapses every non-alphanumeric run into `-` and truncates to `maxLength`.
 */
export const slugify = (value: string, maxLength = SLUG_MAX_LENGTH): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/, '');

/** Next numbered variant of a slug: `novinky` → `novinky-2`, `novinky-2` → `novinky-3` (within `maxLength`). */
export const nextSlug = (slug: string, maxLength = SLUG_MAX_LENGTH): string => {
  const match = /^(.*)-(\d+)$/.exec(slug);
  const base = match ? match[1] : slug;
  const suffix = `-${match ? Number(match[2]) + 1 : 2}`;
  return `${base.slice(0, maxLength - suffix.length).replace(/-+$/, '')}${suffix}`;
};

export const updateMetaTag =(name: string, content: string | number) => {
  document
    .querySelector(`meta[name=${name}]`)
    ?.setAttribute('content', content.toString());
};

export const withAccessToken = (
  url: string | null | undefined,
  token?: string
): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url, import.meta.env.ELVIRA_BASE_URL);
    parsed.searchParams.set('access_token', token ?? '');
    return parsed.toString();
  } catch {
    return null;
  }
};

export const imageUrlToFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob(); // Get the image as a blob
    const fileType = blob.type; // Get the MIME type of the file
    const file = new File([blob], filename, { type: fileType });
    return file;
  } catch {
    return null;
  }
};
