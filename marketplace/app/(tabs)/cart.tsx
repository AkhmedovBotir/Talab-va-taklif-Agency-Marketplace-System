import { CartScreen } from '../../src/marketplace/CartScreen';
import { TabRouteShell } from './TabRouteShell';

export default function CartTab() {
  return (
    <TabRouteShell stackRoute="cart">
      <CartScreen />
    </TabRouteShell>
  );
}
