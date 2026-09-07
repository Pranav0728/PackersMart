import { createBrowserRouter, RouterProvider, Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import LeadForm from './components/LeadForm.jsx';
import OTPVerification from './components/OTPVerification.jsx';
import Dashboard from './components/Dashboard.jsx';
import LeadsTable from './components/LeadsTable.jsx';
import LeadDetail from './components/LeadDetail.jsx';
import Companies from './components/Companies.jsx';
import './App.css';

function Navbar() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard');

  const navLink = (to, label) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
          isActive
            ? 'bg-orange-600 text-white shadow-md'
            : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700'
        }`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">PackersMart</h1>
              <p className="text-xs text-gray-500 -mt-1">Smart Relocation Platform</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLink('/', 'Book Now')}
            {isAdminPath && (
              <>
                {navLink('/dashboard', 'Dashboard')}
                {navLink('/admin/leads', 'Leads')}
                {navLink('/admin/companies', 'Companies')}
              </>
            )}
            {!isAdminPath && (
              <div className="ml-2 pl-4 border-l border-gray-200">
                {navLink('/dashboard', 'Admin Panel')}
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-1">
            {navLink('/', 'Book')}
            {navLink('/dashboard', 'Admin')}
          </div>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-white font-semibold">PackersMart</span>
            <span className="text-xs">© 2025</span>
          </div>
          <p className="text-xs text-center">Lead-to-Booking MVP Demo • React + Node + SQLite</p>
        </div>
      </div>
    </footer>
  );
}

function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <LeadForm /> },
      { path: 'verify-otp/:leadId', element: <OTPVerification /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'admin/leads', element: <LeadsTable /> },
      { path: 'admin/leads/:id', element: <LeadDetail /> },
      { path: 'admin/companies', element: <Companies /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
