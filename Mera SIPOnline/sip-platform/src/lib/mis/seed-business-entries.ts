// ─── Seed Business Entries for Local Development ───
// Sample data for April 2026 to demonstrate the system

import { MonthlyBusinessEntry } from './types';

let nextId = 1;

function entry(
  employeeId: number,
  productId: number,
  rawAmount: number,
  weightedAmount: number,
  opts: Partial<MonthlyBusinessEntry> = {}
): MonthlyBusinessEntry {
  return {
    id: nextId++,
    employeeId,
    month: '2026-04',
    productId,
    rawAmount,
    productCreditPct: opts.productCreditPct || 100,
    channelPayoutPct: opts.channelPayoutPct || 0,
    companyMarginPct: opts.companyMarginPct || 100,
    marginCreditFactor: opts.marginCreditFactor || 1,
    tierMultiplier: opts.tierMultiplier || 100,
    weightedAmount,
    isFpRoute: opts.isFpRoute || false,
    policyNumber: opts.policyNumber,
    clientName: opts.clientName,
    insurer: opts.insurer,
    status: opts.status || 'draft',
    rejectionReason: opts.rejectionReason,
    isCrossSale: opts.isCrossSale,
    isBusinessLoss: opts.isBusinessLoss,
    lossReason: opts.lossReason,
    transactionDate: opts.transactionDate,
    errorMessage: opts.errorMessage,
    ...opts,
  };
}

export const SEED_BUSINESS_ENTRIES: MonthlyBusinessEntry[] = [
  // ─── Abir Das (CDO, Direct Sales, Target: ₹18L) ───
  entry(3, 1, 150000, 187500, { clientName: 'Rajesh Gupta', insurer: 'TATA AIA', policyNumber: 'TAIA-2026-001', productCreditPct: 125, tierMultiplier: 100, status: 'approved', transactionDate: '2026-04-02' }),
  entry(3, 2, 85000, 85000, { clientName: 'Priya Menon', insurer: 'Star Health', policyNumber: 'STAR-2026-042', status: 'submitted', transactionDate: '2026-04-05' }),
  entry(3, 5, 120000, 120000, { clientName: 'Vikram Industries', insurer: 'ICICI Lombard', policyNumber: 'ICL-2026-019', status: 'approved', transactionDate: '2026-04-03' }),
  entry(3, 13, 25000, 12500, { clientName: 'Multiple SIPs', productCreditPct: 100, tierMultiplier: 50, status: 'draft', transactionDate: '2026-04-10' }),

  // ─── Subhasish Kar (VP-Institutional, Target: ₹7.2L) ───
  entry(4, 5, 250000, 250000, { clientName: 'ABC Corporation', insurer: 'New India', policyNumber: 'NIA-2026-108', status: 'approved', transactionDate: '2026-04-01' }),
  entry(4, 17, 180000, 36000, { clientName: 'XYZ Group', insurer: 'ICICI Lombard', policyNumber: 'ICL-GPA-2026-05', productCreditPct: 20, tierMultiplier: 50, status: 'submitted', transactionDate: '2026-04-04' }),
  entry(4, 8, 95000, 71250, { clientName: 'Fleet Motors', insurer: 'Bajaj Allianz', policyNumber: 'BAL-MV-2026-33', tierMultiplier: 75, status: 'draft', transactionDate: '2026-04-08' }),

  // ─── Tamanna Somani (HNI Division, Target: ₹4.5L) ───
  entry(6, 13, 50000, 25000, { clientName: 'HNI SIPs', productCreditPct: 100, tierMultiplier: 50, status: 'approved', transactionDate: '2026-04-01' }),
  entry(6, 14, 500000, 25000, { clientName: 'Dr. Sharma', productCreditPct: 10, tierMultiplier: 50, status: 'approved', transactionDate: '2026-04-02' }),
  entry(6, 2, 75000, 75000, { clientName: 'Amit Agarwal Family', insurer: 'Niva Bupa', policyNumber: 'NB-2026-099', status: 'submitted', transactionDate: '2026-04-06', isCrossSale: true }),
  entry(6, 1, 100000, 125000, { clientName: 'S. Bhattacharya', insurer: 'HDFC Life', policyNumber: 'HDFC-L-2026-44', productCreditPct: 125, tierMultiplier: 100, isFpRoute: true, status: 'approved', transactionDate: '2026-04-03', isCrossSale: true }),

  // ─── Raju Chakraborty (CDM, POSP RM, Target: ₹10L) ───
  entry(7, 2, 200000, 60000, { clientName: 'POSP Business', channelPayoutPct: 70, companyMarginPct: 30, tierMultiplier: 100, status: 'approved', transactionDate: '2026-04-02' }),
  entry(7, 8, 150000, 33750, { clientName: 'POSP Motor', channelPayoutPct: 70, tierMultiplier: 75, status: 'draft', transactionDate: '2026-04-09' }),
  entry(7, 1, 80000, 100000, { clientName: 'Self-sourced Life', productCreditPct: 125, tierMultiplier: 100, status: 'submitted', transactionDate: '2026-04-07', isCrossSale: true }),

  // ─── Priya Sharma (Sr. RM Life, Target: ₹2.7L) ───
  entry(8, 1, 120000, 150000, { clientName: 'Ratan Sinha', insurer: 'Max Life', policyNumber: 'MAX-2026-078', productCreditPct: 125, tierMultiplier: 100, status: 'approved', transactionDate: '2026-04-01' }),
  entry(8, 6, 60000, 45000, { clientName: 'Deepa Choudhury', insurer: 'ICICI Pru', policyNumber: 'IPRU-2026-033', productCreditPct: 100, tierMultiplier: 75, status: 'submitted', transactionDate: '2026-04-05' }),

  // ─── Arjun Dey (Sr. RM Health, Target: ₹2.52L) ───
  entry(9, 2, 95000, 95000, { clientName: 'Kamal Bora', insurer: 'Care Health', policyNumber: 'CARE-2026-156', status: 'approved', transactionDate: '2026-04-03' }),
  entry(9, 3, 120000, 75000, { clientName: 'Nirmala Family', insurer: 'Star Health', policyNumber: 'STAR-2Y-2026-08', productCreditPct: 62.5, tierMultiplier: 100, status: 'draft', transactionDate: '2026-04-10' }),
  entry(9, 7, 45000, 11138, { clientName: 'Renewal batch', insurer: 'Niva Bupa', productCreditPct: 33, tierMultiplier: 75, status: 'approved', transactionDate: '2026-04-02' }),

  // ─── Neha Agarwal (TL MF, Target: ₹2.4L) ───
  entry(10, 13, 80000, 40000, { clientName: 'Monthly SIPs (15 clients)', productCreditPct: 100, tierMultiplier: 50, status: 'approved', transactionDate: '2026-04-01' }),
  entry(10, 14, 300000, 15000, { clientName: 'Lumpsum Equity', productCreditPct: 10, tierMultiplier: 50, status: 'submitted', transactionDate: '2026-04-06' }),
  entry(10, 15, 200000, 7500, { clientName: 'Debt Lumpsum', productCreditPct: 7.5, tierMultiplier: 50, status: 'draft', transactionDate: '2026-04-11' }),

  // ─── Rohit Kalita (RM Life, Target: ₹2.1L) ───
  entry(11, 1, 80000, 100000, { clientName: 'Bibek Das', insurer: 'SBI Life', policyNumber: 'SBI-L-2026-091', productCreditPct: 125, tierMultiplier: 100, status: 'approved', transactionDate: '2026-04-02' }),
  entry(11, 11, 200000, 10000, { clientName: 'Single Premium', insurer: 'LIC', policyNumber: 'LIC-SP-2026-44', productCreditPct: 10, tierMultiplier: 50, status: 'submitted', transactionDate: '2026-04-07' }),

  // ─── Vikram Choudhury (RM MF, Target: ₹1.8L) ───
  entry(14, 13, 45000, 22500, { clientName: 'SIP Book', productCreditPct: 100, tierMultiplier: 50, status: 'approved', transactionDate: '2026-04-01' }),
  entry(14, 14, 150000, 7500, { clientName: 'Equity LS', productCreditPct: 10, tierMultiplier: 50, status: 'draft', transactionDate: '2026-04-12' }),

  // ─── Meena Baruah (RM GI Motor, Target: ₹1.68L) ───
  entry(15, 8, 180000, 135000, { clientName: 'Multiple Cars', insurer: 'HDFC Ergo', tierMultiplier: 75, status: 'approved', transactionDate: '2026-04-04' }),
  entry(15, 16, 40000, 20000, { clientName: 'TP Only', insurer: 'New India', tierMultiplier: 50, status: 'submitted', transactionDate: '2026-04-08' }),

  // ─── Rejected entries ───
  entry(8, 2, 65000, 65000, { clientName: 'Invalid PAN Client', insurer: 'Star Health', policyNumber: 'STAR-2026-REJ1', status: 'rejected', rejectionReason: 'PAN mismatch — client KYC does not match policy document', transactionDate: '2026-04-04', isCrossSale: true }),
  entry(11, 6, 40000, 30000, { clientName: 'Incomplete Docs', insurer: 'HDFC Life', policyNumber: 'HDFC-L-REJ-01', productCreditPct: 100, tierMultiplier: 75, status: 'rejected', rejectionReason: 'Missing proposal form signature', transactionDate: '2026-04-03' }),

  // ─── Error entries (flagged for data issues) ───
  entry(9, 2, 0, 0, { clientName: 'Zero Premium Entry', insurer: 'Care Health', status: 'error', errorMessage: 'Raw amount is zero — possibly incomplete data entry', transactionDate: '2026-04-06' }),
  entry(15, 9, 350000, 262500, { clientName: 'Duplicate Fleet', insurer: 'Bajaj Allianz', policyNumber: 'BAL-CV-DUP-01', tierMultiplier: 75, status: 'error', errorMessage: 'Potential duplicate — same policy number found in previous month', transactionDate: '2026-04-05' }),

  // ─── Business loss entries (cancellation/lapse/surrender) ───
  entry(3, 1, 100000, 125000, { clientName: 'Sanjay Mehta', insurer: 'TATA AIA', policyNumber: 'TAIA-2026-CANC-01', productCreditPct: 125, tierMultiplier: 100, status: 'approved', isBusinessLoss: true, lossReason: 'Free-look period cancellation — client changed mind', transactionDate: '2026-04-07' }),
  entry(8, 1, 75000, 93750, { clientName: 'Rahul Bose', insurer: 'Max Life', policyNumber: 'MAX-2026-LAPSE-01', productCreditPct: 125, tierMultiplier: 100, status: 'approved', isBusinessLoss: true, lossReason: 'Policy lapsed after 2 months — non-payment of premium', transactionDate: '2026-04-09' }),
  entry(6, 2, 55000, 55000, { clientName: 'Mrs. Khanna', insurer: 'Niva Bupa', policyNumber: 'NB-SURR-2026-01', status: 'submitted', isBusinessLoss: true, lossReason: 'Surrender — client moving to group cover from employer', transactionDate: '2026-04-10' }),

  // ─── Cross-sale entries (RM selling outside primary category) ───
  entry(11, 2, 48000, 48000, { clientName: 'Bibek Das Family', insurer: 'Star Health', policyNumber: 'STAR-CROSS-2026-01', status: 'approved', isCrossSale: true, transactionDate: '2026-04-06' }),
  entry(9, 1, 90000, 112500, { clientName: 'Kamal Bora Life', insurer: 'ICICI Pru', policyNumber: 'IPRU-CROSS-2026-01', productCreditPct: 125, tierMultiplier: 100, status: 'submitted', isCrossSale: true, transactionDate: '2026-04-08' }),
  entry(15, 2, 60000, 60000, { clientName: 'Fleet Owner Health', insurer: 'Care Health', policyNumber: 'CARE-CROSS-2026-01', status: 'draft', isCrossSale: true, transactionDate: '2026-04-11' }),
];
