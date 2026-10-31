const fs = require('fs');
const path = require('path');

const religiosos = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'religiosos_elenco_2026.json'), 'utf8'));

let csv = 'Grau,Nome Completo,E-mail de Login,Data de Nascimento,Senha Provisoria Inicial,Status de Acesso\n';

for (const r of religiosos) {
  let senha = 'Sem data';
  if (r.nascimento) {
    const [ano, mes, dia] = r.nascimento.split('-');
    senha = `brm@${dia}${mes}${ano}`;
  }
  const email = r.email ? r.email.trim() : 'SEM E-MAIL CADASTRADO';
  const status = !r.email ? 'Pendente de e-mail' : 'Ativo';

  csv += `"${r.grau}","${r.nomeCompleto}","${email}","${r.nascimento || ''}","${senha}","${status}"\n`;
}

const outputPath = path.join(__dirname, 'data', 'credenciais_provisorias_religiosos_2026.csv');
fs.writeFileSync(outputPath, csv, 'utf8');
console.log(`Relatório de credenciais gerado em: ${outputPath}`);
