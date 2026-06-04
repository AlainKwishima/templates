export type EmailTemplateType = "verification" | "password-reset" | "test";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  templateType: EmailTemplateType;
}

export interface EmailDeliveryResult {
  status: "sent" | "preview";
  provider: "brevo" | "preview";
  to: string;
  subject: string;
  templateType: EmailTemplateType;
  messageId?: string;
}
