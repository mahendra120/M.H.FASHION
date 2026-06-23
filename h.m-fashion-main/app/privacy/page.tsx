import { PublicLayout } from '@/components/layout/public-layout';
import { LEGAL_LAST_UPDATED } from '@/lib/constants';

const SECTIONS = [
  {
    h: '1. Introduction',
    p: 'This Privacy Policy explains how M.H.Fashion ("we", "us") collects, uses and protects your information when you use our website and services. By using the site you agree to the terms set out here.',
  },
  {
    h: '2. Information we collect',
    p: 'We collect information you provide directly — name, email, shipping address, and payment method — along with usage data such as pages visited and products viewed. We never store full card numbers on our servers.',
  },
  {
    h: '3. How we use your information',
    p: 'Your information is used to fulfil orders, communicate updates, prevent fraud, personalise recommendations and improve the site. We do not sell your personal data.',
  },
  {
    h: '4. Cookies',
    p: 'We use essential cookies to keep you logged in and to remember cart contents, plus analytics cookies to understand how the site is used. You can disable non-essential cookies in your browser settings.',
  },
  {
    h: '5. Data sharing',
    p: 'We share data only with trusted service providers (payment processors, shipping partners) under strict confidentiality, and where required by law.',
  },
  {
    h: '6. Data retention',
    p: 'We retain your account and order data for as long as your account is active, plus the period required by applicable tax and consumer law.',
  },
  {
    h: '7. Your rights',
    p: 'You can request access to, correction of, or deletion of your personal data by contacting care@mhfashion.com. We respond within 30 days.',
  },
  {
    h: '8. Security',
    p: 'We use industry-standard encryption (TLS) and secure infrastructure. No method of transmission is 100% secure, but we take reasonable steps to protect your data.',
  },
  {
    h: '9. Changes',
    p: 'We may update this policy from time to time. Significant changes will be highlighted on the homepage.',
  },
];

export default function PrivacyPage() {
  return (
    <PublicLayout title="Privacy Policy">
      <div className="container-lux max-w-3xl pb-24">
        <p className="text-sm text-muted-foreground">Last updated: {LEGAL_LAST_UPDATED}</p>
        <div className="mt-8 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-xl font-semibold">{s.h}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.p}</p>
            </section>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
