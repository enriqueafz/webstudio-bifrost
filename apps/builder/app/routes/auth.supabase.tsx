import { type ActionFunctionArgs } from "@remix-run/server-runtime";
import { authenticator } from "~/services/auth.server";
import { dashboardPath } from "~/shared/router-utils";

export const loader = async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return null;
  }

  // Clone request to inject form data for the authenticator
  const formData = new FormData();
  formData.append("token", token);

  // We simulate a POST request internally or call the authenticator directly
  return await authenticator.authenticate("supabase", request, {
    successRedirect: dashboardPath(),
    failureRedirect: "/login?error=supabase_failed",
    context: { formData }, // Passing the token context
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const returnTo = dashboardPath();

  return await authenticator.authenticate("supabase", request, {
    successRedirect: returnTo,
    failureRedirect: "/login?error=supabase_failed",
  });
};

export default function SupabaseAuth() {
  return null;
}
