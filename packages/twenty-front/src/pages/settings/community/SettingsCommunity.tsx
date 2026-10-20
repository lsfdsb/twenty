import { SettingsCard } from '@/settings/components/SettingsCard';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsLabContent } from '@/settings/lab/components/SettingsLabContent';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { Section } from 'twenty-ui/components/layout';
import { IconBook, IconWorld, IconBrandGithub } from 'twenty-ui/icon';
import { SettingsPath } from 'twenty-shared/types';
import { doNotTranslate } from 'twenty-shared/i18n';
import { getSettingsPath } from 'twenty-shared/utils';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme';

const StyledHero = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.lg};
  overflow: hidden;
  padding: ${themeCssVariables.spacing[8]};
  position: relative;

  &::after {
    background: ${themeCssVariables.accent.accent9};
    bottom: 0;
    content: '';
    height: 4px;
    left: 0;
    position: absolute;
    width: 72px;
  }

  img {
    height: 40px;
    object-fit: contain;
    object-position: left;
    width: 124px;
  }
  h1 {
    font-family: var(--enki-font-display);
    font-size: 42px;
    font-weight: 400;
    line-height: 1.05;
    margin: 28px 0 16px;
    max-width: 440px;
  }
  p {
    color: ${themeCssVariables.font.color.secondary};
    font-size: 14px;
    line-height: 1.7;
    margin: 0;
    max-width: 470px;
  }
  @media (max-width: ${MOBILE_VIEWPORT}px) {
    padding: ${themeCssVariables.spacing[6]};
    h1 {
      font-size: 34px;
    }
  }
`;

const StyledCardsGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: 1fr;
  }
`;

export const SettingsCommunity = () => (
  <SettingsPageLayout
    title={t({ id: 'Comunidade', message: 'Comunidade' })}
    links={[
      {
        children: t({ id: 'Outros', message: 'Outros' }),
        href: getSettingsPath(SettingsPath.Community),
      },
      { children: t({ id: 'Comunidade', message: 'Comunidade' }) },
    ]}
  >
    <SettingsPageContainer>
      <Section.Root>
        <StyledHero>
          <img
            src="/brand/enki-logo.svg"
            alt={doNotTranslate('Enki')}
            data-default-brand
          />
          <h1>
            {t({
              id: 'Relacionamentos que continuam.',
              message: 'Relacionamentos que continuam.',
            })}
          </h1>
          <p>
            {t({
              id: 'Pessoas e agentes trabalhando com a mesma história. Contexto para cuidar de cada cliente e clareza para decidir o próximo passo.',
              message:
                'Pessoas e agentes trabalhando com a mesma história. Contexto para cuidar de cada cliente e clareza para decidir o próximo passo.',
            })}
          </p>
        </StyledHero>
      </Section.Root>
      <Section.Root>
        <Section.Header
          title={t({ id: 'Perto de você', message: 'Perto de você' })}
          description={t({
            id: 'Conheça a Enki e encontre orientação para o seu CRM.',
            message: 'Conheça a Enki e encontre orientação para o seu CRM.',
          })}
        />
        <StyledCardsGrid>
          <SettingsCard
            href="https://enki.now"
            Icon={<IconWorld size={20} />}
            title={t({ id: 'Conheça a Enki', message: 'Conheça a Enki' })}
          />
          <SettingsCard
            href="https://docs.enki.now/modelo-de-dados"
            Icon={<IconBook size={20} />}
            title={t({ id: 'Guia do CRM', message: 'Guia do CRM' })}
          />
        </StyledCardsGrid>
      </Section.Root>
      <Section.Root>
        <Section.Header
          title={t({ id: 'Uma base aberta', message: 'Uma base aberta' })}
          description={t({
            id: 'Consulte o código-fonte, as licenças e os créditos dos componentes da Enki.',
            message:
              'Consulte o código-fonte, as licenças e os créditos dos componentes da Enki.',
          })}
        />
        <SettingsCard
          href="https://docs.enki.now/licencas"
          Icon={<IconBrandGithub size={20} />}
          title={t({
            id: 'Código-fonte do CRM',
            message: 'Código-fonte do CRM',
          })}
        />
      </Section.Root>
      <Section.Root>
        <Section.Header
          title={t({ id: 'Laboratório', message: 'Laboratório' })}
          description={t({
            id: 'Explore recursos experimentais antes de incorporá-los à sua operação.',
            message:
              'Explore recursos experimentais antes de incorporá-los à sua operação.',
          })}
        />
        <SettingsLabContent />
      </Section.Root>
    </SettingsPageContainer>
  </SettingsPageLayout>
);
