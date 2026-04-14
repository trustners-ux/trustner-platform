import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Life Plans — Financial Guidance by Profession | MeraSIP by Trustner',
  description:
    'Explore tailored financial guidance for doctors, engineers, homemakers, business owners, and more. Educational resources to help every Indian family plan their financial journey.',
};

export default function LifePlansLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
