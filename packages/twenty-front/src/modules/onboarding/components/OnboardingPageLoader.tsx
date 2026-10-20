import { isOnOnboardingVerifyPath } from '@/auth/utils/isOnOnboardingVerifyPath';
import { OnboardingPulsingLogo } from '@/onboarding/components/OnboardingPulsingLogo';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme';
import { t } from '@lingui/core/macro';
import { useEffect, useState } from 'react';

const StyledContainer = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: calc(100dvh / var(--t-zoom, 1));
  justify-content: center;
  padding: 24px;
  text-align: center;
  width: 100%;
`;

const StyledMessage = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-family: ${themeCssVariables.font.family};
  line-height: 1.6;
  margin: 0;
  max-width: 320px;
`;

const StyledReload = styled.button`
  background: transparent;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font: inherit;
  margin-top: 20px;
  min-height: 44px;
  padding: 10px 20px;
`;

// No logo: the verify screen renders its own, which would flash twice on cold boot.
export const OnboardingPageLoader = () => {
  const [isTakingLonger, setIsTakingLonger] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsTakingLonger(true), 20000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <StyledContainer>
      {!isOnOnboardingVerifyPath(window.location.pathname) && (
        <OnboardingPulsingLogo />
      )}
      <StyledMessage role="status" aria-live="polite">
        {isTakingLonger
          ? t`Está demorando um pouco mais. Verifique sua conexão ou tente recarregar.`
          : t`Preparando seu espaço…`}
      </StyledMessage>
      {isTakingLonger && (
        <StyledReload onClick={() => window.location.reload()}>
          {t`Recarregar`}
        </StyledReload>
      )}
    </StyledContainer>
  );
};
