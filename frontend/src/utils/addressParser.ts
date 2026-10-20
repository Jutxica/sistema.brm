export interface ParsedAddress {
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  complemento: string;
}

export function parseAddressString(str?: string | null): ParsedAddress {
  if (!str) {
    return { logradouro: '', numero: '', bairro: '', cidade: '', uf: '', cep: '', complemento: '' };
  }
  let raw = str.trim();
  let cep = '';
  const cepMatch = raw.match(/(\d{5}-?\d{3})/);
  if (cepMatch) {
    cep = cepMatch[1];
    if (cep.length === 8 && !cep.includes('-')) {
      cep = `${cep.slice(0, 5)}-${cep.slice(5)}`;
    }
  }

  let cidade = '';
  let uf = '';
  let logradouro = '';
  let numero = '';
  let bairro = '';
  let complemento = '';

  let streetPart = raw;
  let cityPart = '';

  if (raw.includes('|')) {
    const parts = raw.split('|');
    streetPart = parts[0].trim();
    cityPart = parts[1].trim();
  }

  // Parse city & UF
  if (cityPart) {
    const cityUfMatch = cityPart.match(/^([^,-]+)\s*-\s*([A-Za-z]{2})/);
    if (cityUfMatch) {
      cidade = cityUfMatch[1].trim();
      uf = cityUfMatch[2].toUpperCase().trim();
    }
  }

  // Normalize en-dash / em-dash to regular hyphen
  streetPart = streetPart.replace(/[–—]/g, '-');

  // Check if has hyphen dividing number and neighborhood: "R. Padre Dehon, 728 - Hauer"
  const dashParts = streetPart.split(/\s+-\s+/);
  if (dashParts.length > 1) {
    bairro = dashParts.slice(1).join(' - ').trim();
    streetPart = dashParts[0].trim();
  }

  // Comma parts: 'R. Padre Dehon, 728' or 'Rua Governador Trotta, 123, Centro'
  const commaParts = streetPart.split(',').map(s => s.trim()).filter(Boolean);
  if (commaParts.length >= 2) {
    logradouro = commaParts[0];
    const numMatch = commaParts[1].match(/^(\d+[a-zA-Z]?|\bS\/?N\b)/i);
    if (numMatch) {
      numero = numMatch[1];
      const rest = commaParts[1].slice(numMatch[0].length).trim();
      if (rest) complemento = rest.replace(/^[-,\s]+/, '');
    } else {
      numero = commaParts[1];
    }
    if (commaParts.length >= 3 && !bairro) {
      bairro = commaParts.slice(2).join(', ');
    }
  } else {
    logradouro = streetPart;
  }

  return { logradouro, numero, bairro, cidade, uf, cep, complemento };
}
