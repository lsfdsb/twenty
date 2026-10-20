import { Trans } from '@lingui/react';
import { BaseEmail } from 'src/components/BaseEmail';
import { CallToAction } from 'src/components/CallToAction';
import { Link } from 'src/components/Link';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { ShadowText } from 'src/components/ShadowText';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

type PasswordResetLinkEmailProps = {
  duration: string;
  hasPassword: boolean;
  link: string;
  locale: keyof typeof APP_LOCALES;
};

export const PasswordResetLinkEmail = ({
  duration,
  hasPassword,
  link,
  locale,
}: PasswordResetLinkEmailProps) => {
  const i18n = createI18nInstance(locale);
  const headline = hasPassword
    ? i18n._('Redefina sua senha')
    : i18n._('Seu espaço Enki está pronto.');
  const ctaLabel = hasPassword
    ? i18n._('Redefinir minha senha')
    : i18n._('Definir minha senha');

  return (
    <BaseEmail locale={locale}>
      <Title value={headline} />
      <MainText>
        {hasPassword
          ? i18n._(
              'Recebemos um pedido para redefinir sua senha. Use o botão abaixo para continuar com segurança.',
            )
          : i18n._(
              'Seu time, seus clientes e as próximas oportunidades esperam por você. Defina sua senha para começar.',
            )}
      </MainText>
      <CallToAction href={link} value={ctaLabel} />
      <MainText>
        <Trans
          id="Este link é pessoal e válido por {duration}. Abra assim que receber."
          values={{ duration }}
        />
      </MainText>
      <ShadowText>
        {i18n._(
          'Se o link vencer, a página permite solicitar outro. Se você não fez este pedido, pode ignorar este e-mail. Sua senha permanece a mesma.',
        )}
      </ShadowText>
      <ShadowText>
        {i18n._('O botão não abriu? Copie este endereço para o navegador:')}
        <br />
        <Link href={link} value={link} />
      </ShadowText>
    </BaseEmail>
  );
};

PasswordResetLinkEmail.PreviewProps = {
  duration: '5 minutos',
  hasPassword: false,
  link: 'https://app.enki.now/reset-password/exemplo-sem-token',
  locale: 'pt-BR',
} as PasswordResetLinkEmailProps;

export default PasswordResetLinkEmail;
