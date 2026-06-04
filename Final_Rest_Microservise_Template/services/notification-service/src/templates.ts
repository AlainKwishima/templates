export const renderTemplate = (template: string, data: Record<string, string>): string => {
  let rendered = template;
  for (const [key, value] of Object.entries(data)) {
    rendered = rendered.split(`{{${key}}}`).join(value);
  }
  return rendered;
};

const baseLayout = (content: string) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
  ${content}
</body>
</html>
`;

export const welcomeEmailTemplate = baseLayout(`
  <h2>Welcome, {{firstName}}!</h2>
  <p>Thank you for registering. Please verify your email by clicking the link below:</p>
  <p><a href="{{verificationLink}}">Verify Email</a></p>
`);

export const verificationSuccessTemplate = baseLayout(`
  <h2>Account Verified</h2>
  <p>Hi {{firstName}}, your email has been successfully verified. You can now use all features.</p>
`);

export const passwordResetTemplate = baseLayout(`
  <h2>Password Reset</h2>
  <p>Hi {{firstName}}, click the link below to reset your password (valid for 1 hour):</p>
  <p><a href="{{resetLink}}">Reset Password</a></p>
`);

export const transactionCreatedTemplate = baseLayout(`
  <h2>Transaction Created</h2>
  <p>Hi {{firstName}}, a new transaction was created.</p>
  <p><strong>ID:</strong> {{transactionId}}</p>
  <p><strong>Resource:</strong> {{resourceName}}</p>
  <p><strong>Status:</strong> {{status}}</p>
`);

export const transactionStatusUpdateTemplate = baseLayout(`
  <h2>Transaction Status Updated</h2>
  <p>Hi {{firstName}}, your transaction status has been updated.</p>
  <p><strong>ID:</strong> {{transactionId}}</p>
  <p><strong>Resource:</strong> {{resourceName}}</p>
  <p><strong>New Status:</strong> {{status}}</p>
`);

