/**
 * Web refresh / eski havolalar: /(tabs)/... yo'llarini toza URLga aylantiradi.
 * (Server 403 bermasa, klient router to'g'ri sahifani ochadi.)
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  if (!path || typeof path !== 'string') return path;

  if (path === '/(tabs)' || path === '/(tabs)/') {
    return '/(tabs)/';
  }

  const tabsPrefix = '/(tabs)/';
  if (path.startsWith(tabsPrefix)) {
    const rest = path.slice(tabsPrefix.length);
    return rest ? `/${rest}` : '/';
  }

  if (path.startsWith('/(tabs)')) {
    return path.replace(/^\/\(tabs\)/, '') || '/';
  }

  return path;
}
