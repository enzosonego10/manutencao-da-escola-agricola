INSERT IGNORE INTO locais (id, nome, tipo) VALUES
  (1, 'Alojamento masculino', 'Alojamento'),
  (2, 'Laboratório de informática', 'Laboratório'),
  (3, 'Galpão de máquinas', 'Instalação'),
  (4, 'Estufa de hortaliças', 'Área externa'),
  (5, 'Cozinha e refeitório', 'Instalação');

INSERT IGNORE INTO equipamentos (id, local_id, nome, pat) VALUES
  (1, 1, 'Chuveiro elétrico', 'EXEMPLO-001'),
  (2, 2, 'Ar-condicionado', 'EXEMPLO-002'),
  (3, 3, 'Trator agrícola', 'EXEMPLO-003'),
  (4, 4, 'Bomba d’água', 'EXEMPLO-004');

INSERT IGNORE INTO chamados (id, user_id, local_id, equip_id, titulo, descricao, prioridade, situacao, responsavel, solicitante, aberto, concluido, servico)
VALUES
  (1, NULL, 1, 1, 'Chuveiro sem aquecimento', 'Água sai fria em dois boxes do bloco.', 3, 'p', 'Elétrica', 'Exemplo', DATE_SUB(CURDATE(), INTERVAL 6 DAY), NULL, ''),
  (2, NULL, 4, 4, 'Bomba d’água parou', 'Irrigação da estufa sem pressão.', 4, 'a', '', 'Exemplo', DATE_SUB(CURDATE(), INTERVAL 2 DAY), NULL, ''),
  (3, NULL, 3, 3, 'Troca de óleo do trator', 'Manutenção programada.', 2, 'c', 'Jardinagem e máquinas', 'Exemplo', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'Óleo e filtros trocados; teste realizado.');

INSERT IGNORE INTO andamentos (id, chamado_id, quando, situacao, observacao, autor) VALUES
  (1, 1, DATE_SUB(NOW(), INTERVAL 6 DAY), 'a', 'Chamado aberto.', 'Equipe'),
  (2, 1, DATE_SUB(NOW(), INTERVAL 4 DAY), 'p', 'Peça solicitada.', 'Equipe'),
  (3, 2, DATE_SUB(NOW(), INTERVAL 2 DAY), 'a', 'Chamado aberto.', 'Equipe'),
  (4, 3, DATE_SUB(NOW(), INTERVAL 20 DAY), 'a', 'Chamado aberto.', 'Equipe'),
  (5, 3, DATE_SUB(NOW(), INTERVAL 15 DAY), 'c', 'Serviço concluído.', 'Equipe');

INSERT IGNORE INTO custos (id, chamado_id, tipo, descricao, quantidade, valor) VALUES
  (1, 3, 'Material', 'Óleo e filtros', 1, 380.00);
