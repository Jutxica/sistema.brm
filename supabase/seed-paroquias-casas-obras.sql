-- =============================================================
-- IMPORTAÇÃO DAS PARÓQUIAS, CASAS E OBRAS DO ARQUIVO "Paróquias e Obras - Site 2026"
-- =============================================================
-- Execute no Supabase SQL Editor.
-- Mantém o nome da instituição, localidade, UF, contatos e redes sociais.
-- Evita duplicidade por (nome, localidade, uf).

alter table public.religiosos_obras_referencia
  add column if not exists tipo text,
  add column if not exists localidade text,
  add column if not exists uf text,
  add column if not exists diocese text,
  add column if not exists fundacao date,
  add column if not exists assumida_pelos_dehonianos date,
  add column if not exists endereco text,
  add column if not exists instagram text,
  add column if not exists facebook text,
  add column if not exists youtube text,
  add column if not exists site text;

update public.religiosos_obras_referencia
set
  tipo = coalesce(tipo, 'Paróquia'),
  localidade = coalesce(localidade, cidade),
  uf = coalesce(uf, estado)
where tipo is null or localidade is null or uf is null;

insert into public.religiosos_obras_referencia (
  nome,
  tipo,
  cidade,
  localidade,
  uf,
  email,
  telefone,
  diocese,
  fundacao,
  assumida_pelos_dehonianos,
  endereco,
  instagram,
  facebook,
  youtube,
  site,
  status
)
values
  ('Santuário Santa Rita de Cássia', 'Paróquia', 'Curitiba', 'Curitiba', 'PR', 'contato@santuariosantaritadecassia.com.br', '41 3276-2075', 'Arquidiocese de Curitiba', '1960-05-22', NULL, 'R. Padre Dehon, 728 - Hauer | Curitiba-PR, 81630-090', 'https://www.instagram.com/santaritacuritiba', 'https://www.facebook.com/santaritacuritiba', 'https://www.youtube.com/@tvdasrosas', 'https://www.santuariosantaritadecassia.com.br/', 'Ativa'),
  ('Santuário São Judas Tadeu', 'Paróquia', 'Curitiba', 'Curitiba', 'PR', 'santuariosjtadeu@gmail.com', '41 3276-4021', 'Arquidiocese de Curitiba', '2010-03-01', NULL, 'R. Carlos de Laet, 2495 - Hauer | Curitiba-PR, 81650-040', 'https://www.instagram.com/saojudascuritiba/', 'https://www.facebook.com/SaoJudasCuritiba/', 'https://www.youtube.com/@santuariosaojudastadeu-hau4636', '', 'Ativa'),
  ('Imaculada Conceição', 'Paróquia', 'Mangueirinha', 'Mangueirinha', 'PR', 'paroquiamang@hotmail.com', '46 3243-1226', 'Diocese de Palmas-Francisco Beltrão', '1971-12-08', NULL, 'Rua Governador Trotta, 123, Centro | Mangueirinha-PR, 85540-000', 'https://www.instagram.com/imaculadaconceicaomangueirinha/', 'https://www.facebook.com/imaculaconceicaomangueirinha', 'https://www.youtube.com/@paroquiaimaculada33', '', 'Ativa'),
  ('Nossa Senhora Aparecida', 'Paróquia', 'Palmas', 'Palmas', 'PR', 'aparecidapalmas@live.com', '46 3263-1334', 'Diocese de Palmas-Francisco Beltrão', '2012-03-03', NULL, 'Av. Pres Getúlio Vargas, 20 - Lagoão | Palmas-PR, 85692-432', 'https://www.instagram.com/paroquiaaparecidapalmas/', 'https://www.facebook.com/nsapalmas', '', '', 'Ativa'),
  ('Rainha dos Apóstolos', 'Paróquia', 'Ariquemes', 'Ariquemes', 'RO', 'paroquiarainhadosapostolos@hotmail.com', '69 3536-0481', 'Arquidiocese de Porto Velho', '2012-03-03', NULL, 'R. Distrito Federal, 3784 - Setor 5 | Ariquemes-RO, 76870-690', 'https://www.instagram.com/rainhadosapostolosparoquia/', 'https://web.facebook.com/rainhadosapostolosparoquia/', 'https://www.youtube.com/@paroquiarainhadosapostolosro', '', 'Ativa'),
  ('São Sebastião', 'Paróquia', 'Ji-Paraná', 'Ji-Paraná', 'RO', 'paroquiasaosebastiaojipa@gmail.com', '69 3416-4220', 'Diocese de Ji-Paraná', '1984-11-28', NULL, 'Rua das Pedras, 265 - Jardim dos Migrantes | Ji-Paraná-RO, 76900-722', 'https://www.instagram.com/pascomsaosebastiaojipa/', 'https://web.facebook.com/pascomcssoficial/', 'https://www.youtube.com/@ParoquiaSaoSebastiaojipa', '', 'Ativa'),
  ('Nossa Senhora de Nazaré', 'Paróquia', 'Porto Velho', 'Porto Velho', 'RO', 'administrativo@paroquiansnazare.org', '69 3227- 0163', 'Arquidiocese de Porto Velho', '2010-02-12', NULL, 'R. Pau Ferro, 650 - Eldorado | Porto Velho-RO, 76811-666', 'https://www.instagram.com/paroquianazare_/', 'https://web.facebook.com/p/Paróquia-Nossa-Senhora-de-Nazaré-Porto-Velho-61556544278325/', 'https://www.youtube.com/@paroquianossasenhoradenaza474', '', 'Ativa'),
  ('São José', 'Paróquia', 'Boa Vista do Buricá', 'Boa Vista do Buricá', 'RS', 'paroquiasaojosebvb@yahoo.com.br', '55 3538-1290', 'Diocese de Santo Ângelo', '1940-12-15', NULL, 'Av. São José, 805 - Centro | Boa Vista do Buricá-RS, 98918-000', 'https://www.instagram.com/paroquiasaojosebvb/', 'https://web.facebook.com/BVBsaojoseParoquia/', 'https://www.youtube.com/@ParóquiaSãoJosé-BVB', '', 'Ativa'),
  ('Paróquia Sagrado Coração de Jesus', 'Paróquia', 'Porto Xavier', 'Porto Xavier', 'RS', 'scjpx@hotmail.com', '55 3354-1066', 'Diocese de Santo Ângelo', '1964-01-26', NULL, 'Rua Júlio de Castilhos, 635 - Centro | Porto Xavier-RS, 98995-000', 'https://www.instagram.com/pascomsagcoracaodejesus', 'https://web.facebook.com/p/Pascom-Porto-Xavier-100008254681626/', '', '', 'Ativa'),
  ('Nossa Senhora Aparecida', 'Paróquia', 'Tuparendi', 'Tuparendi', 'RS', 'paroquia.aparecidatup@gmail.com', '55 3543-1179', 'Diocese de Santo Ângelo', '1963-04-09', NULL, 'Avenida Uruguai, 2149 - Centro | Tuparendi-RS, 98940-000', 'https://www.instagram.com/aparecida.1963/', 'https://web.facebook.com/aparecidatuparendi', 'https://www.youtube.com/@paroquiatuparendi', '', 'Ativa'),
  ('São Pedro Apóstolo', 'Paróquia', 'Armazém', 'Armazém', 'SC', 'paroquiasp@yahoo.com.br', '48 3645-0142', 'Diocese de Tubarão', '1940-12-21', NULL, 'Praça Dois Corações, 80 - Centro | Armazém-SC, 88740-000', 'https://www.instagram.com/paroquiasaopedroazm/', 'https://web.facebook.com/igrejasaopedroapostolo/', 'https://www.youtube.com/@paroquiasaopedroapostoloaz3611', '', 'Ativa'),
  ('São José', 'Paróquia', 'Botuverá', 'Botuverá', 'SC', 'saojosepbotuvera@gmail.com', '47 3359-1142', 'Arquidiocese de Florianópolis', '1912-12-26', NULL, 'Rua Padre Carlos Enderlin, 215 – Centro | Botuverá-SC, 88370-000', 'https://www.instagram.com/paroquiasaojosebotuvera/', 'https://www.facebook.com/paroquia.sao.jose.249798/', 'https://www.youtube.com/@ParoquiaSãoJoséBotuverá', '', 'Ativa'),
  ('São Luiz Gonzaga', 'Paróquia', 'Brusque', 'Brusque', 'SC', 'secretaria@paroquiasaoluisgonzaga.com', '47 3351-1258', 'Arquidiocese de Florianópolis', '1904-10-04', NULL, 'R. Padre Gatone, 75 - Centro 1 | Brusque-SC, 88350-350', 'https://www.instagram.com/matrizsaoluisgonzaga/', 'https://www.facebook.com/matrizsaoluisgonzaga/', 'https://www.youtube.com/@paroquiasaoluisgonzaga-bru1666', 'https://www.paroquiasaoluisgonzaga.com/', 'Ativa'),
  ('São José', 'Paróquia', 'Corupá', 'Corupá', 'SC', 'psec11@arquijoinville.com.br', '47 3375-1166', 'Arquidiocese de Joinville', '1928-03-19', NULL, 'R. Padre Vicente Schmitz, 116 - Centro | Corupá-SC, 89278-000', 'https://www.instagram.com/paroquiasaojose.corupa/', 'https://www.facebook.com/paroquiasaojosecorupa/#', '', '', 'Ativa'),
  ('Santuário Sagrado Coração de Jesus', 'Paróquia', 'Gravatal', 'Gravatal', 'SC', 'p.gravatal@diocesetb.org.br', '48 3642-2121', 'Diocese de Tubarão', '1966-01-30', NULL, 'R. Otacílio C. Duarte, 118-166 | Gravatal-SC, 88735-000', 'https://www.instagram.com/santuarioscj.gravatal/', 'https://web.facebook.com/santuariogravatal/', 'https://www.youtube.com/@santuarioscj.gravatal', 'https://www.psscj.org.br/', 'Ativa'),
  ('Nossa Senhora do Perpétuo Socorro', 'Paróquia', 'Guabiruba', 'Guabiruba', 'SC', 'igrejaguabiruba@gmail.com', '47 3354-0115', 'Arquidiocese de Florianópolis', '1963-03-19', NULL, 'Rua Brusque, 09 - Centro | Guabiruba-SC, 88360-000', 'https://www.instagram.com/paroquia.guabiruba/', 'https://www.facebook.com/NossaSenhoradoPerpetuoSocorroGuabiruba', 'https://www.youtube.com/@paroquia.guabiruba', 'https://paroquiaguabiruba.org.br/', 'Ativa'),
  ('São Cristóvão', 'Paróquia', 'Itajaí', 'Itajaí', 'SC', 'secretaria@paroquiasaocristovao.com', '47 3341-1408', 'Arquidiocese de Florianópolis', '2011-01-29', NULL, 'Rua Odílio García, 456 - Cordeiros | Itajaí-SC, 88310-180', 'https://www.instagram.com/paroquiasaocristovaoitj/', 'https://www.facebook.com/paroquiasaocristovaoitj', 'https://www.youtube.com/@paroquiasaocristovaoitj', 'https://www.paroquiasaocristovao.com/', 'Ativa'),
  ('Nossa Senhora das Graças', 'Paróquia', 'Jaraguá do Sul', 'Jaraguá do Sul', 'SC', 'riocerro@diocesejoinville.com.br', '47 3376-1931', 'Arquidiocese de Joinville', '2004-01-01', NULL, 'R. Ângelo Rubini, 1256 - Barra do Rio Cerro | Jaraguá do Sul-SC, 89260-155', 'https://www.instagram.com/paroquia.nsg.jaragua/', 'https://www.facebook.com/paroquia.nsg.jaragua', 'https://www.youtube.com/@paroquia.nsg.jaragua', '', 'Ativa'),
  ('Nossa Senhora do Rosário', 'Paróquia', 'Jaraguá do Sul', 'Jaraguá do Sul', 'SC', 'psec63@arquijoinville.com.br', '47 3276-1002', 'Arquidiocese de Joinville', '1952-08-15', NULL, 'R. Pioneiro Luiz Sarti, 1397 - Nereu Ramos | Jaraguá do Sul-SC, 89265-500 ', 'https://www.instagram.com/paroquia.n.sra.rosario_oficial/', 'https://www.facebook.com/paroquianossasenhoradorosarionereuramos', '', '', 'Ativa'),
  ('São Sebastião', 'Paróquia', 'Jaraguá do Sul', 'Jaraguá do Sul', 'SC', 'psec15@diocesejoinville.com.br', '47 3371-0321', 'Arquidiocese de Joinville', '1912-07-31', NULL, 'Av. Mal. Deodoro da Fonseca, 632 - Centro | Jaraguá do Sul-SC, 89251-700', 'https://www.instagram.com/matrizsaosebastiao/', 'https://www.facebook.com/matrizsaosebastiao', 'https://www.youtube.com/@paroquiasaosebastiaoscj-pa21', 'https://www.paroquiasaosebastiaoscj.com.br/', 'Ativa'),
  ('Santuário Sagrado Coração de Jesus', 'Paróquia', 'Joinville', 'Joinville', 'SC', 'comunicacao@santuarioscj.com.br', '47 3455-2204', 'Arquidiocese de Joinville', '1917-05-04', NULL, 'Rua Inácio Bastos, 308 - Bucarein | Joinville-SC, 89202-310', 'https://www.instagram.com/santuarioscj/', 'https://www.facebook.com/santuarioscj', 'https://www.youtube.com/@santuarioscj8092', 'https://santuarioscj.com.br/', 'Ativa'),
  ('São João Batista', 'Paróquia', 'Rio do Sul', 'Rio do Sul', 'SC', 'contato@catedralderiodosul.com.br', '47 3521-0769', 'Diocese de Rio do Sul', '2014-02-16', NULL, 'Rua São João, 154 - Centro | Rio do Sul-SC, 89160-147', 'https://www.instagram.com/catedralderiodosul/', 'https://www.facebook.com/catedralderiodosul/', 'https://www.youtube.com/@catedralderiodosul', 'https://catedralderiodosul.com.br/', 'Ativa'),
  ('São Judas Tadeu', 'Paróquia', 'Rio do Sul', 'Rio do Sul', 'SC', 'paroquiasjt@softhouse.com.br', '47 3522-0866', 'Diocese de Rio do Sul', '2008-02-02', NULL, 'R. Ana Nery, 500 - Santana | Rio do Sul-SC, 89160-000', '', 'https://www.facebook.com/Paroquiasaojudasriodosul/', '', '', 'Ativa'),
  ('Santo Antônio de Pádua', 'Paróquia', 'Rio Negrinho', 'Rio Negrinho', 'SC', 'psec19@diocesejoinville.com.br', '47 3644-2081', 'Arquidiocese de Joinville', '1944-01-01', NULL, 'R. Luís Scholz, 175 - Centro | Rio Negrinho-SC, 89295-000', 'https://www.instagram.com/santoantoniorionegrinhosc/', 'https://www.facebook.com/santoantoniorionegrinhosc', 'https://www.youtube.com/@santoantoniorionegrinhosc', '', 'Ativa'),
  ('Puríssimo Coração de Maria', 'Paróquia', 'São Bento do Sul', 'São Bento do Sul', 'SC', 'psec20@diocesejoinville.com.br', '47 3633-5057', 'Arquidiocese de Joinville', '1904-10-04', NULL, 'Rua Capitão Ernesto Nunes, 220 - Centro | São Bento do Sul-SC, 89280-361', 'https://www.instagram.com/purissimocoracaodemaria/', 'https://www.facebook.com/PurissimoCoracaodeMariaSbs/', 'https://www.youtube.com/@paroquiapurissimocoracaode9887', '', 'Ativa'),
  ('São Sebastião', 'Paróquia', 'Vidal Ramos', 'Vidal Ramos', 'SC', 'paroquiass@gmail.com', '47 3356-1134', 'Diocese de Rio do Sul', '1951-01-20', NULL, 'Rua Leoberto Leal, 216 - Centro | Vidal Ramos-SC, 88443-000', 'https://www.instagram.com/paroquiavidalramos/', 'https://www.facebook.com/paroquiavidalramos', '', '', 'Ativa'),
  ('Seminário São José', 'Casa', 'Rio Negrinho', 'Rio Negrinho', 'SC', 'seminariosaojose@brm.org.br', '47 3644-2099', '', '1949-03-20', NULL, 'Rua do Seminário, 245 - Centro | Rio Negrinho-SC, 89295-121', 'https://www.instagram.com/seminariosj/', 'https://web.facebook.com/seminariosj', '', '', 'Ativa'),
  ('Convento Sagrado Coração de Jesus', 'Casa', 'Brusque', 'Brusque', 'SC', 'cscj@brm.org.br', '47 3351-1404', '', '1924-06-03', NULL, 'R. Padre Leon Dehon, 50 - Centro | Brusque-SC, 88350-365', 'https://www.instagram.com/conventoscj/', 'https://web.facebook.com/conventosagradocoracaodejesus/', 'https://www.youtube.com/@ConventoSagradoCoracaodeJesus', '', 'Ativa'),
  ('Noviciado Nossa Senhora de Fátima', 'Casa', 'Jaraguá do Sul', 'Jaraguá do Sul', 'SC', 'noviciado.nsf@gmail.com', '47 3376-0559', '', '1956-02-11', NULL, 'R. Padre Aloísio Boeing, 742 - Barra do Rio Cerro | Jaraguá do Sul-SC, 89260-200', 'https://www.instagram.com/noviciadofatima/', 'https://web.facebook.com/noviciadofatima/', 'https://www.youtube.com/@noviciadofatima', '', 'Ativa'),
  ('Seminário SCJ', 'Obra', 'Corupá', 'Corupá', 'SC', 'gerenteseminario@gmail.com', '47 3375-1194', '', '1932-01-17', NULL, 'Rua Padre Gabriel Lux, 900, Seminário | Corupá-SC, 89278-000', 'https://www.instagram.com/seminario.scj/', 'https://web.facebook.com/seminarioscj/', '', '', 'Ativa'),
  ('Casa Padre Dehon', 'Obra', 'Brusque', 'Brusque', 'SC', 'cpdehon@yahoo.com.br', '47 3351-1906', '', '1982-08-02', NULL, 'R. Gilberto Comandolli, 100 - São Luiz | Brusque-SC, 88351-001', 'https://www.instagram.com/casapadredehon/', 'https://web.facebook.com/casapadredehon/', '', '', 'Ativa')
on conflict (nome, localidade, uf) do update
set
  tipo = excluded.tipo,
  cidade = excluded.cidade,
  localidade = excluded.localidade,
  uf = excluded.uf,
  email = excluded.email,
  telefone = excluded.telefone,
  diocese = excluded.diocese,
  fundacao = excluded.fundacao,
  assumida_pelos_dehonianos = excluded.assumida_pelos_dehonianos,
  endereco = excluded.endereco,
  instagram = excluded.instagram,
  facebook = excluded.facebook,
  youtube = excluded.youtube,
  site = excluded.site,
  status = excluded.status,
  updated_at = now();

-- =============================================================
-- FIM
-- =============================================================
