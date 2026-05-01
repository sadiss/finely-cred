import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { updateAgreementStatus } from '../../data/billingRepo';

export default function StripeMockPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const agreementId = searchParams.get('agreementId');
  const amount = searchParams.get('amount');
  const [status, setStatus] = useState<'processing' | 'success'>('processing');

  useEffect(() => {
    if (!agreementId) {
      navigate('/portal/billing');
      return;
    }

    // Simulate processing delay
    const timer = setTimeout(() => {
      setStatus('success');
      // Update agreement to active
      updateAgreementStatus(agreementId, 'active');
      // In a real app, webhooks would handle this. Here we mock the entitlement grant.
      // We'd need the partnerId and product details, but for this mock we'll just rely on the billing page to refresh.
    }, 2000);

    return () => clearTimeout(timer);
  }, [agreementId, navigate]);

  const handleReturn = () => {
    navigate('/portal/billing?success=true');
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center p-6 text-slate-900 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-[#635bff] p-6 text-white flex items-center justify-between">
          <div className="font-bold text-lg tracking-tight">Stripe</div>
          <div className="text-xs font-medium bg-white/20 px-2 py-1 rounded">TEST MODE</div>
        </div>
        
        <div className="p-8 text-center space-y-6">
          {status === 'processing' ? (
            <>
              <div className="flex justify-center">
                <Loader2 size={48} className="text-[#635bff] animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Processing Payment...</h2>
              <p className="text-slate-500">Securely communicating with your bank.</p>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Payment Successful</h2>
              <div className="text-3xl font-bold text-slate-900">
                ${amount ? (parseInt(amount) / 100).toFixed(2) : '0.00'}
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                <ShieldCheck size={14} />
                <span>Authenticated & Secure</span>
              </div>
              
              <button
                onClick={handleReturn}
                className="w-full py-3 bg-[#635bff] hover:bg-[#544dc9] text-white font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
              >
                Return to Merchant
              </button>
            </>
          )}
        </div>
        
        <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-100">
          Powered by Stripe (Mock)
        </div>
      </div>
    </div>
  );
}
