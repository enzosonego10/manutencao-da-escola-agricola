# Roteiro de testes

Use um banco descartável no MySQL/MariaDB, por exemplo `etec_manutencao_teste`. Defina `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASS`, execute `php setup.php admin@exemplo.com "Admin de teste"` e depois `php -S 127.0.0.1:8000 -t .`. Em outro terminal, defina `TEST_BASE_URL=http://127.0.0.1:8000`, `TEST_ADMIN_EMAIL` e `TEST_ADMIN_PASSWORD` e execute `python3 tests/smoke.py`. Não grave a senha em arquivos do projeto.

| Caso | Resultado esperado | Verificação nesta revisão |
| --- | --- | --- |
| Criar aluno | Conta recebe papel `student` e começa sem chamados próprios. | Testado antes da migração; repetir no MySQL. |
| Abrir chamado | Aparece só na conta que abriu e persiste após recarregar. | Testado antes da migração; repetir no MySQL. |
| Aluno tentar ação administrativa | API responde 403; custos não aparecem. | Testado antes da migração; repetir no MySQL. |
| Administrador entrar | Painel e navegação administrativa aparecem. | Interface conferida; repetir autenticação no MySQL. |
| Concluir sem data ou serviço | Operação é recusada. | Testado antes da migração; repetir no MySQL. |
| Atualizar situação e custo | Administrador vê o custo; aluno vê a nova situação, sem custo. | Testado antes da migração; repetir no MySQL. |
| Convidar administrador | Administrador gera convite; e-mail convidado cria acesso administrativo; token não reutiliza. | Testado antes da migração; repetir no MySQL. |
| Consultar relatório por local | Abertos, concluídos e custos são agrupados. | Conferido visualmente no desktop e a 390 px. |
| Usar em celular | Navegação e conteúdo continuam utilizáveis. | Menu, locais, lista e formulário conferidos a 390 px. |

Os testes de API precisam ser repetidos no banco MySQL/MariaDB escolhido para a apresentação; a validação completa dessa migração depende das credenciais e do servidor local.
