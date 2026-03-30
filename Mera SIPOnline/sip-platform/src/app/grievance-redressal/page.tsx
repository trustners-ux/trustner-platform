import { COMPANY } from '@/lib/constants/company';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function GrievanceRedressalPage() {
  return (
    <section className="section-padding">
      <div className="container-custom max-w-3xl">
        <Link href="/" className="text-sm text-brand hover:underline mb-6 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-display-sm text-primary-700 mb-8">Investor Grievance Redressal</h1>

        <div className="prose-sip">
          <p className="text-sm text-surface-600">Last updated: March 2026</p>

          <p>
            {COMPANY.mfEntity.name} is committed to ensuring the highest standards of investor service and
            transparency. We have established a robust grievance redressal mechanism in compliance with SEBI and AMFI
            guidelines to address and resolve investor complaints in a fair, transparent, and timely manner.
          </p>

          <h2>Grievance Officer</h2>
          <div className="p-4 bg-surface-200 rounded-lg mb-4">
            <p className="text-sm"><strong>Designation:</strong> Grievance Officer</p>
            <p className="text-sm"><strong>Company:</strong> {COMPANY.mfEntity.name}</p>
            <p className="text-sm"><strong>Email:</strong>{' '}
              <a href={`mailto:${COMPANY.contact.grievanceEmail}`} className="text-brand hover:underline">
                {COMPANY.contact.grievanceEmail}
              </a>
            </p>
            <p className="text-sm"><strong>Phone:</strong>{' '}
              <a href={`tel:${COMPANY.contact.phone}`} className="text-brand hover:underline">
                {COMPANY.contact.phone}
              </a>
            </p>
            <p className="text-sm"><strong>Address:</strong> {COMPANY.address.full}</p>
            <p className="text-sm"><strong>Working Hours:</strong> {COMPANY.contact.workingHours}</p>
          </div>

          <h2>Complaint Resolution Process</h2>
          <p>
            We follow a structured three-level complaint resolution process to ensure every investor concern
            is addressed promptly and effectively.
          </p>

          <h3>Level 1 — Contact Us Directly</h3>
          <p>
            If you have any complaint or concern regarding your mutual fund investments facilitated through
            {' '}{COMPANY.mfEntity.shortName}, please contact us first. You may reach out through any of the
            following channels:
          </p>
          <ul>
            <li>
              <strong>Email:</strong>{' '}
              <a href={`mailto:${COMPANY.contact.grievanceEmail}`} className="text-brand hover:underline">
                {COMPANY.contact.grievanceEmail}
              </a>
            </li>
            <li>
              <strong>Phone:</strong>{' '}
              <a href={`tel:${COMPANY.contact.phone}`} className="text-brand hover:underline">
                {COMPANY.contact.phone}
              </a>
            </li>
            <li>
              <strong>Written Complaint:</strong> You may send a written complaint to our registered office at{' '}
              {COMPANY.address.full}
            </li>
          </ul>
          <p>
            When submitting a complaint, please include the following details for faster resolution:
          </p>
          <ul>
            <li>Your full name and contact information</li>
            <li>Folio number or application reference number</li>
            <li>Name of the mutual fund scheme</li>
            <li>Details of the transaction in question</li>
            <li>Nature of the complaint and expected resolution</li>
            <li>Supporting documents, if any</li>
          </ul>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg my-4">
            <p className="text-sm text-blue-900">
              <strong>Response Timeline:</strong> We will acknowledge your complaint within <strong>3 business days</strong> of
              receipt and endeavour to resolve it within <strong>30 calendar days</strong>.
            </p>
          </div>

          <h3>Level 2 — Escalation to AMFI</h3>
          <p>
            If your complaint is not resolved satisfactorily within 30 days of lodging it with us, or if you are
            not satisfied with the resolution provided, you may escalate your complaint to the Association of
            Mutual Funds in India (AMFI).
          </p>
          <ul>
            <li>
              <strong>AMFI Website:</strong>{' '}
              <a href="https://www.amfiindia.com" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-1">
                www.amfiindia.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              <strong>AMFI Complaint Form:</strong> Available on the AMFI website under the Investor Corner section
            </li>
          </ul>
          <p>
            AMFI acts as a self-regulatory organisation and can intervene to help resolve disputes between
            investors and mutual fund intermediaries, including distributors.
          </p>

          <h3>Level 3 — SEBI SCORES Portal</h3>
          <p>
            If the complaint remains unresolved after escalation to AMFI, investors can lodge a complaint on
            the SEBI SCORES (SEBI Complaint Redress System) portal. SEBI takes up complaints registered against
            listed companies and SEBI-registered intermediaries.
          </p>
          <ul>
            <li>
              <strong>SCORES Portal:</strong>{' '}
              <a href="https://scores.gov.in" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-1">
                scores.gov.in <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              <strong>SEBI Toll-Free Helpline:</strong>{' '}
              <a href="tel:18002227575" className="text-brand hover:underline">
                1800-22-7575
              </a>
            </li>
            <li>
              <strong>SEBI Office:</strong> SEBI Bhavan, Plot No. C4-A, &quot;G&quot; Block, Bandra-Kurla Complex,
              Bandra (East), Mumbai - 400051
            </li>
          </ul>

          <h2>Investor Charter</h2>
          <p>
            As per SEBI guidelines, all intermediaries including mutual fund distributors are required to adopt and
            abide by the Investor Charter. The Investor Charter outlines the rights and responsibilities of both
            investors and intermediaries. Key rights include:
          </p>
          <ul>
            <li>Right to receive fair, transparent, and timely services.</li>
            <li>Right to lodge grievances and receive timely resolution.</li>
            <li>Right to accurate, complete, and timely information about mutual fund products.</li>
            <li>Right to expect that personal data will be treated securely and confidentially.</li>
            <li>Right to be informed about all applicable charges and commissions.</li>
          </ul>
          <p>
            The complete Investor Charter is available on the{' '}
            <a href="https://www.amfiindia.com/investor-corner/knowledge-center/investor-charter.html" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-1">
              AMFI website <ExternalLink className="w-3 h-3" />
            </a>
            {' '}and the{' '}
            <a href="https://www.sebi.gov.in" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-1">
              SEBI website <ExternalLink className="w-3 h-3" />
            </a>.
          </p>

          <h2>Our Commitment</h2>
          <ul>
            <li><strong>Acknowledgement:</strong> All complaints will be acknowledged within 3 business days of receipt.</li>
            <li><strong>Resolution:</strong> We will endeavour to resolve all complaints within 30 calendar days.</li>
            <li><strong>Communication:</strong> Investors will be kept informed of the progress of their complaint at every stage.</li>
            <li><strong>Fairness:</strong> All complaints will be handled in a fair, impartial, and transparent manner.</li>
            <li><strong>Confidentiality:</strong> All investor information shared during the complaint process will be treated as confidential.</li>
          </ul>

          <h2>Regulatory Information</h2>
          <p>
            {COMPANY.mfEntity.name} | {COMPANY.mfEntity.type} | {COMPANY.mfEntity.amfiArn} |
            EUIN: {COMPANY.mfEntity.euin} | CIN: {COMPANY.mfEntity.cin}
          </p>

          <div className="mt-8 p-4 bg-surface-200 rounded-lg">
            <p className="text-sm font-semibold text-primary-700 mb-2">Important Links</p>
            <ul className="text-sm space-y-1">
              <li>
                <a href="https://www.sebi.gov.in" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-1">
                  SEBI — Securities and Exchange Board of India <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://www.amfiindia.com" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-1">
                  AMFI — Association of Mutual Funds in India <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://scores.gov.in" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-1">
                  SCORES — SEBI Complaint Redressal System <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://www.amfiindia.com/investor-corner/knowledge-center/investor-charter.html" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-1">
                  AMFI Investor Charter <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
