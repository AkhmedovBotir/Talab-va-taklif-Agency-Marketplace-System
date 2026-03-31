import { OrderDetailScreen } from '../../../src/marketplace/OrderDetailScreen';
import { TabRouteShell } from '../TabRouteShell';

export default function OrderDetailRoute() {
  return (
    <TabRouteShell stackRoute="profile">
      <OrderDetailScreen />
    </TabRouteShell>
  );
}
