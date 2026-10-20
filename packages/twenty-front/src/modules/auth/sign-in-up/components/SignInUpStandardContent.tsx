import { Logo } from '@/auth/components/Logo';
import { EnkiSignInLayout } from '@/auth/components/EnkiSignInLayout';
import { AnimatedEaseIn } from '@/auth/components/internal/AnimatedEaseIn/AnimatedEaseIn';
import { FooterNote } from '@/auth/sign-in-up/components/FooterNote';
import { WorkspaceSelectionFooter } from '@/auth/sign-in-up/components/WorkspaceSelectionFooter';
import { SignInUpStep } from '@/auth/states/signInUpStepState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type JSX } from 'react';
import { AppPath } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme';
import { type PublicWorkspaceData } from '~/generated-metadata/graphql';

const StyledTitle = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.2;
  margin: 0 0 12px;
`;

const StyledDescription = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
`;

const StyledFormContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-bottom: ${themeCssVariables.spacing[6]};
  margin-top: ${themeCssVariables.spacing[6]};
  min-width: 0;
  width: 100%;
`;

type SignInUpStandardContentProps = {
  workspacePublicData: PublicWorkspaceData | null;
  signInUpForm: JSX.Element | null;
  signInUpStep: SignInUpStep;
  title: string;
  onClickOnLogo: () => void;
};

export const SignInUpStandardContent = ({
  workspacePublicData,
  signInUpForm,
  signInUpStep,
  title,
  onClickOnLogo,
}: SignInUpStandardContentProps) => {
  const { t } = useLingui();
  const isCredentialStep = [
    SignInUpStep.Init,
    SignInUpStep.Email,
    SignInUpStep.Password,
  ].includes(signInUpStep);

  return (
    <EnkiSignInLayout>
      <AnimatedEaseIn>
        <Logo
          primaryLogo={workspacePublicData?.logo || undefined}
          onClick={onClickOnLogo}
          to={AppPath.SignInUp}
        />
      </AnimatedEaseIn>
      <StyledTitle>{title}</StyledTitle>
      {isCredentialStep && (
        <StyledDescription>
          {t({
            id: 'Seu time, seus clientes e as próximas oportunidades esperam por você.',
            message:
              'Seu time, seus clientes e as próximas oportunidades esperam por você.',
          })}
        </StyledDescription>
      )}
      <StyledFormContainer>{signInUpForm}</StyledFormContainer>
      {signInUpStep === SignInUpStep.WorkspaceSelection && (
        <WorkspaceSelectionFooter />
      )}
      {![
        SignInUpStep.Password,
        SignInUpStep.TwoFactorAuthenticationProvision,
        SignInUpStep.TwoFactorAuthenticationVerification,
        SignInUpStep.TwoFactorAuthenticationRecovery,
        SignInUpStep.WorkspaceSelection,
        SignInUpStep.WorkspaceCreation,
      ].includes(signInUpStep) && (
        <FooterNote secondaryAgreement="dataProcessingAgreement" />
      )}
    </EnkiSignInLayout>
  );
};
