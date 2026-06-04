import { renderTemplate, welcomeEmailTemplate } from './emailTemplates';

describe('email templates', () => {
  it('substitutes all placeholders', () => {
    const html = renderTemplate(welcomeEmailTemplate, {
      firstName: 'Alice',
      verificationLink: 'http://localhost/verify',
    });

    expect(html).toContain('Alice');
    expect(html).toContain('http://localhost/verify');
    expect(html).not.toMatch(/\{\{[^}]+\}\}/);
  });
});
