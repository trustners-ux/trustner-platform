/**
 * Trustner Employee Directory — Master List
 * Source: "TRUSTNER EMPLOYEE LIST WITH REPORTING HEAD.xlsx"
 *
 * This is the SINGLE SOURCE OF TRUTH for who can log into the employee portal.
 * Only emails in this list are allowed to sign in. No self-registration.
 */

export type EmployeeRole =
  | 'bod'              // Board of Directors (Ram Shah, Sangeeta Shah)
  | 'cdo'              // Chief Development Officer
  | 'regional_manager' // Regional Managers
  | 'branch_head'      // Branch Heads / Sales Heads
  | 'cdm'              // Channel Development Managers
  | 'manager'          // Operations / HR / Account Managers
  | 'mentor'           // Mentors
  | 'sr_rm'            // Senior Relationship Managers
  | 'rm'               // Relationship Managers / Executives
  | 'back_office'      // Back Office / MIS / Data Entry
  | 'support';         // Office Assistants, Designers, etc.

export type CompanyGroup = 'TAS' | 'TIB' | 'LEADERSHIP';

export type Department =
  | 'OPERATION' | 'LIFE' | 'HEALTH' | 'G.I.' | 'F.P.'
  | 'ADMIN.' | 'ACCOUNTS' | 'DEMAT' | 'DIGITAL & IT'
  | 'POSP' | 'Direct sales' | 'LEADERSHIP';

export interface Employee {
  id: number;
  name: string;
  email: string;
  companyGroup: CompanyGroup;
  doj: string;            // DD/MM/YYYY
  jobLocation: string;
  designation: string;
  reportingHeadId: number; // references another employee's id (0 = top-level)
  department: Department;
  jobResponsibility: string;
  role: EmployeeRole;
  isActive: boolean;
  canApproveResets: boolean; // can approve password reset requests
}

// Role hierarchy for determining capabilities
export const ROLE_HIERARCHY: Record<EmployeeRole, number> = {
  bod: 10,
  cdo: 9,
  regional_manager: 8,
  branch_head: 7,
  cdm: 6,
  manager: 6,
  mentor: 5,
  sr_rm: 4,
  rm: 3,
  back_office: 2,
  support: 1,
};

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  bod: 'Board of Directors',
  cdo: 'Chief Development Officer',
  regional_manager: 'Regional Manager',
  branch_head: 'Branch Head',
  cdm: 'Channel Development Manager',
  manager: 'Manager',
  mentor: 'Mentor',
  sr_rm: 'Senior Relationship Manager',
  rm: 'Relationship Manager',
  back_office: 'Back Office',
  support: 'Support Staff',
};

export const ROLE_COLORS: Record<EmployeeRole, { bg: string; text: string; border: string }> = {
  bod:              { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  cdo:              { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200' },
  regional_manager: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  branch_head:      { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200' },
  cdm:              { bg: 'bg-cyan-50',     text: 'text-cyan-700',    border: 'border-cyan-200' },
  manager:          { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  mentor:           { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200' },
  sr_rm:            { bg: 'bg-orange-50',   text: 'text-orange-700',  border: 'border-orange-200' },
  rm:               { bg: 'bg-slate-50',    text: 'text-slate-700',   border: 'border-slate-200' },
  back_office:      { bg: 'bg-gray-50',     text: 'text-gray-700',    border: 'border-gray-200' },
  support:          { bg: 'bg-stone-50',    text: 'text-stone-600',   border: 'border-stone-200' },
};

/**
 * Complete Employee Directory
 * IDs:
 *   1000-1001 = Leadership (Ram Shah, Sangeeta Shah)
 *   1-79      = From the Excel list
 */
export const EMPLOYEE_DIRECTORY: Employee[] = [
  // ─── LEADERSHIP (not in Excel but are reporting heads) ───
  {
    id: 1000, name: 'Ram Shah', email: 'ram@trustner.in',
    companyGroup: 'LEADERSHIP', doj: '01/01/2013', jobLocation: 'Guwahati',
    designation: 'Managing Director & CFP', reportingHeadId: 0,
    department: 'LEADERSHIP', jobResponsibility: 'Leadership & Strategy',
    role: 'bod', isActive: true, canApproveResets: true,
  },
  {
    id: 1001, name: 'Sangeeta Shah', email: 'sangeeta@trustner.in',
    companyGroup: 'LEADERSHIP', doj: '01/01/2013', jobLocation: 'Guwahati',
    designation: 'Director', reportingHeadId: 0,
    department: 'LEADERSHIP', jobResponsibility: 'Leadership & Operations',
    role: 'bod', isActive: true, canApproveResets: true,
  },

  // ─── EMPLOYEES (from Excel, Sl No → id) ───
  {
    id: 1, name: 'Balbinder Kaur', email: 'bobykaur@gmail.com',
    companyGroup: 'TAS', doj: '01/03/2013', jobLocation: 'Guwahati',
    designation: 'Inhouse Sales Manager', reportingHeadId: 60, // Raju Chakraborty
    department: 'OPERATION', jobResponsibility: 'SALES',
    role: 'manager', isActive: true, canApproveResets: false,
  },
  {
    id: 2, name: 'Pranab Kumar Barman', email: 'pranabbaram42@gmail.com',
    companyGroup: 'TAS', doj: '15/09/2014', jobLocation: 'Guwahati',
    designation: 'Office Assistant', reportingHeadId: 36, // Wasbir Ahmed
    department: 'OPERATION', jobResponsibility: 'ADMIN.',
    role: 'support', isActive: true, canApproveResets: false,
  },
  {
    id: 3, name: 'Ajanta Saikia', email: 'ajanta.saikia@trustner.in',
    companyGroup: 'TIB', doj: '31/01/2019', jobLocation: 'Guwahati',
    designation: 'Sales Head', reportingHeadId: 1000, // Ram Shah
    department: 'LIFE', jobResponsibility: 'SALES',
    role: 'branch_head', isActive: true, canApproveResets: true,
  },
  {
    id: 4, name: 'Akash Kumar', email: 'akashkumar7577@gmail.com',
    companyGroup: 'TIB', doj: '01/09/2020', jobLocation: 'Guwahati',
    designation: 'Executive', reportingHeadId: 60, // Raju Chakraborty
    department: 'HEALTH', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 5, name: 'Nipa Das', email: 'nipadas90mail@gmail.com',
    companyGroup: 'TAS', doj: '16/11/2020', jobLocation: 'Guwahati',
    designation: 'Back Office Executive', reportingHeadId: 36, // Wasbir Ahmed
    department: 'OPERATION', jobResponsibility: 'Back Office Entry',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 6, name: 'Jitender Roy', email: 'jitenderroy82@gmail.com',
    companyGroup: 'TIB', doj: '06/07/2021', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 60, // Raju Chakraborty
    department: 'HEALTH', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 7, name: 'Rafiqueddin Ahmed', email: 'rafiq.ahmed@trustner.in',
    companyGroup: 'TIB', doj: '09/07/2021', jobLocation: 'Guwahati',
    designation: 'Mentor', reportingHeadId: 1000, // Ram Shah
    department: 'OPERATION', jobResponsibility: 'SALES',
    role: 'mentor', isActive: true, canApproveResets: false,
  },
  {
    id: 8, name: 'Pranita Saikia', email: 'monipriya9537@gmail.com',
    companyGroup: 'TIB', doj: '29/07/2021', jobLocation: 'Guwahati',
    designation: 'Back Office Executive', reportingHeadId: 15, // Bhola Singh
    department: 'G.I.', jobResponsibility: 'Back Office Entry',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 9, name: 'Tamanna Kejriwal', email: 'tamanna.kejriwal@trustner.in',
    companyGroup: 'TAS', doj: '22/06/2022', jobLocation: 'Guwahati',
    designation: 'Sales Head', reportingHeadId: 1000, // Ram Shah
    department: 'F.P.', jobResponsibility: 'SALES',
    role: 'branch_head', isActive: true, canApproveResets: true,
  },
  {
    id: 10, name: 'Shivani Kumari', email: 'shivani1011240@gmail.com',
    companyGroup: 'TAS', doj: '01/09/2022', jobLocation: 'Guwahati',
    designation: 'Back office Executive', reportingHeadId: 36, // Wasbir Ahmed
    department: 'OPERATION', jobResponsibility: 'Back Office Entry',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 11, name: 'Rinjima Pathak Das', email: 'rinjima.das@trustner.in',
    companyGroup: 'TIB', doj: '03/01/2023', jobLocation: 'Guwahati',
    designation: 'HR Manager & Customer Care Specialist', reportingHeadId: 1001, // Sangeeta Shah
    department: 'ADMIN.', jobResponsibility: 'H.R. & ADMIN.',
    role: 'manager', isActive: true, canApproveResets: true,
  },
  {
    id: 12, name: 'Nayanjyoti Handique', email: 'nayan_handique@yahoo.co.in',
    companyGroup: 'TIB', doj: '20/02/2023', jobLocation: 'Guwahati',
    designation: 'Operation Manager', reportingHeadId: 1000, // Ram Shah
    department: 'HEALTH', jobResponsibility: 'Claims settlement',
    role: 'manager', isActive: true, canApproveResets: true,
  },
  {
    id: 13, name: 'Laxman Sharma', email: 'lucky2230000@gmail.com',
    companyGroup: 'TIB', doj: '01/06/2023', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 60, // Raju Chakraborty
    department: 'LIFE', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 14, name: 'Mayurakshi Goswami', email: 'mayurakshigoswami1996@gmail.com',
    companyGroup: 'TAS', doj: '03/10/2023', jobLocation: 'Guwahati',
    designation: 'Back Office Executive', reportingHeadId: 36, // Wasbir Ahmed
    department: 'OPERATION', jobResponsibility: 'Back Office Entry',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 15, name: 'Bhola Singh', email: 'bhola.singh@trustner.in',
    companyGroup: 'TIB', doj: '05/10/2023', jobLocation: 'Guwahati',
    designation: 'Sales Head', reportingHeadId: 1000, // Ram Shah
    department: 'G.I.', jobResponsibility: 'SALES',
    role: 'branch_head', isActive: true, canApproveResets: true,
  },
  {
    id: 16, name: 'Ranjan Jyoti Datta Choudhury', email: 'ranjan.dutta@trustner.in',
    companyGroup: 'TAS', doj: '15/02/2024', jobLocation: 'Guwahati',
    designation: 'Account Manager', reportingHeadId: 1000, // Ram Shah
    department: 'ACCOUNTS', jobResponsibility: 'ADMIN.',
    role: 'manager', isActive: true, canApproveResets: true,
  },
  {
    id: 17, name: 'Pinki Rani Kalita', email: 'pinkirk251@gmail.com',
    companyGroup: 'TIB', doj: '01/06/2024', jobLocation: 'Guwahati',
    designation: 'Back office Executive', reportingHeadId: 15, // Bhola Singh
    department: 'G.I.', jobResponsibility: 'Back Office Entry',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 18, name: 'Harshita Jalan', email: 'harshii.jalan05@gmail.com',
    companyGroup: 'TAS', doj: '01/07/2024', jobLocation: 'Guwahati',
    designation: 'Inhouse Sales Executive', reportingHeadId: 60, // Raju Chakraborty
    department: 'OPERATION', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 19, name: 'Lucky Pathak', email: 'luckypathak50@gmail.com',
    companyGroup: 'TAS', doj: '01/07/2024', jobLocation: 'Guwahati',
    designation: 'Back office Executive', reportingHeadId: 36, // Wasbir Ahmed
    department: 'OPERATION', jobResponsibility: 'Back Office Entry',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 20, name: 'Raj Das', email: 'securities@trustner.in',
    companyGroup: 'TAS', doj: '01/07/2024', jobLocation: 'Guwahati',
    designation: 'Financial Planner Officer', reportingHeadId: 1000, // Ram Shah
    department: 'DEMAT', jobResponsibility: 'SALES',
    role: 'sr_rm', isActive: true, canApproveResets: false,
  },
  {
    id: 21, name: 'Vinita Kabra', email: 'vinita.kabra@trustner.in',
    companyGroup: 'TIB', doj: '01/07/2024', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 60, // Raju Chakraborty
    department: 'F.P.', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 22, name: 'Sejal Jain', email: 'sejal.jain@trustner.in',
    companyGroup: 'TAS', doj: '02/08/2024', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 60, // Raju Chakraborty
    department: 'F.P.', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 23, name: 'Sudeep Kashyap', email: 'sudeep.kashyap012@gmail.com',
    companyGroup: 'TAS', doj: '19/08/2024', jobLocation: 'Guwahati',
    designation: 'Digital Marketing - Executive', reportingHeadId: 1000, // Ram Shah
    department: 'DIGITAL & IT', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 24, name: 'Jasmine Jain', email: 'trainer@trustner.in',
    companyGroup: 'TAS', doj: '02/09/2024', jobLocation: 'Guwahati',
    designation: 'Relationship Manager & Trainer', reportingHeadId: 60, // Raju Chakraborty
    department: 'F.P.', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 25, name: 'Hira Shrestha', email: 'heerashrestha@gmail.com',
    companyGroup: 'TIB', doj: '04/11/2024', jobLocation: 'Guwahati',
    designation: 'Back Office Executive', reportingHeadId: 12, // Nayanjyoti Handique
    department: 'HEALTH', jobResponsibility: 'Claims settlement',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 26, name: 'Nisha Koirala', email: 'koirala.nisha12345@gmail.com',
    companyGroup: 'TIB', doj: '04/11/2024', jobLocation: 'Guwahati',
    designation: 'Back Office Executive', reportingHeadId: 12, // Nayanjyoti Handique
    department: 'HEALTH', jobResponsibility: 'Claims settlement',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 27, name: 'Preeti Nag', email: 'preetinag075@gmail.com',
    companyGroup: 'TAS', doj: '05/11/2024', jobLocation: 'Guwahati',
    designation: 'Designer cum Video Editor', reportingHeadId: 23, // Sudeep Kashyap
    department: 'DIGITAL & IT', jobResponsibility: 'SALES',
    role: 'support', isActive: true, canApproveResets: false,
  },
  {
    id: 28, name: 'Jinu Lagachu', email: 'lagachujinuu@gmail.com',
    companyGroup: 'TAS', doj: '14/11/2024', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 60, // Raju Chakraborty
    department: 'F.P.', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 29, name: 'Khushbu Chhajer', email: 'chhajerkhusboo@gmail.com',
    companyGroup: 'TIB', doj: '07/01/2025', jobLocation: 'Guwahati',
    designation: 'Sales Manager', reportingHeadId: 60, // Raju Chakraborty
    department: 'LIFE', jobResponsibility: 'SALES',
    role: 'sr_rm', isActive: true, canApproveResets: false,
  },
  {
    id: 30, name: 'Aruna Deka', email: 'arunadeka92@gmail.com',
    companyGroup: 'TAS', doj: '03/03/2025', jobLocation: 'Guwahati',
    designation: 'Back Office Executive', reportingHeadId: 36, // Wasbir Ahmed
    department: 'OPERATION', jobResponsibility: 'Back Office Entry',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 31, name: 'Dipankar Das', email: 'dipankardas073@gmail.com',
    companyGroup: 'TIB', doj: '07/04/2025', jobLocation: 'Guwahati',
    designation: 'Outbound Team Leader', reportingHeadId: 1000, // Ram Shah
    department: 'HEALTH', jobResponsibility: 'SALES',
    role: 'sr_rm', isActive: true, canApproveResets: false,
  },
  {
    id: 32, name: 'Sweety Sarania', email: 'sweetysaraniya23@gmail.com',
    companyGroup: 'TIB', doj: '16/04/2025', jobLocation: 'Guwahati',
    designation: 'Back office Executive', reportingHeadId: 36, // Wasbir Ahmed
    department: 'OPERATION', jobResponsibility: 'Back Office Entry',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 33, name: 'Tanima Das', email: 'tanimasilchar@gmail.com',
    companyGroup: 'TIB', doj: '16/04/2025', jobLocation: 'Guwahati',
    designation: 'Tele Calling & Operation Executive', reportingHeadId: 36, // Wasbir Ahmed
    department: 'OPERATION', jobResponsibility: 'Back Office Entry',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 34, name: 'Anjali Shah', email: 'anjalixhah1701@gmail.com',
    companyGroup: 'TAS', doj: '01/07/2025', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 60, // Raju Chakraborty
    department: 'F.P.', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 35, name: 'Jumma Ara Begum', email: 'jumma.ghy@gmail.com',
    companyGroup: 'TAS', doj: '01/07/2025', jobLocation: 'Guwahati',
    designation: 'Senior HR Executive', reportingHeadId: 11, // Rinjima Pathak Das
    department: 'ADMIN.', jobResponsibility: 'H.R. & ADMIN.',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 36, name: 'Wasbir Ahmed', email: 'wecare@trustner.in',
    companyGroup: 'TAS', doj: '16/07/2025', jobLocation: 'Guwahati',
    designation: 'Operations & Customer Service Manager', reportingHeadId: 1001, // Sangeeta Shah
    department: 'OPERATION', jobResponsibility: 'Back Office Entry',
    role: 'manager', isActive: true, canApproveResets: true,
  },
  {
    id: 37, name: 'Ajay Singh', email: 'xinghajay360@gmail.com',
    companyGroup: 'TIB', doj: '04/08/2025', jobLocation: 'Guwahati',
    designation: 'MIS & POS Handling', reportingHeadId: 15, // Bhola Singh
    department: 'OPERATION', jobResponsibility: 'MIS',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 38, name: 'Banajit Bezbaruah', email: 'banajitbezbaruah4@gmail.com',
    companyGroup: 'TIB', doj: '04/08/2025', jobLocation: 'Guwahati',
    designation: 'Asst. Manager', reportingHeadId: 15, // Bhola Singh
    department: 'G.I.', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 39, name: 'Kshetrimayam Ajay Krishnan Singh', email: 'ajaykshetri@gmail.com',
    companyGroup: 'TIB', doj: '06/10/2025', jobLocation: 'Imphal',
    designation: 'Ass. Branch Manager', reportingHeadId: 42, // Hemanta Saharia
    department: 'HEALTH', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 40, name: 'Shoibam Nara Singh', email: 'soibamnara@gmail.com',
    companyGroup: 'TIB', doj: '06/10/2025', jobLocation: 'Imphal',
    designation: 'Ass. Branch Manager', reportingHeadId: 42, // Hemanta Saharia
    department: 'HEALTH', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 41, name: 'Tasdiq Ahmed', email: 'tasdiqahmed2811@gmail.com',
    companyGroup: 'TAS', doj: '06/10/2025', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 60, // Raju Chakraborty
    department: 'F.P.', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 42, name: 'Hemanta Saharia', email: 'hemanta.saharia@trustner.in',
    companyGroup: 'TIB', doj: '13/10/2025', jobLocation: 'Guwahati',
    designation: 'Channel Development Manager', reportingHeadId: 60, // Raju Chakraborty
    department: 'POSP', jobResponsibility: 'SALES',
    role: 'cdm', isActive: true, canApproveResets: true,
  },
  {
    id: 43, name: 'Subhasish Kar', email: 'subhasish.kar@trustner.in',
    companyGroup: 'TAS', doj: '13/10/2025', jobLocation: 'Guwahati',
    designation: 'Senior Manager', reportingHeadId: 1000, // Ram Shah
    department: 'OPERATION', jobResponsibility: 'SALES',
    role: 'manager', isActive: true, canApproveResets: true,
  },
  {
    id: 44, name: 'Abir Das', email: 'abir.das@trustner.in',
    companyGroup: 'TIB', doj: '03/11/2025', jobLocation: 'Bangalore',
    designation: 'CDO', reportingHeadId: 1000, // Ram Shah
    department: 'OPERATION', jobResponsibility: 'SALES',
    role: 'cdo', isActive: true, canApproveResets: true,
  },
  {
    id: 45, name: 'Naushad Hussain', email: 'hussainnaushad1976@gmail.com',
    companyGroup: 'TAS', doj: '10/11/2025', jobLocation: 'Guwahati',
    designation: 'Office Assistant', reportingHeadId: 36, // Wasbir Ahmed
    department: 'OPERATION', jobResponsibility: 'ADMIN.',
    role: 'support', isActive: true, canApproveResets: false,
  },
  {
    id: 46, name: 'Partha Deb Barman', email: 'partha.barman@trustner.in',
    companyGroup: 'TIB', doj: '17/11/2025', jobLocation: 'West Bengal',
    designation: 'Regional Manager', reportingHeadId: 44, // Abir Das
    department: 'POSP', jobResponsibility: 'SALES',
    role: 'regional_manager', isActive: true, canApproveResets: true,
  },
  {
    id: 47, name: 'Purnananda Pathak', email: 'pallabpathak20@gmail.com',
    companyGroup: 'TAS', doj: '17/11/2025', jobLocation: 'Guwahati',
    designation: 'Accounts Executive', reportingHeadId: 16, // Ranjan Jyoti
    department: 'ACCOUNTS', jobResponsibility: 'ADMIN.',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 48, name: 'Hirakjyoti Das', email: 'hirakjyotidas49@gmail.com',
    companyGroup: 'TIB', doj: '19/11/2025', jobLocation: 'Guwahati',
    designation: 'Sr. Executive - MIS & POS', reportingHeadId: 11, // Rinjima Pathak Das
    department: 'OPERATION', jobResponsibility: 'MIS',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 49, name: 'Ashis Das', email: 'ashish.das@trustner.in',
    companyGroup: 'TIB', doj: '01/12/2025', jobLocation: 'West Bengal',
    designation: 'Channel Development Manager', reportingHeadId: 46, // Partha Deb Barman
    department: 'POSP', jobResponsibility: 'SALES',
    role: 'cdm', isActive: true, canApproveResets: true,
  },
  {
    id: 50, name: 'Indranil Roy', email: 'indranil.roy@trustner.in',
    companyGroup: 'TIB', doj: '01/12/2025', jobLocation: 'West Bengal',
    designation: 'Channel Development Manager', reportingHeadId: 46, // Partha Deb Barman
    department: 'POSP', jobResponsibility: 'SALES',
    role: 'cdm', isActive: true, canApproveResets: true,
  },
  {
    id: 51, name: 'Karismita Deka', email: 'dekakarismita19@gmail.com',
    companyGroup: 'TAS', doj: '01/12/2025', jobLocation: 'Guwahati',
    designation: 'Client Management Executive', reportingHeadId: 36, // Wasbir Ahmed
    department: 'OPERATION', jobResponsibility: 'Back Office Entry',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 52, name: 'Shakeeb Aamer', email: 'shakeeb.aamer@trustner.in',
    companyGroup: 'TIB', doj: '01/12/2025', jobLocation: 'West Bengal',
    designation: 'Channel Development Manager', reportingHeadId: 46, // Partha Deb Barman
    department: 'POSP', jobResponsibility: 'SALES',
    role: 'cdm', isActive: true, canApproveResets: true,
  },
  {
    id: 53, name: 'Sudarshana Gupta', email: 'sudarshna.gupta@trustner.in',
    companyGroup: 'TAS', doj: '01/12/2025', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 60, // Raju Chakraborty
    department: 'F.P.', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 54, name: 'Sukanta Das', email: 'dassukanta042@gmail.com',
    companyGroup: 'TIB', doj: '01/12/2025', jobLocation: 'West Bengal',
    designation: 'Relationship Manager', reportingHeadId: 46, // Partha Deb Barman
    department: 'POSP', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 55, name: 'Gourab Saha', email: 'gourabsaha29@gmail.com',
    companyGroup: 'TIB', doj: '04/12/2025', jobLocation: 'West Bengal',
    designation: 'Relationship Manager', reportingHeadId: 46, // Partha Deb Barman
    department: 'POSP', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 56, name: 'Abhishek Mitra', email: 'abhisek.mitra@yahoo.co.in',
    companyGroup: 'TIB', doj: '08/12/2025', jobLocation: 'West Bengal',
    designation: 'Relationship Manager', reportingHeadId: 46, // Partha Deb Barman
    department: 'POSP', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 57, name: 'Kabita Goswami', email: 'kabitag1974sarma@gmail.com',
    companyGroup: 'TIB', doj: '08/12/2025', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 42, // Hemanta Saharia
    department: 'OPERATION', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 58, name: 'Pasupulete Veer Pawan Kumar', email: 'veer.pavan@trustner.in',
    companyGroup: 'TIB', doj: '12/12/2025', jobLocation: 'Bangalore',
    designation: 'Relationship Manager', reportingHeadId: 44, // Abir Das
    department: 'POSP', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 59, name: 'Rana Goswami', email: 'rana.goswami2020@gmail.com',
    companyGroup: 'TIB', doj: '15/12/2025', jobLocation: 'West Bengal',
    designation: 'Relationship Manager', reportingHeadId: 46, // Partha Deb Barman
    department: 'POSP', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 60, name: 'Raju Chakraborty', email: 'raju.chakraborty@trustner.in',
    companyGroup: 'TIB', doj: '01/01/2026', jobLocation: 'Guwahati',
    designation: 'Regional Manager', reportingHeadId: 44, // Abir Das
    department: 'OPERATION', jobResponsibility: 'SALES',
    role: 'regional_manager', isActive: true, canApproveResets: true,
  },
  {
    id: 61, name: 'Abhishek Agarwala', email: 'agarwala143@gmail.com',
    companyGroup: 'TAS', doj: '05/01/2026', jobLocation: 'Guwahati',
    designation: 'Sr. Relationship Manager', reportingHeadId: 60, // Raju Chakraborty
    department: 'F.P.', jobResponsibility: 'SALES',
    role: 'sr_rm', isActive: true, canApproveResets: false,
  },
  {
    id: 62, name: 'Ishika Bajaj', email: 'bajajishika123@gmail.com',
    companyGroup: 'TAS', doj: '05/01/2026', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 60, // Raju Chakraborty
    department: 'F.P.', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 63, name: 'Pranjal Kalita', email: 'pranjal.kalita@trustner.in',
    companyGroup: 'TIB', doj: '05/01/2026', jobLocation: 'Guwahati',
    designation: 'Branch Head', reportingHeadId: 43, // Subhasish Kar
    department: 'LIFE', jobResponsibility: 'SALES',
    role: 'branch_head', isActive: true, canApproveResets: true,
  },
  {
    id: 64, name: 'Sudip Choudhury', email: 'sudip.c6@gmail.com',
    companyGroup: 'TIB', doj: '05/01/2026', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 63, // Pranjal Kalita
    department: 'OPERATION', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 65, name: 'Sudip Ghosh', email: 'sudipghosh2105@gmail.com',
    companyGroup: 'TIB', doj: '05/01/2026', jobLocation: 'West Bengal',
    designation: 'Relationship Manager', reportingHeadId: 46, // Partha Deb Barman
    department: 'POSP', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 66, name: 'Prachir Dey', email: 'deyprachir@gmail.com',
    companyGroup: 'TAS', doj: '06/01/2026', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 20, // Raj Das
    department: 'DEMAT', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 67, name: 'Joydeep Dutta', email: 'aajoydeep@gmail.com',
    companyGroup: 'TIB', doj: '19/01/2026', jobLocation: 'West Bengal',
    designation: 'Channel Development Manager', reportingHeadId: 46, // Partha Deb Barman
    department: 'POSP', jobResponsibility: 'SALES',
    role: 'cdm', isActive: true, canApproveResets: true,
  },
  {
    id: 68, name: 'Bikramjit Das', email: 'mantu9thdec@gmail.com',
    companyGroup: 'TIB', doj: '02/02/2026', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 63, // Pranjal Kalita
    department: 'Direct sales', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 69, name: 'Biprojit Roy', email: 'biprojitr09@gmail.com',
    companyGroup: 'TIB', doj: '02/02/2026', jobLocation: 'West Bengal',
    designation: 'Relationship Manager', reportingHeadId: 46, // Partha Deb Barman
    department: 'POSP', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 70, name: 'Kishor Kumar Das', email: 'kishord68@gmail.com',
    companyGroup: 'TIB', doj: '02/02/2026', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 63, // Pranjal Kalita
    department: 'Direct sales', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 71, name: 'Momi Pegu Borah', email: 'momipegu.nlp@gmail.com',
    companyGroup: 'TIB', doj: '02/02/2026', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 63, // Pranjal Kalita
    department: 'Direct sales', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 72, name: 'Niraj Kumar', email: 'niraj000rnc@gmail.com',
    companyGroup: 'TIB', doj: '02/02/2026', jobLocation: 'Ranchi',
    designation: 'Channel Development Manager', reportingHeadId: 46, // Partha Deb Barman
    department: 'POSP', jobResponsibility: 'SALES',
    role: 'cdm', isActive: true, canApproveResets: true,
  },
  {
    id: 73, name: 'Deepjyoti Deka', email: 'dekadeep602@gmail.com',
    companyGroup: 'TIB', doj: '09/02/2026', jobLocation: 'Guwahati',
    designation: 'Back Office Executive', reportingHeadId: 11, // Rinjima Pathak Das
    department: 'OPERATION', jobResponsibility: 'MIS',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 74, name: 'Parishmita Doley', email: 'duttaparishmitadoley@gmail.com',
    companyGroup: 'TIB', doj: '19/02/2026', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 63, // Pranjal Kalita
    department: 'Direct sales', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 75, name: 'Mohammed Bilal', email: 'mohd.bilal@trustner.in',
    companyGroup: 'TIB', doj: '02/03/2026', jobLocation: 'Bangalore',
    designation: 'Relationship Manager', reportingHeadId: 58, // Veer Pawan Kumar
    department: 'POSP', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 76, name: 'Sangita Paul', email: 'sangita.shillong@gmail.com',
    companyGroup: 'TIB', doj: '09/03/2026', jobLocation: 'Guwahati',
    designation: 'Relationship Manager', reportingHeadId: 60, // Raju Chakraborty
    department: 'Direct sales', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 77, name: 'Souvik Das', email: 'souvikjbdas@gmail.com',
    companyGroup: 'TIB', doj: '16/03/2026', jobLocation: 'West Bengal',
    designation: 'Back Office Executive', reportingHeadId: 46, // Partha Deb Barman
    department: 'OPERATION', jobResponsibility: 'Back Office Entry',
    role: 'back_office', isActive: true, canApproveResets: false,
  },
  {
    id: 78, name: 'Jai Prakash Sharma', email: 'sharmajaiprakash520@gmail.com',
    companyGroup: 'TIB', doj: '19/03/2026', jobLocation: 'Guwahati',
    designation: 'Under Writer', reportingHeadId: 60, // Raju Chakraborty
    department: 'G.I.', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
  {
    id: 79, name: 'Reshmi Kumari Sahani', email: 'reshmisahani51@gmail.com',
    companyGroup: 'TAS', doj: '19/03/2026', jobLocation: 'Guwahati',
    designation: 'Fintech Platform Associate – Operations', reportingHeadId: 1000, // Ram Shah
    department: 'DIGITAL & IT', jobResponsibility: 'SALES',
    role: 'rm', isActive: true, canApproveResets: false,
  },
];

// ─── Lookup Utilities ────────────────────────────────────────

const emailIndex = new Map<string, Employee>();
const idIndex = new Map<number, Employee>();

for (const emp of EMPLOYEE_DIRECTORY) {
  emailIndex.set(emp.email.toLowerCase(), emp);
  idIndex.set(emp.id, emp);
}

/** Find employee by email (case-insensitive) */
export function findEmployeeByEmail(email: string): Employee | undefined {
  return emailIndex.get(email.toLowerCase().trim());
}

/** Find employee by ID */
export function findEmployeeById(id: number): Employee | undefined {
  return idIndex.get(id);
}

/** Get reporting manager for an employee */
export function getReportingHead(employee: Employee): Employee | undefined {
  if (employee.reportingHeadId === 0) return undefined;
  return idIndex.get(employee.reportingHeadId);
}

/**
 * Get the full reporting chain (upward) for an employee.
 * Returns [direct manager, manager's manager, ..., top-level]
 */
export function getReportingChain(employee: Employee): Employee[] {
  const chain: Employee[] = [];
  let current = employee;
  const visited = new Set<number>();

  while (current.reportingHeadId !== 0 && !visited.has(current.id)) {
    visited.add(current.id);
    const head = idIndex.get(current.reportingHeadId);
    if (!head) break;
    chain.push(head);
    current = head;
  }

  return chain;
}

/**
 * Get direct reports for a manager.
 */
export function getDirectReports(managerId: number): Employee[] {
  return EMPLOYEE_DIRECTORY.filter(e => e.reportingHeadId === managerId && e.isActive);
}

/**
 * Get the approval chain for password reset requests.
 * Returns: [reporting head, one level above] — plus BOD always has access.
 */
export function getResetApprovalChain(employee: Employee): Employee[] {
  const chain = getReportingChain(employee);
  // Return first two levels (direct manager + one up)
  return chain.slice(0, 2);
}

/**
 * Check if approver can approve a reset request for the target employee.
 * Approver must be in the target's reporting chain OR be BOD/CDO.
 */
export function canApproveReset(approverId: number, targetEmployeeId: number): boolean {
  const approver = idIndex.get(approverId);
  if (!approver) return false;

  // BOD and CDO can approve anyone
  if (approver.role === 'bod' || approver.role === 'cdo') return true;

  // Check if approver is in the target's reporting chain
  const target = idIndex.get(targetEmployeeId);
  if (!target) return false;

  const chain = getReportingChain(target);
  return chain.some(e => e.id === approverId);
}

/** Get all active employees */
export function getAllActiveEmployees(): Employee[] {
  return EMPLOYEE_DIRECTORY.filter(e => e.isActive);
}

/** Get team size for a manager (recursive) */
export function getTeamSize(managerId: number): number {
  const direct = getDirectReports(managerId);
  let count = direct.length;
  for (const report of direct) {
    count += getTeamSize(report.id);
  }
  return count;
}

/** Get department-wise employee counts */
export function getDepartmentStats(): Map<string, number> {
  const stats = new Map<string, number>();
  for (const emp of EMPLOYEE_DIRECTORY) {
    if (!emp.isActive) continue;
    stats.set(emp.department, (stats.get(emp.department) || 0) + 1);
  }
  return stats;
}

/** Get location-wise employee counts */
export function getLocationStats(): Map<string, number> {
  const stats = new Map<string, number>();
  for (const emp of EMPLOYEE_DIRECTORY) {
    if (!emp.isActive) continue;
    stats.set(emp.jobLocation, (stats.get(emp.jobLocation) || 0) + 1);
  }
  return stats;
}
