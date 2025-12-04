import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import ChangePassword from '../ChangePassword';

// Mock the auth API
jest.mock('../../api/auth', () => ({
  useChangePassword: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ChangePassword', () => {
  const mockOnPasswordChanged = jest.fn();
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders password change form', () => {
    renderWithProviders(
      <ChangePassword onPasswordChanged={mockOnPasswordChanged} user={mockUser} />
    );

    expect(screen.getByText('Password Change Required')).toBeInTheDocument();
    expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
  });

  test('shows password strength indicator when new password is entered', async () => {
    renderWithProviders(
      <ChangePassword onPasswordChanged={mockOnPasswordChanged} user={mockUser} />
    );

    const newPasswordField = screen.getByLabelText('New Password');
    fireEvent.change(newPasswordField, { target: { value: 'TestPassword123!' } });

    await waitFor(() => {
      expect(screen.getByText('Password Strength:')).toBeInTheDocument();
    });
  });

  test('shows error when passwords do not match', async () => {
    renderWithProviders(
      <ChangePassword onPasswordChanged={mockOnPasswordChanged} user={mockUser} />
    );

    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'oldpassword' },
    });
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'DifferentPassword123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  test('shows error when password is too short', async () => {
    renderWithProviders(
      <ChangePassword onPasswordChanged={mockOnPasswordChanged} user={mockUser} />
    );

    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'oldpassword' },
    });
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'short' },
    });

    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 12 characters')).toBeInTheDocument();
    });
  });
});