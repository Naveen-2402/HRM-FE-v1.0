import Cookies from "js-cookie";

// Helper to safely get the domain, whether on client or server
const getCookieDomain = () => {
  // If we are on the server, we can't read window.location. 
  // We default to a safe fallback or let the browser handle standard cookie scoping.
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined;
  }

  const hostname = window.location.hostname;
  if (hostname.includes("hrm.test")) return ".hrm.test";

  if (hostname.includes("localhost")) return "localhost";
  return ".hrm.com";
};

export const setAuthToken = (token: string) => {
  if (typeof window === "undefined") return; // Safety check

  Cookies.set("auth_token", token, {
    domain: getCookieDomain(),
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    expires: 7,
  });
};

export const clearAuthToken = () => {
  if (typeof window === "undefined") return; // Safety check

  Cookies.remove("auth_token", {
    domain: getCookieDomain(),
    path: "/"
  });
};

// Note: This only works on the CLIENT side.
export const getClientAuthToken = () => {
  if (typeof window === "undefined") return null;
  return Cookies.get("auth_token");
};