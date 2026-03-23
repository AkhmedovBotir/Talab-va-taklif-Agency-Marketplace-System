/**
 * Web event emitter (replaces DeviceEventEmitter for web)
 */
const EVENT_NAME = 'marketplace:401-unauthorized';

export const appEvents = {
  emit(eventName: string): void {
    if (eventName === EVENT_NAME) {
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
  },
  addListener(eventName: string, callback: () => void): { remove: () => void } {
    if (eventName !== EVENT_NAME) {
      return { remove: () => {} };
    }
    const handler = () => callback();
    window.addEventListener(EVENT_NAME, handler);
    return {
      remove: () => window.removeEventListener(EVENT_NAME, handler),
    };
  },
};
