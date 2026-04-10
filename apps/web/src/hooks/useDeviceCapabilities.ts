import { useSyncExternalStore } from 'react';

type DeviceCapabilities = {
  isMobile: boolean;
  isTablet: boolean;
  hasTouch: boolean;
  pixelRatio: number;
};

const mobileQuery = '(max-width: 768px), (max-width: 1024px) and (pointer: coarse)';
const tabletQuery = '(min-width: 769px) and (max-width: 1024px) and (pointer: coarse)';

function getHasTouch(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function createMediaQueryStore(query: string) {
  const mql = window.matchMedia(query);

  function subscribe(callback: () => void) {
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  }

  function getSnapshot() {
    return mql.matches;
  }

  function getServerSnapshot() {
    return false;
  }

  return { subscribe, getSnapshot, getServerSnapshot };
}

const mobileStore = createMediaQueryStore(mobileQuery);
const tabletStore = createMediaQueryStore(tabletQuery);

export function useIsMobile(): boolean {
  return useSyncExternalStore(
    mobileStore.subscribe,
    mobileStore.getSnapshot,
    mobileStore.getServerSnapshot,
  );
}

export function useDeviceCapabilities(): DeviceCapabilities {
  const isMobile = useSyncExternalStore(
    mobileStore.subscribe,
    mobileStore.getSnapshot,
    mobileStore.getServerSnapshot,
  );

  const isTablet = useSyncExternalStore(
    tabletStore.subscribe,
    tabletStore.getSnapshot,
    tabletStore.getServerSnapshot,
  );

  return {
    isMobile,
    isTablet,
    hasTouch: getHasTouch(),
    pixelRatio: Math.min(window.devicePixelRatio, 2),
  };
}
