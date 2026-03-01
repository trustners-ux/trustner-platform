import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - Book a Free Consultation",
  description: "Contact Trustner for mutual fund investments, insurance queries, or financial planning. Book a free consultation, call, email, or WhatsApp us.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
