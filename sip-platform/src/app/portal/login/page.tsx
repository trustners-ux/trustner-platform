import LoginForm from './LoginForm';

export const metadata = {
  title: 'Sign in to Trustner portal',
  robots: { index: false, follow: false },
};

export default function PortalLoginPage() {
  return <LoginForm />;
}
