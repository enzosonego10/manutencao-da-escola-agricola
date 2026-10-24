# Modelo e dicionário de dados

As tabelas estão em `schema.sql`. Um aluno pode abrir vários chamados. Um local pode ter vários equipamentos e chamados. Cada chamado pode ter vários andamentos e custos. Um equipamento pertence a um local.

| Tabela | Campos | Significado |
| --- | --- | --- |
| `users` | `id`, `name`, `email`, `password_hash`, `role` | Conta, credencial protegida por hash e papel (`student` ou `admin`). |
| `locais` | `id`, `nome`, `tipo` | Espaço da escola. |
| `equipamentos` | `id`, `local_id`, `nome`, `pat` | Equipamento, local vinculado e patrimônio. |
| `chamados` | `id`, `user_id`, `local_id`, `equip_id` | Pedido, aluno que abriu, local e equipamento opcional. `user_id` é nulo nos exemplos. |
| `chamados` | `titulo`, `descricao`, `prioridade`, `situacao` | Problema, prioridade de 1 a 4 e situação. |
| `chamados` | `responsavel`, `solicitante`, `aberto`, `concluido`, `servico` | Acompanhamento e conclusão. |
| `andamentos` | `id`, `chamado_id`, `quando`, `situacao`, `observacao`, `autor` | Histórico de cada pedido. |
| `custos` | `id`, `chamado_id`, `tipo`, `descricao`, `quantidade`, `valor` | Material ou serviço e custo unitário. |
| `admin_invites` | `id`, `email`, `token_hash`, `expires_at`, `used_at`, `created_at`, `created_by` | Convite de administrador de uso único e validade limitada. |

Situações: `a` aberto, `p` em andamento, `m` aguardando material, `c` concluído, `x` cancelado. A data de conclusão não pode ser anterior à abertura. Um chamado concluído precisa ter data e serviço realizado; PHP e MySQL verificam a regra.
