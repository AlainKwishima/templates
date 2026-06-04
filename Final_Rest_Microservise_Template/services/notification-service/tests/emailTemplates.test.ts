import {
  passwordResetTemplate,
  renderTemplate,
  transactionCreatedTemplate,
  transactionStatusUpdateTemplate,
  verificationSuccessTemplate,
  welcomeEmailTemplate,
} from '../src/templates';

describe('notification templates', () => {
  it('renders template placeholders', () => {
    const rendered = renderTemplate(welcomeEmailTemplate, {
      firstName: 'Amina',
      verificationLink: 'https://example.com/verify',
    });

    expect(rendered).toContain('Amina');
    expect(rendered).toContain('https://example.com/verify');
  });

  it('exposes the expected notification templates', () => {
    expect(verificationSuccessTemplate).toContain('Account Verified');
    expect(passwordResetTemplate).toContain('Password Reset');
    expect(transactionCreatedTemplate).toContain('Transaction Created');
    expect(transactionStatusUpdateTemplate).toContain('Transaction Status Updated');
  });
});

