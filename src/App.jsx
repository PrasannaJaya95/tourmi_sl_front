import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';
import Login from './pages/Login';
import Register from './pages/Register';
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Checkout = React.lazy(() => import('./pages/public/Checkout'));
const ThankYou = React.lazy(() => import('./pages/public/ThankYou'));
const VehicleManagement = React.lazy(() => import('./pages/VehicleManagement'));
const DriverManagement = React.lazy(() => import('./pages/DriverManagement'));
const CustomerManagement = React.lazy(() => import('./pages/CustomerManagement'));
const VendorManagement = React.lazy(() => import('./pages/VendorManagement'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const VehicleBrandManagement = React.lazy(() => import('./pages/VehicleBrandManagement'));
const VehicleModelManagement = React.lazy(() => import('./pages/VehicleModelManagement'));
const FleetCategoryManagement = React.lazy(() => import('./pages/FleetCategoryManagement'));
const VehicleRepair = React.lazy(() => import('./pages/VehicleRepair'));
const VehicleExpenses = React.lazy(() => import('./pages/VehicleExpenses'));
const OdometerManagement = React.lazy(() => import('./pages/OdometerManagement'));
const GeneralSettings = React.lazy(() => import('./pages/GeneralSettings'));
const PermissionGroupManagement = React.lazy(() => import('./pages/PermissionGroupManagement'));
const EmailSettings = React.lazy(() => import('./pages/EmailSettings'));
const CompanyProfileSettings = React.lazy(() => import('./pages/CompanyProfileSettings'));
const SystemBackup = React.lazy(() => import('./pages/SystemBackup'));
const Contracts = React.lazy(() => import('./pages/Contracts'));
const Invoices = React.lazy(() => import('./pages/Invoices'));
const AdvanceReceipts = React.lazy(() => import('./pages/AdvanceReceipts'));
const Agreements = React.lazy(() => import('./pages/Agreements'));
const Payments = React.lazy(() => import('./pages/Payments'));
const Quotations = React.lazy(() => import('./pages/Quotations'));
const MyBookings = React.lazy(() => import('./pages/customer/MyBookings'));
const MyProfile = React.lazy(() => import('./pages/customer/MyProfile'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const VehicleListing = React.lazy(() => import('./pages/public/VehicleListing'));
const VehicleDetail = React.lazy(() => import('./pages/public/VehicleDetail'));
const PLReports = React.lazy(() => import('./pages/PLReports'));
const CustomerAgingReport = React.lazy(() => import('./pages/CustomerAgingReport'));
const OverdueContractsReport = React.lazy(() => import('./pages/OverdueContractsReport'));
const ContractExpiryReport = React.lazy(() => import('./pages/ContractExpiryReport'));
const VendorBills = React.lazy(() => import('./pages/VendorBills'));
const About = React.lazy(() => import('./pages/About'));
import { BrandProvider } from './context/BrandContext';
import { QueryProvider } from './context/QueryProvider';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  const userRole = user.role?.toUpperCase().replace(/\s+/g, '_');

  if (userRole === 'SUPER_ADMIN') return children || <Outlet />;

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children || <Outlet />;
};


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'red', color: 'white' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.info && this.state.info.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrandProvider>
          <QueryProvider>
            <Suspense fallback={
              <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
              </div>
            }>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/portal/vehicle" element={<VehicleListing />} />
                  <Route path="/portal/vehicle/:id" element={<VehicleDetail />} />
                  <Route path="/checkout/:id" element={<Checkout />} />
                  <Route path="/thank-you" element={<ThankYou />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>

                <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/about" element={<About />} />

                  {/* Admin/Staff Routes */}
                  <Route element={<RoleProtectedRoute allowedRoles={['ADMIN', 'STAFF']} />}>
                    <Route path="/vehicles" element={<VehicleManagement />} />
                    <Route path="/fleet/categories" element={<FleetCategoryManagement />} />
                    <Route path="/fleet/brands" element={<VehicleBrandManagement />} />
                    <Route path="/fleet/models" element={<VehicleModelManagement />} />
                    <Route path="/fleet/repairs" element={<VehicleRepair />} />
                    <Route path="/fleet/expenses" element={<VehicleExpenses />} />
                    <Route path="/fleet/odometers" element={<OdometerManagement />} />
                    <Route path="/fleet/reports-pl" element={<PLReports />} />
                    <Route path="/reports/customer-aging" element={<CustomerAgingReport />} />
                    <Route path="/reports/overdue-contracts" element={<OverdueContractsReport />} />
                    <Route path="/reports/contract-expiry" element={<ContractExpiryReport />} />
                    <Route path="/fleet/vendor-bills" element={<VendorBills />} />

                    {/* Bookings */}
                    <Route path="/bookings/quotations" element={<Quotations />} />
                    <Route path="/bookings/contracts" element={<Contracts />} />
                    <Route path="/bookings/invoices" element={<Invoices />} />
                    <Route path="/bookings/advance-receipts" element={<AdvanceReceipts />} />
                    <Route path="/bookings/agreements" element={<Agreements />} />
                    <Route path="/bookings/payments" element={<Payments />} />

                    {/* Contacts */}
                    <Route path="/drivers" element={<DriverManagement />} />
                    <Route path="/customers" element={<CustomerManagement />} />
                    <Route path="/vendors" element={<VendorManagement />} />

                    {/* Settings */}
                    <Route path="/settings/users" element={<UserManagement />} />
                    <Route path="/settings/permissions" element={<PermissionGroupManagement />} />
                    <Route path="/settings/general" element={<GeneralSettings />} />
                  </Route>

                  {/* Settings — Admin / Super Admin only */}
                  <Route element={<RoleProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
                    <Route path="/settings/email" element={<EmailSettings />} />
                    <Route path="/settings/company" element={<CompanyProfileSettings />} />
                    <Route path="/settings/system-backup" element={<SystemBackup />} />
                  </Route>

                  {/* Customer Only Routes */}
                  <Route element={<RoleProtectedRoute allowedRoles={['CUSTOMER']} />}>
                    <Route path="/my-bookings" element={<MyBookings />} />
                    <Route path="/my-profile" element={<MyProfile />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </QueryProvider>
        </BrandProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
