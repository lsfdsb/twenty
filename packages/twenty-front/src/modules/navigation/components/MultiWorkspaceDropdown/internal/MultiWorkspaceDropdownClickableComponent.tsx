import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import {
  StyledContainer,
  StyledIconChevronDown,
  StyledLabel,
  StyledLabelWrapper,
} from '@/navigation/components/MultiWorkspaceDropdown/internal/MultiWorkspacesDropdownStyles';
import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';
import { useIsNavigationDrawerContentExpanded } from '@/ui/navigation/navigation-drawer/hooks/useIsNavigationDrawerContentExpanded';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { getWorkspaceAvatarColorSeed } from '@/workspace/utils/getWorkspaceAvatarColorSeed';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';
import { styled } from '@linaria/react';
import { isNonEmptyString } from '@sniptt/guards';
import { doNotTranslate } from 'twenty-shared/i18n';
import { Avatar } from 'twenty-ui/primitives/data-display';
import { useTheme } from 'twenty-ui/theme';

const StyledEnkiLogo = styled.img<{ compact: boolean }>`
  display: block;
  flex-shrink: 0;
  height: 22px;
  object-fit: contain;
  width: ${({ compact }) => (compact ? '24px' : '72px')};
`;

type MultiWorkspaceDropdownClickableComponentProps = {
  disabled?: boolean;
  shouldHideLabel?: boolean;
};

export const MultiWorkspaceDropdownClickableComponent = ({
  disabled,
  shouldHideLabel = false,
}: MultiWorkspaceDropdownClickableComponentProps) => {
  const theme = useTheme();
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);

  const isNavigationDrawerExpanded = useIsNavigationDrawerContentExpanded();
  const isWorkspaceLabelVisible =
    !shouldHideLabel && isNavigationDrawerExpanded;
  const hasWorkspaceLogo = isNonEmptyString(currentWorkspace?.logo);

  return (
    <StyledContainer
      data-testid="workspace-dropdown"
      isNavigationDrawerExpanded={isNavigationDrawerExpanded}
      disabled={disabled}
    >
      {hasWorkspaceLogo ? (
        <Avatar
          imageProps={{
            alt: isWorkspaceLabelVisible
              ? ''
              : (currentWorkspace?.displayName ?? ''),
          }}
          name={currentWorkspace?.displayName || ''}
          colorSeed={getWorkspaceAvatarColorSeed(currentWorkspace?.displayName)}
          src={getAbsoluteImageUrl(currentWorkspace.logo)}
        />
      ) : (
        <StyledEnkiLogo
          src="/brand/enki-logo.svg"
          alt={doNotTranslate('Enki')}
          title={currentWorkspace?.displayName ?? doNotTranslate('Enki')}
          compact={!isWorkspaceLabelVisible}
          data-default-brand
        />
      )}
      {!shouldHideLabel && (
        <>
          {hasWorkspaceLogo && (
            <StyledLabelWrapper aria-hidden={!isWorkspaceLabelVisible}>
              <NavigationDrawerAnimatedCollapseWrapper>
                <StyledLabel>{currentWorkspace?.displayName ?? ''}</StyledLabel>
              </NavigationDrawerAnimatedCollapseWrapper>
            </StyledLabelWrapper>
          )}
          <NavigationDrawerAnimatedCollapseWrapper>
            <StyledIconChevronDown
              size={theme.icon.size.md}
              stroke={theme.icon.stroke.sm}
            />
          </NavigationDrawerAnimatedCollapseWrapper>
        </>
      )}
    </StyledContainer>
  );
};
