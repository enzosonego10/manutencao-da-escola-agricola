# Manutenção da escola

Sistema de chamados para instalações, espaços e equipamentos da ETEC Orlando Quagliato. O tema e a regra de conclusão seguem o [guia do projeto](https://projeto-cooperativa-escola.davidsilvaprog.chatgpt.site/#temas?tema=manutencao): um chamado concluído precisa ter data e descrição do serviço realizado.

## Funções por perfil

| Aluno | Administrador |
| --- | --- |
| Cria uma conta e entra no sistema. | Entra com a conta criada na instalação. |
| Abre chamados para um local e equipamento opcional. | Vê todos os chamados e filtra por situação, prioridade e local. |
| Consulta apenas os próprios chamados, situação e histórico. | Define responsável, situação e andamento; conclui ou cancela chamados. |
| Não vê custos nem altera cadastros. | Registra materiais e serviços, cadastra locais e equipamentos e consulta o relatório por local. |
| — | Convida outros administradores por link de uso único, com validade de 72 horas. |

O PHP aplica as permissões. Esconder um botão na interface não altera o acesso à API.

## Estrutura

```text
assets/css/app.css
assets/js/app.js
includes/bootstrap.php
api.php
index.php
schema.sql
seed.sql
setup.php
tests/smoke.py
```

## Instalação local

Requisitos: PHP 8.2 ou superior com `pdo_mysql` e `mbstring`, além de MySQL 8 ou MariaDB 10.6+. O projeto não instala pacotes.

1. Configure as variáveis de ambiente `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASS` no ambiente local ou no servidor. Os padrões são `127.0.0.1`, `3306`, `etec_manutencao`, `root` e senha vazia.
2. Execute `php setup.php admin@exemplo.com "Nome do administrador"`. Digite a senha quando o programa pedir; ela deve ter ao menos 12 caracteres e não deve ser colocada no comando. O script cria o banco, as tabelas e os dados fictícios se o usuário MySQL tiver permissão para criar bancos.
3. Execute `php -S 127.0.0.1:8000 -t .`.
4. Abra `http://127.0.0.1:8000/`. Alunos criam a própria conta na tela inicial.

No XAMPP, inicie o Apache e o MySQL no painel, confirme a porta e o usuário configurados e execute os mesmos comandos no diretório do projeto. Se o MySQL usar uma senha para `root`, informe-a em `DB_PASS` antes do `setup.php`.

Se o usuário MySQL não puder criar bancos, crie `DB_NAME` no painel do MySQL/MariaDB e execute o `setup.php` novamente. Em hospedagem, proteja `includes/` contra acesso direto e use HTTPS.

## Demonstração

Crie uma conta de aluno e abra um chamado. Entre como administrador, mude a situação, tente concluir sem descrever o serviço e depois conclua corretamente. Confira o histórico e o relatório. O JavaScript orienta o formulário; o PHP valida dados e permissões; o MySQL guarda os registros. A regra de conclusão também está no `CHECK` de `schema.sql`.

Na área **Administradores**, informe o e-mail institucional e gere um convite. Envie o link exibido; a pessoa convidada define nome e senha no próprio link. O token é armazenado somente como hash, expira em 72 horas e deixa de funcionar depois do primeiro uso.

`DADOS.md` traz o modelo e o dicionário de campos. `TESTES.md` registra os casos verificados e como repetir o teste. `schema.sql` cria as tabelas; `seed.sql` insere dados fictícios de demonstração.

## Dados pendentes e limites

- O cadastro de alunos aceita qualquer e-mail válido. A escola ainda precisa definir como comprovar vínculo e recuperar senhas. **[DADO A CONFIRMAR]**
- Os dados da versão anterior em `localStorage` não são importados automaticamente. O novo sistema não os apaga.
- Fontes, ícones e a ilustração dependem de URLs externas; as funções continuam disponíveis sem eles.
- Integrantes, turma, contribuições e forma de entrega: **[DADO A CONFIRMAR]**.
