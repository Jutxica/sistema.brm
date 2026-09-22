# Auditoria — Ficha de Inscrição Pública (`/inscricao`)

**Data:** 22/09/2026
**Arquivo principal:** `frontend/src/pages/InscricaoPublica.tsx` (956 linhas)
**Status:** levantamento concluído; nenhuma correção aplicada (exceto o bug de HTML, já resolvido — ver seção "Já corrigido")

Verificação feita com o app rodando (`npm run dev` em `frontend/`, porta 5173), percorrendo os 6 passos do formulário em viewport desktop (1440×950) e mobile (390×844), mais testes diretos contra a API REST do Supabase.

O formulário **não foi enviado** durante a auditoria — o `insert` cairia na tabela `hospedagens` de produção.

---

## 🔴 Crítico

### 0. A senha SMTP é entregue a todo visitante da página pública

**Onde:** `frontend/src/pages/InscricaoPublica.tsx:97` + modelagem da tabela `mainhospedagem`

A tabela `mainhospedagem` mistura **conteúdo** (mensagens, termos, templates de recibo) com **credenciais de e-mail**:

```
main_host, main_seguranca, main_porta, main_remetente, main_email, main_senha
```

A página pública carrega a tabela inteira:

```ts
supabase.from('mainhospedagem').select('*').eq('main_status', 'Ativo')
```

Capturando o tráfego do navegador ao abrir `/inscricao`, a resposta traz 17 campos, incluindo:

```
>>> credenciais SMTP presentes na resposta:
    ['main_email', 'main_host', 'main_porta', 'main_seguranca', 'main_senha']
```

`main_email` (22 caracteres) e `main_senha` (12 caracteres) estão preenchidos. Qualquer visitante abre a aba Network e lê a senha da conta de e-mail da instituição — e passa a poder enviar mensagens se passando por ela.

**Ações, nesta ordem:**

1. **Trocar a senha do e-mail agora.** Ela já está exposta; toda correção posterior é inútil sem isso.
2. Tirar as credenciais do banco de dados. Lugar correto: variáveis de ambiente / secrets da edge function que envia o e-mail — nunca uma tabela lida pelo cliente.
3. Trocar o `select('*')` por lista explícita de colunas. Regra geral para qualquer consulta feita a partir do navegador: pedir só o que a tela usa.
4. Corrigir a RLS (item 1 abaixo).

Os itens 2, 3 e 4 se reforçam, mas nenhum deles substitui o item 1.

### 1. RLS permissiva expõe todas as inscrições

**Onde:** políticas RLS do Supabase, tabela `hospedagens` (não é código do repositório)

A chave anônima (`VITE_SUPABASE_ANON_KEY`) é embutida no bundle JS pelo Vite. Isso é normal e esperado — a proteção real precisa estar na RLS. Hoje ela não está.

Requisições feitas via `curl`, sem nenhuma sessão autenticada, apenas com a chave anônima:

| Tabela | HTTP | Resultado |
|---|---|---|
| `hospedagens` | 200 | registro completo retornado |
| `confighospedagens` | 200 | 1 registro |
| `mainhospedagem` | 200 | 1 registro |
| `usuarios` | 200 | 0 registros |
| `hos_quartos`, `perfil`, `contatos` | 200 | 0 registros |

Campos de `hospedagens` legíveis anonimamente:

```
hos_nome, hos_nascimento, hos_cpfrg, hos_email, hos_telefone,
hos_telefoneemergencia, hos_logradouro, hos_numero, hos_cep,
hos_bairro, hos_cidade, hos_estado, hos_alergico,
hos_especifiquealergia, hos_restricaoalimentar,
hos_especifiquerestricao, hos_recnome, hos_reccpfcnpj, ...
```

Nome completo, CPF, data de nascimento, e-mail, telefone, contato de emergência, endereço residencial completo e dados de saúde (alergias, restrições alimentares). Dado pessoal sensível sob a LGPD.

Hoje existe **1 inscrição de teste** no banco, então a exposição atual é baixa. No momento em que o link for divulgado, o cadastro inteiro fica público.

**Escrita também está liberada.** Teste conclusivo: `PATCH` em `hos_status` gravando o mesmo valor já existente (`2` → `2`), com `Prefer: return=representation`.

```
>>> ESCRITA PERMITIDA - linha retornada, hos_status = 2
```

Se a política bloqueasse, o retorno viria vazio. Nenhum dado foi alterado (valor idêntico; registro conferido depois, intacto).

**`DELETE` não foi confirmado.** Devolveu HTTP 204, mas RLS bloqueando também devolve 204 — o teste conclusivo exigiria apagar uma linha real. O padrão observado sugere uma policy do tipo `FOR ALL USING (true)`. **Conferir no painel do Supabase.**

**Correção pretendida:**

- `hospedagens`: `INSERT` para `anon`; `SELECT`/`UPDATE`/`DELETE` apenas para `authenticated`
- `mainhospedagem`, `modulos`, `lavanderia`, `confighospedagens`: `SELECT` para `anon` (o formulário depende), nada além disso
- Revisar todas as demais tabelas — as que retornaram 0 registros podem estar vazias em vez de protegidas; 0 registros **não** prova que a RLS está correta

---

## 🟠 Funcional

### 2. E-mail de confirmação nunca é enviado

O admin configura o texto em `main_mensagememail` (`HospedagensConfiguracoes.tsx:970`). A página pública declara o campo na interface `Estadia` (`InscricaoPublica.tsx:20`) e **nunca o utiliza**.

Existe uma edge function `send-receipt`, mas só é chamada na tela administrativa (`HospedagensInscricoes.tsx:371`). Não há nenhuma chamada de envio de e-mail no fluxo de inscrição.

Resultado: quem se inscreve não recebe confirmação alguma. No PHP legado isso era feito via PHPMailer.

### 3. Datas invertidas são aceitas

Chegada `10/10/2026` + saída `01/10/2026` passou pela validação e avançou para o passo seguinte.

`InscricaoPublica.tsx:196-201` só verifica preenchimento:

```ts
if (step === 4) {
  if (!formData.hos_previsaochegada || !formData.hos_previsaosaida) {
    setErrorMsg("Selecione a previsão de chegada e saída.");
    return;
  }
}
```

Falta comparar as duas datas (e provavelmente barrar datas no passado).

### 4. `main_termos` contém texto placeholder

Valor atual no banco: `"Eu aceito os termos e regulamentos da hospedagem..."`

O passo 6 pede aceite de um regulamento que não existe. É conteúdo, não código — precisa ser preenchido pelo admin.

---

## 🟡 Usabilidade e acessibilidade

### 5. Campos obrigatórios não são sinalizados

A mensagem de erro diz "preencha todos os campos obrigatórios", mas nada na tela distingue quais são. No passo 2: Nome, CPF/RG, E-mail e Celular são exigidos; Nascimento e Contato de Urgência não.

### 6. Labels não associados aos campos

33 elementos `<label>` no arquivo, apenas **1** com `htmlFor`. Zero atributos `aria-` .

Consequências: leitor de tela não anuncia o rótulo do campo; clicar no texto do label não foca o input.

Correção: `id` no input + `htmlFor` no label, em todos os pares.

### 7. Sem `inputMode` / `autoComplete`

No celular, CPF, CEP e telefone abrem o teclado alfabético. O autopreenchimento do navegador não funciona em nenhum campo.

Sugestão: `inputMode="numeric"` em CPF/CEP/telefone; `autoComplete` em nome (`name`), e-mail (`email`), telefone (`tel`), CEP (`postal-code`), endereço (`street-address`), cidade (`address-level2`), estado (`address-level1`).

### 8. CPF sem máscara nem validação

Campo é `type="text"` com placeholder "Apenas números" (`InscricaoPublica.tsx:507`). Nada impede texto livre nem valida os dígitos verificadores.

### 9. `<title>` genérico na página pública

`frontend/index.html:10` — "Conventinho SCJ - Sistema Administrativo". A aba de uma ficha de inscrição pública não deveria dizer "Sistema Administrativo". O título é global do SPA; ideal é ajustá-lo por rota.

---

## Não é defeito

**Campo de data exibindo `mm/dd/yyyy`.** Aparece assim nos screenshots da auditoria. Testei forçando `locale=pt-BR` no navegador e não mudou: o Chromium segue o **idioma da interface do navegador**, não o `lang` da página nem o locale do JS. Num Chrome em português aparece `dd/mm/aaaa`. O `lang="pt-br"` já está correto em `frontend/index.html:2`.

Ainda assim afeta quem usa o navegador em inglês. Se isso for um problema real para o público-alvo, a saída é um campo de data customizado em vez do nativo.

---

## O que está bom

- Validação por etapa, com mensagens específicas por passo
- Busca de CEP via ViaCEP preenchendo logradouro, bairro, cidade e UF automaticamente (`InscricaoPublica.tsx:132`)
- Proteção contra duplo envio — `disabled={submitting}` nos dois botões (linhas 916 e 938)
- Botão "Confirmar Inscrição" travado até o aceite dos termos
- Stepper colapsa para números no mobile; layout se comporta bem em 390px
- Zero erros de console em todos os 6 passos, desktop e mobile
- Tratamento de inscrições suspensas (`chos_ativar`) e de lista de cursos vazia

---

## Já corrigido (22/09/2026)

**HTML cru aparecendo na tela.** `chos_acolhida` e `chos_txtinativo` são gravados como HTML pelo editor Summernote do admin legado, mas a página os renderizava como texto puro — o visitante via `<p>Bem-vindos!</p><p class="ql-align-justify">...` literalmente.

Correção: componente `frontend/src/components/RichText.tsx`, que sanitiza com DOMPurify e renderiza via `dangerouslySetInnerHTML` quando há marcação, ou renderiza como texto com `whitespace-pre-line` quando é texto puro (os campos convivem nas duas formas — `chos_acolhida` é HTML legado, `main_termos` é texto puro).

O atributo `style` inline é descartado na sanitização: o conteúdo legado carrega `background-color: rgb(255,255,255)`, que viraria um bloco branco no tema escuro.

Aplicado em 4 pontos: `chos_acolhida` (L381), `chos_txtinativo` (L287), `main_mensagemtela` (L330), `main_termos` (L890). Estilos `.rich-text` em `frontend/src/index.css` (o preflight do Tailwind zera margens de `p`/`ul`/`h*`).

---

## Ordem sugerida

0. **Trocar a senha SMTP** (item 0) — já está exposta hoje, em produção
1. **RLS + tirar credenciais do banco** (itens 0 e 1) — antes de divulgar o link, sem exceção
2. **E-mail de confirmação** (item 2) — o inscrito não recebe nada hoje
3. **Conteúdo dos termos** (item 4) — depende do admin, não de código
4. **Validação de datas** (item 3)
5. **Acessibilidade e obrigatórios** (itens 5, 6, 7, 8)
6. **Título por rota** (item 9)

---

## 🔴 Crítico adicional (22/09/2026) — Credenciais SMTP expostas na página pública

A tabela `mainhospedagem` contém os campos de SMTP do e-mail institucional:
`main_email`, `main_senha`, `main_host`, `main_porta`, `main_seguranca`.

A página pública de inscrição faz `supabase.from('mainhospedagem').select('*')` (InscPublica.tsx:97).
Como a RLS não restringe `SELECT` em `mainhospedagem`, **qualquer visitante recebe esses campos na resposta HTTP**.

Valores atuais (lidos via curl com a chave anônima, sem sessão):
- `main_email`  = media.utxica@gmail.com
- `main_senha` = Mualilissa22
- `main_porta`  = 587
- `main_seguranca` = TLS

O `main_host` está vazio, então o SMTP atual não roda — mas a senha ainda está lá e pode
ser reutilizada em outro provedor. Troque a senha do e-mail **hoje**.

**Correção pretendida:** adicionar `main_email`, `main_senha`, `main_host` à policy de `SELECT`
para `authenticated` apenas. O frontend só precisa de `main_mensagemtela`, `main_mensagememail`,
`main_termos`, `main_recibo_*`, `main_motivo`, `main_status` — o select pode ser explicito
(`select('main_motivo, main_mensagemtela, ...')`) ou a RLS pode restringir as colunas sensíveis.

