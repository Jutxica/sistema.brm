export interface CepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
}

interface ViaCepResponse extends CepAddress {
  erro?: boolean;
}

export const lookupCep = async (cep: string, signal?: AbortSignal): Promise<CepAddress> => {
  const digits = cep.replace(/\D/g, '');
  if (!/^\d{8}$/.test(digits)) {
    throw new Error('Informe um CEP válido com 8 dígitos.');
  }

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal });
  if (!response.ok) {
    throw new Error('Não foi possível consultar o CEP agora.');
  }

  const result = await response.json() as ViaCepResponse;
  if (result.erro) {
    throw new Error('CEP não encontrado. Confira os números informados.');
  }

  return {
    cep: result.cep,
    logradouro: result.logradouro || '',
    complemento: result.complemento || '',
    bairro: result.bairro || '',
    localidade: result.localidade || '',
    uf: result.uf || '',
  };
};

export const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};
