import { ReactElement } from 'react';

export interface CatalogIconConfig {
  type: 'stuDots' | 'customSvg';
  color?: string;
  svgUrl?: string;
}

// Icon configuration for each catalog identifier (url_name)
export const CATALOG_ICON_MAP: Record<string, CatalogIconConfig> = {
  fiit: { type: 'stuDots', color: '#01a9e0' },
  mtf: { type: 'stuDots', color: '#E62B1E' },
  fad: { type: 'stuDots', color: '#009D4A' },
  fchpt: { type: 'stuDots', color: '#FFDA1C' },
  fei: { type: 'stuDots', color: '#0C4A8E' },
  sjf: { type: 'stuDots', color: '#4C5B60' },
  svf: { type: 'stuDots', color: '#E5722A' },
  ku: { type: 'stuDots', color: '#D1A619' },
  // Add more catalogs as needed
  // example: { type: 'customSvg', svgUrl: '/path/to/icon.svg' },
};

// Fallback icon config for unknown catalogs
export const DEFAULT_CATALOG_ICON: CatalogIconConfig = {
  type: 'stuDots',
  color: '#01a9e0', // Use same color as default theme
};
