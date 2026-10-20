import { useState, type FormEvent } from 'react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { AppPath } from 'twenty-shared/types';
import { MainButton } from 'twenty-ui/components/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { Logo } from '@/auth/components/Logo';
import { StyledAuthContent } from '@/auth/components/StyledAuthContent';
import { Title } from '@/auth/components/Title';
import { useHandleResetPassword } from '@/auth/sign-in-up/hooks/useHandleResetPassword';
import { TextInput } from '@/ui/input/components/TextInput';

type PasswordResetRecoveryProps = {
  isInvalidLink: boolean;
  onRetry: () => void;
};

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  max-width: 400px;
  width: 100%;
`;

const StyledDescription = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  line-height: 1.6;
  margin: 0;
  text-align: center;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledLink = styled.a`
  color: ${themeCssVariables.font.color.secondary};
  padding: ${themeCssVariables.spacing[3]};
  text-align: center;
  text-underline-offset: 4px;
`;

export const PasswordResetRecovery = ({
  isInvalidLink,
  onRetry,
}: PasswordResetRecoveryProps) => {
  const { t } = useLingui();
  const { handleResetPassword } = useHandleResetPassword();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const requestNewLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;

    setIsSending(true);
    try {
      setIsSent(await handleResetPassword(email.trim())());
    } finally {
      setIsSending(false);
    }
  };

  return (
    <StyledAuthContent>
      <StyledContent>
        <Logo />
        <Title>
          {isSent
            ? t`Confira seu e-mail`
            : isInvalidLink
              ? t`Vamos renovar seu acesso`
              : t`Não conseguimos verificar o link`}
        </Title>
        <StyledDescription role="status">
          {isSent
            ? t`Se o e-mail estiver cadastrado, um novo link chegará em instantes. Use o e-mail mais recente e abra o link assim que ele chegar.`
            : isInvalidLink
              ? t`Este link expirou ou já foi utilizado. Informe seu e-mail para receber um novo e definir sua senha.`
              : t`Não foi possível conectar agora. Tente novamente para continuar com este mesmo link.`}
        </StyledDescription>
        {isInvalidLink ? (
          !isSent && (
            <StyledForm onSubmit={requestNewLink}>
              <TextInput
                label={t`E-mail`}
                type="email"
                autoComplete="email"
                value={email}
                onChange={setEmail}
                required
                fullWidth
                disabled={isSending}
              />
              <MainButton
                type="submit"
                fullWidth
                disabled={isSending || !email.trim()}
              >
                {isSending ? t`Enviando…` : t`Receber novo link`}
              </MainButton>
            </StyledForm>
          )
        ) : (
          <MainButton fullWidth onClick={onRetry}>
            {t`Tentar novamente`}
          </MainButton>
        )}
        <StyledLink href={AppPath.SignInUp}>
          {t`Voltar para o login`}
        </StyledLink>
      </StyledContent>
    </StyledAuthContent>
  );
};
