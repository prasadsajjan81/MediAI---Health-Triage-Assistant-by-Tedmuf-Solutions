import React, { useState } from 'react';
import { X, Check, CreditCard, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!profile) return;
    setLoading(true);

    try {
      // 1. Create Order on Backend
      const response = await fetch('/api/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 300 }), // ₹300 per month
      });

      const order = await response.json();

      // 2. Open Razorpay Checkout
      const options = {
        key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: order.amount,
        currency: order.currency,
        name: "Vishwasini - MediAI",
        description: "Monthly Subscription Plan",
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
            // 4. Update Subscription in Firestore
            const userRef = doc(db, 'users', profile.uid);
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);

            await updateDoc(userRef, {
              subscriptionStatus: 'active',
              subscriptionEndDate: endDate.toISOString(),
            });

            alert("Payment Successful! Your subscription is now active.");
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
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="relative h-32 bg-gradient-to-r from-teal-600 to-teal-500 p-6 flex items-end">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
            <X size={20} className="text-white" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white rounded-2xl shadow-lg">
              <Zap className="text-teal-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Upgrade to Pro</h2>
          </div>
        </div>

        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Monthly Plan</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-slate-900">₹300</span>
                <span className="text-slate-400 line-through">₹600</span>
                <span className="text-teal-600 font-bold text-sm bg-teal-50 px-2 py-1 rounded-lg">50% OFF</span>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-sm font-bold text-teal-600">Limited Time Offer</span>
              <span className="text-xs text-slate-400">Billed monthly</span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start space-x-3">
              <div className="mt-1 p-1 bg-teal-100 rounded-full">
                <Check size={12} className="text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Unlimited Health Analyses</p>
                <p className="text-sm text-slate-500">No more limits on your health queries</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-1 p-1 bg-teal-100 rounded-full">
                <Check size={12} className="text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Advanced Ayurvedic Insights</p>
                <p className="text-sm text-slate-500">Deeper Dosha analysis and lifestyle planning</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-1 p-1 bg-teal-100 rounded-full">
                <Check size={12} className="text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Priority Report Analysis</p>
                <p className="text-sm text-slate-500">Instant interpretation of complex lab reports</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-1 p-1 bg-teal-100 rounded-full">
                <Check size={12} className="text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Ad-Free Experience</p>
                <p className="text-sm text-slate-500">Clean, focused interface for your health</p>
              </div>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-xl shadow-teal-600/30 transition-all flex items-center justify-center space-x-2 transform hover:-translate-y-1"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <CreditCard size={20} />
                <span>Subscribe Now for ₹300</span>
              </>
            )}
          </button>

          <div className="mt-6 flex items-center justify-center space-x-6 text-slate-400">
            <div className="flex items-center space-x-1">
              <ShieldCheck size={16} />
              <span className="text-xs">Secure Payment</span>
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
