import { SearchMarketplaceView } from '../../src/marketplace/SearchMarketplaceView';
import { TabRouteShell } from './TabRouteShell';

export default function SearchTab() {
  return (
    <TabRouteShell stackRoute="search">
      <SearchMarketplaceView />
    </TabRouteShell>
  );
}
