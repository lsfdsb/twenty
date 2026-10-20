import { type I18n } from '@lingui/core';
import { Font, Head } from 'react-email';

import { canvasTheme } from 'src/common-style';

type BaseHeadProps = {
  i18n: I18n;
};

export const BaseHead = ({ i18n }: BaseHeadProps) => {
  return (
    <Head>
      <title>{i18n._('Enki')}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
      <Font
        fontFamily={canvasTheme.font.family}
        fallbackFontFamily="sans-serif"
        fontStyle="normal"
        fontWeight={canvasTheme.font.weight.regular}
      />
    </Head>
  );
};
