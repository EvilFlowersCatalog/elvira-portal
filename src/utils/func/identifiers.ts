import { IEntryIdentifiers } from '../interfaces/entry';

/**
 * The `identifiers` an entry PUT/POST sends: every key the form holds, trimmed. The catalog stores an empty value as
 * null, and replaces the whole dictionary, so a key left out is a key removed (and a link to that system dropped).
 */
export const identifiersPayload = (identifiers: Partial<IEntryIdentifiers> | null | undefined): IEntryIdentifiers =>
  Object.fromEntries(
    Object.entries({ doi: '', isbn: '', ...(identifiers ?? {}) }).map(([key, value]) => [key, (value ?? '').trim()])
  ) as IEntryIdentifiers;
