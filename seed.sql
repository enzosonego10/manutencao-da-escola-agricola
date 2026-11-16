INSERT IGNORE INTO locais (id, nome, tipo) VALUES
  (1, 'Alojamento masculino', 'Alojamento'),
  (2, 'Laboratório de informática', 'Laboratório'),
  (3, 'Galpão de máquinas', 'Instalação'),
  (4, 'Estufa de hortaliças', 'Área externa'),
  (5, 'Cozinha e refeitório', 'Instalação');

-- Blocos principais e grupo que reúne setores sem bloco específico.
INSERT INTO locais (nome, tipo, parent_id)
SELECT v.nome, v.tipo, NULL FROM (
  SELECT 'Bloco sala de aula um' nome, 'Sala de aula' tipo UNION ALL
  SELECT 'Bloco sala de aula dois', 'Sala de aula' UNION ALL
  SELECT 'Bloco biblioteca', 'Instalação' UNION ALL
  SELECT 'Bloco de alojamentos', 'Alojamento' UNION ALL
  SELECT 'Setores da escola', 'Instalação'
) v WHERE NOT EXISTS (SELECT 1 FROM locais l WHERE l.nome = v.nome AND l.parent_id IS NULL);

-- Setores entram no segundo seletor após escolher "Setores da escola".
UPDATE locais SET nome = 'Bovinocultura' WHERE nome = 'Movinocultura';
UPDATE locais s JOIN locais p ON p.nome = 'Setores da escola' AND p.parent_id IS NULL
SET s.parent_id = p.id WHERE s.nome IN ('Oficina', 'Garagem', 'Bovinocultura', 'Suinocultura', 'Ovinocultura', 'Piscicultura', 'Aves', 'Secretaria', 'Áreas externas', 'Guarita');
INSERT INTO locais (nome, tipo, parent_id)
SELECT v.nome, v.tipo, p.id FROM (
  SELECT 'Oficina' nome, 'Instalação' tipo UNION ALL
  SELECT 'Garagem', 'Instalação' UNION ALL
  SELECT 'Bovinocultura', 'Instalação' UNION ALL
  SELECT 'Suinocultura', 'Instalação' UNION ALL
  SELECT 'Ovinocultura', 'Instalação' UNION ALL
  SELECT 'Piscicultura', 'Instalação' UNION ALL
  SELECT 'Aves', 'Instalação' UNION ALL
  SELECT 'Secretaria', 'Administrativo' UNION ALL
  SELECT 'Áreas externas', 'Área externa' UNION ALL
  SELECT 'Guarita', 'Instalação'
) v JOIN locais p ON p.nome = 'Setores da escola' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM locais l WHERE l.nome = v.nome AND l.parent_id = p.id);

-- As cores aparecem no segundo seletor após escolher o bloco de alojamentos.
INSERT INTO locais (nome, tipo, parent_id)
SELECT v.nome, 'Alojamento', p.id FROM (
  SELECT 'Alojamento vermelho' nome UNION ALL
  SELECT 'Alojamento laranja' UNION ALL
  SELECT 'Alojamento verde' UNION ALL
  SELECT 'Alojamento amarelo' UNION ALL
  SELECT 'Alojamento roxo (feminino)' UNION ALL
  SELECT 'Alojamento rosa (feminino)'
) v JOIN locais p ON p.nome = 'Bloco de alojamentos' AND p.parent_id IS NULL
WHERE NOT EXISTS (SELECT 1 FROM locais l WHERE l.nome = v.nome AND l.parent_id = p.id);

INSERT IGNORE INTO chamados (id, user_id, local_id, categoria, setor, subsetor, patrimonio, titulo, descricao, prioridade, situacao, responsavel, solicitante, aberto, concluido, servico)
VALUES
  (1, NULL, 1, 'Hidráulica', 'Alojamento masculino', 'Quarto 1', '', 'Chuveiro sem aquecimento', 'Água sai fria em dois boxes do bloco.', 3, 'p', 'Elétrica', 'Exemplo', DATE_SUB(CURDATE(), INTERVAL 6 DAY), NULL, ''),
  (2, NULL, 4, 'Hidráulica', 'Estufa de hortaliças', 'Irrigação', '', 'Bomba d’água parou', 'Irrigação da estufa sem pressão.', 4, 'a', '', 'Exemplo', DATE_SUB(CURDATE(), INTERVAL 2 DAY), NULL, ''),
  (3, NULL, 3, 'Equipamentos', 'Galpão de máquinas', 'Tratores', '', 'Troca de óleo do trator', 'Manutenção programada.', 2, 'c', 'Jardinagem e máquinas', 'Exemplo', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'Óleo e filtros trocados; teste realizado.');

INSERT IGNORE INTO andamentos (id, chamado_id, quando, situacao, observacao, autor) VALUES
  (1, 1, DATE_SUB(NOW(), INTERVAL 6 DAY), 'a', 'Chamado aberto.', 'Equipe'),
  (2, 1, DATE_SUB(NOW(), INTERVAL 4 DAY), 'p', 'Peça solicitada.', 'Equipe'),
  (3, 2, DATE_SUB(NOW(), INTERVAL 2 DAY), 'a', 'Chamado aberto.', 'Equipe'),
  (4, 3, DATE_SUB(NOW(), INTERVAL 20 DAY), 'a', 'Chamado aberto.', 'Equipe'),
  (5, 3, DATE_SUB(NOW(), INTERVAL 15 DAY), 'c', 'Serviço concluído.', 'Equipe');

INSERT IGNORE INTO custos (id, chamado_id, tipo, descricao, quantidade, valor) VALUES
  (1, 3, 'Material', 'Óleo e filtros', 1, 380.00);
