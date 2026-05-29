import { ProfileMarketplaceScreen } from '../../src/marketplace/ProfileMarketplaceScreen';
import { TabRouteShell } from './TabRouteShell';

export default function ProfileTab() {
  return (
    <TabRouteShell stackRoute="profile">
      <ProfileMarketplaceScreen />
    </TabRouteShell>
  );
}
