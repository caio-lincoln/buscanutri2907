🔒 1. Proibição de Criação Duplicada Descrição: O TRAE não deve criar rotas, controllers, serviços,
models ou entidades que já existam parcial ou totalmente no sistema.

Critérios de duplicação:

Mesmo nome

Mesma estrutura funcional

Mesma finalidade

Exemplos:

✅ Correto: POST /clientes

❌ Incorreto: POST /clientes, e em outro ponto POST /clientes-criar com a mesma lógica

Ação esperada do TRAE:

Validar nome e estrutura contra arquivos existentes

Impedir duplicação e exibir erro claro

✍ 2. Restrições de Edição Descrição: O TRAE não deve modificar arquivos de lógica do sistema
(controllers, services, rotas) sem autorização explícita no escopo da tarefa.

Critérios:

Não alterar lógica existente sem anotação de tarefa

Toda edição deve ser registrada em changelog ou histórico de commits

Finalidade:

Evitar sobrescrita de funcionalidades críticas ou já testadas

Manter rastreabilidade das mudanças

🔁 3. Validação de Unicidade (Anti-Duplicação) Antes de qualquer criação, o TRAE deve executar:

Verificação de nome: nome_recurso já existe?

Verificação funcional: objetivo já é atendido por outro endpoint?

Verificação de schema: entidade/coluna já está no banco?

Se houver conflito, bloquear com erro:

bash Copiar Editar ERRO: Recurso duplicado detectado. Verifique: [arquivo / rota / entidade] 🧱 4.
Proibição de Duplicação no Banco de Dados Descrição: É proibida a criação de tabelas, colunas ou
relações que repliquem dados de outras tabelas já existentes.

Ações esperadas:

Validar nome e função antes de criar novos campos

Verificar redundância de dados em migrations e schemas

Resultado esperado:

Estrutura limpa, enxuta, sem dados duplicados ou desnormalizados

🧠 5. Função Principal do TRAE O que o TRAE PODE fazer:

Corrigir bugs

Refatorar código legado

Garantir boas práticas e integridade

Aplicar funcionalidades autorizadas

O que o TRAE NÃO PODE fazer:

Criar funcionalidades novas sem aprovação

Recriar o que já existe

Alterar lógica validada sem documentação

✅ 6. Checklist de Ação do TRAE (Antes de Criar ou Editar) Item Verificação Obrigatória Nome ou rota
já existe? ✔ Sim / ✖ Não Já existe funcionalidade similar? ✔ Sim / ✖ Não Está autorizado por
tarefa? ✔ Sim / ✖ Não Testes foram incluídos? ✔ Sim / ✖ Não

Se qualquer item for “Sim” em duplicação ou “Não” em autorização/teste, a ação é bloqueada.

📌 Observações Finais Toda regra deve ser aplicada de forma automática no fluxo de execução do TRAE
(via plugin, CLI ou integração com Git).

Em caso de dúvida sobre similaridade de recurso, deve-se consultar a equipe técnica responsável.

🔐 7. Regras para Ações em Produção (Ambiente production) Descrição: Ao operar no ambiente de
produção, o TRAE deve agir com extrema cautela e respeitar regras adicionais para não causar perdas
ou inconsistências.

Regras:

🔒 Ações Proibidas em Produção (sem autorização):

Alterar dados existentes diretamente (UPDATE, DELETE)

Executar migrações automáticas

Modificar estrutura de tabelas

✅ Ações Permitidas:

Leitura de dados (SELECT)

Execução de simulações (dry-run)

Registro de logs

Criação de entradas autorizadas com validação prévia

Ação esperada do TRAE:

Verificar se está em ambiente production

Em caso afirmativo, bloquear ou solicitar autorização explícita

Retornar erro caso a ação não esteja autorizada

🔄 8. Execução Segura com Dados Reais (Modo Simulado) Descrição: Antes de alterar qualquer dado
real, o TRAE deve executar um modo simulado para verificar quais mudanças seriam feitas.

Ação esperada:

Rodar operação completa em modo dry-run

Exibir:

ID dos registros que seriam afetados

Campos alterados

Novos valores

Solicitar aprovação manual para executar de fato

🧾 9. Registro de Ações em Produção Descrição: Todas as ações que envolvem dados reais devem ser
registradas em logs_producao_trae (ou outra coleção/tabela definida).

Campos obrigatórios no log:

ID do recurso afetado

Tipo da ação (create, update, delete)

Origem (comando, script ou tarefa)

Data e Hora

Resultado (sucesso, erro, pendente)

Observação (quem aprovou, se foi simulação, etc.)

🧠 10. Procedimento de Aprovação Manual Descrição: O TRAE não pode executar ações críticas (como
edição de dados ou exclusões) sem que haja uma anotação ou autorização explícita.

Critérios:

A tarefa deve conter o flag: #liberar_producao

Caso não tenha, o TRAE retorna:

bash Copiar Editar ERRO: Tentativa de ação crítica em produção sem autorização. Adicione
`#liberar_producao` à tarefa para continuar.
