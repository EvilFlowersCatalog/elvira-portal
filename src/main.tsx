import './lib/forceHttps';
import { loadRuntimeConfig } from './lib/config';

// One image for every client (#61): /config.json overrides the build-time ELVIRA_* values, so it
// must be in place before any module that reads configuration is evaluated.
loadRuntimeConfig().then(() => import('./bootstrap'));
