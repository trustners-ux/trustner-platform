import { Metadata } from "next";
import { COMPANY } from "@/lib/constants/company";
import { REGULATORY } from "@/lib/constants/regulatory";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using Trustner platform and services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-100">
      <div className="border-b border-gray-100 bg-white">
        <div className="container-custom py-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: February 2026</p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-gray-100 bg-white p-8 lg:p-12">
          <div className="prose prose-sm max-w-none text-gray-600">
            <h2 className="text-xl font-bold text-gray-900">1. Acceptance of Terms</h2>
            <p>By accessing and using the Trustner platform (wealthyhub.in), you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>

            <h2 className="mt-8 text-xl font-bold text-gray-900">2. Services</h2>
            <p>Trustner provides mutual fund distribution services through {COMPANY.mfEntity.name} ({REGULATORY.AMFI_ARN}) and insurance broking services through {COMPANY.insuranceEntity.name} ({REGULATORY.IRDAI_LICENSE}).</p>
            <p>{REGULATORY.DISTRIBUTOR_DISCLAIMER}</p>

            <h2 className="mt-8 text-xl font-bold text-gray-900">3. Investment Risks</h2>
            <p className="font-semibold text-yellow-700">{REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER}</p>
            <p>{REGULATORY.PAST_PERFORMANCE}</p>

            <h2 className="mt-8 text-xl font-bold text-gray-900">4. User Obligations</h2>
            <ul>
              <li>You must be at least 18 years of age to use our services</li>
              <li>You must provide accurate and complete information</li>
              <li>You must complete KYC as required by SEBI regulations</li>
              <li>You are responsible for maintaining the confidentiality of your account</li>
              <li>You must not use the platform for any illegal activities</li>
            </ul>

            <h2 className="mt-8 text-xl font-bold text-gray-900">5. Limitation of Liability</h2>
            <p>Trustner shall not be liable for any investment losses, market fluctuations, or outcomes of insurance claims. All investment decisions are made at the sole discretion and risk of the investor.</p>

            <h2 className="mt-8 text-xl font-bold text-gray-900">6. Governing Law</h2>
            <p>These terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in [City], India.</p>

            <h2 className="mt-8 text-xl font-bold text-gray-900">7. Contact</h2>
            <p>For any questions regarding these terms, please contact us at {COMPANY.contact.email}.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
