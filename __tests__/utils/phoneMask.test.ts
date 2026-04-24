import { isValidBRPhone, maskPhone, rawDigits } from '@/utils/phoneMask';

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

  it('formata DDD + número parcial de celular sem hífen (até 7 dígitos)', () => {
    expect(maskPhone('1199')).toBe('(11) 99');
    expect(maskPhone('11999')).toBe('(11) 999');
    expect(maskPhone('119999')).toBe('(11) 9999');
    expect(maskPhone('1199999')).toBe('(11) 99999');
  });

  it('insere hífen no celular após 5 dígitos do número (8+ dígitos no total)', () => {
    expect(maskPhone('11999998')).toBe('(11) 99999-8');
    expect(maskPhone('119999988')).toBe('(11) 99999-88');
    expect(maskPhone('1199999887')).toBe('(11) 99999-887');
  });

  it('formata DDD + número parcial de fixo sem hífen (até 6 dígitos)', () => {
    expect(maskPhone('113333')).toBe('(11) 3333');
  });

  it('insere hífen no fixo após 4 dígitos do número (7+ dígitos no total)', () => {
    expect(maskPhone('1133334')).toBe('(11) 3333-4');
    expect(maskPhone('113333444')).toBe('(11) 3333-444');
  });

  it('formata número fixo completo (10 dígitos) no padrão (XX) XXXX-XXXX', () => {
    expect(maskPhone('1133334444')).toBe('(11) 3333-4444');
  });

  it('formata número de celular completo (11 dígitos)', () => {
    expect(maskPhone('11999887766')).toBe('(11) 99988-7766');
  });

  it('ignora caracteres não-numéricos na entrada', () => {
    expect(maskPhone('(11) 99988-7766')).toBe('(11) 99988-7766');
  });

  it('trunca entrada com mais de 11 dígitos sem prefixo BR', () => {
    expect(maskPhone('119998877661234')).toBe('(11) 99988-7766');
  });

  it('remove prefixo +55 ao colar número internacional de celular', () => {
    expect(maskPhone('+55 11 99988-7766')).toBe('(11) 99988-7766');
  });

  it('remove prefixo 55 ao colar número internacional de fixo', () => {
    expect(maskPhone('551133334444')).toBe('(11) 3333-4444');
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

describe('isValidBRPhone', () => {
  it('aceita celular com 11 dígitos começando com 9', () => {
    expect(isValidBRPhone('11999887766')).toBe(true);
  });

  it('aceita fixo com 10 dígitos', () => {
    expect(isValidBRPhone('1133334444')).toBe(true);
  });

  it('rejeita números com menos de 10 dígitos', () => {
    expect(isValidBRPhone('119998877')).toBe(false);
  });

  it('rejeita números com mais de 11 dígitos', () => {
    expect(isValidBRPhone('119998877661')).toBe(false);
  });

  it('rejeita DDD inválido (menor que 11)', () => {
    expect(isValidBRPhone('1099887766')).toBe(false);
  });

  it('rejeita celular de 11 dígitos que não começa com 9', () => {
    expect(isValidBRPhone('11899887766')).toBe(false);
  });

  it('rejeita números repetidos (ex.: 0000000000)', () => {
    expect(isValidBRPhone('1111111111')).toBe(false);
  });
});
