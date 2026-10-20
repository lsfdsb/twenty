import { type JSX } from 'react';
import { Button } from 'react-email';

import { canvasTheme } from 'src/common-style';

const callToActionStyle = {
  display: 'inline-block',
  padding: '14px 24px',
  borderRadius: canvasTheme.border.radius.md,
  border: `1px solid ${canvasTheme.font.colors.blue}`,
  background: canvasTheme.background.button,
  color: canvasTheme.font.colors.inverted,
  fontSize: canvasTheme.font.size.md,
  fontWeight: canvasTheme.font.weight.bold,
  width: 'auto',
};

type CallToActionProps = {
  href: string;
  value: JSX.Element | JSX.Element[] | string;
};

export const CallToAction = ({ value, href }: CallToActionProps) => {
  return (
    <Button href={href} style={callToActionStyle}>
      {value}
    </Button>
  );
};
