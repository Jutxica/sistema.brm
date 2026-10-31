const fs = require('fs');
const path = require('path');

const territorialRaw = `Região,Comunidade,Nº obras,Obras / instituições integrantes
Litoral Norte Catarinense,Local Padre Gabriel Lux,3,Sede Provincial – Seminário SCJ | Paróquia São José | Paróquia Nossa Senhora do Rosário
,Local São Sebastião,2,Paróquia São Sebastião | Paróquia Nossa Senhora das Graças
,Local Nossa Senhora de Fátima,2,Noviciado Nossa Senhora de Fátima | Casa São João
,Local Santa Margarida Maria,1,Santuário Sagrado Coração de Jesus
Paraná e Planalto Norte Catarinense,Local Santa Rita de Cássia,3,Residência Sagrado Coração de Jesus | Paróquia Santuário Santa Rita de Cássia | Paróquia Santuário São Judas Tadeu
,Local São José,3,Seminário São José | Secretariado Vocacional – Seminário São José | Paróquia Santo Antônio
,Territorial Nossa Senhora Aparecida,2,Paróquia Nossa Senhora Aparecida | Paróquia Imaculada Conceição
,Local Puríssimo Coração de Maria,1,Paróquia Puríssimo Coração de Maria
Vale do Itajaí,Local Sagrado Coração de Jesus,3,Convento Sagrado Coração de Jesus | Faculdade São Luiz | Colégio São Luiz
,Local São Luís Gonzaga,4,Paróquia São Luís Gonzaga | Paróquia São José | Paróquia Nossa Senhora do Perpétuo Socorro | Paróquia São Cristóvão
,Local Padre Dehon,1,Casa Padre Dehon
Alto Vale do Itajaí e Sul de Santa Catarina,Territorial São Judas Tadeu,3,Paróquia São Judas Tadeu | Paróquia Catedral São João Batista | Paróquia São Sebastião
,Territorial Venerável Servo de Deus Padre Aloísio Boeing,2,Paróquia São Pedro Apóstolo | Paróquia Santuário Sagrado Coração de Jesus
Rio Grande do Sul,Territorial São Miguel,3,Paróquia São José | Paróquia Nossa Senhora Aparecida | Paróquia Sagrado Coração de Jesus
Rondônia,Territorial de Rondônia – Nossa Senhora de Nazaré,3,Paróquia Nossa Senhora de Nazaré | Paróquia Rainha dos Apóstolos | Paróquia São Sebastião
Taubaté,Conventinho SCJ,1,Conventinho SCJ`;

const lines = territorialRaw.split('\n').slice(1);
const territorial = [];
let currentRegiao = '';

for (const line of lines) {
  if (!line.trim()) continue;
  const parts = line.split(',');
  const regiao = parts[0]?.trim();
  const comunidade = parts[1]?.trim();
  const numObras = parseInt(parts[2]?.trim() || '0', 10);
  const obrasStr = parts.slice(3).join(',').trim();

  if (regiao) currentRegiao = regiao;

  const obras = obrasStr.split('|').map(o => o.trim()).filter(Boolean);

  territorial.push({
    regiao: currentRegiao,
    comunidade,
    numObras,
    obras,
  });
}

fs.writeFileSync(
  path.join(__dirname, 'data', 'catalogo_territorial_2026.json'),
  JSON.stringify(territorial, null, 2),
  'utf8'
);

console.log(`Salvo catalogo_territorial_2026.json com ${territorial.length} comunidades.`);
