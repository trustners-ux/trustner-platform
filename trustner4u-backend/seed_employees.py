"""
Seed script — Create all 16 Trustner employees in Supabase Auth + employees table.
Run once: python seed_employees.py
"""

import os
import json
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ajftivwizjehjuoiiryq.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_SERVICE_KEY:
    print("ERROR: Set SUPABASE_SERVICE_KEY env variable")
    exit(1)

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

EMPLOYEES = [
    # Admins
    {"name": "Ram Shah",           "email": "ram@trustner.in",                "designation": "Founder & CEO",      "department": "Leadership",  "role": "admin",    "password": "Trustner_Ram47!"},
    {"name": "Sangeeta Shah",      "email": "sangeeta@trustner.in",           "designation": "COO",                "department": "Leadership",  "role": "admin",    "password": "Trustner_Sangeeta83!"},
    # Managers
    {"name": "Tamanna Kejriwal",   "email": "tamanna.kejriwal@trustner.in",   "designation": "FP Team Manager",    "department": "Financial Planning", "role": "manager",  "password": "Trustner_Tamanna29!"},
    {"name": "Ajanta Saikia",      "email": "ajanta.saikia@trustner.in",      "designation": "Principal Officer",   "department": "Compliance",  "role": "manager",  "password": "Trustner_Ajanta56!"},
    {"name": "Abir Kumar Das",     "email": "abir.das@trustner.in",           "designation": "CDO",                "department": "Technology",  "role": "manager",  "password": "Trustner_Abir61!"},
    {"name": "Sejal Jain",         "email": "sejal.jain@trustner.in",         "designation": "FP Team Leader",     "department": "Financial Planning", "role": "manager",  "password": "Trustner_Sejal38!"},
    {"name": "Raju Chakraborty",   "email": "raju.chakraborty@trustner.in",   "designation": "Regional Manager",   "department": "Sales",       "role": "manager",  "password": "Trustner_Raju72!"},
    {"name": "Partha Deb Barman",  "email": "partha.barman@trustner.in",      "designation": "Regional Manager",   "department": "Sales",       "role": "manager",  "password": "Trustner_Partha15!"},
    # Employees
    {"name": "Vinita Kabra",       "email": "vinita.kabra@trustner.in",       "designation": "Compliance Officer",  "department": "Compliance",  "role": "employee", "password": "Trustner_Vinita94!"},
    {"name": "Jasmine Jain",       "email": "trainer@trustner.in",            "designation": "Trainer",             "department": "Training",    "role": "employee", "password": "Trustner_Jasmine27!"},
    {"name": "Wealth Team",        "email": "wealth@trustner.in",             "designation": "Wealth Executive",    "department": "Wealth",      "role": "employee", "password": "Trustner_Wealth53!"},
    {"name": "Foram Thakkar",      "email": "foram.thakkar@trustner.in",      "designation": "Wealth Executive",    "department": "Wealth",      "role": "employee", "password": "Trustner_Foram46!"},
    {"name": "Rishab Jain",        "email": "rishab.jain@trustner.in",        "designation": "Partner",             "department": "Partnerships","role": "employee", "password": "Trustner_Rishab68!"},
    {"name": "Sudarshna Gupta",    "email": "sudarshna.gupta@trustner.in",    "designation": "Wealth Executive",    "department": "Wealth",      "role": "employee", "password": "Trustner_Sudarshna31!"},
    {"name": "Customer Care",      "email": "wecare@trustner.in",             "designation": "Customer Care",       "department": "Support",     "role": "employee", "password": "Trustner_Care85!"},
]


def main():
    print("\n" + "=" * 80)
    print("  TRUSTNER ASSET SERVICES — Employee Seeding Script")
    print("  MeraSIP S.M.A.R.T Platform")
    print("=" * 80 + "\n")

    results = []

    for emp in EMPLOYEES:
        print(f"  Creating: {emp['name']} ({emp['email']})...", end=" ")
        try:
            # 1. Create Supabase Auth user
            auth_response = sb.auth.admin.create_user({
                "email": emp["email"],
                "password": emp["password"],
                "email_confirm": True,
                "app_metadata": {"role": emp["role"]},
                "user_metadata": {"name": emp["name"], "designation": emp["designation"]},
            })

            auth_id = auth_response.user.id

            # 2. Create employees table record
            sb.table("employees").insert({
                "auth_id": str(auth_id),
                "name": emp["name"],
                "email": emp["email"],
                "designation": emp["designation"],
                "department": emp["department"],
                "role": emp["role"],
                "status": "active",
            }).execute()

            print(f"OK  (auth_id: {auth_id})")
            results.append({"name": emp["name"], "email": emp["email"], "password": emp["password"], "role": emp["role"], "status": "created"})

        except Exception as e:
            err = str(e)
            if "already been registered" in err or "duplicate" in err.lower():
                print(f"SKIP (already exists)")
                results.append({"name": emp["name"], "email": emp["email"], "password": emp["password"], "role": emp["role"], "status": "exists"})
            else:
                print(f"FAIL ({err})")
                results.append({"name": emp["name"], "email": emp["email"], "password": emp["password"], "role": emp["role"], "status": f"error: {err}"})

    # Print credentials table
    print("\n" + "=" * 80)
    print("  LOGIN CREDENTIALS")
    print("=" * 80)
    print(f"  {'Name':<22} {'Email':<38} {'Password':<26} {'Role':<10}")
    print("  " + "-" * 96)
    for r in results:
        print(f"  {r['name']:<22} {r['email']:<38} {r['password']:<26} {r['role']:<10}")
    print("=" * 80)
    print(f"\n  Total: {len(results)} employees processed")
    print(f"  Created: {sum(1 for r in results if r['status'] == 'created')}")
    print(f"  Skipped: {sum(1 for r in results if r['status'] == 'exists')}")
    print(f"  Errors:  {sum(1 for r in results if r['status'].startswith('error'))}")
    print()


if __name__ == "__main__":
    main()
