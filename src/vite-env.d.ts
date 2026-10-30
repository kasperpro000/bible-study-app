/// <reference types="vite/client" />
import type { BibleApi } from '../electron/preload';

declare global {
  interface Window {
    api: BibleApi;
  }
}
