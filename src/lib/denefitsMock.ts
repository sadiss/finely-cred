import { updateAgreementStatus } from '../data/billingRepo';

export async function createDenefitsContract(agreementId: string, amount: number, termMonths: number) {
  // Simulate API call
  return new Promise<{ contractId: string; status: string }>((resolve) => {
    setTimeout(() => {
      // In a real app, this would call the Denefits API
      // For now, we just return a mock contract ID
      const contractId = `den_${Math.random().toString(36).substring(2, 9)}`;
      
      // Update local agreement status
      // Denefits usually starts as 'pending_review' or 'active' depending on configuration
      // We'll keep it as pending_review for the partner to see
      updateAgreementStatus(agreementId, 'pending_review');

      resolve({
        contractId,
        status: 'pending_review'
      });
    }, 1500);
  });
}
