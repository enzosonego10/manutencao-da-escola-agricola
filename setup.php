<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/includes/bootstrap.php';

$email = strtolower(trim($argv[1] ?? ''));
$name = trim($argv[2] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $name === '') {
    fwrite(STDERR, "Uso: php setup.php email@escola.com \"Nome do administrador\"\n");
    exit(1);
}

$config = dbConfig();
$server = databaseServer();
$server->exec('CREATE DATABASE IF NOT EXISTS `' . $config['name'] . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
$db = database();
$db->exec(file_get_contents(__DIR__ . '/schema.sql'));
$db->exec(file_get_contents(__DIR__ . '/seed.sql'));
if ((int) $db->query("SELECT count(*) FROM users WHERE role = 'admin'")->fetchColumn() > 0) {
    fwrite(STDERR, "Já existe um administrador. Nenhuma conta foi alterada.\n");
    exit(1);
}

fwrite(STDOUT, 'Senha do administrador (mínimo 12 caracteres): ');
$tty = function_exists('shell_exec') && stream_isatty(STDIN);
if ($tty) shell_exec('stty -echo');
try {
    $password = rtrim((string) fgets(STDIN), "\r\n");
} finally {
    if ($tty) shell_exec('stty echo');
    fwrite(STDOUT, "\n");
}
if (strlen($password) < 12) {
    fwrite(STDERR, "Senha muito curta. Execute novamente.\n");
    exit(1);
}
$stmt = $db->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')");
$stmt->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
fwrite(STDOUT, "Banco e administrador prontos.\n");
