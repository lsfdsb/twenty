import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { MockedProvider } from '@apollo/client/testing/react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider as JotaiProvider } from 'jotai';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from 'twenty-ui/theme';

import { PasswordReset } from '~/pages/auth/PasswordReset';
import {
  ValidatePasswordResetTokenDocument,
  UpdatePasswordViaResetTokenDocument,
} from '~/generated-metadata/graphql';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

const mockNavigate = jest.fn();
const mockReset = jest.fn();

jest.mock('~/hooks/useNavigateApp', () => ({
  useNavigateApp: () => mockNavigate,
}));
jest.mock('@/auth/hooks/useAuth', () => ({
  useAuth: () => ({}),
}));
jest.mock('@/auth/hooks/useIsLogged', () => ({
  useIsLogged: () => false,
}));
jest.mock('@/domain-manager/hooks/useRedirect', () => ({
  useRedirect: () => ({ redirect: jest.fn() }),
}));
jest.mock('@/domain-manager/hooks/useIsCurrentLocationOnAWorkspace', () => ({
  useIsCurrentLocationOnAWorkspace: () => ({ isOnAWorkspace: true }),
}));
jest.mock('@/captcha/hooks/useReadCaptchaToken', () => ({
  useReadCaptchaToken: () => ({ readCaptchaToken: () => undefined }),
}));
jest.mock('@/client-config/hooks/useCaptcha', () => ({
  useCaptcha: () => ({ isCaptchaReady: true }),
}));
jest.mock('@/auth/sign-in-up/hooks/useHandleResetPassword', () => ({
  useHandleResetPassword: () => ({
    handleResetPassword: (email: string) => () => mockReset(email),
  }),
}));
jest.mock('twenty-ui/components/feedback', () => ({
  ...jest.requireActual('twenty-ui/components/feedback'),
  useToast: () => ({ enqueueToast: jest.fn() }),
}));

const renderPage = (error?: Error, delay = 0) =>
  render(
    <MockedProvider
      mocks={[
        {
          request: {
            query: ValidatePasswordResetTokenDocument,
            variables: { token: 'test-token' },
          },
          delay,
          ...(error
            ? { error }
            : {
                result: {
                  data: {
                    validatePasswordResetToken: {
                      __typename: 'ValidatePasswordResetToken',
                      id: 'test-user',
                      email: 'test@example.com',
                      hasPassword: false,
                    },
                  },
                },
              }),
        },
        {
          request: {
            query: UpdatePasswordViaResetTokenDocument,
            variables: {
              token: 'test-token',
              newPassword: 'test-password-only',
            },
          },
          result: {
            errors: [
              {
                message: 'Token is invalid',
                extensions: { code: 'FORBIDDEN' },
              },
            ],
          },
        },
      ]}
    >
      <JotaiProvider>
        <ThemeProvider colorScheme="light">
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/reset-password/test-token']}>
              <Routes>
                <Route
                  path="/reset-password/:passwordResetToken"
                  element={<PasswordReset />}
                />
              </Routes>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </JotaiProvider>
    </MockedProvider>,
  );

describe('PasswordReset', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await dynamicActivate('en');
  });

  it('shows a loading state while checking the link', () => {
    renderPage(undefined, Infinity);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Preparando seu espaço',
    );
  });

  it('offers another link for an expired token without redirecting to login', async () => {
    mockReset.mockResolvedValue(true);
    renderPage(
      new CombinedGraphQLErrors({
        errors: [
          { message: 'Token is invalid', extensions: { code: 'FORBIDDEN' } },
        ],
      }),
    );

    expect(
      await screen.findByText('Vamos renovar seu acesso'),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();

    await userEvent.type(screen.getByRole('textbox'), 'test@example.com');
    await userEvent.click(
      screen.getByRole('button', { name: 'Receber novo link' }),
    );
    expect(mockReset).toHaveBeenCalledWith('test@example.com');
    expect(await screen.findByText('Confira seu e-mail')).toBeInTheDocument();
  });

  it('keeps the recovery form available when sending fails', async () => {
    mockReset.mockResolvedValue(false);
    renderPage(
      new CombinedGraphQLErrors({ errors: [{ message: 'Token is invalid' }] }),
    );
    await userEvent.type(
      await screen.findByRole('textbox'),
      'test@example.com',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Receber novo link' }),
    );
    expect(screen.queryByText('Confira seu e-mail')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Receber novo link' }),
    ).toBeEnabled();
  });

  it('distinguishes connection failures from expired links', async () => {
    renderPage(new Error('Network unavailable'));
    expect(
      await screen.findByText('Não conseguimos verificar o link'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Receber novo link' }),
    ).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('opens the password form for a valid token', async () => {
    renderPage();
    expect(
      await screen.findByPlaceholderText('New Password'),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Set Password' }),
    ).toBeInTheDocument();
  });

  it('offers recovery if the token expires while the password form is open', async () => {
    renderPage();
    await userEvent.type(
      await screen.findByPlaceholderText('New Password'),
      'test-password-only',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Set Password' }));
    expect(
      await screen.findByText('Vamos renovar seu acesso'),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
