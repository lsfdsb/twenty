import { type I18n } from '@lingui/core';
import { Section } from 'react-email';
import { canvasTheme } from 'src/common-style';
import { Link } from 'src/components/Link';
import { ShadowText } from 'src/components/ShadowText';

type FooterProps = { i18n: I18n };

export const Footer = ({ i18n }: FooterProps) => (
  <Section
    style={{
      borderTop: `1px solid ${canvasTheme.border.color.highlighted}`,
      marginTop: '32px',
      paddingTop: '24px',
    }}
  >
    <ShadowText>
      <strong>{i18n._('Equipe Enki')}</strong>
      <br />
      {i18n._('Relacionamentos que continuam.')}
    </ShadowText>
    <ShadowText>
      <Link href="https://enki.now" value="enki.now" />
      {' · '}
      <Link href="https://app.enki.now" value={i18n._('Acessar meu espaço')} />
    </ShadowText>
  </Section>
);
