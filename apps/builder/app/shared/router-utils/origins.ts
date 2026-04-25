import { parseBuilderUrl } from "@webstudio-is/http-client";

/**
 * In local development, force http:// for localhost origins.
 * Vite's dev server can cause Remix to reconstruct request.url with https://
 * even when the actual connection is plain http, which breaks the OAuth flow.
 */
const normalizeProtocol = (urlStr: string): string => {
  try {
    const url = new URL(urlStr);
    if (
      url.protocol === "https:" &&
      (url.hostname === "localhost" || url.hostname.endsWith(".localhost"))
    ) {
      url.protocol = "http:";
      return url.toString();
    }
  } catch {
    // invalid URL, return as-is
  }
  return urlStr;
};

export const getRequestOrigin = (urlStr: string) => {
  const url = new URL(normalizeProtocol(urlStr));

  return url.origin;
};

export const isCanvas = (urlStr: string): boolean => {
  const url = new URL(urlStr);
  const projectId = url.searchParams.get("projectId");

  return projectId !== null;
};

export const isBuilderUrl = (urlStr: string): boolean => {
  const { projectId } = parseBuilderUrl(normalizeProtocol(urlStr));
  return projectId !== undefined;
};

export const getAuthorizationServerOrigin = (urlStr: string): string => {
  const origin = getRequestOrigin(urlStr);
  const { sourceOrigin } = parseBuilderUrl(origin);
  return sourceOrigin;
};
