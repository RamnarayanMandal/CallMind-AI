'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import api from '@/lib/axios-client';

const plans = [
  {
    id: 'plan_starter',
    name: 'Starter',
    price: '₹1,999',
    description: 'Perfect for small businesses starting with voice AI.',
    features: ['500 AI Minutes / month', '1 AI Agent', 'Standard Support', 'Basic Analytics'],
    razorpayPlanId: 'plan_XXXXXX_starter', // Replace with actual Razorpay Plan ID
  },
  {
    id: 'plan_growth',
    name: 'Growth',
    price: '₹4,999',
    description: 'Scale your outbound operations efficiently.',
    features: ['2000 AI Minutes / month', '5 AI Agents', 'Priority Support', 'Advanced Analytics', 'Custom Voices'],
    isPopular: true,
    razorpayPlanId: 'plan_XXXXXX_growth',
  },
  {
    id: 'plan_business',
    name: 'Business',
    price: '₹14,999',
    description: 'Enterprise grade infrastructure for high volume.',
    features: ['Unlimited AI Minutes (FUP)', 'Unlimited Agents', '24/7 Dedicated Support', 'API Access', 'Custom Integrations'],
    razorpayPlanId: 'plan_XXXXXX_business',
  }
];

export default function BillingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan: any) => {
    setLoadingPlan(plan.id);

    const res = await loadRazorpay();
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      setLoadingPlan(null);
      return;
    }

    try {
      // Create subscription on our backend
      const { data } = await api.post('/subscription/create', { planId: plan.id });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use public key here
        subscription_id: data.razorpaySubscriptionId,
        name: 'Bivha AI Voice',
        description: `${plan.name} Subscription`,
        handler: async function (response: any) {
          // This executes on successful payment
          // The backend webhook will handle the actual activation, but we can show a success message here
          alert('Subscription successful! Payment ID: ' + response.razorpay_payment_id);
        },
        theme: {
          color: '#3b82f6',
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to initiate subscription. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight text-white">Simple, transparent pricing</h1>
        <p className="text-lg text-slate-400">Choose the perfect plan to automate your voice operations. Upgrade or downgrade at any time.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 pt-8">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`bg-slate-900 flex flex-col relative ${plan.isPopular ? 'border-blue-500 shadow-blue-900/20 shadow-xl' : 'border-slate-800'}`}
          >
            {plan.isPopular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                MOST POPULAR
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
              <CardDescription className="text-slate-400 h-10">{plan.description}</CardDescription>
              <div className="mt-4 flex items-baseline text-4xl font-bold text-white">
                {plan.price}
                <span className="ml-1 text-sm font-medium text-slate-400">/mo</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start text-sm text-slate-300">
                    <Check className="h-5 w-5 text-blue-500 shrink-0 mr-3" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlan === plan.id}
                className={`w-full ${plan.isPopular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
              >
                {loadingPlan === plan.id ? 'Processing...' : 'Subscribe Now'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
