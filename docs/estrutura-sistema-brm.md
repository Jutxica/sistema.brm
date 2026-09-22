# Arquitetura e Estrutura — Sistema de Gestão BRM
**Província Brasileira Meridional dos Padres do Sagrado Coração de Jesus (Dehonianos)**

---

## 1. Visão Geral & Escopo

O sistema deixa de ser uma aplicação monolítica restrita a uma casa ("Conventinho") e assume seu propósito integral: **Sistema de Gestão Institucional da Província BRM**.

A hospedagem deixa de ser a raiz do sistema e passa a ser **um dos módulos operacionais**, vinculado às **Obras** administradas pela Província.

---

## 2. Hierarquia Estrutural do Domínio

```
                    ┌─────────────────────────┐
                    │      Província BRM      │
                    └────────────┬────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
        ┌────────┴────────┐             ┌────────┴────────┐
        │  Comunidade A   │             │  Comunidade B   │
        └────────┬────────┘             └────────┬────────┘
                 │                               │
       ┌─────────┴─────────┐                     │
       │                   │                     │
┌──────┴──────┐     ┌──────┴──────┐       ┌──────┴──────┐
│   Obra 1    │     │   Obra 2    │       │   Obra 3    │
│(Hospedagem) │     │  (Colégio)  │       │ (Paróquia)  │
└──────┬──────┘     └─────────────┘       └─────────────┘
       │
┌──────┴──────────────────────────┐
│  Módulo Hospedagem              │
│  - Configurações da Obra        │
│  - Quartos / Acomodações        │
│  - Inscrições Públicas / Eventos│
│  - Check-in, Check-out, Recibos │
└─────────────────────────────────┘
```

### Relacionamentos Fundamentais:
1. **Província ➔ Comunidades**: A Província congrega as comunidades religiosas da BRM.
2. **Comunidade ➔ Religiosos**: Os religiosos são alocados ou transferidos entre as comunidades.
3. **Comunidade ➔ Obras**: Cada obra pertence juridicamente ou pastoralmente a uma comunidade de referência.
4. **Obra ➔ Hospedagem / Gestão Operacional**: A capacidade de hospedagem, eventos e inscrições é gerida no contexto de uma Obra específica.

---

## 3. Entidades & Modelagem de Dados

### A. Núcleo Institucional (Comunidades, Obras, Religiosos)

#### `comunidades`
Representa as residências/casas religiosas da Província.
- `id`: UUID (PK)
- `nome`: Nome da comunidade (ex: "Comunidade Sagrado Coração", "Convento São José")
- `padroeiro`: Titular/padroeiro da comunidade
- `data_fundacao`: Data de ereção canônica/início
- `superior_id`: FK para `religiosos` (superior/coordenador da comunidade)
- `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `telefone`, `email`
- `status`: 'Ativo' | 'Inativo'

#### `obras`
Representa os centros pastorais, casas de formação, colégios, paróquias e casas de retiros vinculadas a uma comunidade.
- `id`: UUID (PK)
- `comunidade_id`: FK para `comunidades` (Obra pertence à comunidade)
- `nome`: Nome da obra
- `tipo`: 'Casa de Retiro/Hospedagem' | 'Paróquia' | 'Colégio' | 'Seminário' | 'Obra Social' | 'Outro'
- `permite_hospedagem`: Boolean (se ativa o submódulo de hospedagem)
- `cnpj`: Opcional se filial ou matriz
- `responsavel_id`: FK para `religiosos` (diretor/reitor/pároco)
- `cep`, `logradouro`, `numero`, `bairro`, `cidade`, `estado`, `telefone`, `email`
- `status`: 'Ativo' | 'Inativo'

#### `religiosos`
Cadastro canônico e civil de cada religioso da BRM.
- `id`: UUID (PK)
- `auth_user_id`: UUID (FK para `auth.users` do Supabase — permite login próprio)
- `comunidade_atual_id`: FK para `comunidades`
- `nome_religioso`: Nome canônico / como é conhecido (ex: "Pe. João Carlos", "Fr. Marcos")
- `nome_civil`: Nome de registro civil
- `grau`: 'Bispo' | 'Presbítero' | 'Diácono' | 'Irmão' | 'Noviço' | 'Postulante'
- `data_nascimento`: Date
- `data_primeira_profissao`: Date
- `data_profissao_perpetua`: Date
- `data_ordenacao_presbiteral`: Date
- `cpf`, `rg`, `passaporte`, `nacionalidade`
- `email_institucional`, `telefone_celular`
- `status`: 'Ativo' | 'Em missão externa' | 'Em estudos' | 'Emérito' | 'Falecido' | 'Exclausurado'

---

### B. Módulo Hospedagem (Acoplado à Obra)

Toda a lógica de hospedagens existente é preservada e contextualizada por `obra_id`:

#### `hospedagens_configuracoes`
Configuração específica de cada obra que recebe hóspedes.
- `id`: UUID (PK)
- `obra_id`: FK para `obras` (1:1 ou 1:N por setor da obra)
- `chave_publica_slug`: Slug para link público (ex: `/inscricao/retiro-itajai`)
- `ativar_inscricoes`: Boolean
- `texto_inativo`: Rich text
- `texto_acolhida`: Rich text
- `termos_regulamento`: Rich text
- `mensagem_sucesso_tela`: Rich text
- `mensagem_confirmacao_email`: Rich text

#### `hospedagens_quartos`
- `id`: UUID (PK)
- `obra_id`: FK para `obras`
- `numero_identificacao`: Nome ou número do quarto
- `ala_bloco`: Ala/piso
- `capacidade`: Número de leitos
- `status`: 'Disponível' | 'Ocupado' | 'Manutenção' | 'Reservado'

#### `hospedagens_inscricoes`
Ficha de hospedagem / retiro / estadia:
- `id`: UUID (PK)
- `obra_id`: FK para `obras`
- `estadia_motivo_id`: Categoria/evento
- `hos_nome`, `hos_email`, `hos_telefone`, `hos_cpf`, `hos_nascimento`
- `hos_logradouro`, `hos_cep`, `hos_cidade`, `hos_estado`
- `hos_alergico`, `hos_restricaoalimentar`
- `hos_previsaochegada`, `hos_previsaosaida`
- `quarto_id`: FK para `hospedagens_quartos` (opcional)
- `status`: 'Pendente' | 'Confirmada' | 'Check-in' | 'Check-out' | 'Cancelada'

---

## 4. Estrutura do Frontend (React + Vite)

### Reorganização da Navegação:
- **Painel Geral (Dashboard BRM)**
- **Institucional:**
  - Comunidades (`/comunidades`)
  - Obras (`/obras`)
  - Religiosos (`/religiosos`)
- **Hospedagem & Eventos (por Obra):**
  - Inscrições & Reservas (`/hospedagens`)
  - Gestão de Quartos (`/quartos`)
  - Configurações da Hospedagem (`/hospedagens-configuracoes`)
- **Administração:**
  - Usuários & Permissões (`/usuarios`)
  - Meu Perfil (`/perfil`)

### Link de Inscrição Pública:
- Rota atual: `/inscricao`
- Rota escalável multiobra: `/inscricao/:slugObra` (com fallback para a obra principal padrão).

---

## 5. Prontidão para o Formulário em PDF

Assim que você enviar o arquivo PDF:
1. **Mapearemos os campos**: Extrairemos todos os campos exigidos (dados civis, canônicos, pastorais, de saúde ou financeiros).
2. **Formulário Administrativo**: Telas internas de inserção e edição com validações.
3. **Formulário Público de Inscrição**: Ajuste da esteira pública de etapas (Stepper) com os campos do PDF.
4. **Geração de Documentos/PDFs**: Emissão de ficha cadastral ou comprovante padronizado.
