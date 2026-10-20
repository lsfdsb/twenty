import { type I18n } from '@lingui/core';
import { Img } from 'react-email';

const logoStyle = {
  marginBottom: '32px',
  maxWidth: '100%',
};

type LogoProps = {
  i18n: I18n;
};

export const Logo = ({ i18n }: LogoProps) => {
  return (
    <Img
      src="https://app.enki.now/brand/enki-email-logo.png"
      alt={i18n._('Enki')}
      width="132"
      height="44"
      style={logoStyle}
    />
  );
};
