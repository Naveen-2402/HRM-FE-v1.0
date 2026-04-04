import Cookies from "js-cookie";

// Helper to safely get the domain, whether on client or server
const getCookieDomain = () => {
  // If we are on the server, we can't read window.location. 
  // We default to a safe fallback or let the browser handle standard cookie scoping.
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined;
  }

  const hostname = window.location.hostname;
  if (hostname.includes(`${process.env.NEXT_PUBLIC_LOCAL_DOMAIN}`)) return `.${process.env.NEXT_PUBLIC_LOCAL_DOMAIN}`;

  // if (hostname.includes("localhost")) return "localhost";
  return `.${process.env.NEXT_PUBLIC_HOSTED_DOMAIN}`;
};

export const setAuthTokens = (
  access_token: string,
  refresh_token: string,
  id_token: string,
  session_state: string,
  rememberMe: boolean = false
) => {
  if (typeof window === "undefined") return; // Safety check

  // Base options applied to all cookies
  const cookieOptions: Cookies.CookieAttributes = {
    domain: getCookieDomain(),
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  };

  // If rememberMe is true, persist for 14 days. 
  // If false, we DO NOT set 'expires'. This makes it a "Session Cookie" 
  // which the browser automatically deletes when the window is closed.
  if (rememberMe) {
    cookieOptions.expires = 14;
  }

  Cookies.set("auth_token", access_token, cookieOptions);
  Cookies.set("refresh_token", refresh_token, cookieOptions);
  Cookies.set("id_token", id_token, cookieOptions);

  if (session_state) {
    Cookies.set("session_state", session_state, cookieOptions); // Store Session State
  }
};

export const clearAuthToken = () => {
  if (typeof window === "undefined") return; // Safety check

  const cookieOptions = { domain: getCookieDomain(), path: "/" };

  Cookies.remove("auth_token", cookieOptions);
  Cookies.remove("refresh_token", cookieOptions);
  Cookies.remove("id_token", cookieOptions);
  Cookies.remove("session_state", cookieOptions);
};

// Note: This only works on the CLIENT side.
export const getClientAuthToken = () => {
  if (typeof window === "undefined") return null;
  return Cookies.get("auth_token");
};

export const getClientRefreshToken = () => {
  if (typeof window === "undefined") return null;
  return Cookies.get("refresh_token");
};

export const getClientIdToken = () => {
  if (typeof window === "undefined") return null;
  return Cookies.get("id_token");
};