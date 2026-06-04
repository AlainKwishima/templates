import { env } from "@/config/env.js";

function buildFrontendUrl(path: string) {
  const baseUrl = env.FRONTEND_URL.replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function verificationTemplate(token: string, name?: string) {
  const url = `${buildFrontendUrl("/verify-email")}?token=${encodeURIComponent(token)}`;
  return {
    subject: "Verify your email address",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2>Hello${name ? ` ${name}` : ""},</h2>
        <p>Please verify your email address to activate your account.</p>
        <p><a href="${url}">Verify email</a></p>
        <p>If the link is unavailable, use this token: <strong>${token}</strong></p>
      </div>
    `,
    text: `Verify your email at ${url}`,
  };
}

export function passwordResetTemplate(token: string, name?: string) {
  const url = `${buildFrontendUrl("/reset-password")}?token=${encodeURIComponent(token)}`;
  return {
    subject: "Reset your password",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2>Hello${name ? ` ${name}` : ""},</h2>
        <p>You can reset your password by opening this link.</p>
        <p><a href="${url}">Reset password</a></p>
        <p>If the link is unavailable, use this token: <strong>${token}</strong></p>
      </div>
    `,
    text: `Reset your password at ${url}`,
  };
}
