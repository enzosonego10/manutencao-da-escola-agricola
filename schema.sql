CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'student') NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_invites (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(254) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  created_by INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_invites_token (token_hash),
  KEY idx_admin_invites_email (email),
  CONSTRAINT fk_admin_invites_creator FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS locais (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS equipamentos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  local_id INT UNSIGNED NOT NULL,
  nome VARCHAR(100) NOT NULL,
  pat VARCHAR(80) NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  KEY idx_equipamentos_local (local_id),
  CONSTRAINT fk_equipamentos_local FOREIGN KEY (local_id) REFERENCES locais (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chamados (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  local_id INT UNSIGNED NOT NULL,
  equip_id INT UNSIGNED NULL,
  titulo VARCHAR(80) NOT NULL,
  descricao TEXT NOT NULL,
  prioridade TINYINT UNSIGNED NOT NULL,
  situacao ENUM('a', 'p', 'm', 'c', 'x') NOT NULL,
  responsavel VARCHAR(100) NOT NULL DEFAULT '',
  solicitante VARCHAR(100) NOT NULL,
  aberto DATE NOT NULL,
  concluido DATE NULL,
  servico TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  KEY idx_chamados_user (user_id),
  KEY idx_chamados_local (local_id),
  KEY idx_chamados_equip (equip_id),
  CONSTRAINT fk_chamados_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_chamados_local FOREIGN KEY (local_id) REFERENCES locais (id),
  CONSTRAINT fk_chamados_equip FOREIGN KEY (equip_id) REFERENCES equipamentos (id),
  CONSTRAINT chk_chamados_prioridade CHECK (prioridade BETWEEN 1 AND 4),
  CONSTRAINT chk_chamados_conclusao CHECK (situacao <> 'c' OR (concluido IS NOT NULL AND CHAR_LENGTH(TRIM(servico)) > 0)),
  CONSTRAINT chk_chamados_datas CHECK (concluido IS NULL OR concluido >= aberto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS andamentos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  chamado_id INT UNSIGNED NOT NULL,
  quando DATETIME NOT NULL,
  situacao ENUM('a', 'p', 'm', 'c', 'x') NOT NULL,
  observacao VARCHAR(1000) NOT NULL,
  autor VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_andamentos_chamado (chamado_id),
  CONSTRAINT fk_andamentos_chamado FOREIGN KEY (chamado_id) REFERENCES chamados (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS custos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  chamado_id INT UNSIGNED NOT NULL,
  tipo ENUM('Material', 'Serviço') NOT NULL,
  descricao VARCHAR(200) NOT NULL,
  quantidade DECIMAL(12,3) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_custos_chamado (chamado_id),
  CONSTRAINT fk_custos_chamado FOREIGN KEY (chamado_id) REFERENCES chamados (id),
  CONSTRAINT chk_custos_quantidade CHECK (quantidade > 0),
  CONSTRAINT chk_custos_valor CHECK (valor >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
