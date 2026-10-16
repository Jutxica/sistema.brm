-- Cadastros mínimos de pessoas encontradas nas abas Religiosos por obra,
-- Fratres BRM e EXTERIOR do Elenco 2026.
-- NÃO EXECUTAR: fluxo substituído pela diretriz de aguardar os cadastros reais
-- dos religiosos pelo Portal e conciliá-los antes de montar o Elenco.
-- Não cria login nem preenche dados civis/pessoais. Não cria designações.
-- Os dois dirigentes que só aparecem em Outras instituições ficam pendentes
-- de confirmação de pertencimento ao elenco BRM.

begin;

do $$
declare
  v_total integer;
begin
  select count(*)
    into v_total
    from public.religiosos
   where id = 'dfb9ae84-b4a4-48ae-9740-f8555159a05c'
     and lower(trim(nome_civil)) = lower(trim('Djonatan Engelmann'));

  if v_total <> 1 then
    raise exception 'Esperado exatamente um cadastro do Djonatan já confirmado; encontrados: %.', v_total;
  end if;

  update public.religiosos
     set nome_elenco = 'Fr. Djonatan Engelmann',
         grau = 'Frater',
         cadastro_elenco_provisorio = true,
         status_cadastro = 'Em revisão',
         situacao_elenco = 'Ativo'
   where id = 'dfb9ae84-b4a4-48ae-9740-f8555159a05c';
end;
$$;

with elenco_pessoas (nome_elenco, grau, situacao_elenco) as (
  values
    ('D. Murilo S. Ramos Krieger', 'Diácono', 'Ativo'),
    ('Diác. Tiago Junior Waier', 'Diácono', 'Ativo'),
    ('Fr. Alexandre Johann', 'Frater', 'Ativo'),
    ('Fr. Alexandre Semkiv de Andrade Caetano', 'Frater', 'Ativo'),
    ('Fr. Artur Hang', 'Frater', 'Ativo'),
    ('Fr. Cleiton Froehner', 'Frater', 'Ativo'),
    ('Fr. Cristiano Schneider', 'Frater', 'Ativo'),
    ('Fr. Daugmar Zeitz Kraus', 'Frater', 'Ativo'),
    ('Fr. Djonatan Engelmann', 'Frater', 'Ativo'),
    ('Fr. Erik Patrik Fantini', 'Frater', 'Ativo'),
    ('Fr. Filipe José Potter', 'Frater', 'Ativo'),
    ('Fr. Geovan Luiz Alberton', 'Frater', 'Ativo'),
    ('Fr. Henrique Carvalho da Silva', 'Frater', 'Ativo'),
    ('Fr. Honaycon Gonçalves', 'Frater', 'Ativo'),
    ('Fr. Iago Mafra Cunha', 'Frater', 'Ativo'),
    ('Fr. Jeferson Adriano Caldas', 'Frater', 'Ativo'),
    ('Fr. João Pedro Dutra Walecki', 'Frater', 'Ativo'),
    ('Fr. Marcio Rech', 'Frater', 'Ativo'),
    ('Fr. Pedro Henrique Oliveira de Paula', 'Frater', 'Ativo'),
    ('Fr. Renato Schweitzer Filho', 'Frater', 'Ativo'),
    ('Fr. Ricardo Vinter', 'Frater', 'Ativo'),
    ('Fr. Thiago Hermenegildo de Faria', 'Frater', 'Ativo'),
    ('Ir. Ederson Krause', 'Irmão', 'Ativo'),
    ('Ir. Itaianan Bozza Vieira', 'Irmão', 'Ativo'),
    ('P. Ademir Wickert', 'Padre', 'Ativo'),
    ('P. Adilson José Colombi', 'Padre', 'Ativo'),
    ('P. Afonso Molinari', 'Padre', 'Ativo'),
    ('P. Airton Franzner', 'Padre', 'Ativo'),
    ('P. Alberto Luiz Huber', 'Padre', 'Ativo'),
    ('P. Alceu Weber', 'Padre', 'Ativo'),
    ('P. Aldo Cícero Lisboa', 'Padre', 'Ativo'),
    ('P. Aléssio da Rosa', 'Padre', 'Ativo'),
    ('P. Alexandre Barbosa', 'Padre', 'Ativo'),
    ('P. Alírio José Pedrini (Casa Shalom)', 'Padre', 'Ativo'),
    ('P. Anderson Carlos da Silva Viana', 'Padre', 'Ativo'),
    ('P. André Borges da Silva', 'Padre', 'Ativo'),
    ('P. Anésio Dalcastagner', 'Padre', 'Ativo'),
    ('P. Anísio José Schwirkowski', 'Padre', 'Ativo'),
    ('P. Ari João Erthal', 'Padre', 'Ativo'),
    ('P. Arildo José Ferrari', 'Padre', 'Ativo'),
    ('P. Aurélio Pereira', 'Padre', 'Ativo'),
    ('P. Bala Jojappa Kakumanu', 'Padre', 'Ativo'),
    ('P. Carlos Alberto Rodrigues', 'Padre', 'Ativo'),
    ('P. Carlos Marcos Nicolodelli', 'Padre', 'Ativo'),
    ('P. Carlos Roberto de Oliveira', 'Padre', 'Ativo'),
    ('P. Cenário Ervino Hanauer', 'Padre', 'Ativo'),
    ('P. Cezar Augusto Hammes', 'Padre', 'Ativo'),
    ('P. Cícero Celeste Murara', 'Padre', 'Ativo'),
    ('P. Cláudio Márcio Piontkewicz', 'Padre', 'Ativo'),
    ('P. Cristiano Tiago Araújo', 'Padre', 'Ativo'),
    ('P. Darlan Dejaime Marasca', 'Padre', 'Ativo'),
    ('P. Diego Martins', 'Padre', 'Ativo'),
    ('P. Diomar Romaniv', 'Padre', 'Ativo'),
    ('P. Elinton Costa', 'Padre', 'Ausente'),
    ('P. Eloi Comper', 'Padre', 'Ativo'),
    ('P. Elói José Schons', 'Padre', 'Ativo'),
    ('P. Emerson Guimarães', 'Padre', 'Ativo'),
    ('P. Fábio Luiz Pereira', 'Padre', 'Ativo'),
    ('P. Fagner Ramon Pacheco Haas', 'Padre', 'Ativo'),
    ('P. Fernando Teckler', 'Padre', 'Ativo'),
    ('P. Francisco Lawall', 'Padre', 'Ativo'),
    ('P. Galdino Becker', 'Padre', 'Ativo'),
    ('P. Geraldo Kohler', 'Padre', 'Ativo'),
    ('P. Gilberto Bonato Xavier', 'Padre', 'Ativo'),
    ('P. Gilberto Luiz R. de Miranda', 'Padre', 'Ativo'),
    ('P. Gilberto Moisés B. Mittelstaed', 'Padre', 'Ativo'),
    ('P. Giovani Pontes', 'Padre', 'Ativo'),
    ('P. Hélio Feuser', 'Padre', 'Ativo'),
    ('P. Helton Iomes', 'Padre', 'Ausente'),
    ('P. Itamar José Zigowski', 'Padre', 'Ativo'),
    ('P. Jaime Ludwig', 'Padre', 'Ativo'),
    ('P. Jair Rodrigues Costa', 'Padre', 'Ativo'),
    ('P. Jairson Hellmann', 'Padre', 'Ausente'),
    ('P. João Sebastião Boeing', 'Padre', 'Ativo'),
    ('P. João Selhorst', 'Padre', 'Ausente'),
    ('P. José Francisco Alves', 'Padre', 'Ativo'),
    ('P. José Napoleão L. dos Santos', 'Padre', 'Ativo'),
    ('P. José Ricardo Henrique Zorer', 'Padre', 'Ativo'),
    ('P. Josimar Baggio', 'Padre', 'Ativo'),
    ('P. Kleber Ferreira de Oliveira', 'Padre', 'Ativo'),
    ('P. Léo Heck', 'Padre', 'Ativo'),
    ('P. Leonardo Jacomelli', 'Padre', 'Ativo'),
    ('P. Lindolfo Neves Braga', 'Padre', 'Ativo'),
    ('P. Lucas Ignacio Scheid', 'Padre', 'Ativo'),
    ('P. Luciano José Toller', 'Padre', 'Ativo'),
    ('P. Luís Antônio Nunes da Silva', 'Padre', 'Ausente'),
    ('P. Luis Mazzochini', 'Padre', 'Ativo'),
    ('P. Luiz Antônio de Faria', 'Padre', 'Ativo'),
    ('P. Luiz Carlos Berri', 'Padre', 'Ativo'),
    ('P. Magnos José Baron Caneppele', 'Padre', 'Ativo'),
    ('P. Maicon Frasson', 'Padre', 'Ausente'),
    ('P. Marcial Maçaneiro', 'Padre', 'Ativo'),
    ('P. Márcio Antônio Auth', 'Padre', 'Ativo'),
    ('P. Marcos Antônio Bernardes', 'Padre', 'Ativo'),
    ('P. Marcos Jonizei P. de Lima', 'Padre', 'Ausente'),
    ('P. Mariano Weizenmann', 'Padre', 'Ativo'),
    ('P. Marilton Nuss', 'Padre', 'Ativo'),
    ('P. Mário Peixe', 'Padre', 'Ativo'),
    ('P. Mário Tito Angioletti', 'Padre', 'Ativo'),
    ('P. Maurídio Weber', 'Padre', 'Ausente'),
    ('P. Miguel da Silva', 'Padre', 'Ativo'),
    ('P. Moacir Pedrini', 'Padre', 'Ativo'),
    ('P. Nelson Tachini', 'Padre', 'Ativo'),
    ('P. Nilson Helmann', 'Padre', 'Ativo'),
    ('P. Nivaldo Alves de Souza', 'Padre', 'Ativo'),
    ('P. Odilo Antônio Leviski', 'Padre', 'Ativo'),
    ('P. Olindo Smaniotto', 'Padre', 'Ausente'),
    ('P. Osvaldo Rech', 'Padre', 'Ativo'),
    ('P. Paulo Eurico Krautler', 'Padre', 'Ativo'),
    ('P. Paulo Vanderlei Riffel', 'Padre', 'Ativo'),
    ('P. Pedro Nelson Brentano', 'Padre', 'Ativo'),
    ('P. Pedro Paulo Dias (BSP)', 'Padre', 'Ativo'),
    ('P. Renato José Rohr', 'Padre', 'Ativo'),
    ('P. Renato Vicente Pohl', 'Padre', 'Ativo'),
    ('P. Renato Vieira Lima', 'Padre', 'Ativo'),
    ('P. Robson Rocha da Silva', 'Padre', 'Ativo'),
    ('P. Rodrigo Bento', 'Padre', 'Ativo'),
    ('P. Rodrigo Fernando Tascheck', 'Padre', 'Ativo'),
    ('P. Rubens Rieg', 'Padre', 'Ativo'),
    ('P. Sebastião Pitz', 'Padre', 'Ativo'),
    ('P. Sérgio José Hemkemeier', 'Padre', 'Ativo'),
    ('P. Sérgio Luís da Costa', 'Padre', 'Ativo'),
    ('P. Sildo César da Costa', 'Padre', 'Ativo'),
    ('P. Silvano Borba', 'Padre', 'Ativo'),
    ('P. Silvano João da Costa', 'Padre', 'Ativo'),
    ('P. Silvino Hoepers', 'Padre', 'Ativo'),
    ('P. Simão Pedro Claudino dos Santos', 'Padre', 'Ativo'),
    ('P. Tarcísio Darrós Feldhaus', 'Padre', 'Ativo'),
    ('P. Thomas Antônio B. Mittelstaed', 'Padre', 'Ativo'),
    ('P. Vilmar Vitorino Feuser', 'Padre', 'Ativo'),
    ('P. Vilson José Comandolli', 'Padre', 'Ativo'),
    ('P. Zaqueu Suczeck', 'Padre', 'Ativo')
), inseridos as (
  insert into public.religiosos (
    nome_civil,
    nome_religioso,
    nome_elenco,
    grau,
    status,
    status_cadastro,
    origem_cadastro,
    situacao_elenco,
    cadastro_elenco_provisorio
  )
  select
    null,
    null,
    source.nome_elenco,
    source.grau,
    'Ativo',
    'Em revisão',
    'admin',
    source.situacao_elenco,
    true
  from elenco_pessoas source
  where not exists (
    select 1
      from public.religiosos existing
     where lower(trim(coalesce(existing.nome_elenco, ''))) = lower(trim(source.nome_elenco))
        or lower(trim(coalesce(existing.nome_civil, ''))) = lower(trim(source.nome_elenco))
        or lower(trim(coalesce(existing.nome_religioso, ''))) = lower(trim(source.nome_elenco))
  )
  returning id
)
select count(*) as cadastros_basicos_criados
from inseridos;

commit;
