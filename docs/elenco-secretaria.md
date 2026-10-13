# Elenco da Secretaria

## Banco de dados

O catálogo institucional existente usado pelo sistema é `religiosos_obras_referencia`; o Elenco não cria cópias das instituições na tabela legada `obras`.

### Etapa 1 — catálogos

`supabase/migration-elenco-catalogos.sql` prepara as 15 comunidades, adiciona sua região e importa/atualiza o catálogo de instituições a partir das planilhas institucionais. Ela não cria nem altera religiosos.

O catálogo inclui as obras e casas do Elenco, as escolas ligadas à comunidade Local Sagrado Coração de Jesus, o Secretariado Vocacional, as 11 entidades de “Outras instituições”, as missões no exterior e o Conventinho marcado como não pertencente à BRM. Cada instituição vinculada a uma comunidade recebe o `comunidade_id` dessa comunidade.

O campo `tipo` respeita as categorias aceitas pela tabela existente (`Paróquia`, `Casa` e `Obra`): santuários são classificados como `Paróquia`; conventos, seminários, noviciados, residências e casas como `Casa`; e instituições de ensino, vocacionais, externas e missões como `Obra`. O nome preserva a identificação específica de cada entidade.

A carga usa uma CTE na própria instrução, sem depender de tabela temporária entre comandos. No SQL Editor, execute o arquivo inteiro, incluindo `begin;` e `commit;`, e não somente o trecho final.

Aplicar primeiro em uma base Supabase de teste que já contenha as tabelas-base `comunidades` e `religiosos_obras_referencia`. Conferir as contagens e os vínculos antes de avançar.

### Etapa 2 — designações e permissões

Depois de aprovada a conferência dos catálogos, `supabase/migration-elenco-secretaria.sql` adiciona:

- a situação específica do Elenco (`Ativo` ou `Ausente`), sem alterar o status geral do cadastro;
- designações vinculadas a uma comunidade ou instituição, com função e vigência;
- rotinas transacionais para registrar uma transferência e para marcar ausência/reativação;
- políticas e validações para que apenas usuários ativos com acesso `secretaria` ou `admin` alterem o Elenco;

Essa etapa exige a tabela `public.usuarios` com os campos `idusuarios`, `auth_user_id`, `usu_status` e `usu_acessos`. A migração instala/atualiza `usuario_tem_papel(text)` para autorizar somente contas ativas com o papel solicitado, ou com `admin`; a mesma definição está na migração-base de segurança. A Etapa 2 é transacional: em caso de erro, suas alterações são revertidas. Não a execute automaticamente no deploy do frontend.

### Cadastro mínimo do Elenco

**Diretriz atual: não criar cadastros mínimos a partir da planilha antes dos religiosos se cadastrarem pelo Portal.** A planilha não tem todos os dados civis necessários para identificar cada pessoa com segurança. Portanto, não execute `supabase/import-elenco-pessoas-2026.sql` nem `supabase/import-elenco-djonatan-estudos-2026.sql` nesta etapa.

O cadastro normal pelo Portal deve criar ou localizar a ficha usando os dados informados pelo próprio religioso, especialmente o CPF, e associar a conta autenticada ao registro quando a sessão já estiver confirmada. Depois dos cadastros, a Secretaria conciliará cada registro real com a planilha, sem usar títulos religiosos ou semelhança de nomes como prova de identidade. Casos sem correspondência segura ficam pendentes de validação.

Somente após essa conciliação será decidido quais campos do Elenco devem ser acrescentados aos registros já existentes e quais designações de 2026 podem ser registradas com segurança. Assim se evita criar uma segunda ficha para a mesma pessoa. As migrações de cadastro mínimo e de carga permanecem como rascunhos históricos e não fazem parte da sequência aprovada neste momento.

### Vinculação ao Portal do Religioso

No fluxo normal, a conta deve se relacionar à ficha criada no cadastro do Portal por CPF e/ou pelo e-mail autenticado que corresponda à ficha. Não vincule contas manualmente pelo nome ou título religioso. A migração `supabase/migration-elenco-vinculo-conta-portal.sql` e a ação **Vincular conta** são uma ferramenta de contingência administrativa, não uma etapa para executar agora.

Quando os cadastros reais estiverem conciliados e o Elenco montado, o Portal poderá exibir comunidade, instituição, função e tipo de vínculo a partir das designações vigentes. Essas designações serão somente leitura para o religioso e continuarão sob gestão da Secretaria. Se ainda não houver designação vigente, o Portal deverá informar isso em vez de sugerir um destino.

## Sequência aprovada

1. Manter aberto o cadastro normal dos religiosos pelo Portal; não importar a lista da planilha como pessoas provisórias.
2. Conferir os cadastros criados e resolver duplicidades ou falhas de associação por CPF/e-mail antes de montar o Elenco.
3. Conciliar cada cadastro real com as abas da planilha. Não associar por aproximação; encaminhar ambiguidades à Secretaria.
4. Só então registrar nome de exibição, situação e designações confirmadas, mantendo pendentes os vínculos sem evidência suficiente.
5. Validar o acesso do religioso e da Secretaria ao Portal e ao Elenco antes de publicar alterações.

## Dados do elenco 2026

A pasta `BRM_Elenco_2026_Dashboard.xlsx` é a fonte aprovada para a carga inicial. As abas de estatísticas são agregados e não devem ser importadas como designações. As abas de religiosos por obra, fratres, exterior, comunidades e outras instituições contêm os registros-fonte.

A carga de pessoas e designações fica suspensa até que os religiosos façam o cadastro normal e os registros reais sejam conciliados com os IDs existentes no Supabase. Não se deve fazer correspondência aproximada nem criar religiosos duplicados automaticamente. A planilha servirá para acrescentar os dados do Elenco aos cadastros confirmados, e não para criar uma segunda lista de pessoas antes dos cadastros.

Para as designações provenientes do retrato de 2026, manter `ano_referencia = 2026` e `vigencia_inicio` nula quando a data exata não for conhecida. Transferências novas exigem uma data de início.

### Correspondências de obras já validadas

Estas três diferenças de nome são a mesma entidade e devem apontar para um único cadastro:

- `Sede Provincial – Seminário SCJ` / `Seminário SCJ` (Corupá);
- `Paróquia Catedral São João Batista` / `São João Batista` (Rio do Sul);
- `Paróquia Santo Antônio` / `Santo Antônio de Pádua` (Rio Negrinho);
- `Paróquia São Luís Gonzaga` / `São Luiz Gonzaga` (Brusque).

A Secretaria confirmou também que `Casa São João` (Jaraguá do Sul II) e `Residência Sagrado Coração de Jesus` (Curitiba I) são instituições próprias, distintas das demais obras locais; ambas estão preparadas como novos registros na migração.

### Comunidades-base

As 15 comunidades da aba `Comunidades` são preparadas na primeira etapa, com a região escrita em cada cadastro, inclusive quando a planilha usou células mescladas. Os campos de superior permanecem sem vínculo (`superior_id` nulo) até os religiosos serem cadastrados e reconciliados por UUID; “Não informado” continuará pendente.

## Regras de vínculo

- Uma designação aponta para exatamente uma comunidade ou uma obra/instituição.
- Residência, filiação jurídica, estudos, missão, função pastoral e função institucional são vínculos distintos.
- Uma pessoa pode ter vários vínculos simultâneos e funções diferentes.
- Religiosos ausentes podem manter designação jurídica; outras designações vigentes são encerradas ao marcar ausência.
- Reativar uma pessoa não cria alocações automaticamente; a Secretaria registra os novos vínculos.
- O Convento de Brusque e o Conventinho de Taubaté são entidades distintas; somente o segundo é marcado como não pertencente à BRM.
