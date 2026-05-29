import { HomeMarketplaceView } from '../../src/marketplace/HomeMarketplaceView';
import { TabRouteShell } from './TabRouteShell';
import { CategoriesMarketplaceView } from '../../src/marketplace/CategoriesMarketplaceView';
import { useMarketplace } from '../../src/marketplace/MarketplaceContext';

export default function HomeTab() {
  const m = useMarketplace();
  const isCategories = m.listNav === 'products';
  return (
    <TabRouteShell stackRoute="index">
      {isCategories ? <CategoriesMarketplaceView /> : <HomeMarketplaceView />}
    </TabRouteShell>
  );
}
