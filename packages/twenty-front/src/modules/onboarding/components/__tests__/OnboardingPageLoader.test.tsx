import { act, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'twenty-ui/theme';
import { i18n } from '@lingui/core';

import { OnboardingPageLoader } from '@/onboarding/components/OnboardingPageLoader';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

describe('OnboardingPageLoader', () => {
  beforeEach(async () => {
    await dynamicActivate('en');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('remains readable before a locale is available, including a slow boot', () => {
    jest.spyOn(i18n, 'locale', 'get').mockReturnValue('');
    jest.spyOn(i18n, '_').mockImplementation(() => {
      throw new Error('No locale activated');
    });

    render(
      <ThemeProvider colorScheme="light">
        <OnboardingPageLoader />
      </ThemeProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Preparando seu espaço…',
    );
    act(() => jest.advanceTimersByTime(20000));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Está demorando um pouco mais',
    );
    expect(screen.getByRole('button', { name: 'Recarregar' })).toBeEnabled();
  });

  it('offers a visible recovery action when loading takes too long', () => {
    render(
      <ThemeProvider colorScheme="light">
        <OnboardingPageLoader />
      </ThemeProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Preparando seu espaço',
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(20000));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Está demorando um pouco mais',
    );
    expect(screen.getByRole('button', { name: 'Recarregar' })).toBeEnabled();
  });
});
