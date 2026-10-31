const fs = require('fs');
const path = require('path');

const territorial = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'catalogo_territorial_2026.json'), 'utf8'));
const religiosos = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'religiosos_elenco_2026.json'), 'utf8'));

// Mapeamento de código local para Nome Oficial da Comunidade
const mapLocalParaComunidade = {
  'Taubaté I': 'Conventinho SCJ',
  'Bispo': 'Local Padre Gabriel Lux',
  'Rio Grande do Sul': 'Territorial São Miguel',
  'Jaraguá do Sul II': 'Local Nossa Senhora de Fátima',
  'Palmas': 'Territorial Nossa Senhora Aparecida',
  'Brusque IV': 'Local Padre Dehon',
  'Brusque I': 'Local Sagrado Coração de Jesus',
  'Rio Negrinho I': 'Local São José',
  'Corupá I': 'Local Padre Gabriel Lux',
  'Rondônia': 'Territorial de Rondônia – Nossa Senhora de Nazaré',
  'Mangueirinha': 'Territorial Nossa Senhora Aparecida',
  'Curitiba I': 'Local Santa Rita de Cássia',
  'Brusque II': 'Local São Luís Gonzaga',
  'Rio do Sul I': 'Territorial São Judas Tadeu',
  'Corupá II': 'Local Padre Gabriel Lux',
  'Vidal Ramos': 'Territorial São Judas Tadeu',
  'São Bento do Sul': 'Local Puríssimo Coração de Maria',
  'Gravatal': 'Territorial Venerável Servo de Deus Padre Aloísio Boeing',
  'Armazém': 'Territorial Venerável Servo de Deus Padre Aloísio Boeing',
  'Rio do Sul II': 'Territorial São Judas Tadeu',
  'Ausente': 'Ausente da Congregação',
  'Bethânia': 'Ausente da Congregação',
  'Jaraguá do Sul III': 'Local São Sebastião',
  'Rio Negrinho II': 'Local São José',
  'Jaraguá do Sul I': 'Local São Sebastião',
  'Paraguai': 'Missão Paraguai',
  'Roma': 'Roma — Cúria Geral / Colégio Leone Dehon',
  'Joinville': 'Local Santa Margarida Maria',
  'Curitiba II': 'Local Santa Rita de Cássia',
  'Alemanha': 'Missão Alemanha',
};

const getTipoObra = (nome) => {
  const n = nome.toLowerCase();
  if (n.includes('paróquia') || n.includes('paroquia') || n.includes('santuário') || n.includes('santuario') || n.includes('catedral')) {
    return 'Paróquia';
  }
  if (n.includes('convento') || n.includes('seminário') || n.includes('seminario') || n.includes('noviciado') || n.includes('residência') || n.includes('residencia') || n.includes('casa')) {
    return 'Casa';
  }
  return 'Obra';
};

let sql = `-- =========================================================================
-- CARGA OFICIAL DO ELENCO TERRITORIAL E RELIGIOSOS BRM 2026
-- Província Brasileira Meridional dos Sacerdotes do Sagrado Coração de Jesus
-- Arquitetura 100% Relacional: Regiões -> Comunidades -> Obras -> Confrades
-- =========================================================================

BEGIN;

-- 1. ASSEGURAR COLUNAS E RELACIONAMENTOS NO BANCO DE DADOS
ALTER TABLE public.comunidades ADD COLUMN IF NOT EXISTS regiao TEXT;
ALTER TABLE public.religiosos_obras_referencia ADD COLUMN IF NOT EXISTS comunidade_id UUID REFERENCES public.comunidades(id) ON DELETE SET NULL;
ALTER TABLE public.religiosos_obras_referencia ADD COLUMN IF NOT EXISTS pertencimento_elenco TEXT;
ALTER TABLE public.religiosos ADD COLUMN IF NOT EXISTS comunidade_atual_id UUID REFERENCES public.comunidades(id) ON DELETE SET NULL;
ALTER TABLE public.religiosos ADD COLUMN IF NOT EXISTS obra_atual_id UUID REFERENCES public.religiosos_obras_referencia(id) ON DELETE SET NULL;

-- 2. CADASTRO / ATUALIZAÇÃO DAS 16 COMUNIDADES TERRITORIAIS
`;

for (const t of territorial) {
  const comNome = t.comunidade.replace(/'/g, "''");
  const regNome = t.regiao.replace(/'/g, "''");
  sql += `
-- Atualizar comunidade existente ou inserir caso não conste
UPDATE public.comunidades
SET regiao = '${regNome}', status = 'Ativo'
WHERE nome = '${comNome}';

INSERT INTO public.comunidades (nome, regiao, status)
SELECT '${comNome}', '${regNome}', 'Ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.comunidades WHERE nome = '${comNome}'
);
`;
}

sql += `
-- 3. CADASTRO / ATUALIZAÇÃO DAS OBRAS E INSTITUIÇÕES INTEGRANTES (SEPARADAS)
`;

for (const t of territorial) {
  const comNome = t.comunidade.replace(/'/g, "''");
  for (const obra of t.obras) {
    const obraNome = obra.replace(/'/g, "''");
    const tipo = getTipoObra(obra);
    sql += `
-- Atualizar obra existente ou vincular à comunidade territorial
UPDATE public.religiosos_obras_referencia ro
SET comunidade_id = c.id,
    pertencimento_elenco = 'brm'
FROM public.comunidades c
WHERE c.nome = '${comNome}'
  AND (ro.nome = '${obraNome}' OR ro.nome ILIKE '${obraNome}');

-- Inserir se ainda não constar na tabela de obras de referência
INSERT INTO public.religiosos_obras_referencia (nome, tipo, comunidade_id, status, pertencimento_elenco)
SELECT '${obraNome}', '${tipo}', c.id, 'Ativa', 'brm'
FROM public.comunidades c
WHERE c.nome = '${comNome}'
  AND NOT EXISTS (
    SELECT 1 FROM public.religiosos_obras_referencia ro
    WHERE ro.comunidade_id = c.id AND (ro.nome = '${obraNome}' OR ro.nome ILIKE '${obraNome}')
  );
`;
  }
}

sql += `
-- 4. CARGA E PRÉ-PREENCHIMENTO DOS 123 RELIGIOSOS DA PROVÍNCIA
-- Preenche Nome Civil, Nome Elenco, Grau, Data de Nascimento, E-mail, Comunidade e Atuação
`;

for (const r of religiosos) {
  const nomeCivil = (r.nomeCivil || r.nomeCompleto).replace(/'/g, "''");
  const nomeElenco = r.nomeCompleto.replace(/'/g, "''");
  const grau = r.grau;
  const dataNasc = r.nascimento ? `'${r.nascimento}'` : 'NULL';
  const email = r.email ? `'${r.email.trim().toLowerCase()}'` : 'NULL';
  const comunidadeOficial = (mapLocalParaComunidade[r.comunidadeLocal] || r.comunidadeLocal).replace(/'/g, "''");
  const situacaoElenco = (r.comunidadeLocal === 'Ausente' || r.atuacao === 'Ausente' || r.provincia === 'APU') ? 'Ausente' : 'Ativo';

  sql += `
DO $$
DECLARE
  v_rel_id UUID;
  v_com_id UUID;
BEGIN
  -- Obter o ID relacional da comunidade
  SELECT id INTO v_com_id FROM public.comunidades WHERE nome = '${comunidadeOficial}' LIMIT 1;

  -- Verificar se já existe por nome civil ou e-mail
  SELECT id INTO v_rel_id
  FROM public.religiosos
  WHERE lower(trim(nome_civil)) = lower(trim('${nomeCivil}'))
     OR (${email} IS NOT NULL AND (lower(trim(email_institucional)) = ${email} OR lower(trim(email_pessoal)) = ${email}))
  LIMIT 1;

  IF v_rel_id IS NOT NULL THEN
    UPDATE public.religiosos
    SET nome_elenco = '${nomeElenco}',
        grau = '${grau}',
        data_nascimento = COALESCE(data_nascimento, ${dataNasc}),
        email_institucional = COALESCE(email_institucional, ${email}),
        comunidade_atual_nome = '${comunidadeOficial}',
        comunidade_atual_id = COALESCE(v_com_id, comunidade_atual_id),
        situacao_elenco = '${situacaoElenco}',
        cadastro_elenco_provisorio = true,
        updated_at = now()
    WHERE id = v_rel_id;
  ELSE
    INSERT INTO public.religiosos (
      nome_civil,
      nome_elenco,
      nome_religioso,
      grau,
      data_nascimento,
      email_institucional,
      comunidade_atual_nome,
      comunidade_atual_id,
      situacao_elenco,
      status_cadastro,
      cadastro_elenco_provisorio,
      origem_cadastro
    ) VALUES (
      '${nomeCivil}',
      '${nomeElenco}',
      '${nomeElenco}',
      '${grau}',
      ${dataNasc},
      ${email},
      '${comunidadeOficial}',
      v_com_id,
      '${situacaoElenco}',
      'Em revisão',
      true,
      'admin'
    );
  END IF;
END $$;
`;
}

sql += `
-- 5. RECONCILIAÇÃO FINAL RELACIONAL (GARANTIA DE INTEGRIDADE TOTAL)
UPDATE public.religiosos r
SET comunidade_atual_id = c.id
FROM public.comunidades c
WHERE (lower(trim(r.comunidade_atual_nome)) = lower(trim(c.nome))
   OR (c.nome = 'Conventinho SCJ' AND r.comunidade_atual_nome ILIKE '%Conventinho%')
   OR (c.nome = 'Local Padre Gabriel Lux' AND r.comunidade_atual_nome ILIKE '%Gabriel Lux%'))
  AND (r.comunidade_atual_id IS NULL OR r.comunidade_atual_id <> c.id);

COMMIT;
`;

const outputPath = path.join(__dirname, '..', 'supabase', 'CARGA_ELENCO_E_RELIGIOSOS_2026.sql');
fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`Carga SQL relacional gerada com sucesso em: ${outputPath}`);
