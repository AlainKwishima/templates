export type EmailTemplateType = "verification" | "password_reset" | "test";

export type EmailDeliveryStatus = "sent" | "preview" | "failed";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateType?: EmailTemplateType;
}

export interface EmailDeliveryResult {
  status: EmailDeliveryStatus;
  provider: "brevo" | "preview";
  messageId?: string;
  to: string;
  subject: string;
  templateType?: EmailTemplateType;
  attempts: number;
}

export interface BrevoSendEmailPayload {
  sender: {
    name: string;
    email: string;
  };
  to: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  tags?: string[];
}

export interface BrevoSendEmailResponse {
  messageId: string;
  attempts: number;
}

export interface BrevoErrorResponse {
  code?: string;
  message?: string;
}
