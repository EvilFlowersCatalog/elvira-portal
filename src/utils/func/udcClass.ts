/**
 * UDC main classes grouped into six map classes plus "unclassified".
 *
 * Each class has a fixed (hue, shape) pair — colour follows the class, never its rank or count.
 * Only three categorical hues validate all-pairs for dots (dataviz validator: CVD ΔE ≥ 9.2 light /
 * 9.4 dark, normal-vision ≥ 20.9), so shape is the second channel: two classes either differ in a
 * validated hue or in shape. Legend, hover label and the list view keep identity off colour alone.
 */
export type UdcClass = 'general' | 'philosophy' | 'social' | 'science' | 'applied' | 'humanities' | 'none';

export type MarkShape = 'circle' | 'square';

export const UDC_CLASSES: { id: UdcClass; digits: string[]; color: string; shape: MarkShape }[] = [
  { id: 'general', digits: ['0'], color: 'var(--viz-s1)', shape: 'circle' },
  { id: 'social', digits: ['3'], color: 'var(--viz-s2)', shape: 'circle' },
  { id: 'science', digits: ['5'], color: 'var(--viz-s3)', shape: 'circle' },
  { id: 'applied', digits: ['6'], color: 'var(--viz-s1)', shape: 'square' },
  { id: 'philosophy', digits: ['1', '2'], color: 'var(--viz-s2)', shape: 'square' },
  { id: 'humanities', digits: ['7', '8', '9'], color: 'var(--viz-s3)', shape: 'square' },
  { id: 'none', digits: [], color: 'var(--viz-muted)', shape: 'circle' },
];

const BY_DIGIT = new Map(UDC_CLASSES.flatMap((c) => c.digits.map((d) => [d, c] as const)));
export const UDC_CLASS = new Map(UDC_CLASSES.map((c) => [c.id, c]));

/** The class of a publication from its category terms: the first term that is a UDC code. */
export const udcClassOf = (terms: string[]): UdcClass => {
  for (const term of terms) {
    const digit = /^\s*(\d)/.exec(term)?.[1];
    const found = digit ? BY_DIGIT.get(digit) : undefined;
    if (found) return found.id;
  }
  return 'none';
};
