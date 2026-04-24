import { ensureCustomerDoc, updateCustomerPhone } from '@/services/customers';
import type { AuthUser } from '@/platform/auth';
import type { CustomerProfile } from '@/types/customer';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/services/firebase', () => ({ db: {} }));

const mockGetDoc    = jest.fn();
const mockSetDoc    = jest.fn();
const mockDocRef    = { path: 'customers/user-123' };

jest.mock('firebase/firestore', () => ({
  doc:     jest.fn(() => mockDocRef),
  getDoc:  () => mockGetDoc(),
  setDoc:  (...args: unknown[]) => mockSetDoc(...args),
  deleteDoc: jest.fn(),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockAuthUser: AuthUser = {
  uid:         'user-123',
  email:       'ana@example.com',
  displayName: 'Ana Lima',
  photoURL:    'https://example.com/photo.jpg',
};

const existingProfile: CustomerProfile = {
  uid:       'user-123',
  name:      'Ana Lima',
  email:     'ana@example.com',
  photoUrl:  'https://example.com/photo.jpg',
  phone:     '11999887766',
  createdAt: 1700000000000,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => jest.clearAllMocks());

describe('ensureCustomerDoc', () => {
  it('retorna perfil existente sem criar novo documento', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => existingProfile });

    const result = await ensureCustomerDoc(mockAuthUser);

    expect(result).toEqual(existingProfile);
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('cria documento quando cliente não existe', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await ensureCustomerDoc(mockAuthUser);

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [, profileArg] = mockSetDoc.mock.calls[0];
    expect(profileArg.uid).toBe('user-123');
    expect(profileArg.email).toBe('ana@example.com');
    expect(profileArg.name).toBe('Ana Lima');
    expect(profileArg.phone).toBeNull();
  });

  it('retorna o perfil construído quando cria documento novo', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    const result = await ensureCustomerDoc(mockAuthUser);

    expect(result.uid).toBe('user-123');
    expect(result.phone).toBeNull();
    expect(typeof result.createdAt).toBe('number');
  });

  it('usa displayName vazio quando authUser não tem nome', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await ensureCustomerDoc({ ...mockAuthUser, displayName: null });

    const [, profileArg] = mockSetDoc.mock.calls[0];
    expect(profileArg.name).toBe('');
  });

  it('usa email vazio quando authUser não tem email', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await ensureCustomerDoc({ ...mockAuthUser, email: null });

    const [, profileArg] = mockSetDoc.mock.calls[0];
    expect(profileArg.email).toBe('');
  });
});

describe('updateCustomerPhone', () => {
  it('chama setDoc com merge para gravar o telefone', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ ...existingProfile, phone: '11888776655' }),
    });

    await updateCustomerPhone('user-123', '11888776655');

    expect(mockSetDoc).toHaveBeenCalledWith(
      mockDocRef,
      { phone: '11888776655', uid: 'user-123' },
      { merge: true },
    );
  });

  it('retorna perfil atualizado após setDoc', async () => {
    const updatedProfile = { ...existingProfile, phone: '11888776655' };
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => updatedProfile });

    const result = await updateCustomerPhone('user-123', '11888776655');

    expect(result.phone).toBe('11888776655');
  });

  it('lança erro quando documento não existe após gravação', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await expect(updateCustomerPhone('user-123', '11999')).rejects.toThrow(
      'Customer document missing after phone update',
    );
  });
});
