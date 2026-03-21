import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard, Sparkles, ShieldCheck, Zap, GraduationCap, Stethoscope, Building2, User, Wallet } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { useGlobal } from '../context/GlobalContext';
import { SubscriptionPlan } from '../types';
import { load } from '@cashfreepayments/cashfree-js';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BASE_PLANS = [
  {
    id: SubscriptionPlan.Patient,
    name: 'General Public / Patient',
    icon: User,
    priceINR: 99,
    yearlyPriceINR: 999,
    description: 'For personal & family use',
    features: [
      '20 triage sessions/month',
      'Symptom history',
      'Family profiles (up to 4)',
      'Nearest hospital suggestions',
      'No clinical tools'
    ],
    color: 'from-emerald-600 to-emerald-500',
    shadow: 'shadow-emerald-600/30'
  },
  {
    id: SubscriptionPlan.Student,
    name: 'Student Subscription',
    icon: GraduationCap,
    priceINR: 199,
    yearlyPriceINR: 1599,
    description: 'Best for medical students',
    features: [
      'Up to 50 reports/month',
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
    priceINR: 499,
    yearlyPriceINR: 4999,
    description: 'For medical professionals',
    features: [
      'Up to 200 reports/month',
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
    priceINR: 1999,
    yearlyPriceINR: 19999,
    description: 'Bulk analysis for hospitals',
    features: [
      'Unlimited reports',
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
  const { currency, currencySymbol, country } = useGlobal();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentGateway, setPaymentGateway] = useState<'razorpay' | 'cashfree'>('cashfree');
  const [cashfree, setCashfree] = useState<any>(null);

  useEffect(() => {
    const initCashfree = async () => {
      try {
        const configRes = await fetch('/api/payments/config');
        const { cashfreeEnv } = await configRes.json();
        const cf = await load({
          mode: cashfreeEnv === 'PRODUCTION' ? 'production' : 'sandbox'
        });
        setCashfree(cf);
      } catch (err) {
        console.error("Failed to initialize Cashfree:", err);
      }
    };
    initCashfree();
  }, []);

  if (!isOpen) return null;

  // Simple conversion logic for demo purposes
  // In production, these would be fixed prices defined in the backend per region
  const getPrice = (inr: number) => {
    if (currency === 'INR') return inr;
    if (currency === 'USD') return Math.round(inr / 80);
    if (currency === 'EUR') return Math.round(inr / 90);
    if (currency === 'GBP') return Math.round(inr / 100);
    if (currency === 'AED') return Math.round(inr / 22);
    if (currency === 'CAD') return Math.round(inr / 60);
    if (currency === 'AUD') return Math.round(inr / 55);
    if (currency === 'SGD') return Math.round(inr / 60);
    return Math.round(inr / 80); // Default to USD-like conversion
  };

  const handleSubscriptionUpdate = async (planId: SubscriptionPlan) => {
    if (!profile) return;
    const userRef = doc(db, 'users', profile.uid);
    const endDate = new Date();
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    let newRole: 'user' | 'student' | 'doctor' | 'hospital' | 'admin' = 'user';
    if (planId === SubscriptionPlan.Student) newRole = 'student';
    else if (planId === SubscriptionPlan.Doctor) newRole = 'doctor';
    else if (planId === SubscriptionPlan.Hospital) newRole = 'hospital';
    else if (planId === SubscriptionPlan.Patient) newRole = 'user';

    if (profile.role === 'admin') {
      newRole = 'admin';
    }

    try {
      await updateDoc(userRef, {
        subscriptionStatus: 'active',
        subscriptionPlan: planId,
        subscriptionEndDate: endDate.toISOString(),
        role: newRole
      });
      alert(`Payment Successful! Your ${planId} subscription is now active.`);
      onClose();
    } catch (error) {
      console.error("Error updating user profile after payment:", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  const handleCashfreePayment = async (planId: SubscriptionPlan, amount: number) => {
    if (!profile || !cashfree) return;
    setLoading(planId);

    try {
      const response = await fetch('/api/cashfree/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          customerId: profile.uid,
          customerName: profile.displayName || "User",
          customerEmail: profile.email || "user@example.com",
          customerPhone: "9999999999"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details?.message || "Failed to create Cashfree order");
      }

      const orderData = await response.json();
      
      let checkoutOptions = {
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: "_modal",
      };

      cashfree.checkout(checkoutOptions).then((result: any) => {
        if (result.error) {
          alert(result.error.message);
        }
        if (result.paymentDetails) {
          handleSubscriptionUpdate(planId);
        }
      });

    } catch (error: any) {
      console.error("Cashfree error:", error);
      alert(`Payment error: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const handleRazorpayPayment = async (planId: SubscriptionPlan, amount: number) => {
    if (!profile) return;
    setLoading(planId);

    try {
      // 1. Create Order on Backend
      const response = await fetch('/api/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount, 
          currency: "INR"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Failed to create order");
      }

      const order = await response.json();
      console.log("Order created successfully:", order);

      // 2. Get Razorpay Key
      const configRes = await fetch('/api/payments/config');
      const { razorpayKeyId } = await configRes.json();

      // 3. Open Razorpay Checkout
      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "MediAI",
        description: `Subscription for ${planId}`,
        order_id: order.id,
        handler: async function (response: any) {
          // 4. Verify Payment on Backend
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyData.status === 'success') {
            handleSubscriptionUpdate(planId);
          } else {
            alert(`Payment verification failed: ${verifyData.message || "Unknown error"}`);
          }
        },
        prefill: {
          name: profile.displayName,
          email: profile.email,
        },
        theme: {
          color: "#0d9488",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      alert(`Payment error: ${error.message || "Something went wrong with the payment process."}`);
    } finally {
      setLoading(null);
    }
  };

  const handlePayment = (planId: SubscriptionPlan, amount: number) => {
    if (paymentGateway === 'cashfree') {
      handleCashfreePayment(planId, amount);
    } else {
      handleRazorpayPayment(planId, amount);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto py-10">
      <div className="bg-slate-50 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 z-10 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer shadow-sm border border-slate-200"
          title="Close"
        >
          <X size={20} className="text-slate-600" />
        </button>

        <div className="max-h-[85vh] overflow-y-auto">
          <div className="relative bg-white p-8 border-b border-slate-200">
            <div className="text-center pt-4">
              <h2 className="text-3xl font-sans font-bold text-slate-900 mb-2">Choose Your Plan</h2>
              <p className="text-slate-500">Select the best model for your needs and start your journey with MediAI</p>
              
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                  <button 
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${billingCycle === 'monthly' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Monthly
                  </button>
                  <button 
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${billingCycle === 'yearly' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Yearly
                  </button>
                </div>

                <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                  <button 
                    onClick={() => setPaymentGateway('cashfree')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${paymentGateway === 'cashfree' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    <Wallet size={14} />
                    <span>Cashfree</span>
                  </button>
                  <button 
                    onClick={() => setPaymentGateway('razorpay')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${paymentGateway === 'razorpay' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    <CreditCard size={14} />
                    <span>Razorpay</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BASE_PLANS.map((plan) => {
              const currentPrice = billingCycle === 'yearly' ? plan.yearlyPriceINR : plan.priceINR;
              const localizedPrice = getPrice(currentPrice);
              const savings = billingCycle === 'yearly' ? getPrice(plan.priceINR * 12 - plan.yearlyPriceINR) : 0;

              return (
                <div key={plan.id} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col h-full hover:border-teal-500 transition-all hover:shadow-xl group">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${plan.color} flex items-center justify-center text-white mb-6 shadow-lg ${plan.shadow}`}>
                    <plan.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-3xl font-black text-slate-900">
                        {currencySymbol}{localizedPrice}
                      </span>
                      <span className="text-slate-400 text-sm">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                    </div>
                    {billingCycle === 'yearly' && savings > 0 && (
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Save {currencySymbol}{savings}</span>
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
                        const message = encodeURIComponent(`Hello, I'm interested in the Hospital Integration for MediAI from ${country.name}.`);
                        window.open(`https://wa.me/917506549564?text=${message}`, '_blank');
                      } else {
                        handlePayment(plan.id, localizedPrice);
                      }
                    }}
                    disabled={!!loading}
                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
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
              );
            })}
          </div>

          <div className="p-6 bg-slate-100 flex items-center justify-center space-x-8 text-slate-400">
            <div className="flex items-center space-x-1">
              <ShieldCheck size={16} />
              <span className="text-xs">Secure {paymentGateway === 'cashfree' ? 'Cashfree' : 'Razorpay'} Payment</span>
            </div>
            <div className="flex items-center space-x-1">
              <Sparkles size={16} />
              <span className="text-xs">Cancel Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
