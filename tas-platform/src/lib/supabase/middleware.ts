import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect /employee routes — redirect to /login if not authenticated
  if (pathname.startsWith("/employee") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from /login to /employee
  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/employee";
    return NextResponse.redirect(url);
  }

  // For admin routes, check role
  if (pathname.startsWith("/employee/admin") && user) {
    const { data: employee } = await supabase
      .from("employees")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    if (!employee || !["admin", "hr_head"].includes(employee.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/employee";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
