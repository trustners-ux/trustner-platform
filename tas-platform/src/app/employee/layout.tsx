import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EmployeeSidebar from "@/components/employee/EmployeeSidebar";
import EmployeeTopbar from "@/components/employee/EmployeeTopbar";
import type { Employee } from "@/types/employee";

export const metadata = {
  title: "Employee Portal | Trustner",
};

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!employee) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EmployeeSidebar role={(employee as Employee).role} />
      <div className="ml-64 flex flex-1 flex-col">
        <EmployeeTopbar employee={employee as Employee} />
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
