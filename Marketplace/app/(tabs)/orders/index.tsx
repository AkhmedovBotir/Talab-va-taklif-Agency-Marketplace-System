import { OrdersScreen } from '../../../src/marketplace/OrdersScreen';
import { TabRouteShell } from '../TabRouteShell';

export default function OrdersRoute() {
  return (
    <TabRouteShell stackRoute="profile">
      <OrdersScreen />
    </TabRouteShell>
  );
}
