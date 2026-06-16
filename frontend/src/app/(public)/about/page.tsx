'use client';

import { Bot, PhoneCall, Shield, TrendingUp } from 'lucide-react';
import NavBar from '@/components/homePageCompoment/NavBar';
import Footer from '@/components/homePageCompoment/Footer';

const values = [
  { icon: Bot, title: 'Innovation', desc: 'Pushing the boundaries of AI voice technology to deliver human-like conversations.' },
  { icon: PhoneCall, title: 'Reliability', desc: '99.9% uptime ensuring your business never misses a call.' },
  { icon: Shield, title: 'Security', desc: 'Enterprise-grade encryption and data protection for all conversations.' },
  { icon: TrendingUp, title: 'Scalability', desc: 'From startups to enterprises, our platform grows with your business.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <NavBar/>

      <main className="flex-1 mt-20">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About CallMind AI</h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              CallMind AI is a cutting-edge platform that enables businesses to deploy intelligent AI voice agents. 
              Our technology handles inbound and outbound calls with natural, human-like conversations, 
              helping businesses automate customer support, lead generation, and more.
            </p>
          </div>
        </section>

        <section className="py-16 px-6 bg-neutral-900/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {values.map((v) => (
                <div key={v.title} className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                    <v.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-400">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              To transform business communication by making AI voice technology accessible, 
              reliable, and human-like. We believe every business deserves a voice agent 
              that represents their brand perfectly and delights their customers.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
