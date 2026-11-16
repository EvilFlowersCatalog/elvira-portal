/**
 * Shortest LCP passphrase the catalog accepts for a new or changed passphrase (EvilFlowersCatalog#198:
 * `EVILFLOWERS_LCP_PASSPHRASE_MIN_LENGTH`, default 8; it used to be 4). Existing passphrases stay valid.
 * The catalog setting is the authority: its 422 field error on `lcp_passphrase` is shown when it differs.
 */
export const LCP_PASSPHRASE_MIN_LENGTH = 8;

export const LCP_PASSPHRASE_MAX_LENGTH = 255;

export const passphraseTooShort = (value: string) => value.length > 0 && value.length < LCP_PASSPHRASE_MIN_LENGTH;
