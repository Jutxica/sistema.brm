// Dados semente e catálogo padrão de variáveis para formulários e atos da Secretaria Provincial BRM
import type { VariavelCampo } from '../components/FormularioTimbrado';
import type { FormularioSecretaria, RespostaFormulario, ConfiguracaoSecretaria } from '../types/secretaria';

export const LOCAL_STORAGE_FORMULARIOS = 'brm_secretaria_formularios_v1';
export const LOCAL_STORAGE_CONFIG = 'brm_secretaria_configuracoes_v1';
export const LOCAL_STORAGE_RESPOSTAS = 'brm_secretaria_respostas_v1';

export const CATALOGO_VARIAVEIS_PADRAO: VariavelCampo[] = [
  // 1. Identificação
  { id: 'nome_completo', label: 'Nome Civil Completo', categoria: 'Identificação', obrigatorio: true, tipo: 'text', placeholder: 'Nome civil de registro' },
  { id: 'nome_religioso', label: 'Nome Religioso / Tratamento', categoria: 'Identificação', obrigatorio: true, tipo: 'text', placeholder: 'Pe. João dehoniano, Fr. Antônio...' },
  { id: 'grau_ordem', label: 'Grau / Vínculo Canônico', categoria: 'Identificação', obrigatorio: true, tipo: 'select', opcoes: ['Bispo', 'Presbítero', 'Diácono', 'Frater (Votos Temporários)', 'Frater (Votos Perpétuos)', 'Irmão Religioso', 'Noviço', 'Postulante', 'Outro'] },
  { id: 'comunidade_atual', label: 'Comunidade Atual / Residência', categoria: 'Identificação', obrigatorio: true, tipo: 'text', placeholder: 'Ex: Seminário SCJ de Corupá ou Casa Padre Dehon' },
  { id: 'cargo_funcao', label: 'Cargo ou Ofício Atual', categoria: 'Identificação', obrigatorio: false, tipo: 'text', placeholder: 'Ex: Pároco, Vigário, Formador, Ecônomo, Superior Local' },
  { id: 'cpf', label: 'CPF do Religioso', categoria: 'Identificação', obrigatorio: false, tipo: 'text', placeholder: '000.000.000-00' },
  { id: 'rg', label: 'Documento de Identidade (RG)', categoria: 'Identificação', obrigatorio: false, tipo: 'text', placeholder: 'Número do RG e órgão emissor' },
  { id: 'data_nascimento', label: 'Data de Nascimento', categoria: 'Identificação', obrigatorio: false, tipo: 'date' },

  // 2. Contato & Emergência
  { id: 'email', label: 'E-mail Principal', categoria: 'Contato', obrigatorio: true, tipo: 'email', placeholder: 'confrade@dehonianos.org.br' },
  { id: 'telefone_whatsapp', label: 'Telefone Celular / WhatsApp', categoria: 'Contato', obrigatorio: true, tipo: 'tel', placeholder: '(00) 00000-0000' },
  { id: 'contato_emergencia', label: 'Nome do Contato de Emergência', categoria: 'Contato', obrigatorio: false, tipo: 'text', placeholder: 'Familiar ou confrade responsável' },
  { id: 'telefone_emergencia', label: 'Telefone de Emergência', categoria: 'Contato', obrigatorio: false, tipo: 'tel', placeholder: '(00) 00000-0000' },

  // 3. Acolhida & Hospedagem
  { id: 'necessita_hospedagem', label: 'Necessita de Hospedagem / Quarto', categoria: 'Acolhida & Hospedagem', obrigatorio: true, tipo: 'boolean', ajuda: 'Marque Sim se você pernoitará na casa do encontro.' },
  { id: 'tipo_quarto', label: 'Preferência de Acomodação', categoria: 'Acolhida & Hospedagem', obrigatorio: false, tipo: 'select', opcoes: ['Quarto Individual (se disponível)', 'Quarto Duplo / Compartilhado', 'Sem preferência'] },
  { id: 'data_chegada', label: 'Data Prevista de Chegada', categoria: 'Acolhida & Hospedagem', obrigatorio: false, tipo: 'date' },
  { id: 'horario_chegada', label: 'Horário Previsto de Chegada', categoria: 'Acolhida & Hospedagem', obrigatorio: false, tipo: 'text', placeholder: 'Ex: 14:30 ou Manhã' },
  { id: 'data_saida', label: 'Data Prevista de Partida', categoria: 'Acolhida & Hospedagem', obrigatorio: false, tipo: 'date' },
  { id: 'meio_transporte', label: 'Meio de Transporte Utilizado', categoria: 'Acolhida & Hospedagem', obrigatorio: false, tipo: 'select', opcoes: ['Carro próprio da paróquia/obra', 'Carona com outros confrades', 'Ônibus rodoviário', 'Transporte Aéreo (necessita traslado)', 'Outro'] },

  // 4. Saúde & Alimentação
  { id: 'restricao_alimentar', label: 'Restrição Alimentar ou Alergia', categoria: 'Saúde & Alimentação', obrigatorio: false, tipo: 'text', placeholder: 'Ex: Intolerante a lactose, celíaco, vegetariano, diabético...' },
  { id: 'necessidade_acessibilidade', label: 'Necessidade Especial de Acessibilidade', categoria: 'Saúde & Alimentação', obrigatorio: false, tipo: 'text', placeholder: 'Ex: Dificuldade de locomoção em escadas, quarto térreo...' },
  { id: 'observacoes_medicas', label: 'Observações Médicas Relevantes', categoria: 'Saúde & Alimentação', obrigatorio: false, tipo: 'textarea', placeholder: 'Uso contínuo de medicação ou cuidados especiais' },

  // 5. Liturgia & Participação
  { id: 'tamanho_paramento', label: 'Tamanho de Paramento / Túnica', categoria: 'Liturgia & Geral', obrigatorio: false, tipo: 'select', opcoes: ['P', 'M', 'G', 'GG', 'Tamanho Especial'] },
  { id: 'intencao_celebracao', label: 'Intenção Particular de Missa', categoria: 'Liturgia & Geral', obrigatorio: false, tipo: 'text', placeholder: 'Intenção comemorativa ou súplica' },
  { id: 'disponibilidade_servico', label: 'Disponibilidade para Serviços Litúrgicos', categoria: 'Liturgia & Geral', obrigatorio: false, tipo: 'select', opcoes: ['Canto / Animação', 'Leituras / Salmo', 'Serviço do Altar', 'Acolhida e Credenciamento', 'O que for necessário'] },
  { id: 'observacoes_gerais', label: 'Observações Finais / Mensagem', categoria: 'Liturgia & Geral', obrigatorio: false, tipo: 'textarea', placeholder: 'Espaço aberto para esclarecimentos à Secretaria Provincial' }
];

export const SEED_FORMULARIOS: FormularioSecretaria[] = [
  {
    id: 'form-retiro-presbiteros-2026',
    codigo: 'FORM-2026/001',
    titulo: 'Inscrição para o Retiro Provincial dos Presbíteros 2026 (Turma I)',
    descricao: 'Formulário canônico de inscrição para hospedagem, paramentação e logística do Retiro Anual na Casa Padre Dehon (Brusque/SC).',
    evento_id: 'evt-1',
    ativo: true,
    limite_vagas: 60,
    prazo_encerramento: '2026-03-05',
    mensagem_sucesso: 'Inscrição recebida pela Secretaria Provincial. A hospedaria já foi comunicada de sua chegada.',
    total_respostas: 18,
    created_at: '2026-01-15T10:00:00Z',
    campos: CATALOGO_VARIAVEIS_PADRAO.filter(c => [
      'nome_completo', 'nome_religioso', 'grau_ordem', 'comunidade_atual', 
      'email', 'telefone_whatsapp', 'necessita_hospedagem', 'tipo_quarto', 
      'data_chegada', 'data_saida', 'meio_transporte', 'restricao_alimentar', 
      'tamanho_paramento', 'observacoes_gerais'
    ].includes(c.id)).map(c => ({
      ...c,
      obrigatorio: ['nome_completo', 'nome_religioso', 'comunidade_atual', 'email', 'telefone_whatsapp', 'necessita_hospedagem'].includes(c.id)
    }))
  },
  {
    id: 'form-assembleia-provincial-2026',
    codigo: 'FORM-2026/002',
    titulo: 'Confirmação de Presença na Assembleia Provincial Ordinária 2026',
    descricao: 'Confirmação obrigatória de participação com definição de transporte e alojamento no Seminário São José (Rio Negrinho/SC).',
    evento_id: 'evt-6',
    ativo: true,
    limite_vagas: 120,
    prazo_encerramento: '2026-09-20',
    mensagem_sucesso: 'Sua confirmação para a Assembleia Provincial 2026 foi registrada na Secretaria dos Atos.',
    total_respostas: 42,
    created_at: '2026-01-20T14:30:00Z',
    campos: CATALOGO_VARIAVEIS_PADRAO.filter(c => [
      'nome_completo', 'nome_religioso', 'grau_ordem', 'comunidade_atual', 'cargo_funcao',
      'email', 'telefone_whatsapp', 'necessita_hospedagem', 'tipo_quarto', 'meio_transporte',
      'restricao_alimentar', 'necessidade_acessibilidade', 'disponibilidade_servico', 'observacoes_gerais'
    ].includes(c.id)).map(c => ({
      ...c,
      obrigatorio: ['nome_completo', 'nome_religioso', 'comunidade_atual', 'email', 'telefone_whatsapp'].includes(c.id)
    }))
  },
  {
    id: 'form-encontro-fratres-2026',
    codigo: 'FORM-2026/003',
    titulo: 'Ficha de Inscrição - Encontro dos Fratres da Configuração',
    descricao: 'Encontro provincial de formação e partilha fraterna no Seminário Sagrado Coração de Jesus (Corupá/SC).',
    evento_id: 'evt-3',
    ativo: true,
    limite_vagas: 30,
    prazo_encerramento: '2026-05-10',
    mensagem_sucesso: 'Ficha de inscrição enviada com sucesso à equipe de coordenação formativa da BRM.',
    total_respostas: 12,
    created_at: '2026-02-01T09:00:00Z',
    campos: CATALOGO_VARIAVEIS_PADRAO.filter(c => [
      'nome_completo', 'nome_religioso', 'comunidade_atual', 'email', 'telefone_whatsapp',
      'data_chegada', 'data_saida', 'meio_transporte', 'restricao_alimentar', 'observacoes_gerais'
    ].includes(c.id)).map(c => ({
      ...c,
      obrigatorio: ['nome_completo', 'nome_religioso', 'comunidade_atual', 'email', 'telefone_whatsapp'].includes(c.id)
    }))
  }
];

export const SEED_RESPOSTAS: RespostaFormulario[] = [
  {
    id: 'resp-1',
    formulario_id: 'form-retiro-presbiteros-2026',
    evento_id: 'evt-1',
    protocolo: 'FORM-2026-9812',
    status: 'Confirmada',
    created_at: '2026-02-10T11:20:00Z',
    dados: {
      nome_completo: 'Pe. Carlos Eduardo Silva, SCJ',
      nome_religioso: 'Pe. Carlos Silva',
      grau_ordem: 'Presbítero',
      comunidade_atual: 'Paróquia São Sebastião - Jaraguá do Sul/SC',
      email: 'pe.carlos@dehonianos.org.br',
      telefone_whatsapp: '(47) 99876-5432',
      necessita_hospedagem: 'Sim',
      tipo_quarto: 'Quarto Individual (se disponível)',
      data_chegada: '2026-03-14',
      meio_transporte: 'Carro próprio da paróquia/obra',
      restricao_alimentar: 'Nenhuma',
      tamanho_paramento: 'G',
      observacoes_gerais: 'Prevejo chegada por volta das 16h para a oração inicial.'
    }
  },
  {
    id: 'resp-2',
    formulario_id: 'form-retiro-presbiteros-2026',
    evento_id: 'evt-1',
    protocolo: 'FORM-2026-9815',
    status: 'Confirmada',
    created_at: '2026-02-12T15:45:00Z',
    dados: {
      nome_completo: 'Pe. Marcos Aurélio de Souza, SCJ',
      nome_religioso: 'Pe. Marcos SCJ',
      grau_ordem: 'Presbítero',
      comunidade_atual: 'Seminário São José - Rio Negrinho/SC',
      email: 'pe.marcos@dehonianos.org.br',
      telefone_whatsapp: '(47) 99123-4567',
      necessita_hospedagem: 'Sim',
      tipo_quarto: 'Quarto Duplo / Compartilhado',
      data_chegada: '2026-03-14',
      meio_transporte: 'Carona com outros confrades',
      restricao_alimentar: 'Intolerância moderada a lactose',
      tamanho_paramento: 'M',
      observacoes_gerais: 'Viajarei junto com o Pe. André.'
    }
  }
];

export const CONFIG_PADRAO: ConfiguracaoSecretaria = {
  prefixo_decretos: 'DEC-BRM',
  numero_atual_decretos: 14,
  prefixo_portarias: 'PORT-BRM',
  numero_atual_portarias: 28,
  prefixo_circulares: 'CIRC-BRM',
  numero_atual_circulares: 9,
  prefixo_formularios: 'FORM-BRM',
  numero_atual_formularios: 4,
  cabecalho_institucional: 'CONGREGAÇÃO DOS SACERDOTES DO SAGRADO CORAÇÃO DE JESUS',
  subtitulo_provincia: 'Província Brasileira Meridional',
  orgao_emissor: 'SECRETARIA PROVINCIAL & ATOS CANÔNICOS',
  lema_oficial: '«COR JESU, IN TE CONFIDO • SINT UNUM»',
  email_secretaria: 'secretaria@brm.org.br',
  telefone_secretaria: '+55 (47) 3375-1194',
  notificar_confrade_email: true,
  notificar_secretario_nova_resposta: true,
  exibir_marca_dagua: true
};
