# Trustner Partner OS - Frontend

A professional React 18 + Vite frontend for the Trustner fintech B2B2C platform with three distinct user interfaces: Super Admin Panel, Partner (Sub-Broker) Dashboard, and Client Portal.

## Features

### Tech Stack
- **React 18** - UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router v6** - Client-side routing
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **dayjs** - Date manipulation

### User Interfaces

#### 1. Super Admin Panel (`/admin/*`)
- Dashboard with key metrics
- Sub-broker management
- Client overview
- Commission tracking
- Payout management
- Compliance alerts
- Reports generation
- System settings

#### 2. Partner (Sub-Broker) Dashboard (`/partner/*`)
- Business dashboard
- Client management
- Transaction tracking
- SIP management
- Commission dashboard
- Marketing toolkit
- Profile management

#### 3. Client Portal (`/client/*`)
- Portfolio overview
- Financial goals
- Transaction history
- SIP tracking
- Account profile

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── common/              # Reusable components
│   │   ├── StatCard.jsx
│   │   ├── DataTable.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── Modal.jsx
│   │   └── ...
│   ├── charts/              # Chart components
│   │   ├── BarChart.jsx
│   │   ├── LineChart.jsx
│   │   ├── PieChart.jsx
│   │   └── AreaChart.jsx
│   └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx      # Authentication context
├── layouts/
│   ├── AdminLayout.jsx
│   ├── PartnerLayout.jsx
│   └── ClientLayout.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── admin/               # Admin pages
│   ├── partner/             # Partner pages
│   └── client/              # Client pages
├── services/
│   ├── api.js               # Axios instance
│   └── auth.js              # Authentication service
├── utils/
│   ├── formatters.js        # Utility functions
│   └── constants.js         # App constants
├── App.jsx                  # Main app with routing
├── main.jsx                 # Entry point
└── index.css                # Global styles
```

## Authentication

The app uses JWT token-based authentication. Tokens are stored in localStorage and automatically added to API requests via an axios interceptor.

### Authentication Flow
1. User logs in with email and password
2. Backend returns `accessToken`, `refreshToken`, and `user` data
3. Tokens stored in localStorage
4. Request interceptor adds Authorization header
5. Response interceptor handles 401 errors

## Role-Based Access Control

Six roles supported:
- `SUPER_ADMIN` - Full system access
- `COMPLIANCE_ADMIN` - Compliance monitoring
- `FINANCE_ADMIN` - Financial management
- `REGIONAL_HEAD` - Regional partner management
- `SUB_BROKER` - Partner dashboard access
- `CLIENT` - Client portal access

Routes are protected using `ProtectedRoute` component that checks user role.

## API Integration

All API calls use the centralized `apiService` which:
- Uses `/api` base URL (proxied to backend in dev)
- Automatically adds JWT tokens
- Handles errors and redirects on 401
- Returns response data directly

## Styling

Uses Tailwind CSS with custom color palette:
- **Navy** (#1a237e) - Primary navigation and headers
- **Blue** (#1565c0) - Primary actions and links
- **Teal** (#00897b) - Success and positive indicators
- **Gold** (#f9a825) - Warnings and highlights
- **Light Background** (#f5f7fa)

## Forms and Validation

Forms are built with HTML5 validation and basic error handling. For production, consider adding a form library like React Hook Form or Formik.

## Development Tips

1. **Hot Module Replacement**: Changes to code automatically refresh without losing state
2. **CSS in Tailwind**: Use existing utility classes - avoid inline styles
3. **Component Structure**: Keep components focused and reusable
4. **API Calls**: Use `useEffect` for data fetching with proper loading/error states
5. **Testing**: Add tests using Vitest or Jest

## Building for Production

```bash
npm run build
```

This creates an optimized `dist/` folder ready for deployment.

## Docker Deployment

```dockerfile
# Build image
docker build -t trustner-frontend .

# Run container
docker run -p 3000:80 trustner-frontend
```

The app will be available at `http://localhost:3000`

## Environment Variables

Create a `.env.local` file:

```
VITE_API_URL=/api
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimization

- Code splitting with React Router
- Image optimization
- CSS minification via Tailwind
- Bundle analysis available with build
- Lazy loading of routes

## License

Copyright © 2024 Trustner Asset Services. All rights reserved.
