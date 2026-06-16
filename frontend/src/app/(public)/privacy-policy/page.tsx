'use client';

import Footer from '@/components/homePageCompoment/Footer';
import NavBar from '@/components/homePageCompoment/NavBar';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <NavBar/>

      <main className="flex-1 py-20 px-6 mt-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-slate-400 text-sm mb-8">Last updated: January 2025</p>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">Information We Collect</h2>
              <p>We collect information you provide directly, including name, email address, phone number, and organization details when you create an account or contact us.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide and maintain our AI voice agent services</li>
                <li>To process and record calls made through our platform</li>
                <li>To send administrative information and service updates</li>
                <li>To improve and optimize our platform performance</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">Data Security</h2>
              <p>We implement industry-standard encryption, access controls, and security measures to protect your data. Call recordings and transcripts are stored securely with restricted access.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">Data Retention</h2>
              <p>We retain your data for as long as your account is active or as needed to provide services. You can request deletion of your data at any time through your account settings or by contacting us.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">Third-Party Services</h2>
              <p>We may share data with service providers who assist in our operations (cloud infrastructure, telephony providers, AI models). These providers are contractually bound to protect your data.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">Contact Us</h2>
              <p>For privacy-related inquiries, please contact us at <span className="text-blue-400">privacy@callmind.ai</span>.</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
