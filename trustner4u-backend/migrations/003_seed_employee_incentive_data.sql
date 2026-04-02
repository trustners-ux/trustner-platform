-- ============================================================
-- Seed Employee Incentive Data
-- Source: Job Responsibilities Master + March Target Excel
-- Run AFTER 002_incentive_tables.sql
-- ============================================================

-- Update existing employees with incentive-specific fields
-- (employee_code, doj, gross_salary, entity, level_code, segment, target_multiplier, monthly_target, etc.)

-- NOTE: These UPDATE statements match by employee name since auth_id varies.
-- Run via Supabase SQL Editor.

-- ─── Direct Sales / FP Team (6× multiplier) ────────────────────────────

UPDATE employees SET
  employee_code = 'TAS001', doj = '2013-03-01', gross_salary = 36017,
  entity = 'TAS', level_code = 'L5', segment = 'Direct Sales',
  target_multiplier = 6, monthly_target = 216102, annual_target = 2593224,
  designation = 'Inhouse Sales Manager', department = 'OPERATION', location = 'North East'
WHERE LOWER(name) LIKE '%balbinder%';

UPDATE employees SET
  employee_code = 'TAS009', doj = '2022-06-22', gross_salary = 90000,
  entity = 'TAS', level_code = 'L3', segment = 'Direct Sales',
  target_multiplier = 6, monthly_target = 540000, annual_target = 6480000,
  designation = 'Sales Head', department = 'F.P.', location = 'North East'
WHERE LOWER(name) LIKE '%tamanna%';

UPDATE employees SET
  employee_code = 'TAS030', doj = '2024-07-01', gross_salary = 43200,
  entity = 'TAS', level_code = 'L6', segment = 'Direct Sales',
  target_multiplier = 6, monthly_target = 259200, annual_target = 3110400,
  designation = 'Relationship Manager', department = 'F.P.', location = 'North East'
WHERE LOWER(name) LIKE '%vinita%kabra%';

UPDATE employees SET
  employee_code = 'TAS040', doj = '2024-09-02', gross_salary = 28200,
  entity = 'TAS', level_code = 'L6', segment = 'Direct Sales',
  target_multiplier = 6, monthly_target = 169200, annual_target = 2030400,
  designation = 'Relationship Manager & Trainer', department = 'F.P.', location = 'North East'
WHERE LOWER(name) LIKE '%jasmine%jain%';

UPDATE employees SET
  employee_code = 'TAS052', doj = '2024-11-14', gross_salary = 23200,
  entity = 'TAS', level_code = 'L6', segment = 'Direct Sales',
  target_multiplier = 6, monthly_target = 139200, annual_target = 1670400,
  designation = 'Relationship Manager', department = 'F.P.', location = 'North East'
WHERE LOWER(name) LIKE '%jinu%';

UPDATE employees SET
  employee_code = 'TAS054', doj = '2025-01-07', gross_salary = 38200,
  entity = 'TAS', level_code = 'L5', segment = 'Direct Sales',
  target_multiplier = 6, monthly_target = 229200, annual_target = 2750400,
  designation = 'Sales Manager', department = 'LIFE', location = 'North East'
WHERE LOWER(name) LIKE '%khushbu%';

UPDATE employees SET
  employee_code = 'TAS058', doj = '2025-04-07', gross_salary = 48200,
  entity = 'TAS', level_code = 'L5', segment = 'Direct Sales',
  target_multiplier = 6, monthly_target = 289200, annual_target = 3470400,
  designation = 'Outbound Team Leader', department = 'HEALTH', location = 'North East'
WHERE LOWER(name) LIKE '%dipankar%das%';

UPDATE employees SET
  employee_code = 'TAS067', doj = '2025-07-16', gross_salary = 13507,
  entity = 'TAS', level_code = 'L7', segment = 'Direct Sales',
  target_multiplier = 6, monthly_target = 81042, annual_target = 972504,
  designation = 'Relationship Manager', department = 'F.P.', location = 'North East'
WHERE LOWER(name) LIKE '%banshika%';

UPDATE employees SET
  employee_code = 'TAS032', doj = '2024-07-01', gross_salary = 18011,
  entity = 'TAS', level_code = 'L7', segment = 'Direct Sales',
  target_multiplier = 6, monthly_target = 108066, annual_target = 1296792,
  designation = 'Back office Executive', department = 'OPERATION', location = 'North East'
WHERE LOWER(name) LIKE '%harshita%jalan%';

-- ─── POSP / CDM Channel (20× multiplier) ────────────────────────────────

UPDATE employees SET
  employee_code = 'TAS004', doj = '2020-09-01', gross_salary = 22449,
  entity = 'TAS', level_code = 'L6', segment = 'CDM/POSP RM',
  target_multiplier = 20, monthly_target = 404082, annual_target = 4848984,
  designation = 'Executive', department = 'HEALTH', location = 'North East'
WHERE LOWER(name) LIKE '%akash%kumar%';

UPDATE employees SET
  employee_code = 'TAS006', doj = '2021-07-06', gross_salary = 40440,
  entity = 'TAS', level_code = 'L6', segment = 'CDM/POSP RM',
  target_multiplier = 20, monthly_target = 727920, annual_target = 8735040,
  designation = 'Relationship Manager', department = 'HEALTH', location = 'North East'
WHERE LOWER(name) LIKE '%jitender%roy%';

UPDATE employees SET
  employee_code = 'TAS018', doj = '2023-06-01', gross_salary = 43700,
  entity = 'TAS', level_code = 'L6', segment = 'CDM/POSP RM',
  target_multiplier = 20, monthly_target = 786600, annual_target = 9439200,
  designation = 'Relationship Manager', department = 'LIFE', location = 'North East'
WHERE LOWER(name) LIKE '%laxman%sharma%';

UPDATE employees SET
  employee_code = 'TAS102', doj = '2025-12-01', gross_salary = 67008,
  entity = 'TIB', level_code = 'L5', segment = 'CDM/POSP RM',
  target_multiplier = 20, monthly_target = 1340160, annual_target = 16081920,
  designation = 'Channel Development Manager', department = 'POSP', location = 'West Bengal'
WHERE LOWER(name) LIKE '%indranil%roy%';

UPDATE employees SET
  employee_code = 'TAS104', doj = '2025-12-01', gross_salary = 67008,
  entity = 'TIB', level_code = 'L5', segment = 'CDM/POSP RM',
  target_multiplier = 20, monthly_target = 1340160, annual_target = 16081920,
  designation = 'Channel Development Manager', department = 'POSP', location = 'West Bengal'
WHERE LOWER(name) LIKE '%shakeeb%';

UPDATE employees SET
  employee_code = 'TAS086', doj = '2025-10-13', gross_salary = 66117,
  entity = 'TIB', level_code = 'L5', segment = 'CDM/POSP RM',
  target_multiplier = 20, monthly_target = 1322340, annual_target = 15868080,
  designation = 'Channel Development Manager', department = 'OPERATION', location = 'North East'
WHERE LOWER(name) LIKE '%hemanta%saharia%';

UPDATE employees SET
  employee_code = 'TAS098', doj = '2025-12-01', gross_salary = 52009,
  entity = 'TIB', level_code = 'L6', segment = 'CDM/POSP RM',
  target_multiplier = 20, monthly_target = 1040180, annual_target = 12482160,
  designation = 'Channel Development Manager', department = 'POSP', location = 'West Bengal'
WHERE LOWER(name) LIKE '%ashis%das%';

UPDATE employees SET
  employee_code = 'TAS083', doj = '2025-10-06', gross_salary = 44035,
  entity = 'TAS', level_code = 'L5', segment = 'CDM/POSP RM',
  target_multiplier = 20, monthly_target = 880700, annual_target = 10568400,
  designation = 'Ass. Branch Manager', department = 'HEALTH', location = 'North East'
WHERE LOWER(name) LIKE '%ajay%krishnan%';

UPDATE employees SET
  employee_code = 'TAS084', doj = '2025-10-06', gross_salary = 41534,
  entity = 'TAS', level_code = 'L5', segment = 'CDM/POSP RM',
  target_multiplier = 20, monthly_target = 830680, annual_target = 9968160,
  designation = 'Ass. Branch Manager', department = 'HEALTH', location = 'North East'
WHERE LOWER(name) LIKE '%shoibam%nara%';

-- ─── Support / Back Office (no target multiplier) ────────────────────────

UPDATE employees SET
  employee_code = 'TAS002', doj = '2014-09-15', gross_salary = 21429,
  entity = 'TAS', level_code = 'L7', segment = 'Support',
  target_multiplier = 0, monthly_target = 0, annual_target = 0,
  designation = 'Office Assistant', department = 'OPERATION', location = 'North East'
WHERE LOWER(name) LIKE '%pranab%kumar%barman%';

UPDATE employees SET
  employee_code = 'TAS005', doj = '2020-11-16', gross_salary = 22263,
  entity = 'TAS', level_code = 'L7', segment = 'Support',
  target_multiplier = 0, monthly_target = 0, annual_target = 0,
  designation = 'Back Office Executive', department = 'OPERATION', location = 'North East'
WHERE LOWER(name) LIKE '%nipa%das%';

UPDATE employees SET
  employee_code = 'TAS008', doj = '2021-07-29', gross_salary = 34500,
  entity = 'TAS', level_code = 'L6', segment = 'Support',
  target_multiplier = 0, monthly_target = 0, annual_target = 0,
  designation = 'Back Office Executive', department = 'G.I.', location = 'North East'
WHERE LOWER(name) LIKE '%pranita%saikia%';

UPDATE employees SET
  employee_code = 'TAS013', doj = '2022-09-01', gross_salary = 16749,
  entity = 'TAS', level_code = 'L7', segment = 'Support',
  target_multiplier = 0, monthly_target = 0, annual_target = 0,
  designation = 'Back office Executive', department = 'OPERATION', location = 'North East'
WHERE LOWER(name) LIKE '%shivani%kumari%';

UPDATE employees SET
  employee_code = 'TAS014', doj = '2023-01-03', gross_salary = 46876,
  entity = 'TAS', level_code = 'L5', segment = 'Support',
  target_multiplier = 0, monthly_target = 0, annual_target = 0,
  designation = 'HR Manager & Customer Care', department = 'ADMIN', location = 'North East'
WHERE LOWER(name) LIKE '%rinjima%';

UPDATE employees SET
  employee_code = 'TAS051', doj = '2021-07-09', gross_salary = 30000,
  entity = 'TAS', level_code = 'L5', segment = 'Direct Sales',
  target_multiplier = 6, monthly_target = 180000, annual_target = 2160000,
  designation = 'Mentor', department = 'OPERATION', location = 'North East'
WHERE LOWER(name) LIKE '%rafiqueddin%';

-- ─── Senior Management ───────────────────────────────────────────────────

UPDATE employees SET
  employee_code = 'TAS003', doj = '2019-01-31', gross_salary = 99751,
  entity = 'TAS', level_code = 'L3', segment = 'CDM/POSP RM',
  target_multiplier = 20, monthly_target = 1995020, annual_target = 23940240,
  designation = 'Field Force Multiplier', department = 'LIFE', location = 'North East'
WHERE LOWER(name) LIKE '%ajanta%saikia%';

-- ─── Directors (L1) ─────────────────────────────────────────────────────

UPDATE employees SET
  level_code = 'L1', segment = 'Direct Sales', entity = 'TIB'
WHERE LOWER(name) LIKE '%ram%shah%' AND role = 'admin';

UPDATE employees SET
  level_code = 'L1', segment = 'Direct Sales', entity = 'TIB'
WHERE LOWER(name) LIKE '%sangeeta%shah%' OR LOWER(name) LIKE '%sangita%shah%';

-- ============================================================
-- Verify updates
-- ============================================================
-- SELECT name, employee_code, level_code, segment, gross_salary, monthly_target
-- FROM employees
-- WHERE employee_code IS NOT NULL
-- ORDER BY level_code, name;
