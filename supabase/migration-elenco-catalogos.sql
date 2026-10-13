-- Etapa 1 do Elenco: catalogo de comunidades e instituicoes.
-- Nao cria nem altera registros de religiosos.

begin;

alter table public.comunidades
  add column if not exists regiao text;

alter table public.religiosos_obras_referencia
  add column if not exists pais text not null default 'Brasil',
  add column if not exists pertencimento_elenco text not null default 'brm'
    check (pertencimento_elenco in ('brm', 'nao_brm', 'exterior', 'outra')),
  add column if not exists comunidade_id uuid references public.comunidades(id) on delete set null;

insert into public.comunidades (nome, regiao)
select source.nome, source.regiao
from (values
  ('Local Padre Gabriel Lux', 'Litoral Norte Catarinense'),
  ('Local São Sebastião', 'Litoral Norte Catarinense'),
  ('Local Nossa Senhora de Fátima', 'Litoral Norte Catarinense'),
  ('Local Santa Margarida Maria', 'Litoral Norte Catarinense'),
  ('Local Santa Rita de Cássia', 'Paraná e Planalto Norte Catarinense'),
  ('Local São José', 'Paraná e Planalto Norte Catarinense'),
  ('Territorial Nossa Senhora Aparecida', 'Paraná e Planalto Norte Catarinense'),
  ('Local Puríssimo Coração de Maria', 'Paraná e Planalto Norte Catarinense'),
  ('Local Sagrado Coração de Jesus', 'Vale do Itajaí'),
  ('Local São Luís Gonzaga', 'Vale do Itajaí'),
  ('Local Padre Dehon', 'Vale do Itajaí'),
  ('Territorial São Judas Tadeu', 'Alto Vale do Itajaí e Sul de Santa Catarina'),
  ('Territorial Venerável Servo de Deus Padre Aloísio Boeing', 'Alto Vale do Itajaí e Sul de Santa Catarina'),
  ('Territorial São Miguel', 'Rio Grande do Sul'),
  ('Territorial de Rondônia – Nossa Senhora de Nazaré', 'Rondônia')
) as source(nome, regiao)
where not exists (
  select 1
  from public.comunidades existing
  where lower(trim(existing.nome)) = lower(trim(source.nome))
);

update public.comunidades existing
set regiao = source.regiao
from (values
  ('Local Padre Gabriel Lux', 'Litoral Norte Catarinense'),
  ('Local São Sebastião', 'Litoral Norte Catarinense'),
  ('Local Nossa Senhora de Fátima', 'Litoral Norte Catarinense'),
  ('Local Santa Margarida Maria', 'Litoral Norte Catarinense'),
  ('Local Santa Rita de Cássia', 'Paraná e Planalto Norte Catarinense'),
  ('Local São José', 'Paraná e Planalto Norte Catarinense'),
  ('Territorial Nossa Senhora Aparecida', 'Paraná e Planalto Norte Catarinense'),
  ('Local Puríssimo Coração de Maria', 'Paraná e Planalto Norte Catarinense'),
  ('Local Sagrado Coração de Jesus', 'Vale do Itajaí'),
  ('Local São Luís Gonzaga', 'Vale do Itajaí'),
  ('Local Padre Dehon', 'Vale do Itajaí'),
  ('Territorial São Judas Tadeu', 'Alto Vale do Itajaí e Sul de Santa Catarina'),
  ('Territorial Venerável Servo de Deus Padre Aloísio Boeing', 'Alto Vale do Itajaí e Sul de Santa Catarina'),
  ('Territorial São Miguel', 'Rio Grande do Sul'),
  ('Territorial de Rondônia – Nossa Senhora de Nazaré', 'Rondônia')
) as source(nome, regiao)
where lower(trim(existing.nome)) = lower(trim(source.nome));

with elenco_catalogo_import (
  nome, alias_elenco, tipo, cidade, localidade, uf, pais, pertencimento_elenco, comunidade
) as (
  values
  ('Santuário Santa Rita de Cássia', 'Paróquia Santuário Santa Rita de Cássia', 'Paróquia', 'Curitiba', 'Curitiba II', 'PR', 'Brasil', 'brm', 'Local Santa Rita de Cássia'),
  ('Santuário São Judas Tadeu', 'Paróquia Santuário São Judas Tadeu', 'Paróquia', 'Curitiba', 'Curitiba III', 'PR', 'Brasil', 'brm', 'Local Santa Rita de Cássia'),
  ('Imaculada Conceição', 'Paróquia Imaculada Conceição', 'Paróquia', 'Mangueirinha', 'Mangueirinha', 'PR', 'Brasil', 'brm', 'Territorial Nossa Senhora Aparecida'),
  ('Nossa Senhora Aparecida', 'Paróquia Nossa Senhora Aparecida', 'Paróquia', 'Palmas', 'Palmas', 'PR', 'Brasil', 'brm', 'Territorial Nossa Senhora Aparecida'),
  ('Rainha dos Apóstolos', 'Paróquia Rainha dos Apóstolos', 'Paróquia', 'Ariquemes', 'Ariquemes', 'RO', 'Brasil', 'brm', 'Territorial de Rondônia – Nossa Senhora de Nazaré'),
  ('São Sebastião', 'Paróquia São Sebastião', 'Paróquia', 'Ji-Paraná', 'Ji-Paraná', 'RO', 'Brasil', 'brm', 'Territorial de Rondônia – Nossa Senhora de Nazaré'),
  ('Nossa Senhora de Nazaré', 'Paróquia Nossa Senhora de Nazaré', 'Paróquia', 'Porto Velho', 'Porto Velho', 'RO', 'Brasil', 'brm', 'Territorial de Rondônia – Nossa Senhora de Nazaré'),
  ('São José', 'Paróquia São José', 'Paróquia', 'Boa Vista do Buricá', 'Boa Vista do Buricá', 'RS', 'Brasil', 'brm', 'Territorial São Miguel'),
  ('Paróquia Sagrado Coração de Jesus', null, 'Paróquia', 'Porto Xavier', 'Porto Xavier', 'RS', 'Brasil', 'brm', 'Territorial São Miguel'),
  ('Nossa Senhora Aparecida', 'Paróquia Nossa Senhora Aparecida', 'Paróquia', 'Tuparendi', 'Tuparendi', 'RS', 'Brasil', 'brm', 'Territorial São Miguel'),
  ('São Pedro Apóstolo', 'Paróquia São Pedro Apóstolo', 'Paróquia', 'Armazém', 'Armazém', 'SC', 'Brasil', 'brm', 'Territorial Venerável Servo de Deus Padre Aloísio Boeing'),
  ('São José', 'Paróquia São José', 'Paróquia', 'Botuverá', 'Botuverá', 'SC', 'Brasil', 'brm', 'Local São Luís Gonzaga'),
  ('São Luiz Gonzaga', 'Paróquia São Luís Gonzaga', 'Paróquia', 'Brusque', 'Brusque II', 'SC', 'Brasil', 'brm', 'Local São Luís Gonzaga'),
  ('São José', 'Paróquia São José', 'Paróquia', 'Corupá', 'Corupá II', 'SC', 'Brasil', 'brm', 'Local Padre Gabriel Lux'),
  ('Santuário Sagrado Coração de Jesus', 'Paróquia Santuário Sagrado Coração de Jesus', 'Paróquia', 'Gravatal', 'Gravatal', 'SC', 'Brasil', 'brm', 'Territorial Venerável Servo de Deus Padre Aloísio Boeing'),
  ('Nossa Senhora do Perpétuo Socorro', 'Paróquia Nossa Senhora do Perpétuo Socorro', 'Paróquia', 'Guabiruba', 'Guabiruba', 'SC', 'Brasil', 'brm', 'Local São Luís Gonzaga'),
  ('São Cristóvão', 'Paróquia São Cristóvão', 'Paróquia', 'Itajaí', 'Itajaí', 'SC', 'Brasil', 'brm', 'Local São Luís Gonzaga'),
  ('Nossa Senhora das Graças', 'Paróquia Nossa Senhora das Graças', 'Paróquia', 'Jaraguá do Sul', 'Jaraguá do Sul III', 'SC', 'Brasil', 'brm', 'Local São Sebastião'),
  ('Nossa Senhora do Rosário', 'Paróquia Nossa Senhora do Rosário', 'Paróquia', 'Jaraguá do Sul', 'Nereu Ramos I', 'SC', 'Brasil', 'brm', 'Local Padre Gabriel Lux'),
  ('São Sebastião', 'Paróquia São Sebastião', 'Paróquia', 'Jaraguá do Sul', 'Jaraguá do Sul I', 'SC', 'Brasil', 'brm', 'Local São Sebastião'),
  ('Santuário Sagrado Coração de Jesus', null, 'Paróquia', 'Joinville', 'Joinville', 'SC', 'Brasil', 'brm', 'Local Santa Margarida Maria'),
  ('São João Batista', 'Paróquia Catedral São João Batista', 'Paróquia', 'Rio do Sul', 'Rio do Sul II', 'SC', 'Brasil', 'brm', 'Territorial São Judas Tadeu'),
  ('São Judas Tadeu', 'Paróquia São Judas Tadeu', 'Paróquia', 'Rio do Sul', 'Rio do Sul I', 'SC', 'Brasil', 'brm', 'Territorial São Judas Tadeu'),
  ('Santo Antônio de Pádua', 'Paróquia Santo Antônio', 'Paróquia', 'Rio Negrinho', 'Rio Negrinho II', 'SC', 'Brasil', 'brm', 'Local São José'),
  ('Puríssimo Coração de Maria', 'Paróquia Puríssimo Coração de Maria', 'Paróquia', 'São Bento do Sul', 'São Bento do Sul', 'SC', 'Brasil', 'brm', 'Local Puríssimo Coração de Maria'),
  ('São Sebastião', 'Paróquia São Sebastião', 'Paróquia', 'Vidal Ramos', 'Vidal Ramos', 'SC', 'Brasil', 'brm', 'Territorial São Judas Tadeu'),
  ('Seminário São José', null, 'Casa', 'Rio Negrinho', 'Rio Negrinho I', 'SC', 'Brasil', 'brm', 'Local São José'),
  ('Convento Sagrado Coração de Jesus', null, 'Casa', 'Brusque', 'Brusque I', 'SC', 'Brasil', 'brm', 'Local Sagrado Coração de Jesus'),
  ('Noviciado Nossa Senhora de Fátima', null, 'Casa', 'Jaraguá do Sul', 'Jaraguá do Sul II', 'SC', 'Brasil', 'brm', 'Local Nossa Senhora de Fátima'),
  ('Seminário SCJ', 'Sede Provincial – Seminário SCJ', 'Casa', 'Corupá', 'Corupá I', 'SC', 'Brasil', 'brm', 'Local Padre Gabriel Lux'),
  ('Casa Padre Dehon', null, 'Casa', 'Brusque', 'Brusque IV', 'SC', 'Brasil', 'brm', 'Local Padre Dehon'),
  ('Casa São João', null, 'Casa', 'Jaraguá do Sul', 'Jaraguá do Sul II', 'SC', 'Brasil', 'brm', 'Local Nossa Senhora de Fátima'),
  ('Residência Sagrado Coração de Jesus', null, 'Casa', 'Curitiba', 'Curitiba I', 'PR', 'Brasil', 'brm', 'Local Santa Rita de Cássia'),
  ('Secretariado Vocacional – Seminário São José', null, 'Obra', 'Rio Negrinho', 'Rio Negrinho I', 'SC', 'Brasil', 'brm', 'Local São José'),
  ('Faculdade São Luiz', null, 'Obra', 'Brusque', 'Brusque I', 'SC', 'Brasil', 'brm', 'Local Sagrado Coração de Jesus'),
  ('Colégio São Luiz', null, 'Obra', 'Brusque', 'Brusque I', 'SC', 'Brasil', 'brm', 'Local Sagrado Coração de Jesus'),
  ('Convento Sagrado Coração de Jesus (Conventinho)', null, 'Casa', 'Taubaté', 'Taubaté', 'SP', 'Brasil', 'nao_brm', null),
  ('Associação Cor Iesu', null, 'Obra', 'Corupá', 'Corupá/SC', 'SC', 'Brasil', 'outra', null),
  ('Associação Lux de Cultura e Arte', null, 'Obra', 'Corupá', 'Corupá/SC', 'SC', 'Brasil', 'outra', null),
  ('Dehon Store', null, 'Obra', 'Joinville', 'Joinville/SC', 'SC', 'Brasil', 'outra', null),
  ('Editora Cor Iesu', null, 'Obra', 'Corupá', 'Corupá/SC', 'SC', 'Brasil', 'outra', null),
  ('Instituto Padre Aloísio', null, 'Obra', 'Jaraguá do Sul', 'Jaraguá do Sul/SC', 'SC', 'Brasil', 'outra', null),
  ('Loja do Noviciado', null, 'Obra', 'Jaraguá do Sul', 'Jaraguá do Sul/SC', 'SC', 'Brasil', 'outra', null),
  ('Pousada Seminário', null, 'Obra', 'Corupá', 'Corupá/SC', 'SC', 'Brasil', 'outra', null),
  ('Sagrado Store', null, 'Obra', 'Joinville', 'Joinville/SC', 'SC', 'Brasil', 'outra', null),
  ('Unidade ESIC', null, 'Obra', 'Curitiba', 'Curitiba/PR', 'PR', 'Brasil', 'outra', null),
  ('Unidade São Luiz', null, 'Obra', 'Brusque', 'Brusque/SC', 'SC', 'Brasil', 'outra', null),
  ('Velas Seminário de Corupá', null, 'Obra', 'Corupá', 'Corupá/SC', 'SC', 'Brasil', 'outra', null),
  ('Herz-Jesu-Kloster', null, 'Obra', 'Freiburg', 'Herz-Jesu-Kloster — Freiburg', null, 'Alemanha', 'exterior', null),
  ('Missão em Angola (localidade não informada)', null, 'Obra', null, null, null, 'Angola', 'exterior', null),
  ('Buenos Aires — comunidade não especificada', null, 'Obra', 'Buenos Aires', 'Buenos Aires — comunidade não especificada', null, 'Argentina', 'exterior', null),
  ('Cúria Geral / Colégio Internacional Leone Dehon', null, 'Obra', 'Roma', 'Cúria Geral / Colégio Internacional Leone Dehon — Roma', null, 'Itália', 'exterior', null),
  ('Missão Ásia', null, 'Obra', 'Macau', 'Macau', null, 'Missão Ásia', 'exterior', null),
  ('Parroquia San Isidro Villa Madrid – Misión Corazón Jesu', null, 'Obra', 'Limpio', 'Parroquia San Isidro Villa Madrid – Misión Corazón Jesu — Limpio', null, 'Paraguai', 'exterior', null)
), atualizadas as (
  update public.religiosos_obras_referencia existing
  set tipo = source.tipo,
      localidade = source.localidade,
      uf = source.uf,
      pais = source.pais,
      pertencimento_elenco = source.pertencimento_elenco,
      comunidade_id = communities.id
  from elenco_catalogo_import source
  left join public.comunidades communities
    on lower(trim(communities.nome)) = lower(trim(source.comunidade))
  where lower(trim(existing.nome)) in (
      lower(trim(source.nome)),
      lower(trim(coalesce(source.alias_elenco, source.nome)))
    )
    and lower(trim(coalesce(existing.cidade, ''))) = lower(trim(coalesce(source.cidade, '')))
    and coalesce(existing.uf, '') = coalesce(source.uf, '')
  returning existing.id
), inseridas as (
  insert into public.religiosos_obras_referencia (
    nome, tipo, cidade, localidade, uf, pais, pertencimento_elenco, comunidade_id, status
  )
  select
    source.nome, source.tipo, source.cidade, source.localidade, source.uf, source.pais,
    source.pertencimento_elenco, communities.id, 'Ativa'
  from elenco_catalogo_import source
  left join public.comunidades communities
    on lower(trim(communities.nome)) = lower(trim(source.comunidade))
  where not exists (
    select 1
    from public.religiosos_obras_referencia existing
    where lower(trim(existing.nome)) in (
        lower(trim(source.nome)),
        lower(trim(coalesce(source.alias_elenco, source.nome)))
      )
      and lower(trim(coalesce(existing.cidade, ''))) = lower(trim(coalesce(source.cidade, '')))
      and coalesce(existing.uf, '') = coalesce(source.uf, '')
  )
  returning id
)
select
  (select count(*) from atualizadas) as instituicoes_atualizadas,
  (select count(*) from inseridas) as instituicoes_inseridas;

commit;
