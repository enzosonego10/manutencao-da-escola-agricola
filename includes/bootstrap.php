<?php
declare(strict_types=1);

function database(): PDO
{
    $config = dbConfig();
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['host'], $config['port'], $config['name']);
    return new PDO($dsn, $config['user'], $config['pass'], pdoOptions());
}

function databaseServer(): PDO
{
    $config = dbConfig();
    $dsn = sprintf('mysql:host=%s;port=%d;charset=utf8mb4', $config['host'], $config['port']);
    return new PDO($dsn, $config['user'], $config['pass'], pdoOptions());
}

function dbConfig(): array
{
    $name = getenv('DB_NAME') ?: 'etec_manutencao';
    if (!preg_match('/^[A-Za-z0-9_]+$/', $name)) {
        throw new RuntimeException('DB_NAME inválido. Use apenas letras, números e sublinhado.');
    }
    return [
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'port' => (int) (getenv('DB_PORT') ?: 3306),
        'name' => $name,
        'user' => getenv('DB_USER') ?: 'root',
        'pass' => getenv('DB_PASS') ?: '',
    ];
}

function pdoOptions(): array
{
    return [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4',
        PDO::MYSQL_ATTR_MULTI_STATEMENTS => true,
    ];
}
