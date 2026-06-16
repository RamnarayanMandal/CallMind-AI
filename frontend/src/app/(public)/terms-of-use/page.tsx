'use client';



import Footer from '@/components/homePageCompoment/Footer';
import NavBar from '@/components/homePageCompoment/NavBar';

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <NavBar/>

      <main className="flex-1 py-20 mt-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Use</h1>
          <p className="text-slate-400 text-sm mb-8">Last updated: January 2025</p>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">Acceptance of Terms</h2>
              <p>By accessing or using CallMind AI, you agree to be bound by these Terms of Use. If you do not agree, please do not use our services.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">Service Description</h2>
              <p>CallMind AI provides AI-powered voice agent services that can make and receive phone calls on behalf of your business. The service includes call handling, transcription, AI analysis, and related features.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate account information and keep it updated</li>
                <li>Maintain confidentiality of your login credentials</li>
                <li>Use the service in compliance with all applicable laws</li>
                <li>Ensure you have consent to call the phone numbers you provide</li>
                <li>Not use the service for spam, fraud, or illegal activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">Payment Terms</h2>
              <p>Services are billed according to your chosen subscription plan. Payments are processed through our payment gateway. Failure to pay may result in service suspension.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">Limitation of Liability</h2>
              <p>CallMind AI shall not be liable for indirect, incidental, or consequential damages arising from the use of our services. Our total liability is limited to the amount paid for the service in the preceding 12 months.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">Termination</h2>
              <p>We reserve the right to suspend or terminate accounts that violate these terms. You may cancel your account at any time from your account settings.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">Contact</h2>
              <p>For questions about these terms, contact us at <span className="text-blue-400">legal@callmind.ai</span>.</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
