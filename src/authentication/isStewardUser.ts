import type { User } from "./types.js";

const parseEmails = (raw: string | undefined) =>
  raw
    ?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean) ?? [];

const stewardOverrideEnabled =
  process.env.DEV_STEWARD_TOGGLE === "1" ||
  process.env.DEV_STEWARD_TOGGLE === "true";

const hasStewardOverride = (cookieHeader?: string | null): boolean | null => {
  if (!stewardOverrideEnabled || !cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith("vsat_steward="));
  if (!match) {
    return null;
  }

  const value = match.split("=").at(1);
  if (value === "1" || value === "true") {
    return true;
  }
  if (value === "0" || value === "false") {
    return false;
  }
  return null;
};

export default function isStewardUser(
  user?: User | null,
  cookieHeader?: string | null,
): boolean {
  if (!user?.email) {
    return false;
  }

  const override = hasStewardOverride(cookieHeader);
  if (override !== null) {
    return override;
  }

  const stewardEmails = parseEmails(process.env.STEWARD_EMAILS);
  if (!stewardEmails.length) {
    return false;
  }

  return stewardEmails.includes(user.email.toLowerCase());
}
