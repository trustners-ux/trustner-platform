-- Employee Portal Schema for Trustner
-- Run this in Supabase SQL Editor

-- 1. Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  designation TEXT,
  department TEXT,
  date_of_joining DATE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'hr_head', 'management', 'employee')),
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('salary_slip', 'hr_policy', 'leave_encashment', 'appointment_letter', 'increment_letter', 'fnf_settlement', 'other')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES employees(id),
  is_company_wide BOOLEAN DEFAULT false,
  month_year TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Document assignments
CREATE TABLE IF NOT EXISTS document_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, employee_id)
);

-- 4. Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'newsletter', 'policy_update', 'event', 'urgent')),
  is_pinned BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. F&F Settlements table
CREATE TABLE IF NOT EXISTS fnf_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  last_working_date DATE NOT NULL,
  resignation_date DATE,
  basic_salary NUMERIC(12,2),
  earned_leave_balance NUMERIC(8,2),
  leave_encashment NUMERIC(12,2),
  gratuity NUMERIC(12,2),
  bonus NUMERIC(12,2),
  deductions NUMERIC(12,2),
  deduction_notes TEXT,
  net_payable NUMERIC(12,2),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'paid', 'disputed')),
  notes TEXT,
  processed_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Leave records table
CREATE TABLE IF NOT EXISTS leave_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  leave_type TEXT NOT NULL CHECK (leave_type IN ('casual', 'sick', 'earned', 'compensatory', 'maternity', 'paternity', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC(4,1) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES employees(id),
  applied_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fnf_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_records ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM employees WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to get current user's employee id
CREATE OR REPLACE FUNCTION get_employee_id()
RETURNS UUID AS $$
  SELECT id FROM employees WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============ RLS POLICIES ============

-- EMPLOYEES table policies
CREATE POLICY "Employees can view own record" ON employees
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Admin/HR/Management can view all employees" ON employees
  FOR SELECT USING (get_user_role() IN ('admin', 'hr_head', 'management'));

CREATE POLICY "Admin/HR can create employees" ON employees
  FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'hr_head'));

CREATE POLICY "Admin/HR can update employees" ON employees
  FOR UPDATE USING (get_user_role() IN ('admin', 'hr_head'));

CREATE POLICY "Admin can delete employees" ON employees
  FOR DELETE USING (get_user_role() = 'admin');

-- DOCUMENTS table policies
CREATE POLICY "Admin/HR/Management can view all documents" ON documents
  FOR SELECT USING (get_user_role() IN ('admin', 'hr_head', 'management'));

CREATE POLICY "Employees can view company-wide documents" ON documents
  FOR SELECT USING (is_company_wide = true);

CREATE POLICY "Employees can view assigned documents" ON documents
  FOR SELECT USING (
    id IN (
      SELECT document_id FROM document_assignments
      WHERE employee_id = get_employee_id()
    )
  );

CREATE POLICY "Admin/HR can upload documents" ON documents
  FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'hr_head'));

CREATE POLICY "Admin/HR can delete documents" ON documents
  FOR DELETE USING (get_user_role() IN ('admin', 'hr_head'));

-- DOCUMENT_ASSIGNMENTS table policies
CREATE POLICY "Employees can view own assignments" ON document_assignments
  FOR SELECT USING (employee_id = get_employee_id());

CREATE POLICY "Admin/HR can view all assignments" ON document_assignments
  FOR SELECT USING (get_user_role() IN ('admin', 'hr_head', 'management'));

CREATE POLICY "Admin/HR can create assignments" ON document_assignments
  FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'hr_head'));

CREATE POLICY "Employees can update own assignment (mark viewed)" ON document_assignments
  FOR UPDATE USING (employee_id = get_employee_id());

CREATE POLICY "Admin/HR can delete assignments" ON document_assignments
  FOR DELETE USING (get_user_role() IN ('admin', 'hr_head'));

-- ANNOUNCEMENTS table policies
CREATE POLICY "All employees can view published announcements" ON announcements
  FOR SELECT USING (
    published_at IS NOT NULL
    AND published_at <= now()
    AND (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY "Admin/HR can view all announcements" ON announcements
  FOR SELECT USING (get_user_role() IN ('admin', 'hr_head'));

CREATE POLICY "Admin/HR can create announcements" ON announcements
  FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'hr_head'));

CREATE POLICY "Admin/HR can update announcements" ON announcements
  FOR UPDATE USING (get_user_role() IN ('admin', 'hr_head'));

CREATE POLICY "Admin can delete announcements" ON announcements
  FOR DELETE USING (get_user_role() = 'admin');

-- LEAVE_RECORDS table policies
CREATE POLICY "Employees can view own leave records" ON leave_records
  FOR SELECT USING (employee_id = get_employee_id());

CREATE POLICY "Admin/HR/Management can view all leave records" ON leave_records
  FOR SELECT USING (get_user_role() IN ('admin', 'hr_head', 'management'));

CREATE POLICY "All employees can apply for leave" ON leave_records
  FOR INSERT WITH CHECK (employee_id = get_employee_id());

CREATE POLICY "Admin/HR/Management can approve/reject leave" ON leave_records
  FOR UPDATE USING (get_user_role() IN ('admin', 'hr_head', 'management'));

CREATE POLICY "Employees can cancel own pending leave" ON leave_records
  FOR UPDATE USING (
    employee_id = get_employee_id()
    AND status = 'pending'
  );

-- FNF_SETTLEMENTS table policies
CREATE POLICY "Admin/HR can manage F&F settlements" ON fnf_settlements
  FOR ALL USING (get_user_role() IN ('admin', 'hr_head'));

CREATE POLICY "Employees can view own F&F settlement" ON fnf_settlements
  FOR SELECT USING (employee_id = get_employee_id());

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_fnf_settlements_updated_at
  BEFORE UPDATE ON fnf_settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_leave_records_updated_at
  BEFORE UPDATE ON leave_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admin/HR can upload to documents bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND (SELECT get_user_role()) IN ('admin', 'hr_head')
);

CREATE POLICY "Authenticated users can read assigned documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Admin/HR can delete from documents bucket"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND (SELECT get_user_role()) IN ('admin', 'hr_head')
);
