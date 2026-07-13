import { chrome } from 'jest-chrome';
import 'fake-indexeddb/auto';

Object.assign(global, { chrome });

// Polyfill structuredClone for jsdom compatibility
if (!(global as any).structuredClone) {
  (global as any).structuredClone = (obj: unknown) =>
    JSON.parse(JSON.stringify(obj));
}
