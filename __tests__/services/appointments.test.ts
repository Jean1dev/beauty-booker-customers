import { subscribeAppointments } from '@/services/appointments';
import type { Appointment } from '@/types/appointment';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/services/firebase', () => ({ db: {} }));

const mockOnSnapshot = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  query:      jest.fn((...args: unknown[]) => args),
  where:      jest.fn(() => ({})),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeDoc = (id: string, data: Partial<Appointment>) => ({
  id,
  data: () => data,
});

beforeEach(() => jest.clearAllMocks());

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('subscribeAppointments', () => {
  it('chama onData com lista de agendamentos mapeados', () => {
    const docs = [
      makeDoc('apt-1', { clientPhone: '11999', serviceName: 'Corte', status: 'confirmed' }),
      makeDoc('apt-2', { clientPhone: '11999', serviceName: 'Escova', status: 'pending' }),
    ];
    mockOnSnapshot.mockImplementation((_q, onNext: Function) => {
      onNext({ docs });
      return jest.fn();
    });

    const onData = jest.fn();
    subscribeAppointments('11999', onData, jest.fn());

    expect(onData).toHaveBeenCalledTimes(1);
    const result: Appointment[] = onData.mock.calls[0][0];
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'apt-1', serviceName: 'Corte' });
    expect(result[1]).toMatchObject({ id: 'apt-2', serviceName: 'Escova' });
  });

  it('chama onData com lista vazia quando não há agendamentos', () => {
    mockOnSnapshot.mockImplementation((_q, onNext: Function) => {
      onNext({ docs: [] });
      return jest.fn();
    });

    const onData = jest.fn();
    subscribeAppointments('11999', onData, jest.fn());

    expect(onData).toHaveBeenCalledWith([]);
  });

  it('inclui o id do documento em cada agendamento', () => {
    const docs = [makeDoc('doc-xyz', { serviceName: 'Manicure' })];
    mockOnSnapshot.mockImplementation((_q, onNext: Function) => {
      onNext({ docs });
      return jest.fn();
    });

    const onData = jest.fn();
    subscribeAppointments('11999', onData, jest.fn());

    expect(onData.mock.calls[0][0][0].id).toBe('doc-xyz');
  });

  it('chama onError quando o listener falha', () => {
    const firebaseError = new Error('Firestore unavailable');
    mockOnSnapshot.mockImplementation((_q, _onNext: Function, onError: Function) => {
      onError(firebaseError);
      return jest.fn();
    });

    const onError = jest.fn();
    subscribeAppointments('11999', jest.fn(), onError);

    expect(onError).toHaveBeenCalledWith(firebaseError);
  });

  it('retorna função de cancelamento (unsubscribe)', () => {
    const unsubscribeMock = jest.fn();
    mockOnSnapshot.mockReturnValue(unsubscribeMock);

    const unsubscribe = subscribeAppointments('11999', jest.fn(), jest.fn());

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it('filtra por clientPhone correto', () => {
    const { where } = jest.requireMock('firebase/firestore');
    mockOnSnapshot.mockImplementation((_q, onNext: Function) => {
      onNext({ docs: [] });
      return jest.fn();
    });

    subscribeAppointments('11888776655', jest.fn(), jest.fn());

    expect(where).toHaveBeenCalledWith('clientPhone', '==', '11888776655');
  });
});
