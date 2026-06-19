import { allRequiredLegalAccepted, signupLegalItems } from './signupLegalPack';
import type { OnboardingRole } from '../onboarding/pipeline';
import { defaultAgentOperatingModel } from '../domain/agentProgram';

export type OnboardingWizardNavState = {
  prev?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled: boolean;
};

export function resolveOnboardingWizardNav(args: {
  currentKey: string;
  userData: Record<string, any>;
  authBusy?: boolean;
  nextStep: () => void;
  prevStep: () => void;
  onSubmitSignup: () => void;
}): OnboardingWizardNavState {
  const { currentKey, userData, authBusy, nextStep, prevStep, onSubmitSignup } = args;
  const d = userData;

  switch (currentKey) {
    case 'role':
      return {
        onNext: nextStep,
        nextLabel: d.role ? 'Continue' : 'Select a role to continue',
        nextDisabled: !d.role,
      };

    case 'focus':
      return {
        prev: prevStep,
        onNext: nextStep,
        nextLabel: 'Continue',
        nextDisabled: !(Array.isArray(d.focuses) && d.focuses.length > 0),
      };

    case 'agentTier': {
      const model = defaultAgentOperatingModel(d.agentOperatingModel ?? {});
      const specialties = (d.agentSpecialties as string[])?.length
        ? d.agentSpecialties
        : model.specialties;
      const canContinue = specialties.length > 0 && Boolean(model.capacityTierId || d.agentTierId);
      return {
        prev: prevStep,
        onNext: nextStep,
        nextLabel: canContinue ? 'Continue' : 'Select a specialty to continue',
        nextDisabled: !canContinue,
      };
    }

    case 'context': {
      if ((d.lane || '') === 'business_credit') {
        const ok = Boolean((d.businessName || '').trim()) && Boolean((d.entityState || '').trim());
        return { prev: prevStep, onNext: nextStep, nextLabel: 'Continue', nextDisabled: !ok };
      }
      return {
        prev: prevStep,
        onNext: nextStep,
        nextLabel: 'Continue',
        nextDisabled: !(Array.isArray(d.fractures) && d.fractures.length > 0),
      };
    }

    case 'recommendation':
      return { prev: prevStep, onNext: nextStep, nextLabel: 'Continue', nextDisabled: false };

    case 'legal': {
      const ctx = {
        role: (d.role || '') as OnboardingRole,
        focuses: Array.isArray(d.focuses) ? d.focuses : [],
        lane: d.lane,
        goal: d.goal,
      };
      const checked = d.legalChecks ?? {};
      const name = (d.legalAcceptedName || d.name || '').trim();
      const ok = allRequiredLegalAccepted(ctx, checked) && name.length >= 2;
      return {
        prev: prevStep,
        onNext: nextStep,
        nextLabel: ok ? 'Continue to profile' : 'Accept all required agreements',
        nextDisabled: !ok,
      };
    }

    case 'profile': {
      const passwordOk = (d.password || '').length >= 8;
      const passwordsMatch = !d.password || d.password === (d.confirmPassword || '');
      const canSubmit =
        Boolean((d.name || '').trim()) &&
        Boolean((d.email || '').trim()) &&
        Boolean((d.phone || '').trim()) &&
        passwordOk &&
        passwordsMatch &&
        !authBusy;
      return {
        prev: prevStep,
        onNext: onSubmitSignup,
        nextLabel: authBusy ? 'Creating account…' : 'Create account & continue',
        nextDisabled: !canSubmit,
      };
    }

    default:
      return { prev: prevStep, onNext: nextStep, nextLabel: 'Continue', nextDisabled: false };
  }
}
