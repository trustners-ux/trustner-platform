import { Metadata } from "next";
import { COMPANY } from "@/lib/constants/company";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Trustner Privacy Policy - How we collect, use, and protect your personal data. DPDPA 2023 compliant.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-surface-100">
      <div className="border-b border-gray-100 bg-white">
        <div className="container-custom py-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: February 2026 | Compliant with Digital Personal Data Protection Act, 2023</p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-gray-100 bg-white p-8 lg:p-12">
          <div className="prose prose-sm max-w-none text-gray-600">
            <h2 className="text-xl font-bold text-gray-900">1. Introduction</h2>
            <p>{COMPANY.brand} (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and share your information when you use our website (trustner.in) and services.</p>
            <p>This policy is compliant with the Digital Personal Data Protection Act, 2023 (DPDPA) and applicable SEBI, AMFI, and IRDAI regulations regarding data protection.</p>

            <h2 className="mt-8 text-xl font-bold text-gray-900">2. Information We Collect</h2>
            <p>We collect the following categories of personal data:</p>
            <ul>
              <li><strong>Identity Data:</strong> Name, PAN, Aadhaar (for KYC), date of birth, gender</li>
              <li><strong>Contact Data:</strong> Email, phone number, postal address</li>
              <li><strong>Financial Data:</strong> Bank account details, investment history, insurance policies</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, cookies</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, interaction patterns</li>
            </ul>

            <h2 className="mt-8 text-xl font-bold text-gray-900">3. How We Use Your Data</h2>
            <ul>
              <li>To process mutual fund investments and insurance applications</li>
              <li>To complete KYC verification as required by SEBI/AMFI regulations</li>
              <li>To provide personalized investment recommendations</li>
              <li>To send transaction confirmations and policy documents</li>
              <li>To comply with regulatory reporting requirements (SEBI, AMFI, IRDAI, FIU-IND)</li>
              <li>To improve our services and user experience</li>
            </ul>

            <h2 className="mt-8 text-xl font-bold text-gray-900">4. Data Sharing</h2>
            <p>We share your data only with:</p>
            <ul>
              <li>Asset Management Companies (AMCs) for mutual fund transactions</li>
              <li>Insurance companies for policy issuance and claims</li>
              <li>KYC Registration Agencies (KRAs) as mandated by SEBI</li>
              <li>Payment processors for transaction execution</li>
              <li>Regulatory authorities (SEBI, AMFI, IRDAI, FIU-IND) as required by law</li>
            </ul>

            <h2 className="mt-8 text-xl font-bold text-gray-900">5. Your Rights (DPDPA 2023)</h2>
            <p>Under the DPDPA 2023, you have the right to:</p>
            <ul>
              <li>Access your personal data held by us</li>
              <li>Correct inaccurate personal data</li>
              <li>Erase your personal data (subject to regulatory retention requirements)</li>
              <li>Withdraw consent for data processing</li>
              <li>Nominate a person to exercise rights in case of death or incapacity</li>
              <li>File a grievance with our Data Protection Officer</li>
            </ul>

            <h2 className="mt-8 text-xl font-bold text-gray-900">6. Data Security</h2>
            <p>We employ industry-standard security measures including encryption (SSL/TLS), secure data storage in India as per RBI data localization requirements, access controls, and regular security audits.</p>

            <h2 className="mt-8 text-xl font-bold text-gray-900">7. Data Retention</h2>
            <p>We retain your data for as long as required by applicable regulations (typically 5-8 years for financial records) and for legitimate business purposes.</p>

            <h2 className="mt-8 text-xl font-bold text-gray-900">8. Contact Us</h2>
            <p>For privacy-related queries, contact our Grievance Officer:</p>
            <p>Email: {COMPANY.contact.supportEmail}</p>
            <p>Phone: {COMPANY.contact.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
