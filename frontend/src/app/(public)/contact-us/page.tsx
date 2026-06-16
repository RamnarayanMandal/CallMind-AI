'use client';

import { useState } from 'react';
import { useCreateContact } from '@/hooks/use-contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, AlertCircle, Mail, Phone, MapPin } from 'lucide-react';
import NavBar from '@/components/homePageCompoment/NavBar';
import Footer from '@/components/homePageCompoment/Footer';

export default function ContactUsPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { mutateAsync: createContact, isPending: submitting } = useCreateContact();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createContact(form);
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send message. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <NavBar/>

      <main className="flex-1 mt-20">
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Have a question or want to learn more? We'd love to hear from you.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                {success ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Message Sent Successfully!</h3>
                    <p className="text-slate-400">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                    <Button variant="outline" className="mt-6" onClick={() => setSuccess(false)}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                        <p className="text-red-300 text-sm">{error}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-400 mb-1.5 block">Name *</label>
                        <Input required placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-neutral-900 border-neutral-800 text-white" />
                      </div>
                      <div>
                        <label className="text-sm text-slate-400 mb-1.5 block">Email *</label>
                        <Input required type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="bg-neutral-900 border-neutral-800 text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1.5 block">Phone *</label>
                      <Input required placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="bg-neutral-900 border-neutral-800 text-white" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1.5 block">Subject *</label>
                      <Input required placeholder="How can we help?" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="bg-neutral-900 border-neutral-800 text-white" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1.5 block">Message *</label>
                      <textarea required rows={5} placeholder="Tell us more about your inquiry..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full h-12 text-base">
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</> : 'Send Message'}
                    </Button>
                  </form>
                )}
              </div>

              <div className="space-y-8">
                <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                  <h3 className="text-lg font-semibold mb-4">Get In Touch</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-400">Email</p>
                        <p className="text-white">ramnarayan847230@gmail.com</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-400">Phone</p>
                        <p className="text-white">+91 6352 396 301</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-400">Office</p>
                        <p className="text-white">Bangalore, India</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                  <h3 className="text-lg font-semibold mb-2">Response Time</h3>
                  <p className="text-sm text-slate-400">We typically respond within 24 hours during business days. For urgent inquiries, please reach out via phone.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
