// ─── Trustner Employee Master Data ───
// Sourced from Trustner_Incentive_Master_v2.xlsx + build_workbook_v2.py
// This is seed data — will migrate to Supabase PostgreSQL

import { Employee, Product, ProductTier } from './types';

export const EMPLOYEES: Employee[] = [
  // L1 — Directors
  { id: 1, employeeCode: 'TAS001', name: 'Ram Shah', email: 'ram@trustner.in', phone: '9864051214', doj: '2018-01-01', designation: 'Director & CFP', department: 'Management', grossSalary: 0, entity: 'TAS', annualCTC: 0, tenureYears: 8, levelCode: 'L1', segment: 'Direct Sales', targetMultiplier: 0, monthlyTarget: 0, annualTarget: 0, costRecoveryMin: 0, isActive: true },
  { id: 2, employeeCode: 'TIB001', name: 'Sangita Shah', email: 'sangeeta@trustner.in', doj: '2018-01-01', designation: 'Director', department: 'Management', grossSalary: 0, entity: 'TIB', annualCTC: 0, tenureYears: 8, levelCode: 'L1', segment: 'Direct Sales', targetMultiplier: 0, monthlyTarget: 0, annualTarget: 0, costRecoveryMin: 0, isActive: true },

  // L2 — CDO / President
  { id: 3, employeeCode: 'TIB002', name: 'Abir Das', doj: '2019-06-15', designation: 'CDO', department: 'Sales - Insurance', grossSalary: 300000, entity: 'TIB', annualCTC: 3600000, tenureYears: 6.8, levelCode: 'L2', segment: 'Direct Sales', targetMultiplier: 6, monthlyTarget: 1800000, annualTarget: 21600000, costRecoveryMin: 480000, isActive: true },

  // L3 — VP / Regional Manager
  { id: 4, employeeCode: 'TIB003', name: 'Subhasish Kar', doj: '2020-04-01', designation: 'VP - Institutional Sales', department: 'Sales - GI', grossSalary: 120000, entity: 'TIB', annualCTC: 1440000, tenureYears: 6, levelCode: 'L3', segment: 'Direct Sales', targetMultiplier: 6, monthlyTarget: 720000, annualTarget: 8640000, costRecoveryMin: 192000, isActive: true },
  { id: 5, employeeCode: 'TIB004', name: 'Rafiquddin Ahmed', doj: '1988-01-01', designation: 'Consultant — GI Team', department: 'Sales - GI', grossSalary: 80000, entity: 'TIB', annualCTC: 960000, tenureYears: 38, levelCode: 'L3', segment: 'Direct Sales', targetMultiplier: 6, monthlyTarget: 480000, annualTarget: 5760000, costRecoveryMin: 128000, isActive: true },

  // L4 — Area Manager / Branch Head
  { id: 6, employeeCode: 'TAS002', name: 'Tamanna Somani', doj: '2021-07-01', designation: 'Head HNI Division', department: 'Sales - MF', grossSalary: 75000, entity: 'TAS', annualCTC: 900000, tenureYears: 4.7, levelCode: 'L4', segment: 'Direct Sales', targetMultiplier: 6, monthlyTarget: 450000, annualTarget: 5400000, costRecoveryMin: 120000, isActive: true },
  { id: 7, employeeCode: 'TIB005', name: 'Raju Chakraborty', doj: '2001-05-01', designation: 'Regional Manager North East', department: 'Sales - CDM', grossSalary: 50000, entity: 'TIB', annualCTC: 600000, tenureYears: 25, levelCode: 'L4', segment: 'CDM/POSP RM', targetMultiplier: 20, monthlyTarget: 1000000, annualTarget: 12000000, costRecoveryMin: 80000, isActive: true },

  // L5 — Sr. RM / Team Leader
  { id: 8, employeeCode: 'TIB006', name: 'Priya Sharma', doj: '2022-03-15', designation: 'Sr. RM - Life', department: 'Sales - Life', grossSalary: 45000, entity: 'TIB', annualCTC: 540000, tenureYears: 4, levelCode: 'L5', segment: 'Direct Sales', targetMultiplier: 6, monthlyTarget: 270000, annualTarget: 3240000, costRecoveryMin: 72000, isActive: true },
  { id: 9, employeeCode: 'TIB007', name: 'Arjun Dey', doj: '2022-06-01', designation: 'Sr. RM - Health', department: 'Sales - Health', grossSalary: 42000, entity: 'TIB', annualCTC: 504000, tenureYears: 3.8, levelCode: 'L5', segment: 'Direct Sales', targetMultiplier: 6, monthlyTarget: 252000, annualTarget: 3024000, costRecoveryMin: 67200, isActive: true },
  { id: 10, employeeCode: 'TAS003', name: 'Neha Agarwal', doj: '2022-09-01', designation: 'Team Leader - MF', department: 'Sales - MF', grossSalary: 40000, entity: 'TAS', annualCTC: 480000, tenureYears: 3.5, levelCode: 'L5', segment: 'Direct Sales', targetMultiplier: 6, monthlyTarget: 240000, annualTarget: 2880000, costRecoveryMin: 64000, isActive: true },

  // L6 — RM / Executive
  { id: 11, employeeCode: 'TIB008', name: 'Rohit Kalita', doj: '2023-01-15', designation: 'RM - Life', department: 'Sales - Life', grossSalary: 35000, entity: 'TIB', annualCTC: 420000, tenureYears: 3.2, levelCode: 'L6', segment: 'Direct Sales', targetMultiplier: 6, monthlyTarget: 210000, annualTarget: 2520000, costRecoveryMin: 56000, isActive: true },
  { id: 12, employeeCode: 'TIB009', name: 'Sanjay Bora', doj: '2023-04-01', designation: 'RM - Health', department: 'Sales - Health', grossSalary: 32000, entity: 'TIB', annualCTC: 384000, tenureYears: 3, levelCode: 'L6', segment: 'Direct Sales', targetMultiplier: 6, monthlyTarget: 192000, annualTarget: 2304000, costRecoveryMin: 51200, isActive: true },
  { id: 13, employeeCode: 'TIB010', name: 'Ankita Das', doj: '2023-06-15', designation: 'RM - CDM', department: 'Sales - CDM', grossSalary: 30000, entity: 'TIB', annualCTC: 360000, tenureYears: 2.8, levelCode: 'L6', segment: 'CDM/POSP RM', targetMultiplier: 20, monthlyTarget: 600000, annualTarget: 7200000, costRecoveryMin: 48000, isActive: true },
  { id: 14, employeeCode: 'TAS004', name: 'Vikram Choudhury', doj: '2023-08-01', designation: 'RM - MF', department: 'Sales - MF', grossSalary: 30000, entity: 'TAS', annualCTC: 360000, tenureYears: 2.6, levelCode: 'L6', segment: 'Direct Sales', targetMultiplier: 6, monthlyTarget: 180000, annualTarget: 2160000, costRecoveryMin: 48000, isActive: true },
  { id: 15, employeeCode: 'TIB011', name: 'Meena Baruah', doj: '2024-01-10', designation: 'RM - GI Motor', department: 'Sales - GI', grossSalary: 28000, entity: 'TIB', annualCTC: 336000, tenureYears: 2.2, levelCode: 'L6', segment: 'Direct Sales', targetMultiplier: 6, monthlyTarget: 168000, annualTarget: 2016000, costRecoveryMin: 44800, isActive: true },
  { id: 16, employeeCode: 'TIB012', name: 'Deepak Nath', doj: '2024-03-01', designation: 'RM - CDM', department: 'Sales - CDM', grossSalary: 25000, entity: 'TIB', annualCTC: 300000, tenureYears: 2, levelCode: 'L6', segment: 'CDM/POSP RM', targetMultiplier: 20, monthlyTarget: 500000, annualTarget: 6000000, costRecoveryMin: 40000, isActive: true },

  // L7 — Junior RM / Support Staff
  { id: 17, employeeCode: 'TIB013', name: 'Ritika Gogoi', doj: '2024-08-01', designation: 'Jr. RM - Life', department: 'Sales - Life', grossSalary: 22000, entity: 'TIB', annualCTC: 264000, tenureYears: 1.6, levelCode: 'L7', segment: 'Direct Sales', targetMultiplier: 6, monthlyTarget: 132000, annualTarget: 1584000, costRecoveryMin: 35200, isActive: true },
  { id: 18, employeeCode: 'TIB014', name: 'Amir Hussain', doj: '2024-10-01', designation: 'Jr. RM - Health', department: 'Sales - Health', grossSalary: 20000, entity: 'TIB', annualCTC: 240000, tenureYears: 1.4, levelCode: 'L7', segment: 'Direct Sales', targetMultiplier: 6, monthlyTarget: 120000, annualTarget: 1440000, costRecoveryMin: 32000, isActive: true },

  // Support Staff
  { id: 19, employeeCode: 'TIB015', name: 'Pooja Saikia', doj: '2021-04-01', designation: 'Sr. Operations Executive', department: 'Operations', grossSalary: 28000, entity: 'TIB', annualCTC: 336000, tenureYears: 5, levelCode: 'L7', segment: 'Support', targetMultiplier: 0, monthlyTarget: 0, annualTarget: 0, costRecoveryMin: 44800, isActive: true },
  { id: 20, employeeCode: 'TIB016', name: 'Rakesh Thakur', doj: '2022-07-01', designation: 'Accounts Executive', department: 'Accounts', grossSalary: 25000, entity: 'TIB', annualCTC: 300000, tenureYears: 3.7, levelCode: 'L7', segment: 'Support', targetMultiplier: 0, monthlyTarget: 0, annualTarget: 0, costRecoveryMin: 40000, isActive: true },
  { id: 21, employeeCode: 'TIB017', name: 'Sunita Roy', doj: '2023-02-01', designation: 'HR Executive', department: 'HR', grossSalary: 22000, entity: 'TIB', annualCTC: 264000, tenureYears: 3.1, levelCode: 'L7', segment: 'Support', targetMultiplier: 0, monthlyTarget: 0, annualTarget: 0, costRecoveryMin: 35200, isActive: true },
  { id: 22, employeeCode: 'TIB018', name: 'Kamal Hazarika', doj: '2023-09-01', designation: 'Training Manager', department: 'Training', grossSalary: 30000, entity: 'TIB', annualCTC: 360000, tenureYears: 2.5, levelCode: 'L6', segment: 'Support', targetMultiplier: 0, monthlyTarget: 0, annualTarget: 0, costRecoveryMin: 48000, isActive: true },
  { id: 23, employeeCode: 'TAS005', name: 'Divya Bharali', doj: '2024-04-01', designation: 'Digital Marketing Executive', department: 'Digital & IT', grossSalary: 25000, entity: 'TAS', annualCTC: 300000, tenureYears: 2, levelCode: 'L7', segment: 'Support', targetMultiplier: 0, monthlyTarget: 0, annualTarget: 0, costRecoveryMin: 40000, isActive: true },
];

export const PRODUCTS: Product[] = [
  // Tier 1 (>30%, 100% credit)
  { id: 1, productName: 'Life Regular 10yr+', productCategory: 'Life', tier: 1, commissionRange: '>30%', creditPct: 125, referralCreditPct: 15, isMotor: false },
  { id: 2, productName: 'Health Fresh (Annual)', productCategory: 'Health', tier: 1, commissionRange: '>30%', creditPct: 100, referralCreditPct: 10, isMotor: false },
  { id: 3, productName: 'Health Long-Term 2yr', productCategory: 'Health', tier: 1, commissionRange: '>30%', creditPct: 62.5, referralCreditPct: 10, isMotor: false },
  { id: 4, productName: 'Health Long-Term 3yr', productCategory: 'Health', tier: 1, commissionRange: '>30%', creditPct: 50, referralCreditPct: 10, isMotor: false },
  { id: 5, productName: 'GI Non-Motor', productCategory: 'GI Non-Motor', tier: 1, commissionRange: '>30%', creditPct: 100, referralCreditPct: 7.5, isMotor: false },

  // Tier 2 (15-30%, 75% credit)
  { id: 6, productName: 'Life Regular <10yr', productCategory: 'Life', tier: 2, commissionRange: '15-30%', creditPct: 100, referralCreditPct: 15, isMotor: false },
  { id: 7, productName: 'Health Port/Renewal', productCategory: 'Health', tier: 2, commissionRange: '15-30%', creditPct: 33, referralCreditPct: 7.5, isMotor: false },
  { id: 8, productName: 'GI Motor Private Car', productCategory: 'GI Motor', tier: 2, commissionRange: '15-30%', creditPct: 100, referralCreditPct: 0, isMotor: true },
  { id: 9, productName: 'GI Motor CV (LCV/HCV)', productCategory: 'GI Motor', tier: 2, commissionRange: '15-30%', creditPct: 100, referralCreditPct: 0, isMotor: true },

  // Tier 3 (<15%, 50% credit)
  { id: 10, productName: 'Life ULIP', productCategory: 'Life', tier: 3, commissionRange: '<15%', creditPct: 25, referralCreditPct: 0, isMotor: false },
  { id: 11, productName: 'Life Single Premium', productCategory: 'Life', tier: 3, commissionRange: '<15%', creditPct: 10, referralCreditPct: 0, isMotor: false },
  { id: 12, productName: 'Health Quarterly/HY', productCategory: 'Health', tier: 3, commissionRange: '<15%', creditPct: 50, referralCreditPct: 0, isMotor: false },
  { id: 13, productName: 'MF SIP (Monthly)', productCategory: 'MF', tier: 3, commissionRange: '<15%', creditPct: 100, referralCreditPct: 0, isMotor: false, notes: '100% of MONTHLY collection ONLY. NO ×12 annualization.' },
  { id: 14, productName: 'MF Lumpsum Equity', productCategory: 'MF', tier: 3, commissionRange: '<15%', creditPct: 10, referralCreditPct: 0, isMotor: false },
  { id: 15, productName: 'MF Lumpsum Debt', productCategory: 'MF', tier: 3, commissionRange: '<15%', creditPct: 7.5, referralCreditPct: 0, isMotor: false },
  { id: 16, productName: 'GI Motor TP Only', productCategory: 'GI Motor', tier: 3, commissionRange: '<15%', creditPct: 100, referralCreditPct: 0, isMotor: true },
  { id: 17, productName: 'GI GMC/GPA', productCategory: 'GI Non-Motor', tier: 3, commissionRange: '<15%', creditPct: 20, referralCreditPct: 0, isMotor: false },
  { id: 18, productName: 'MF Debt→Equity via STP', productCategory: 'MF', tier: 3, commissionRange: '<15%', creditPct: 10, referralCreditPct: 0, isMotor: false },
];

// Tier multiplier lookup
export function getTierMultiplier(tier: ProductTier): number {
  switch (tier) {
    case 1: return 100;
    case 2: return 75;
    case 3: return 50;
  }
}
