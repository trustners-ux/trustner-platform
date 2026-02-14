import { Metadata } from "next";
import { REGULATORY } from "@/lib/constants/regulatory";
import { COMPANY } from "@/lib/constants/company";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Important disclaimers regarding mutual fund investments, insurance products, and services offered by Trustner.",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-100 bg-white">
        <div className="container-custom py-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Disclaimer</h1>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-gray-100 bg-white p-8 lg:p-12">
          <div className="prose prose-sm max-w-none text-gray-600">
            <h2 className="text-xl font-bold text-gray-900">Mutual Fund Investments</h2>
            <p className="font-semibold text-yellow-700">{REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER}</p>
            <p>{REGULATORY.PAST_PERFORMANCE}</p>
            <p>{REGULATORY.NAV_DISCLAIMER}</p>
            <p>{REGULATORY.NO_GUARANTEE}</p>
            <p>{REGULATORY.DISTRIBUTOR_DISCLAIMER}</p>

            <h2 className="mt-8 text-xl font-bold text-gray-900">Tax Information</h2>
            <p>{REGULATORY.TAX_DISCLAIMER}</p>

            <h2 className="mt-8 text-xl font-bold text-gray-900">Insurance Products</h2>
            <p>{REGULATORY.INSURANCE_DISCLAIMER}</p>
            <p>Insurance products are distributed by {COMPANY.insuranceEntity.name}. {REGULATORY.IRDAI_LICENSE}.</p>

            <h2 className="mt-8 text-xl font-bold text-gray-900">KYC Compliance</h2>
            <p>{REGULATORY.KYC_NOTICE}</p>

            <h2 className="mt-8 text-xl font-bold text-gray-900">FATCA / CRS</h2>
            <p>{REGULATORY.FATCA_CRS}</p>

            <h2 className="mt-8 text-xl font-bold text-gray-900">Data & Privacy</h2>
            <p>{REGULATORY.DPDPA_NOTICE}</p>
            <p>{REGULATORY.DATA_DISCLAIMER}</p>

            <h2 className="mt-8 text-xl font-bold text-gray-900">Grievance Redressal</h2>
            <p>
              For any grievance, you may contact our Compliance Officer: {REGULATORY.COMPLIANCE_OFFICER.name} at {REGULATORY.COMPLIANCE_OFFICER.email}.
            </p>
            <p>
              You may also reach out to SEBI through the{" "}
              <a href={REGULATORY.SEBI_SCORES.url} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">
                SCORES portal
              </a>{" "}
              or visit{" "}
              <a href={REGULATORY.AMFI_WEBSITE.url} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">
                AMFI
              </a>.
            </p>

            <h2 className="mt-8 text-xl font-bold text-gray-900">Entity Information</h2>
            <p><strong>Mutual Fund Distribution:</strong> {COMPANY.mfEntity.name} | {REGULATORY.AMFI_ARN} | {REGULATORY.CIN_MF}</p>
            <p><strong>Insurance Broking:</strong> {COMPANY.insuranceEntity.name} | {REGULATORY.IRDAI_LICENSE} | {REGULATORY.CIN_INSURANCE}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
