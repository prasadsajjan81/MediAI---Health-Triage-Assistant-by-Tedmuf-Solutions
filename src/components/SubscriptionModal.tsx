import React, { useState } from 'react';
import { X, Check, CreditCard, Sparkles, ShieldCheck, Zap, GraduationCap, Stethoscope, Building2 } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { SubscriptionPlan } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLANS = [
  {
    id: SubscriptionPlan.Student,
    name: 'Student Subscription',
    icon: GraduationCap,
    price: 199,
    yearlyPrice: 999,
    description: 'Best for medical students',
    features: [
      'Unlimited report analysis',
      'Disease explanations',
      'Learning mode',
      'Interactive quizzes'
    ],
    color: 'from-blue-600 to-blue-500',
    shadow: 'shadow-blue-600/30'
  },
  {
    id: SubscriptionPlan.Doctor,
    name: 'Doctor AI Assistant',
    icon: Stethoscope,
    price: 999,
    description: 'For medical professionals',
    features: [
      'Report summarizer',
      'Patient explanation tools',
      'Clinical reference access',
      'Priority processing'
    ],
    color: 'from-teal-600 to-teal-500',
    shadow: 'shadow-teal-600/30'
  },
  {
    id: SubscriptionPlan.Hospital,
    name: 'Hospital Integration',
    icon: Building2,
    price: 'Custom',
    description: 'Bulk analysis for hospitals',
    features: [
      '₹20-₹50 per report API',
      'Massive scale support',
      'Direct EHR integration',
      'Dedicated support'
    ],
    color: 'from-purple-600 to-purple-500',
    shadow: 'shadow-purple-600/30'
  }
];

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  if (!isOpen) return null;

  const handlePayment = async (planId: SubscriptionPlan, amount: number) => {
    if (!profile) return;
    setLoading(planId);

    try {
      const razorpayKey = (import.meta as any).env.VITE_RAZORPAY_KEY_ID;
      
      if (!razorpayKey || razorpayKey === 'rzp_test_placeholder') {
        alert("Razorpay API Key is missing. Please configure VITE_RAZORPAY_KEY_ID in your environment variables.");
        setLoading(null);
        return;
      }

      // 1. Create Order on Backend
      const response = await fetch('/api/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const order = await response.json();

      // 2. Open Razorpay Checkout
      const options = {
        key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: order.amount,
        currency: order.currency,
        name: "Vishwasini - MediAI",
        description: `${planId} Plan`,
        order_id: order.id,
        handler: async (response: any) => {
          // 3. Verify Payment on Backend
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });

          const verifyData = await verifyRes.json();

          if (verifyData.status === 'success') {
            // 4. Update Subscription and Role in Firestore
            const userRef = doc(db, 'users', profile.uid);
            const endDate = new Date();
            if (billingCycle === 'yearly' && planId === SubscriptionPlan.Student) {
              endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
              endDate.setMonth(endDate.getMonth() + 1);
            }

            // Map plan to role
            let newRole: 'user' | 'student' | 'doctor' | 'hospital' = 'user';
            if (planId === SubscriptionPlan.Student) newRole = 'student';
            else if (planId === SubscriptionPlan.Doctor) newRole = 'doctor';
            else if (planId === SubscriptionPlan.Hospital) newRole = 'hospital';

            await updateDoc(userRef, {
              subscriptionStatus: 'active',
              subscriptionPlan: planId,
              subscriptionEndDate: endDate.toISOString(),
              role: newRole
            });

            alert(`Payment Successful! Your ${planId} subscription is now active.`);
            onClose();
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          email: profile.email,
          name: profile.displayName,
        },
        theme: {
          color: "#0d9488",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong with the payment process.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-50 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 my-8">
        <div className="relative bg-white p-8 border-b border-slate-200">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-600" />
          </button>
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Choose Your Plan</h2>
            <p className="text-slate-500">Select the best model for your needs and start your journey with MediAI</p>
            
            <div className="mt-6 inline-flex p-1 bg-slate-100 rounded-xl">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${billingCycle === 'yearly' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div key={plan.id} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col h-full hover:border-teal-500 transition-all hover:shadow-xl group">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${plan.color} flex items-center justify-center text-white mb-6 shadow-lg ${plan.shadow}`}>
                <plan.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
              
              <div className="mb-6">
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-slate-900">
                    {typeof plan.price === 'number' 
                      ? `₹${billingCycle === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.price}` 
                      : plan.price}
                  </span>
                  {typeof plan.price === 'number' && (
                    <span className="text-slate-400 text-sm">/{billingCycle === 'yearly' && plan.yearlyPrice ? 'year' : 'month'}</span>
                  )}
                </div>
                {billingCycle === 'yearly' && plan.yearlyPrice && typeof plan.price === 'number' && (
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Save ₹{(plan.price as number) * 12 - plan.yearlyPrice}</span>
                )}
              </div>

              <div className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="mt-1 p-0.5 bg-teal-100 rounded-full">
                      <Check size={10} className="text-teal-600" />
                    </div>
                    <span className="text-sm text-slate-600">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  if (plan.id === SubscriptionPlan.Hospital) {
                    window.location.href = 'mailto:prasadsajjan81@gmail.com?subject=Hospital Integration Inquiry';
                  } else {
                    handlePayment(plan.id, billingCycle === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.price as number);
                  }
                }}
                disabled={!!loading}
                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${
                  plan.id === SubscriptionPlan.Hospital 
                    ? 'bg-slate-900 text-white hover:bg-slate-800' 
                    : `bg-gradient-to-r ${plan.color} text-white hover:opacity-90 shadow-lg ${plan.shadow}`
                }`}
              >
                {loading === plan.id ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CreditCard size={18} />
                    <span>{plan.id === SubscriptionPlan.Hospital ? 'Contact Sales' : 'Get Started'}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-100 flex items-center justify-center space-x-8 text-slate-400">
          <div className="flex items-center space-x-1">
            <ShieldCheck size={16} />
            <span className="text-xs">Secure Razorpay Payment</span>
          </div>
          <div className="flex items-center space-x-1">
            <Sparkles size={16} />
            <span className="text-xs">Cancel Anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
