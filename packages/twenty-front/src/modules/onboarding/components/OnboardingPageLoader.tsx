import { isOnOnboardingVerifyPath } from '@/auth/utils/isOnOnboardingVerifyPath';
import { OnboardingPulsingLogo } from '@/onboarding/components/OnboardingPulsingLogo';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme';
import { i18n, type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useEffect, useState } from 'react';

const LOADING_MESSAGE = msg({
  id: 'Preparando seu espaço…',
  message: 'Preparando seu espaço…',
});
const SLOW_LOADING_MESSAGE = msg({
  id: 'Está demorando um pouco mais. Verifique sua conexão ou tente recarregar.',
  message:
    'Está demorando um pouco mais. Verifique sua conexão ou tente recarregar.',
});
const RELOAD_MESSAGE = msg({ id: 'Recarregar', message: 'Recarregar' });

// This loader also renders before the async locale catalog has activated.
const translateLoadingMessage = (message: MessageDescriptor) =>
  isNonEmptyString(i18n.locale) ? i18n._(message) : message.id;

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
        {translateLoadingMessage(
          isTakingLonger ? SLOW_LOADING_MESSAGE : LOADING_MESSAGE,
        )}
      </StyledMessage>
      {isTakingLonger && (
        <StyledReload onClick={() => window.location.reload()}>
          {translateLoadingMessage(RELOAD_MESSAGE)}
        </StyledReload>
      )}
    </StyledContainer>
  );
};
