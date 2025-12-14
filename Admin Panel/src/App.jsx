import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Admins from './pages/Admins/Admins';
import Regions from './pages/Regions/Regions';
import Contragents from './pages/Contragents/Contragents';
import Agents from './pages/Agents/Agents';
import Punkts from './pages/Punkts/Punkts';
import Categories from './pages/Categories/Categories';
import Products from './pages/Products/Products';
import SMSVerifications from './pages/SMSVerifications/SMSVerifications';
import MarketplaceUsers from './pages/MarketplaceUsers/MarketplaceUsers';
import Orders from './pages/Orders/Orders';
import MarketplaceOrders from './pages/Orders/MarketplaceOrders';
import DeliveredToPunktOrders from './pages/Orders/DeliveredToPunktOrders';
import AssignedToAgentsOrders from './pages/Orders/AssignedToAgentsOrders';
import ConfirmedByAgentsOrders from './pages/Orders/ConfirmedByAgentsOrders';
import ConfirmedByCustomersOrders from './pages/Orders/ConfirmedByCustomersOrders';
import CancelledOrders from './pages/Orders/CancelledOrders';
import Settings from './pages/Settings/Settings';
import KPIStatistics from './pages/KPI/KPIStatistics';
import KPITransactions from './pages/KPI/KPITransactions';
import KPIViloyatAgents from './pages/KPI/KPIViloyatAgents';
import KPITumanAgents from './pages/KPI/KPITumanAgents';
import KPIMfyAgents from './pages/KPI/KPIMfyAgents';
import KPIPunkts from './pages/KPI/KPIPunkts';
import SalesStatistics from './pages/Statistics/SalesStatistics';
import Notifications from './pages/Notifications/Notifications';
import Reviews from './pages/Reviews/Reviews';
import Contacts from './pages/Contacts/Contacts';
import PartnershipRequests from './pages/PartnershipRequests/PartnershipRequests';
import Vacancies from './pages/Vacancies/Vacancies';
import VacancyApplications from './pages/Vacancies/VacancyApplications';
import DailyReport from './pages/Finance/Reports/DailyReport';
import WeeklyReport from './pages/Finance/Reports/WeeklyReport';
import MonthlyReport from './pages/Finance/Reports/MonthlyReport';
import YearlyReport from './pages/Finance/Reports/YearlyReport';
import CustomReport from './pages/Finance/Reports/CustomReport';
import Submissions from './pages/Finance/Submissions';
import Transactions from './pages/Finance/Transactions';
import FinanceStatistics from './pages/Finance/Statistics';
import NotFound from './pages/NotFound/NotFound';

function App() {
  return (
    <SnackbarProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <DashboardLayout />
                  </SidebarProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="admins" element={<Admins />} />
              <Route path="regions" element={<Regions />} />
              <Route path="contragents" element={<Contragents />} />
              <Route path="agents" element={<Agents />} />
              <Route path="punkts" element={<Punkts />} />
              <Route path="categories" element={<Categories />} />
              <Route path="products" element={<Products />} />
              <Route path="sms-verifications" element={<SMSVerifications />} />
              <Route path="marketplace-users" element={<MarketplaceUsers />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/marketplace" element={<MarketplaceOrders />} />
              <Route path="orders/delivered-to-punkt" element={<DeliveredToPunktOrders />} />
              <Route path="orders/assigned-to-agents" element={<AssignedToAgentsOrders />} />
              <Route path="orders/confirmed-by-agents" element={<ConfirmedByAgentsOrders />} />
              <Route path="orders/confirmed-by-customers" element={<ConfirmedByCustomersOrders />} />
              <Route path="orders/cancelled" element={<CancelledOrders />} />
              <Route path="kpi/statistics" element={<KPIStatistics />} />
              <Route path="kpi/transactions" element={<KPITransactions />} />
              <Route path="kpi/viloyat-agents" element={<KPIViloyatAgents />} />
              <Route path="kpi/tuman-agents" element={<KPITumanAgents />} />
              <Route path="kpi/mfy-agents" element={<KPIMfyAgents />} />
              <Route path="kpi/punkts" element={<KPIPunkts />} />
              <Route path="statistics" element={<SalesStatistics />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="reviews/contacts" element={<Contacts />} />
              <Route path="partnership-requests" element={<PartnershipRequests />} />
              <Route path="vacancies" element={<Vacancies />} />
              <Route path="vacancies/:vacancyId/applications" element={<VacancyApplications />} />
              <Route path="finance/reports/daily" element={<DailyReport />} />
              <Route path="finance/reports/weekly" element={<WeeklyReport />} />
              <Route path="finance/reports/monthly" element={<MonthlyReport />} />
              <Route path="finance/reports/yearly" element={<YearlyReport />} />
              <Route path="finance/reports/custom" element={<CustomReport />} />
              <Route path="finance/submissions" element={<Submissions />} />
              <Route path="finance/transactions" element={<Transactions />} />
              <Route path="finance/statistics" element={<FinanceStatistics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </SnackbarProvider>
  );
}

export default App;
