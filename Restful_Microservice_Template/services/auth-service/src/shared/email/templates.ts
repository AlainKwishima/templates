import { env } from "@/config/env.js";

function layout(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="font-family:Segoe UI,sans-serif;line-height:1.5;color:#0f172a">
<h2>${title}</h2>${body}
<p style="color:#64748b;font-size:12px">${env.APP_NAME}</p></body></html>`;
}

export function verificationTemplate(token: string, firstName?: string) {
  const url = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;
  const greeting = firstName ? `Hello ${firstName},` : "Hello,";
  return {
    subject: `${env.APP_NAME} — Verify your email`,
    html: layout("Verify your email", `<p>${greeting}</p><p><a href="${url}">Verify email</a></p><p>Or use token: <code>${token}</code></p>`),
    text: `${greeting}\nVerify: ${url}\nToken: ${token}`,
  };
}

export function passwordResetTemplate(token: string, firstName?: string) {
  const url = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const greeting = firstName ? `Hello ${firstName},` : "Hello,";
  return {
    subject: `${env.APP_NAME} — Reset your password`,
    html: layout("Reset password", `<p>${greeting}</p><p><a href="${url}">Reset password</a></p><p>Or use token: <code>${token}</code></p>`),
    text: `${greeting}\nReset: ${url}\nToken: ${token}`,
  };
}
