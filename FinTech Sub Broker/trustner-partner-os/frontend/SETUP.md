# Trustner Partner OS - Frontend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd /sessions/gifted-adoring-maxwell/mnt/FinTech\ Sub\ Broker/trustner-partner-os/frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
npm run preview
```

## Project Structure Overview

### `/src/components`
Reusable UI components organized by category:
- **common/** - StatCard, DataTable, Modal, StatusBadge, PageHeader, LoadingSpinner
- **charts/** - BarChart, LineChart, PieChart, AreaChart
- ProtectedRoute.jsx - Route authentication guard

### `/src/contexts`
- **AuthContext.jsx** - Global authentication state management with login, logout, user info

### `/src/layouts`
Three main layout components wrapping page content:
- **AdminLayout.jsx** - Navy sidebar, top bar for admin routes
- **PartnerLayout.jsx** - Navy sidebar for partner routes
- **ClientLayout.jsx** - Clean horizontal nav for client routes

### `/src/pages`
Page components organized by user role:
- **admin/** - 8 pages (Dashboard, SubBrokers, Clients, Commissions, Payouts, Compliance, Reports, Settings)
- **partner/** - 7 pages (Dashboard, MyClients, Transactions, SIPs, Commission, Marketing, Profile)
- **client/** - 5 pages (Portfolio, Goals, Transactions, SIPs, Profile)
- LoginPage.jsx

### `/src/services`
- **api.js** - Axios instance with interceptors for JWT and error handling
- **auth.js** - Authentication service methods (login, logout, getCurrentUser, etc.)

### `/src/utils`
- **formatters.js** - Number, currency, date formatting with Indian locale
- **constants.js** - Enums and mappings for statuses, roles, colors

## Key Features

### Authentication
- JWT token-based auth with localStorage
- Auto-add tokens to requests via axios interceptor
- Auto-redirect to login on 401 responses
- Role-based route protection

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Collapsible sidebar on admin/partner layouts
- Grid layouts adapting to screen size

### Data Visualization
- Recharts for Bar, Line, Area, and Pie charts
- Custom color scheme matching brand guidelines

### Forms
- HTML5 validation
- Multi-step forms (client creation)
- Modal-based forms
- Loading states during submission

### Tables
- Sortable columns
- Search/filter capabilities
- Pagination support
- Empty states and loading skeletons
- Responsive horizontal scroll

### Status Indicators
- Color-coded badges for various statuses
- KYC, Partner, Transaction, Compliance, Payout status badges

## API Integration Points

The frontend expects the following API endpoints at `/api`:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh

### Admin Routes
- `GET /admin/dashboard/stats` - Dashboard statistics
- `GET /admin/dashboard/aum-growth` - AUM trend data
- `GET /admin/dashboard/sip-inflow` - SIP inflow data
- `GET /admin/dashboard/top-partners` - Partner leaderboard
- `GET /admin/dashboard/product-mix` - Product allocation
- `GET /admin/sub-brokers` - List all sub-brokers
- `POST /admin/sub-brokers` - Create sub-broker
- `GET /admin/clients` - List all clients
- `GET /admin/clients/stats` - Client statistics
- `GET /admin/commissions` - Commission data
- `GET /admin/commissions/stats` - Commission statistics
- `POST /admin/commissions/import` - Import RTA file
- `GET /admin/payouts` - Payout data
- `GET /admin/payouts/stats` - Payout statistics
- `PATCH /admin/payouts/:id/mark-paid` - Mark payout as paid
- `GET /admin/compliance/stats` - Compliance statistics
- `GET /admin/compliance/alerts` - Compliance alerts
- `PATCH /admin/compliance/alerts/:id/resolve` - Resolve alert
- `GET /admin/settings` - System settings
- `PATCH /admin/settings` - Update settings
- `GET /admin/settings/commission-tiers` - Commission tiers
- `PATCH /admin/settings/commission-tiers` - Update tiers

### Partner Routes
- `GET /partner/dashboard/stats` - Dashboard statistics
- `GET /partner/dashboard/aum-trend` - AUM trend
- `GET /partner/dashboard/commission-trend` - Commission trend
- `GET /partner/dashboard/recent-transactions` - Recent transactions
- `GET /partner/dashboard/top-clients` - Top clients
- `GET /partner/clients` - List clients
- `POST /partner/clients` - Add client
- `GET /partner/transactions` - List transactions
- `POST /partner/transactions` - Create transaction
- `GET /partner/sips` - List SIPs
- `GET /partner/sips/stats` - SIP statistics
- `POST /partner/sips` - Create SIP
- `GET /partner/commission/stats` - Commission statistics
- `GET /partner/commission/forecast` - Commission forecast
- `GET /partner/commission/history` - Commission history
- `GET /partner/profile` - Partner profile
- `PATCH /partner/profile` - Update profile
- `GET /partner/documents` - Partner documents
- `GET /partner/schemes` - Available schemes

### Client Routes
- `GET /client/portfolio/summary` - Portfolio summary
- `GET /client/portfolio/holdings` - Holdings list
- `GET /client/portfolio/performance` - Performance data
- `GET /client/portfolio/allocation` - Asset allocation
- `GET /client/goals` - Client goals
- `POST /client/goals` - Create goal
- `GET /client/transactions` - Transaction history
- `GET /client/sips` - SIP list
- `GET /client/sips/stats` - SIP statistics
- `GET /client/sips/history` - SIP installation history
- `GET /client/profile` - Client profile

## Customization Guide

### Colors
Edit `tailwind.config.js` to customize the color palette:

```javascript
colors: {
  navy: { 500: '#1a237e' },
  teal: { 500: '#00897b' },
  gold: { 500: '#f9a825' },
}
```

### Branding
- Update logo in layouts (currently "T" placeholder)
- Change company name in footer and headers
- Modify favicon in `index.html`

### Navigation Items
Edit navigation arrays in:
- `src/layouts/AdminLayout.jsx` - Admin nav items
- `src/layouts/PartnerLayout.jsx` - Partner nav items
- `src/layouts/ClientLayout.jsx` - Client nav items

### Chart Colors
Modify `colors` prop in chart components:

```jsx
<LineChart
  data={data}
  colors={['#1565c0', '#00897b']}
/>
```

## Performance Tips

1. **Code Splitting**: Routes are automatically split by React Router
2. **Lazy Loading**: Consider lazy loading heavy components
3. **Memoization**: Use React.memo for expensive components
4. **Image Optimization**: Compress and optimize images
5. **Bundle Analysis**: Run `npm run build` and check dist folder size

## Deployment

### Docker
```bash
docker build -t trustner-frontend .
docker run -p 3000:80 trustner-frontend
```

### Environment Variables
Create `.env.local`:
```
VITE_API_URL=/api
```

### Production Build
```bash
npm run build
```

Serve the `dist/` folder with a static web server.

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
lsof -i :5173
kill -9 <PID>
```

### Node Modules Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### API Connection Issues
- Check backend is running on port 5000
- Verify `vite.config.js` proxy configuration
- Check browser network tab for failed requests

### Styling Issues
- Clear browser cache (Shift+Ctrl+Delete)
- Rebuild Tailwind: `npm run build`
- Check class names in `tailwind.config.js`

## Testing Credentials

For development, use these test credentials:

### Super Admin
- Email: admin@trustner.com
- Password: Admin@123

### Sub-Broker
- Email: partner@trustner.com
- Password: Partner@123

### Client
- Email: client@trustner.com
- Password: Client@123

## Next Steps

1. Configure backend API endpoints
2. Set up authentication tokens handling
3. Implement error handling and notifications
4. Add form validation library
5. Set up testing framework
6. Implement analytics
7. Add dark mode support
8. Optimize bundle size

## Support & Documentation

- React: https://react.dev
- Vite: https://vitejs.dev
- Tailwind: https://tailwindcss.com
- React Router: https://reactrouter.com
- Recharts: https://recharts.org

## License

Copyright © 2024 Trustner Asset Services. All rights reserved.
