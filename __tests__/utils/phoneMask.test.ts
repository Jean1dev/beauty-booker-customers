import { maskPhone, rawDigits } from '@/utils/phoneMask';

describe('maskPhone', () => {
  it('retorna vazio para string vazia', () => {
    expect(maskPhone('')).toBe('');
  });

  it('formata apenas DDD (2 dígitos)', () => {
    expect(maskPhone('11')).toBe('(11');
  });

  it('formata DDD + início do número (3 dígitos)', () => {
    expect(maskPhone('119')).toBe('(11) 9');
  });

  it('formata DDD + número parcial sem hífen (7 dígitos)', () => {
    expect(maskPhone('1199988')).toBe('(11) 99988');
  });

  it('formata número de celular completo (11 dígitos)', () => {
    expect(maskPhone('11999887766')).toBe('(11) 99988-7766');
  });

  it('formata número fixo completo (10 dígitos)', () => {
    expect(maskPhone('1133334444')).toBe('(11) 33334-444');
  });

  it('ignora caracteres não-numéricos na entrada', () => {
    expect(maskPhone('(11) 99988-7766')).toBe('(11) 99988-7766');
  });

  it('trunca entrada com mais de 11 dígitos', () => {
    expect(maskPhone('119998877661234')).toBe('(11) 99988-7766');
  });

  it('processa apenas dígitos em string mista', () => {
    expect(maskPhone('abc11def999887766ghi')).toBe('(11) 99988-7766');
  });
});

describe('rawDigits', () => {
  it('retorna vazio para string vazia', () => {
    expect(rawDigits('')).toBe('');
  });

  it('remove parênteses, espaços e hífen da máscara', () => {
    expect(rawDigits('(11) 99988-7766')).toBe('11999887766');
  });

  it('preserva string já limpa', () => {
    expect(rawDigits('11999887766')).toBe('11999887766');
  });

  it('remove todos os não-dígitos', () => {
    expect(rawDigits('abc123def456')).toBe('123456');
  });

  it('retorna vazio para string sem dígitos', () => {
    expect(rawDigits('abc!@#')).toBe('');
  });
});
