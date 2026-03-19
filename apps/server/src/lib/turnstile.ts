import { env } from "@fresh-mansions/env/server";

export const verifyTurnstileToken = async (
  token: null | string | undefined,
  ip?: null | string
): Promise<boolean> => {
  if (!env.TURNSTILE_SECRET_KEY) {
    return true;
  }

  if (!token) {
    return false;
  }

  const body = new URLSearchParams({
    response: token,
    secret: env.TURNSTILE_SECRET_KEY,
  });

  if (ip) {
    body.set("remoteip", ip);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    }
  );

  if (!response.ok) {
    return false;
  }

  const payload = (await response.json()) as { success?: boolean };
  return Boolean(payload.success);
};
