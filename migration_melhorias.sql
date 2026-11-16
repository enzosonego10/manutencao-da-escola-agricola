-- Execute uma única vez em bancos existentes antes de publicar a nova versão.
ALTER TABLE locais ADD COLUMN parent_id INT UNSIGNED NULL;
ALTER TABLE locais ADD KEY idx_locais_parent (parent_id);
ALTER TABLE locais ADD CONSTRAINT fk_locais_parent FOREIGN KEY (parent_id) REFERENCES locais (id);
ALTER TABLE chamados ADD COLUMN categoria VARCHAR(80) NOT NULL DEFAULT 'Geral';
ALTER TABLE chamados ADD COLUMN setor VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE chamados ADD COLUMN subsetor VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE chamados ADD COLUMN patrimonio VARCHAR(80) NOT NULL DEFAULT '';
-- Preserva no chamado o código patrimonial do equipamento associado.
UPDATE chamados c JOIN equipamentos e ON e.id = c.equip_id
SET c.patrimonio = e.pat WHERE c.patrimonio = '';
ALTER TABLE chamados DROP FOREIGN KEY fk_chamados_equip;
ALTER TABLE chamados DROP INDEX idx_chamados_equip;
ALTER TABLE chamados DROP COLUMN equip_id;
DROP TABLE equipamentos;
