import { PublicLayout } from '@/components/layout/public-layout';

const SECTIONS = [
  { h: '1. Acceptance of terms', p: 'By accessing or using M.H.Fashion you agree to be bound by these Terms. If you do not agree, please discontinue use of the site.' },
  { h: '2. Account', p: 'You are responsible for safeguarding your account credentials and for all activity under your account. Notify us immediately of any unauthorised use.' },
  { h: '3. Orders', p: 'All orders are subject to availability and confirmation. We reserve the right to refuse or cancel any order. Prices are listed in INR and inclusive of applicable taxes.' },
  { h: '4. Payment', p: 'Payments are processed by secure third-party processors. We do not store full card details. COD orders may carry a small handling fee.' },
  { h: '5. Shipping', p: 'Estimated delivery times are indicative. Risk of loss passes to you upon delivery. Free shipping applies to orders above ₹1,499.' },
  { h: '6. Returns', p: 'Returns are accepted within 30 days for unworn items with tags. Certain hygiene items (mobile covers, posters) may be non-returnable unless defective.' },
  { h: '7. Intellectual property', p: 'All content, imagery, branding and designs are property of M.H.Fashion. You may not reproduce, copy or distribute without written permission.' },
  { h: '8. User content', p: 'Reviews must be honest and your own. We may remove content that is abusive, off-topic or promotional.' },
  { h: '9. Limitation of liability', p: 'Our liability is limited to the value of the order. We are not liable for indirect or consequential damages.' },
  { h: '10. Governing law', p: 'These Terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of courts in Mumbai.' },
  { h: '11. Changes', p: 'We may update these Terms at any time. Continued use after changes constitutes acceptance.' },
];

export default function TermsPage() {
  return (
    <PublicLayout title="Terms & Conditions">
      <div className="container-lux max-w-3xl pb-24">
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
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
