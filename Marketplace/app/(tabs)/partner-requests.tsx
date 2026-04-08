import { PartnerRequestsScreen } from '../../src/marketplace/PartnerRequestsScreen';
import { TabRouteShell } from './TabRouteShell';

export default function PartnerRequestsRoute() {
  return (
    <TabRouteShell stackRoute="profile">
      <PartnerRequestsScreen />
    </TabRouteShell>
  );
}
