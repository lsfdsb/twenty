import { type JSX } from 'react';
import { I18nProvider } from '@lingui/react';
import { Body, Container, Html } from 'react-email';

import { canvasTheme } from 'src/common-style';
import { BaseHead } from 'src/components/BaseHead';
import { Footer } from 'src/components/Footer';
import { Logo } from 'src/components/Logo';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

type BaseEmailProps = {
  children: JSX.Element | JSX.Element[] | string;
  width?: number;
  locale: keyof typeof APP_LOCALES;
};

export const BaseEmail = ({ children, width, locale }: BaseEmailProps) => {
  const i18nInstance = createI18nInstance(locale);

  return (
    <I18nProvider i18n={i18nInstance}>
      <Html lang={locale}>
        <BaseHead i18n={i18nInstance} />
        <Body
          style={{
            backgroundColor: canvasTheme.background.page,
            color: canvasTheme.font.colors.primary,
            fontFamily: canvasTheme.font.family,
            margin: 0,
            padding: '32px 16px',
          }}
        >
          <Container
            style={{
              backgroundColor: canvasTheme.background.paper,
              border: `1px solid ${canvasTheme.border.color.highlighted}`,
              borderTop: `3px solid ${canvasTheme.background.button}`,
              borderRadius: '16px',
              boxSizing: 'border-box',
              maxWidth: `${Math.max(width ?? 560, 480)}px`,
              padding: '32px 24px 20px',
              width: '100%',
            }}
          >
            <Logo i18n={i18nInstance} />
            {children}
            <Footer i18n={i18nInstance} />
          </Container>
        </Body>
      </Html>
    </I18nProvider>
  );
};
