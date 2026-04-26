import { type ActionFunctionArgs } from "@remix-run/server-runtime";
import { authenticator } from "~/services/auth.server";
import { dashboardPath } from "~/shared/router-utils";

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
