import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import SetupPhoneScreen from '@/app/setup-phone';
import { useAuthStore } from '@/store/authStore';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUpdatePhone = jest.fn();
const mockSignOut     = jest.fn();

jest.mock('@/services/customers', () => ({
  updateCustomerPhone: (...args: unknown[]) => mockUpdatePhone(...args),
}));

jest.mock('@/platform/auth', () => ({
  signOut: () => mockSignOut(),
}));

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
}));

jest.mock('@/services/firebase', () => ({ db: {}, auth: {}, storage: {} }));

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_PHONE = '(11) 99988-7766'; // 11 dígitos com máscara

function makeFirestoreError(code: string): Error {
  return Object.assign(new Error(`Firestore: ${code}`), { code });
}

function renderScreen() {
  return render(<SetupPhoneScreen />);
}

function typePhone(getByPlaceholderText: ReturnType<typeof render>['getByPlaceholderText'], value: string) {
  const input = getByPlaceholderText('(11) 99999-9999');
  fireEvent.changeText(input, value);
  return input;
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user:    { uid: 'user-abc', email: 'test@example.com', displayName: 'Test', photoURL: null },
    profile: null,
    loading: false,
  });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SetupPhoneScreen — salvamento com sucesso', () => {
  it('chama updateCustomerPhone com os dígitos corretos', async () => {
    const updatedProfile = {
      uid: 'user-abc', name: 'Test', email: 'test@example.com',
      photoUrl: '', phone: '11999887766', createdAt: 0,
    };
    mockUpdatePhone.mockResolvedValue(updatedProfile);

    const { getByPlaceholderText, getByText } = renderScreen();
    typePhone(getByPlaceholderText, VALID_PHONE);
    fireEvent.press(getByText('Confirmar'));

    await waitFor(() => expect(mockUpdatePhone).toHaveBeenCalledWith('user-abc', '11999887766'));
  });

  it('atualiza profile no store após salvar', async () => {
    const updatedProfile = {
      uid: 'user-abc', name: 'Test', email: 'test@example.com',
      photoUrl: '', phone: '11999887766', createdAt: 0,
    };
    mockUpdatePhone.mockResolvedValue(updatedProfile);

    const { getByPlaceholderText, getByText } = renderScreen();
    typePhone(getByPlaceholderText, VALID_PHONE);
    fireEvent.press(getByText('Confirmar'));

    await waitFor(() =>
      expect(useAuthStore.getState().profile?.phone).toBe('11999887766'),
    );
  });
});

describe('SetupPhoneScreen — erros de autenticação (regressão bug iPhone)', () => {
  it('limpa user e profile do store quando recebe permission-denied', async () => {
    mockUpdatePhone.mockRejectedValue(makeFirestoreError('permission-denied'));
    mockSignOut.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = renderScreen();
    typePhone(getByPlaceholderText, VALID_PHONE);
    fireEvent.press(getByText('Confirmar'));

    await waitFor(() => {
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().profile).toBeNull();
    });
  });

  it('chama signOut quando recebe permission-denied', async () => {
    mockUpdatePhone.mockRejectedValue(makeFirestoreError('permission-denied'));
    mockSignOut.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = renderScreen();
    typePhone(getByPlaceholderText, VALID_PHONE);
    fireEvent.press(getByText('Confirmar'));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
  });

  it('limpa user e profile do store quando recebe unauthenticated', async () => {
    mockUpdatePhone.mockRejectedValue(makeFirestoreError('unauthenticated'));
    mockSignOut.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = renderScreen();
    typePhone(getByPlaceholderText, VALID_PHONE);
    fireEvent.press(getByText('Confirmar'));

    await waitFor(() => {
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().profile).toBeNull();
    });
  });

  it('chama signOut quando recebe unauthenticated', async () => {
    mockUpdatePhone.mockRejectedValue(makeFirestoreError('unauthenticated'));
    mockSignOut.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = renderScreen();
    typePhone(getByPlaceholderText, VALID_PHONE);
    fireEvent.press(getByText('Confirmar'));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
  });

  it('NÃO chama signOut em erro genérico — exibe mensagem ao usuário', async () => {
    mockUpdatePhone.mockRejectedValue(new Error('Network request failed'));

    const { getByPlaceholderText, getByText } = renderScreen();
    typePhone(getByPlaceholderText, VALID_PHONE);
    fireEvent.press(getByText('Confirmar'));

    await waitFor(() =>
      expect(getByText('Não foi possível salvar. Tente novamente.')).toBeTruthy(),
    );
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('NÃO chama signOut em erro de rede — exibe mensagem ao usuário', async () => {
    mockUpdatePhone.mockRejectedValue(makeFirestoreError('unavailable'));

    const { getByPlaceholderText, getByText } = renderScreen();
    typePhone(getByPlaceholderText, VALID_PHONE);
    fireEvent.press(getByText('Confirmar'));

    await waitFor(() =>
      expect(getByText('Sem conexão. Verifique sua internet e tente novamente.')).toBeTruthy(),
    );
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});

describe('SetupPhoneScreen — validação de telefone', () => {
  it('não chama updateCustomerPhone com número inválido', async () => {
    const { getByPlaceholderText, getByText } = renderScreen();
    typePhone(getByPlaceholderText, '(11) 1234');
    fireEvent.press(getByText('Confirmar'));

    await waitFor(() => expect(mockUpdatePhone).not.toHaveBeenCalled());
  });

  it('não chama updateCustomerPhone sem user no store', async () => {
    useAuthStore.setState({ user: null, profile: null, loading: false });

    const { getByPlaceholderText, getByText } = renderScreen();
    typePhone(getByPlaceholderText, VALID_PHONE);
    fireEvent.press(getByText('Confirmar'));

    await waitFor(() => expect(mockUpdatePhone).not.toHaveBeenCalled());
  });
});
