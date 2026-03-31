import { CheckoutScreen } from '../../src/marketplace/CheckoutScreen';
import { TabRouteShell } from './TabRouteShell';

export default function CheckoutRoute() {
  return (
    <TabRouteShell stackRoute="cart">
      <CheckoutScreen />
    </TabRouteShell>
  );
}
