export const getDomainUrl = (): URL => {
  const raw = process.env.NEXT_PUBLIC_DOMAIN;
  if (!raw) throw new Error("NEXT_PUBLIC_DOMAIN is not set");
  return new URL(raw);
};

// e.g. "hrm.test" or "hrm-fe-1-0.vercel.app"
export const getRootHostname = (): string => getDomainUrl().hostname;

// e.g. "http://hrm.test:3000" or "https://hrm-fe-1-0.vercel.app"
export const getRootOrigin = (): string => getDomainUrl().origin;

// e.g. ".hrm.test" or ".hrm-fe-1-0.vercel.app"
export const getCookieRootDomain = (): string => `.${getRootHostname()}`;