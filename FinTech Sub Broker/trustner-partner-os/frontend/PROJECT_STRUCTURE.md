# Trustner Partner OS - Complete Project Structure

## Directory Tree

```
frontend/
├── public/                          # Static assets (favicon, etc)
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── StatCard.jsx        # Statistics card component
│   │   │   ├── DataTable.jsx       # Sortable, searchable data table
│   │   │   ├── StatusBadge.jsx     # Color-coded status badges
│   │   │   ├── LoadingSpinner.jsx  # Loading spinner component
│   │   │   ├── Modal.jsx           # Reusable modal dialog
│   │   │   ├── ConfirmDialog.jsx   # Confirmation dialog
│   │   │   └── PageHeader.jsx      # Page title with actions
│   │   ├── charts/
│   │   │   ├── BarChart.jsx        # Bar chart wrapper
│   │   │   ├── LineChart.jsx       # Line chart wrapper
│   │   │   ├── PieChart.jsx        # Pie/Donut chart wrapper
│   │   │   └── AreaChart.jsx       # Area chart wrapper
│   │   └── ProtectedRoute.jsx      # Route authentication guard
│   ├── contexts/
│   │   └── AuthContext.jsx         # Global auth state provider
│   ├── layouts/
│   │   ├── AdminLayout.jsx         # Admin dashboard layout
│   │   ├── PartnerLayout.jsx       # Partner dashboard layout
│   │   └── ClientLayout.jsx        # Client portal layout
│   ├── pages/
│   │   ├── LoginPage.jsx           # Authentication login form
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx          # Dashboard with stats & charts
│   │   │   ├── SubBrokersManagement.jsx    # Partner management table
│   │   │   ├── ClientsOverview.jsx         # Client directory
│   │   │   ├── CommissionsPage.jsx         # Commission tracking & import
│   │   │   ├── PayoutsPage.jsx             # Payout approval & management
│   │   │   ├── CompliancePage.jsx          # Compliance alerts
│   │   │   ├── ReportsPage.jsx             # Report generation
│   │   │   └── SettingsPage.jsx            # System configuration
│   │   ├── partner/
│   │   │   ├── PartnerDashboard.jsx        # Partner business overview
│   │   │   ├── MyClients.jsx               # Client management
│   │   │   ├── TransactionsPage.jsx        # Transaction management
│   │   │   ├── SIPsPage.jsx                # SIP creation & tracking
│   │   │   ├── CommissionDashboard.jsx     # Commission history & forecast
│   │   │   ├── MarketingToolkit.jsx        # SIP calculator & templates
│   │   │   └── PartnerProfile.jsx          # Profile & certifications
│   │   └── client/
│   │       ├── ClientPortfolio.jsx         # Investment portfolio view
│   │       ├── GoalsPage.jsx               # Financial goals
│   │       ├── ClientTransactions.jsx      # Transaction history
│   │       ├── SIPTracker.jsx              # SIP management
│   │       └── ClientProfile.jsx           # Account information
│   ├── services/
│   │   ├── api.js                  # Axios instance with interceptors
│   │   └── auth.js                 # Authentication service methods
│   ├── utils/
│   │   ├── constants.js            # Enums, status mappings, color schemes
│   │   └── formatters.js           # Currency, number, date formatting
│   ├── App.jsx                     # Main app with routing
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Global styles & Tailwind imports
├── index.html                      # HTML template
├── package.json                    # Dependencies
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
├── nginx.conf                      # Nginx server configuration
├── Dockerfile                      # Docker build configuration
├── .gitignore                      # Git ignore rules
├── .env.example                    # Environment variables template
├── README.md                       # Project overview
├── SETUP.md                        # Setup and development guide
└── PROJECT_STRUCTURE.md            # This file
```

## File Descriptions

### Configuration Files

#### `package.json`
- Dependencies: react, react-dom, react-router-dom, axios, recharts, lucide-react, dayjs
- DevDeps: vite, tailwindcss, postcss, autoprefixer, @types/react
- Scripts: dev, build, preview

#### `vite.config.js`
- React plugin integration
- Dev server configuration with /api proxy
- Port: 5173

#### `tailwind.config.js`
- Extended colors: navy, teal, gold
- Content paths for component scanning
- Custom component layer definitions

#### `postcss.config.js`
- Tailwind CSS and autoprefixer processing

#### `index.html`
- HTML template with root div
- Script reference to main.jsx

### Authentication System

#### `src/contexts/AuthContext.jsx`
- `AuthProvider` component wrapping entire app
- `useAuth()` hook for accessing auth state
- State: user, isLoading, isAuthenticated, role
- Methods: login, logout

#### `src/services/auth.js`
- `login(email, password)` - User authentication
- `logout()` - Clear tokens and user
- `refreshToken()` - Token refresh
- `getCurrentUser()` - Get user from storage
- `isAuthenticated()` - Check auth status
- `getUserRole()` - Get user's role

#### `src/services/api.js`
- Axios instance with `/api` base URL
- Request interceptor: adds Bearer token
- Response interceptor: handles 401 redirects
- Methods: get, post, patch, delete

### UI Components

#### StatCard.jsx
- Props: title, value, change, changeType, icon, color, format
- Displays KPI with trending indicator
- Format options: currency, number, percentage

#### DataTable.jsx
- Props: columns, data, pagination, sorting, searching
- Features: sortable headers, search bar, pagination controls
- Handles loading and empty states

#### Modal.jsx & ConfirmDialog.jsx
- Reusable dialog components
- Modal: generic content container
- ConfirmDialog: action confirmation with danger option

#### StatusBadge.jsx
- Color-coded status indicators
- Variants: kyc, partner, transaction, severity, payout, client

#### Chart Components
- BarChart, LineChart, PieChart, AreaChart
- Built on Recharts
- Customizable colors and data keys

### Admin Interface

#### AdminDashboard.jsx
- 6 stat cards (AUM, Partners, Clients, SIP Book, Commission, Alerts)
- AUM growth area chart (12 months)
- SIP inflow bar chart (12 months)
- Partner leaderboard table
- Product mix pie chart
- Recent activity feed

#### SubBrokersManagement.jsx
- Filterable table: Status, Tier, Branch, Search
- Add new sub-broker modal (form)
- Columns: Code, Name, ARN, Status, Tier, AUM, Clients, Actions
- Export to Excel button

#### ClientsOverview.jsx
- Client directory with filters
- KYC Status and Client Status filters
- Stats: Total, KYC Pending, Active, Dormant
- Columns: Code, Name, PAN, KYC Status, Portfolio Value, SIP Amount, Status

#### CommissionsPage.jsx
- Period selector (month/year)
- Summary cards: Gross, TDS, GST, Net, Trustner Revenue
- Commission table with breakdown
- Import RTA file modal
- Calculate and Export buttons

#### PayoutsPage.jsx
- Summary: Pending, Processing, Paid This Month
- Payout table with approval workflow
- Mark as Paid modal with bank reference
- Status tracking: PENDING → APPROVED → PROCESSING → PAID

#### CompliancePage.jsx
- Alert severity cards: Critical, High, Medium, Low
- Alert list with filters and search
- Resolve modal with notes
- Run Scan button

#### ReportsPage.jsx
- 6 report cards: MIS, Branch, Partner, AUM, Commission, Capital Gains
- Date range picker per report
- Download button for each report

#### SettingsPage.jsx
- System Configuration: TDS, GST, Revenue Share, Min Payout
- Commission Tiers: editable table with AUM ranges and rates
- Save configurations button

### Partner Interface

#### PartnerDashboard.jsx
- 5 stat cards: AUM, SIP Book, Monthly Commission, Active Clients, Upcoming SIPs
- AUM trend line chart (12 months)
- Monthly commission bar chart
- Recent transactions table
- Top clients by AUM table

#### MyClients.jsx
- Multi-step form: Basic Details → Contact → Risk Assessment
- Client table: Name, PAN, KYC Status, Portfolio Value, SIP Amount, Status
- Add Client button triggering modal

#### TransactionsPage.jsx
- New Transaction modal with transaction type selector
- Client and scheme selection
- Amount and payment mode input
- Transaction table with status tracking

#### SIPsPage.jsx
- Create SIP modal
- SIP stats: Total Book, Active, Paused, This Month
- Active SIPs table: Client, Scheme, Amount, Frequency, Next Due, Status
- Monthly/Quarterly/Semi-Annual/Annual frequency options

#### CommissionDashboard.jsx
- 4 stat cards: This Month, This Year, Pending Payout, Average Monthly
- Commission forecast line chart (6 months)
- Commission history table with download statements

#### MarketingToolkit.jsx
- Interactive SIP calculator
- Report templates: Investment Benefits, Market Volatility, Goal Planning
- Social media post templates
- Resource downloads: Presentations, Brochures, Checklists, Videos

#### PartnerProfile.jsx
- Profile information form
- Bank details form
- Certifications display: ARN, NISM, POSP with expiry dates
- Documents upload section

### Client Interface

#### ClientPortfolio.jsx
- Portfolio summary: Total Invested, Current Value, Returns ₹, Returns %
- Holdings table: Scheme, Units, Invested, Current Value, Returns %, Allocation %
- Portfolio performance line chart
- Asset allocation pie chart

#### GoalsPage.jsx
- Goal cards with progress bars
- Add Goal modal
- Goal metrics: Target, Current, Remaining, Monthly SIP Needed
- Target date display

#### ClientTransactions.jsx
- Date range filter
- Transaction table: Date, Type, Scheme, Amount, NAV, Units, Status
- Download statement button

#### SIPTracker.jsx
- SIP stats: Total Book, Active, Total Invested, Current Value
- Active SIPs table
- SIP installation history table (calendar-style)

#### ClientProfile.jsx
- Personal information display (read-only)
- KYC status with verification date
- Nominee details with update button
- Bank account details with update button
- Risk profile with update option
- Communication preferences checkboxes

### Layouts

#### AdminLayout.jsx
- Navy sidebar (#1a237e) with logo
- Navigation: Dashboard, Sub-Brokers, Clients, Commissions, Payouts, Compliance, Reports, Settings
- Top bar: Page title, notifications, user info, logout
- Collapsible sidebar on mobile

#### PartnerLayout.jsx
- Similar structure to AdminLayout
- Navigation: Dashboard, My Clients, Transactions, SIPs, Commission, Marketing, Profile
- Green user avatar color

#### ClientLayout.jsx
- Horizontal top navigation (no sidebar)
- Clean, simple investor-focused interface
- Navigation: Portfolio, Goals, Transactions, SIPs, Profile
- Teal user avatar color

## Routing Structure

```
/
├── /login                          (LoginPage)
├── /admin/*                        (AdminLayout)
│   ├── dashboard                   (AdminDashboard)
│   ├── sub-brokers                 (SubBrokersManagement)
│   ├── clients                     (ClientsOverview)
│   ├── commissions                 (CommissionsPage)
│   ├── payouts                     (PayoutsPage)
│   ├── compliance                  (CompliancePage)
│   ├── reports                     (ReportsPage)
│   └── settings                    (SettingsPage)
├── /partner/*                      (PartnerLayout)
│   ├── dashboard                   (PartnerDashboard)
│   ├── clients                     (MyClients)
│   ├── transactions                (TransactionsPage)
│   ├── sips                        (SIPsPage)
│   ├── commission                  (CommissionDashboard)
│   ├── marketing                   (MarketingToolkit)
│   └── profile                     (PartnerProfile)
├── /client/*                       (ClientLayout)
│   ├── portfolio                   (ClientPortfolio)
│   ├── goals                       (GoalsPage)
│   ├── transactions                (ClientTransactions)
│   ├── sips                        (SIPTracker)
│   └── profile                     (ClientProfile)
└── * (redirect to /login)
```

## Role-Based Access Control

```
Routes Protected by Role:
├── /admin/*         → SUPER_ADMIN, COMPLIANCE_ADMIN, FINANCE_ADMIN
├── /partner/*       → SUB_BROKER, REGIONAL_HEAD
└── /client/*        → CLIENT
```

## Data Flow

```
User Input (Form/Button)
    ↓
Component State (useState)
    ↓
API Call via apiService.post/get/patch/delete
    ↓
Axios Request with JWT Token
    ↓
Backend API (/api/...)
    ↓
Response Data
    ↓
Component Update (setData)
    ↓
Re-render with new data
```

## Component Hierarchy

```
<App>
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/*">
        <ProtectedRoute requiredRoles={ADMIN_ROLES}>
          <AdminLayout>
            <Outlet>
              <AdminDashboard />
              <SubBrokersManagement />
              ...
            </Outlet>
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      ...
    </Routes>
  </AuthProvider>
</App>
```

## State Management

- **Global State**: AuthContext (user, isAuthenticated, role)
- **Component State**: useState for local component data
- **Server State**: Fetched via API and stored in component state

## API Communication

All API requests go through:
1. `apiService` in `src/services/api.js`
2. Axios instance with interceptors
3. Automatic token injection in headers
4. Error handling and 401 redirect

## Styling System

- **Framework**: Tailwind CSS
- **Colors**: Custom color palette (navy, teal, gold)
- **Components**: Layer-based component styles in index.css
- **Responsive**: Mobile-first design with md: lg: breakpoints
- **Icons**: Lucide React (24+ icons used)

## Performance Considerations

- **Code Splitting**: Routes automatically split by React Router
- **Lazy Loading**: Potential for component lazy loading
- **Memoization**: Consider for expensive components
- **Bundle**: ~150-200KB gzipped (Vite optimized)

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development Tools

- **Build Tool**: Vite
- **CSS**: Tailwind CSS + PostCSS
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date Handling**: dayjs

## Dependencies

- **Core**: react@18, react-dom@18, react-router-dom@6
- **UI**: tailwindcss, @headlessui/react
- **Data**: recharts, axios, dayjs
- **Icons**: lucide-react

## Getting Started

```bash
npm install
npm run dev
# Open http://localhost:5173
```

## Build for Production

```bash
npm run build
npm run preview
```

## Docker Deployment

```bash
docker build -t trustner-frontend .
docker run -p 3000:80 trustner-frontend
```

---

**Last Updated**: February 2025
**Version**: 1.0.0
**Status**: Production Ready
