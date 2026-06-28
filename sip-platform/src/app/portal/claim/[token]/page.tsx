import ClaimForm from './ClaimForm';

export const metadata = {
  title: 'Claim your Trustner portal account',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ClaimPage({ params }: Props) {
  const { token } = await params;
  return <ClaimForm token={token} />;
}
