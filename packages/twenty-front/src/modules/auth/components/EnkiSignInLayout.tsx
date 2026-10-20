import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode } from 'react';
import { doNotTranslate } from 'twenty-shared/i18n';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledLayout = styled.main`
  box-sizing: border-box;
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 1fr) minmax(420px, 1fr);
  min-height: 100%;
  padding: 20px;

  @media (max-width: 800px) {
    display: flex;
    flex-direction: column;
    padding: 0;
  }
`;

const StyledStory = styled.aside`
  background: #25231e;
  border: 1px solid #3d382d;
  border-radius: 12px;
  color: #f8f7e9;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(32px, 4.5vw, 72px);

  @media (max-width: 800px) {
    display: none;
  }
`;

const StyledEyebrow = styled.span`
  color: #d2c4ab;
  font-family: 'Geist Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  line-height: 1.6;
  text-transform: uppercase;
`;

const StyledStatement = styled.h2`
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(64px, 6.5vw, 104px);
  font-weight: 400;
  letter-spacing: -0.015em;
  line-height: 0.97;
  margin: 72px 0 28px;
  overflow-wrap: anywhere;

  em {
    color: #ff9559;
    font-style: normal;
  }
`;

const StyledStoryCopy = styled.p`
  color: #d2c4ab;
  font-size: 17px;
  line-height: 1.7;
  margin: 0 0 72px;
  max-width: 330px;
`;

const StyledStoryFooter = styled.div`
  border-top: 1px solid #51483a;
  padding-top: 24px;
`;

const StyledContent = styled.section`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 64px 40px;

  @media (max-width: 800px) {
    flex: 1;
    padding: 48px 24px 32px;
  }
`;

const StyledForm = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  width: 360px;

  [data-enki-default-logo] {
    height: 40px;
    margin: 0 0 40px;
    width: 104px;
  }

  input {
    box-sizing: border-box;
    font-size: 16px;
    min-height: 44px;
  }

  input:focus {
    border-color: ${themeCssVariables.accent.accent9};
    box-shadow: 0 0 0 2px ${themeCssVariables.accent.accent3};
  }

  button[type='submit'] {
    min-height: 44px;
  }

  button[type='submit']:not(:disabled) {
    background: #ff9559;
    border-color: #c46a37;
    color: #211f1b;
  }

  button[type='submit']:not(:disabled):hover {
    background: #ffa875;
  }

  button[type='submit']:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.accent11};
    outline-offset: 3px;
  }
`;

const StyledMobileSignature = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  display: none;
  font-size: 12px;
  margin: 32px 24px;
  text-align: center;

  @media (max-width: 800px) {
    display: block;
  }
`;

export const EnkiSignInLayout = ({ children }: { children: ReactNode }) => {
  const { t } = useLingui();

  return (
    <StyledLayout>
      <StyledStory>
        <StyledEyebrow>{doNotTranslate('Enki / CRM')}</StyledEyebrow>
        <div>
          <StyledStatement>
            {t({ id: 'Relacionamentos', message: 'Relacionamentos' })}
            <br />
            {t({ id: 'que', message: 'que' })}{' '}
            <em>{t({ id: 'continuam.', message: 'continuam.' })}</em>
          </StyledStatement>
          <StyledStoryCopy>
            {t({
              id: 'Cada empresa, cada pessoa e cada próximo passo. Tudo no mesmo contexto.',
              message:
                'Cada empresa, cada pessoa e cada próximo passo. Tudo no mesmo contexto.',
            })}
          </StyledStoryCopy>
        </div>
        <StyledStoryFooter>
          <StyledEyebrow>
            {t({
              id: 'Menos distância. Mais relação.',
              message: 'Menos distância. Mais relação.',
            })}
          </StyledEyebrow>
        </StyledStoryFooter>
      </StyledStory>
      <StyledContent>
        <StyledForm>{children}</StyledForm>
      </StyledContent>
      <StyledMobileSignature>
        {t({
          id: 'Relacionamentos que continuam.',
          message: 'Relacionamentos que continuam.',
        })}
      </StyledMobileSignature>
    </StyledLayout>
  );
};
