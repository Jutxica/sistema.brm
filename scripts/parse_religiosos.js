const fs = require('fs');
const path = require('path');

const raw = `PROVÍNCIA,SIGLA,NOME,NASCIMENTO,E-MAIL,COMUNIDADE,ATUAÇÃO
BRM,Diac,Diácono Tiago Junior Waier,1995-11-09,tiagowaier7@gmail.com,Taubaté I,Configuração
BRM,Bispo,Dom Murilo Sebastião Ramos Krieger,1943-09-19,dom.murilo@brm.org.br,Bispo,Bispo
BRM,Frater,Frater Alexandre Johann,1991-02-05,alexandre.johann@brm.org.br,Rio Grande do Sul,Tirocínio
BRM,Frater,Frater Alexandre Semkiv de A. Caetano,1998-11-12,ale12caetano@gmail.com,Jaraguá do Sul II,Tirocínio
BRM,Frater,Frater Artur Hang,2001-02-14,artur.hangs@gmail.com,Palmas,Tirocínio
BRM,Frater,Frater Cleiton Froehner,1991-12-17,cleiton.froehner@icloud.com,Brusque IV,Tirocínio
BRM,Frater,Frater Cristiano Schneider,1990-02-26,cristianosch26@gmail.com,Brusque I,Tirocínio
BRM,Frater,Frater Daugmar Zeitz Kraus,1999-10-07,daugmar_kraus@brm.org.br,Brusque IV,Casa Dehon
BRM,Frater,Frater Djonatan Engelmann,1992-05-12,djonatan.engelmann@brm.org.br,Taubaté I,configuração
BRM,Frater,Frater Erik Patrik Fantini,1996-03-20,erikpatrik02@gmail.com,Taubaté I,configuração
BRM,Frater,Frater Filipe José Potter,2003-09-17,filipe.potter1709@gmail.com,Rio Negrinho I,Tirocínio
BRM,Frater,Frater Geovan Luiz Alberton,1998-09-11,geovanalbertao@gmail.com,Rio Negrinho I,Tirocínio
BRM,Frater,Frater Henrique Carvalho da Silva ,2003-04-04,henrique_silva@brm.org.br,Palmas,Tirocínio
BRM,Frater,Frater Honaycon Gonçalves,1994-11-30,honaycon@brm.org.br,Taubaté I,configuração
BRM,Frater,Frater Iago Mafra Cunha,1998-03-25,iagomafracunha@outlook.com,Corupá I,Tirocínio
BRM,Frater,Frater Jeferson Adriano Caldas,1987-03-26,phnjefer@gmail.com,Taubaté I,configuração
BRM,Frater,Frater João Pedro Dutra Walecki,2002-06-30,joaopedro_scj@brm.org.br,Jaraguá do Sul II,Tirocínio
BRM,Frater,Frater Márcio Rech,1984-01-16,marciorech84@gmail.com,Taubaté I,configuração
BRM,Frater,Frater Pedro Henrique Oliveira de Paula,2000-08-17,pedroh03@hotmail.com,Rondônia,Tirocínio
BRM,Frater,Frater Renato Schweitzer Filho ,2001-01-21,renatosf_scj@brm.org.br,Rondônia,Tirocínio
BRM,Frater,Frater Ricardo Vinter,1992-12-04,ricardo.vinter@gmail.com,Taubaté I,configuração
BRM,Frater,Frater Thiago Hermenegildo de Faria,1987-09-15,thf.scj@gmail.com,Taubaté I,configuração
BRM,Irmão,Irmão Ederson Krause,1987-01-19,ederson.krause@hotmail.com,Jaraguá do Sul II,Casa São João
BRM,Irmão,Irmão Itaianan Bazza Vieira,1985-11-11,itaianan@gmail.com,Mangueirinha,Pastoral
BRM,Padre,Padre Ademir Wickert,1975-01-06,ademir.wickert@gmail.com,Curitiba I,Pastoral
BRM,Padre,Padre Adilson José Colombi,1942-07-15,colombiadilson@gmail.com,Brusque II,Pastoral
BRM,Padre,Padre Afonso Molinari,1972-02-16,afmolinari@yahoo.com.br,Rio do Sul I,Pastoral
BRM,Padre,Padre Airton Franzner,1955-04-23,airtonscj@hotmail.com,Corupá II,Pastoral
BRM,Padre,Padre Alberto Luiz Huber,1946-09-16,albertoluizhuber@gmail.com,Jaraguá do Sul II,Casa São João
BRM,Padre,Padre Alceu Luiz Weber,1959-09-09,alceuluizweber@gmail.com,Vidal Ramos,Pastoral
BRM,Padre,Padre Aldo Cícero Lisboa,1984-04-09,aldocicerolisboa@gmail.com,Rio Grande do Sul,Pastoral
BRM,Padre,Padre Aléssio da Rosa,1974-03-28,alessiosc@gmail.com,Brusque I,Educacional
BRM,Padre,Padre Alexandre Barbosa,1986-05-15,ale_barbosa01@hotmail.com,Mangueirinha,Pastoral
BRM,Padre,Padre Alírio José Pedrini,1938-03-24,padrealirio@gmail.com,Corupá II,Pastoral
BRM,Padre,Padre Anderson Carlos S. Viana,1991-09-01,anderson_csv@hotmail.com,São Bento do Sul,Pastoral
BRM,Padre,Padre André Borges da Silva,1980-02-29,abstche@gmail.com,Gravatal,Pastoral
BRM,Padre,Padre Anésio Dalcastagner,1968-05-01,dalcastagner@icloud.com,Armazém,Pastoral
BRM,Padre,Padre Anísio José Schwirkowski,1971-09-30,anisioscj@yahoo.com.br,Brusque IV,Casa Dehon
BRM,Padre,Padre Ari João Erthal,1971-12-17,ari.erthal@gmail.com,Rio do Sul II,Pastoral
APU,Padre,Padre Arildo José Ferrari,1971-11-24,padrearildo@gmail.com,Ausente,Argentina
BRM,Padre,Padre Aurélio Pereira,1961-01-22,aurelioguarani@gmail.com,Jaraguá do Sul III,Pastoral
BRM,Padre,Padre Bala Jojappa Kakumanu,1983-10-22,kbjojappascj@yahoo.co.in,Palmas,Pastoral
BRM,Padre,Padre Carlos Alberto Rodrigues,1966-11-28,betoscj@gmail.com,Rio Negrinho II,Pastoral
BRM,Padre,Padre Carlos Marcos Nicolodelli,1949-10-12,nicolodelli7@gmail.com,Jaraguá do Sul I,Pastoral
APU,Padre,Padre Carlos Roberto de Oliveira,1980-11-27,carlosrobertoscj@yahoo.com,Ausente,Argentina
BRM,Padre,Padre Cenário Ervino Hanauer,1950-12-16,,Rio Grande do Sul,Pastoral
BRM,Padre,Padre Cezar Augusto Hammes,1971-06-19,frcezar@hotmail.com,Paraguai,Missão
BRM,Padre,Padre Cícero Celeste Murara,1971-09-08,cicero.murara@esic.br,Corupá I,Governo
BRM,Padre,Padre Cláudio Márcio Piontkewicz,1972-12-01,claudinhoscj@gmail.com,Brusque II,Pastoral
BRM,Padre,Padre Cristiano Tiago Araújo,1986-05-12,padretiagoscj@gmail.com,Brusque I,Formação
BRM,Padre,Padre Darlan Dejaime Marasca,1989-01-17,d.marasca@yahoo.com.br,Roma,Estudante
BRM,Padre,Padre Diego Martins,1988-05-21,diego_scj@hotmail.com,Rondônia,Pastoral
BRM,Padre,Padre Diomar Romaniv,1983-05-27,diomarscj@hotmail.com,Brusque II,Pastoral
BRM,Padre,Padre Elinton Costa,1984-01-05,,Bethânia,Ausente
BRM,Padre,Padre Elói Comper,1956-05-04,eloiscj@gmail.com,Corupá I,Residente
BRM,Padre,Padre Elói José Schons,1953-12-11,eloijschons@gmail.com,Rio Grande do Sul,Pastoral
BRM,Padre,Padre Emerson Guimarães,1972-10-29,emer_guima@hotmail.com,Rio Negrinho II,Pastoral
BRM,Padre,Padre Fábio Luiz Pereira,1986-09-26,fabioluizscj@gmail.com,Jaraguá do Sul II,Formação
BRM,Padre,Padre Fagner Ramon Pacheco Haas,1992-08-25,pachecoscj@gmail.com,Rondônia,Missão
BRM,Padre,Padre Fernando Teckler,1995-06-27,fernandoteckler@gmail.com,Brusque I,Formação
BRM,Padre,Padre Francisco Lawall ,1964-01-12,franclawal@gmail.com,Rio do Sul I,Pastoral
BRM,Padre,Padre Galdino Becker,1931-07-24,galdino.becker@brm.org.br,Rio Grande do Sul,Pastoral
BRM,Padre,Padre Geraldo Kohler,1952-01-08,pgkohler@hotmail.com,Joinville,Pastoral
BRM,Padre,Padre Gilberto Bonato Xavier,1961-12-08,bonatoscj@gmail.com,Rondônia,Missão
BRM,Padre,Padre Gilberto Luiz R. de Miranda,1968-06-28,giba.luiz@yahoo.com.br,Rio Grande do Sul,Pastoral
BRM,Padre,Padre Gilberto Moisés Bohn Mittelstead,1978-04-26,mittelstaed6@gmail.com,Rio Negrinho I,Formação
BRM,Padre,Padre Giovani Pontes,1963-12-20,gio_pontes@yahoo.com.br,Curitiba II,Pastoral
BRM,Padre,Padre Hélio Feuser,1966-11-30,heliofeuser@yahoo.com.br,Brusque II,Pastoral
BRM,Padre,Padre Itamar José Zigowski,1967-09-02,peitajose@yahoo.com.br,Curitiba II,Pastoral
BRM,Padre,Padre Jaime Ludwig,1981-12-14,scjjaimeludwig@gmail.com,Brusque II,Pastoral-Educacional
BRM,Padre,Padre Jair Rodrigues Costa,1953-08-29,jair.costa@brm.org.br,Corupá II,Pastoral
BRM,Padre,Padre João Sebastião Boeing,1953-05-17,joao.boeing@brm.org.br,Corupá I,Residente
BRM,Padre,Padre José Francisco Alves,1947-12-25,jfa.scj@gmail.com,Curitiba I,Residente
BRM,Padre,Padre José Napoleão Laureano dos Santos,1952-10-14,penapoleaoscj@gmail.com,Jaraguá do Sul I,Pastoral
BRM,Padre,Padre José Ricardo H. Zorer,1996-04-30,josezscj@gmail.com,Rio Negrinho I,Formação
BRM,Padre,Padre Josimar Baggio,1986-08-23,josimarscj@yahoo.com.br,Roma,Estudante
BRM,Padre,Padre Kleber Ferreira de Oliveira ,1963-08-30,kleberscjsul@gmail.com,Jaraguá do Sul I,Pastoral
BRM,Padre,Padre Léo Heck,1953-10-26,pleoscj@hotmail.com,Jaraguá do Sul III,Pastoral
BRM,Padre,Padre Leonardo Jacomelli,1995-07-20,jacomelli10@hotmail.com,Taubaté I,configuração
BRM,Padre,Padre Lindolfo Neves Braga,1964-07-27,lindolfoneves@hotmail.com,Brusque II,Pastoral
BRM,Padre,Padre Lucas Ignacio Scheid,1939-11-14,pelucas.scheid@hotmail.com,Brusque I,Formação
BRM,Padre,Padre Luciano José Toller,1977-09-10,ltollerscj@yahoo.com.br,São Bento do Sul,Pastoral
BRM,Padre,Padre Luiz Antônio de Faria ,1953-03-21,pluizfaria@yahoo.com.br,Brusque II,Pastoral
BRM,Padre,Padre Luiz Carlos Berri,1958-04-18,lcberri@outlook.com,Brusque I,Educacional
BRM,Padre,Padre Luiz Mazzochini,1980-12-26,luisscj@gmail.com,Rondônia,Missão
BRM,Padre,Padre Magnos José Baron Caneppele,1980-04-24,mjbcaneppele@yahoo.com.br,Rondônia,Missão
BRM,Padre,Padre Marcial Maçaneiro,1966-07-16,marcialscj@gmail.com,Curitiba I,Residente
BRM,Padre,Padre Márcio Antônio Auth,1976-06-03,marcio.auth@scj.de,Alemanha,Missão
BRM,Padre,Padre Marcos Antônio Bernardes,1989-06-03,marcos.pdh@gmail.com,Jaraguá do Sul I,Pastoral
BRM,Padre,Padre Mariano Weizenmann,1956-03-24,marianoscj@yahoo.com.br,Gravatal,Pastoral
BRM,Padre,Padre Marilton Nuss,1968-12-09,mariltonn@gmail.com,Brusque II,Pastoral
BRM,Padre,Padre Mário Peixe,1946-01-07,pemariopeixe@gmail.com,Brusque II,Pastoral
BRM,Padre,Padre Mário Tito Angioletti ,1967-02-13,mariotitoscj@yahoo.com.br,Joinville,Pastoral
BRM,Padre,Padre Maurídio Weber,1955-02-27,mauridio.weber@hotmail.com,Ausente,Ausente
BRM,Padre,Padre Miguel da Silva ,1974-02-13,miguel.silva@unifebe.edu.br,Rio Negrinho I,Formação
BRM,Padre,Padre Nelson Tachini ,1946-01-02,penelsonscj@gmail.com,São Bento do Sul,Pastoral
BRM,Padre,Padre Nilson Hellmann,1981-03-02,nilsonscj@hotmail.com,Curitiba II,Pastoral
BRM,Padre,Padre Nivaldo Alves de Souza,1946-11-10,nivas247@gmail.com,Brusque IV,Casa Dehon
BRM,Padre,Padre Odilo Antônio Leviski,1945-03-07,odilo.leviski@outlook.com,São Bento do Sul,Pastoral
BRM,Padre,Padre Olindo Smaniotto,1959-08-14,olindo59@hotmail.com,Rio Grande do Sul,Pastoral
BRM,Padre,Padre Osvaldo Rech,1952-12-07,osvaldorech@gmail.com,Jaraguá do Sul II,Casa São João
BRM,Padre,Padre Paulo Eurico Krautler,1949-09-30,padreeuricoscj@hotmail.com,Jaraguá do Sul I,Casa São João
BRM,Padre,Padre Paulo Vanderlei Riffel,1970-01-17,pepauloscj@hotmail.com,Rio do Sul II,Pastoral
BRM,Padre,Padre Pedro Nelson Brentano,1949-07-15,pe.pedro.nelson@gmail.com,Rio Negrinho I,Formação
BRM,Padre,Padre Renato José Rohr,1947-07-11,rohrrenatoj@gmail.com,Rio Grande do Sul,Pastoral
BRM,Padre,Padre Renato Vicente Polh,1983-10-26,renatoscj@yahoo.com.br,Palmas,Pastoral
BRM,Padre,Padre Renato Vieira Lima,1994-04-17,renatolimascj@gmail.com,Corupá I,Governo
BRM,Padre,Padre Robson Rocha da Silva,1968-10-06,robsonrochascj@gmail.com,Mangueirinha,Pastoral
BRM,Padre,Padre Rodrigo Bento,1987-11-23,bentoscj@gmail.com,Roma,Estudante
BRM,Padre,Padre Rodrigo Fernando Tascheck,1989-12-26,rodrigotascheck@icloud.com,Brusque II,Pastoral
BRM,Padre,Padre Rubens Rieg,1975-02-20,rubensrieg@gmail.com,Jaraguá do Sul II,Formação
BRM,Padre,Padre Sebastião Pitz ,1952-06-05,sebpitz@yahoo.com,Joinville,Pastoral
BRM,Padre,Padre Sérgio Luís da Costa,1969-06-07,sergiodacosta0@gmail.com,Jaraguá do Sul II,Formação
BRM,Padre,Padre Sildo César da Costa,1970-12-10,,Corupá I,Governo
BRM,Padre,Padre Silvano Borba,1977-03-10,silvano.borba@yahoo.com.br,Curitiba I,Educacional
BRM,Padre,Padre Silvano João da Costa,1975-08-23,silvano.costa8@gmail.com,Brusque I,Educacional
BRM,Padre,Padre Silvino Hoepers,1948-01-10,silvino.hoepers@brm.org.br,Brusque II,Pastoral
BRM,Padre,Padre Simão Pedro C. dos Santos,1970-10-28,simao.santos@brm.org.br,Corupá I,Residente
BRM,Padre,Padre Tarcísio Darrós Feldhaus,1966-01-25,tarcisio.feldhaus@scj.de,Alemanha,Missão
BRM,Padre,Padre Thomas Antônio B. Mittelstaed,1987-07-28,thomas_mdj@hotmail.com,Rio Grande do Sul,Pastoral
BRM,Padre,Padre Vilmar Vitorino Feuser,1954-12-15,,Armazém,Pastoral
BRM,Padre,Padre Vilson José Comandolli,1958-03-25,vilsonjcomandolli@hotmail.com,Corupá II,Pastoral
BRM,Padre,Padre Zaqueu Suczeck,1985-09-23,zaqueuscj@gmail.com,Armazém,Pastoral`;

const lines = raw.split('\n').slice(1);
const list = [];

function parseGrau(sigla, nome) {
  if (sigla === 'Bispo' || nome.startsWith('Dom ')) return 'Bispo';
  if (sigla === 'Diac' || nome.startsWith('Diácono ')) return 'Diácono';
  if (sigla === 'Frater' || nome.startsWith('Frater ')) return 'Frater';
  if (sigla === 'Irmão' || nome.startsWith('Irmão ')) return 'Irmão';
  return 'Padre';
}

function extrairNomeCivil(nomeCompleto) {
  return nomeCompleto
    .replace(/^Dom\s+/, '')
    .replace(/^Diácono\s+/, '')
    .replace(/^Frater\s+/, '')
    .replace(/^Irmão\s+/, '')
    .replace(/^Padre\s+/, '')
    .trim();
}

for (const line of lines) {
  if (!line.trim()) continue;
  const parts = line.split(',');
  const provincia = parts[0]?.trim();
  const sigla = parts[1]?.trim();
  const nomeCompleto = parts[2]?.trim();
  const nascimento = parts[3]?.trim();
  const email = parts[4]?.trim();
  const comunidadeLocal = parts[5]?.trim();
  const atuacao = parts[6]?.trim();

  const grau = parseGrau(sigla, nomeCompleto);
  const nomeCivil = extrairNomeCivil(nomeCompleto);

  list.push({
    provincia,
    grau,
    nomeCompleto,
    nomeCivil,
    nascimento: nascimento || null,
    email: email || null,
    comunidadeLocal,
    atuacao,
  });
}

fs.writeFileSync(
  path.join(__dirname, 'data', 'religiosos_elenco_2026.json'),
  JSON.stringify(list, null, 2),
  'utf8'
);

console.log(`Salvo religiosos_elenco_2026.json com ${list.length} religiosos.`);
