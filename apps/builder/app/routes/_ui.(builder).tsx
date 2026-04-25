/**
 * The file is named _ui.(builder) instead of _ui._index due to an issue with Vercel.
 * The _ui._index route isn’t recognized on Vercel, even though it works perfectly in other environments.
 */

import { lazy } from "react";
import { useLoaderData } from "@remix-run/react";
import type { MetaFunction, ShouldRevalidateFunction } from "@remix-run/react";
import {
  json,
  type HeadersArgs,
  type LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import * as projectApi from "@webstudio-is/project/index.server";
import { defaultRole, type Role } from "@webstudio-is/project";
import { db as authDb } from "@webstudio-is/authorization-token/index.server";

import {
  AuthorizationError,
  authorizeProject,
  templateIds,
} from "@webstudio-is/trpc-interface/index.server";
import { createContext } from "~/shared/context.server";
import { getPlanInfo } from "@webstudio-is/plans/index.server";
import { defaultPlanFeatures } from "@webstudio-is/plans";
import { dashboardPath, isBuilder, isDashboard } from "~/shared/router-utils";

import env from "~/env/env.server";

import builderStyles from "~/builder/builder.css?url";
import { ClientOnly } from "~/shared/client-only";
import { parseBuilderUrl } from "@webstudio-is/http-client";
import { preventCrossOriginCookie } from "~/services/no-cross-origin-cookie";
import { redirect } from "~/services/no-store-redirect";
import { builderSessionStorage } from "~/services/builder-session.server";
import {
  allowedDestinations,
  isFetchDestination,
} from "~/services/destinations.server";
import { loader as authWsLoader } from "./auth.ws";
export { ErrorBoundary } from "~/shared/error/error-boundary";

export const links = () => {
  return [{ rel: "stylesheet", href: builderStyles }];
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const metas: ReturnType<MetaFunction> = [];

  if (data === undefined) {
    return metas;
  }

  // Project title will be set dynamically after data loads
  return metas;
};

export const loader = async (loaderArgs: LoaderFunctionArgs) => {
  const { request } = loaderArgs;
  preventCrossOriginCookie(request);
  // Allow iframe destination for preview mode (e.g. the Live Preview modal in the dashboard)
  const previewUrl = new URL(request.url);
  const isPreviewMode = previewUrl.searchParams.get("mode") === "preview";
  allowedDestinations(
    request,
    isPreviewMode ? ["document", "empty", "iframe"] : ["document", "empty"]
  );

  if (isDashboard(request)) {
    throw redirect(dashboardPath());
  }

  if (false === isBuilder(request)) {
    throw new Response("Not Found", {
      status: 404,
    });
  }

  if (isFetchDestination(request)) {
    // Remix does not provide a built-in way to add CSRF tokens to data fetches,
    // such as client-side navigation or data refreshes.
    // Therefore, ensure that all data fetched here is not sensitive and does not require CSRF protection.
    // await checkCsrf(request);
  }

  const context = await createContext(request);

  if (context.authorization.type === "service") {
    throw new AuthorizationError("Service calls are not allowed");
  }

  try {
    const normalizeLocalhost = (u: URL) => {
      if (
        u.protocol === "https:" &&
        (u.hostname === "localhost" || u.hostname.endsWith(".localhost"))
      ) {
        u.protocol = "http:";
      }
      return u;
    };
    const url = normalizeLocalhost(new URL(request.url));

    const { projectId } = parseBuilderUrl(url.href);

    if (context.authorization.type === "anonymous") {
      console.error(`[DEBUG] Anonymous request for project: ${projectId}`);
      // Allow anonymous access only for whitelisted templates
      if (projectId && templateIds.includes(projectId)) {
        console.error(
          `[DEBUG] Project ${projectId} is a whitelisted template, bypassing mandatory login.`
        );
        // Continue without redirecting to login
      } else {
        console.error(
          `[DEBUG] Project ${projectId} is NOT whitelisted, redirecting to login.`
        );
        throw await authWsLoader(loaderArgs);
      }
    }

    if (
      context.authorization.type === "user" &&
      request.headers.get("sec-fetch-mode") === "navigate"
    ) {
      // If logout fails, or the session cookie in the dashboard is deleted or expired,
      // enforce reauthorization on builder reload or navigation (sec-fetch-mode === 'navigate') after a timeout.
      const RELOAD_ON_NAVIGATE_TIMEOUT =
        env.DEPLOYMENT_ENVIRONMENT === "production"
          ? 1000 * 60 * 60 * 24 * 7 // 1 week
          : 1000 * 60 * 60 * 1; // 1 hour

      if (
        Date.now() - context.authorization.sessionCreatedAt >
        RELOAD_ON_NAVIGATE_TIMEOUT
      ) {
        throw await authWsLoader(loaderArgs); // start immediately instead of redirect("/auth/ws");
      }
    }

    if (projectId === undefined) {
      throw new Response("Project ID is not defined", {
        status: 404,
      });
    }

    const start = Date.now();
    const project = await projectApi.loadById(projectId, context);

    if (project === null) {
      console.error(`[DEBUG] Project ${projectId} not found in DB.`);
      throw new Response(`Project "${projectId}" not found`, {
        status: 404,
      });
    }

    console.error(`[DEBUG] Project ${projectId} found, checking permits...`);

    const authPermit =
      (await authorizeProject.getProjectPermit(
        {
          projectId: project.id,
          // At this point we already knew that if project loaded we have at least "view" permit
          // having that getProjectPermit is heavy operation we can skip check "view" permit
          permits: ["own", "admin", "build", "edit"] as const,
        },
        context
      )) ?? "view";

    const end = Date.now();

    const diff = end - start;

    // we need to log timings to figure out how to speed up loading

    console.info(`Project ${project.id} is loaded in ${diff}ms`);

    const authToken = url.searchParams.get("authToken") ?? undefined;

    const authTokenPermissions =
      authPermit !== "own" && authToken !== undefined
        ? await authDb.getTokenPermissions(
            {
              projectId: project.id,
              token: authToken,
            },
            context
          )
        : authDb.tokenDefaultPermissions;

    let role: Role | "own" = "own";
    const isTemplate = projectId && templateIds.includes(projectId);

    if (isTemplate) {
      console.error(
        `[DEBUG] Skipping workspace/plan check for whitelisted template ${projectId}`
      );
      // Templates use default plan features for preview
    } else if (project.workspaceId !== null) {
      const currentUserId =
        context.authorization.type === "user"
          ? context.authorization.userId
          : undefined;

      // Fetch workspace owner and current user's membership in a single query.
      // When currentUserId is undefined (token auth), filter with a UUID that
      // can never match so the members array comes back empty.
      const noMatchId = "00000000-0000-0000-0000-000000000000";
      const workspace = await context.postgrest.client
        .from("Workspace")
        .select("userId, members:WorkspaceMember(relation)")
        .eq("id", project.workspaceId)
        .eq("isDeleted", false)
        .eq("members.userId", currentUserId ?? noMatchId)
        .is("members.removedAt", null)
        .single();

      if (workspace.error) {
        console.error(
          `[DEBUG] Workspace load error for project ${project.id}:`,
          workspace.error
        );
        throw workspace.error;
      }

      const planResult = await getPlanInfo([workspace.data.userId], context);
      const ownerPlan = planResult.get(workspace.data.userId) ?? {
        planFeatures: defaultPlanFeatures,
        purchases: [],
      };
      context.planFeatures = ownerPlan.planFeatures;
      context.purchases = ownerPlan.purchases;

      // Determine the current user's relation to the workspace
      if (
        currentUserId !== undefined &&
        workspace.data.userId !== currentUserId
      ) {
        const membership = workspace.data.members[0];
        role = (membership?.relation as Role) ?? defaultRole;

        // When the workspace owner has downgraded, members lose access.
        // Data stays intact but permissions are suspended.
        if (ownerPlan.planFeatures.maxWorkspaces <= 1) {
          throw new AuthorizationError(
            "The workspace owner's plan no longer supports workspace access"
          );
        }
      }
    }

    const { planFeatures, purchases } = context;

    if (project.userId === null && !isTemplate) {
      throw new AuthorizationError("Project must have project userId defined");
    }

    const headers = new Headers();

    if (context.authorization.type === "token") {
      // To protect against cookie overwrites, we set a null session cookie if a user is using an authToken.
      // This ensures that any existing HttpOnly, secure session cookies cannot be overwritten by client-side scripts

      // See Storage model https://datatracker.ietf.org/doc/html/rfc6265#section-5.3
      // If the cookie store contains a cookie with the same name,
      // domain, and path as the newly created cookie:
      // ...
      // If the newly created cookie was received from a "non-HTTP"
      //  API and the old-cookie's http-only-flag is set, abort these
      //  steps and ignore the newly created cookie entirely.
      const builderSession = await builderSessionStorage.getSession(null);
      headers.set(
        "Set-Cookie",
        await builderSessionStorage.commitSession(builderSession)
      );
    }

    headers.set(
      // Disallowing iframes from loading any content except the canvas
      // Still possible create iframes on canvas itself (but we use credentialless attribute)
      // Still possible create iframe without src attribute
      // Allow blob: workers so hdr-color-input can spawn its inline canvas-rendering worker.
      // blob: workers can only be created from JS already running in this page, so the
      // attack surface is no wider than allowing eval.
      "Content-Security-Policy",
      `frame-src ${url.origin}/canvas https://app.goentri.com/ https://help.webstudio.is/; worker-src blob: 'self'`
    );

    return json(
      {
        projectId: project.id,
        authToken,
        authTokenPermissions,
        authPermit,
        role,
        planFeatures,
        purchases,
        stagingUsername: env.STAGING_USERNAME,
        stagingPassword: env.STAGING_PASSWORD,
      } as const,
      {
        headers,
      }
    );
  } catch (error) {
    console.error(`[DEBUG] Loader caught error:`, error);
    if (error instanceof AuthorizationError) {
      console.error(
        `[DEBUG] AuthorizationError: ${error.message}. Redirecting to /auth/ws`
      );
      throw redirect(`/auth/ws`);
    }

    if (error instanceof Response && error.status === 403) {
      console.error(
        `[DEBUG] 403 Response thrown. Message:`,
        await error.text()
      );
    }

    throw error;
  }
};

/**
 * When doing changes in a project, then navigating to a dashboard then pressing the back button,
 * the builder page may display stale data because it’s being retrieved from the browser’s back/forward cache (bfcache).
 *
 * https://web.dev/articles/bfcache
 *
 */
export const headers = ({ loaderHeaders }: HeadersArgs) => {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
  };
  const csp = loaderHeaders.get("Content-Security-Policy");
  if (csp) {
    headers["Content-Security-Policy"] = csp;
  }
  return headers;
};

const Builder = lazy(async () => {
  const { Builder } = await import("~/builder/index.client");
  return { default: Builder };
});

const BuilderRoute = () => {
  const data = useLoaderData<typeof loader>();

  return (
    <ClientOnly>
      {/* Using a key here ensures that certain effects are re-executed inside the builder,
      especially in cases like cloning a project */}
      <Builder key={data.projectId} {...data} />
    </ClientOnly>
  );
};

/**
 * We do not want trpc and other mutations that use the Remix useFetcher hook
 * to cause a reload of all builder data.
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}) => {
  const currentUrlCopy = new URL(currentUrl);
  const nextUrlCopy = new URL(nextUrl);
  // prevent revalidating data when pageId changes
  // to not regenerate auth token and preserve canvas url
  currentUrlCopy.searchParams.delete("pageId");
  nextUrlCopy.searchParams.delete("pageId");

  currentUrlCopy.searchParams.delete("mode");
  nextUrlCopy.searchParams.delete("mode");

  currentUrlCopy.searchParams.delete("pageHash");
  nextUrlCopy.searchParams.delete("pageHash");

  return currentUrlCopy.href === nextUrlCopy.href
    ? false
    : defaultShouldRevalidate;
};

export default BuilderRoute;
