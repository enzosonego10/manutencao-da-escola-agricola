<?php
declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';
date_default_timezone_set('America/Sao_Paulo');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
session_name('etec_manut');
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'path' => '/',
]);
session_start();
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));

function reply(array $body, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function fail(string $message, int $status = 400): never
{
    reply(['error' => $message], $status);
}

function field(array $data, string $key, int $limit = 255): string
{
    $value = trim((string) ($data[$key] ?? ''));
    if (mb_strlen($value) > $limit) fail('O campo ' . $key . ' está muito longo.');
    return $value;
}

function required(array $data, string $key, int $limit = 255): string
{
    $value = field($data, $key, $limit);
    if ($value === '') fail('Preencha o campo ' . $key . '.');
    return $value;
}

function admin(): void
{
    if (($_SESSION['user']['role'] ?? '') !== 'admin') fail('Acesso restrito à administração.', 403);
}

function inviteHash(string $token): string
{
    return hash('sha256', $token);
}

function activeInvite(PDO $db, string $token): array
{
    if ($token === '' || strlen($token) > 200) fail('Convite inválido.', 400);
    $stmt = $db->prepare('SELECT id, email, expires_at AS expiresAt, used_at AS usedAt FROM admin_invites WHERE token_hash = ?');
    $stmt->execute([inviteHash($token)]);
    $invite = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$invite || $invite['usedAt'] !== null || strtotime($invite['expiresAt']) <= time()) fail('Convite inválido ou expirado.', 410);
    return $invite;
}

function exists(PDO $db, string $table, int $id): bool
{
    // $table comes only from fixed calls below.
    $stmt = $db->prepare("SELECT 1 FROM $table WHERE id = ?");
    $stmt->execute([$id]);
    return (bool) $stmt->fetchColumn();
}

function snapshot(PDO $db): array
{
    $user = $_SESSION['user'] ?? null;
    if (!$user) return ['user' => null, 'csrf' => $_SESSION['csrf']];
    $student = $user['role'] === 'student';
    $id = (int) $user['id'];
    $tickets = $db->prepare('SELECT id, local_id AS localId, equip_id AS equipId, titulo, descricao AS `desc`, prioridade AS prio, situacao AS st, responsavel AS resp, solicitante AS sol, aberto, concluido AS concl, servico AS serv FROM chamados' . ($student ? ' WHERE user_id = ?' : '') . ' ORDER BY id DESC');
    $tickets->execute($student ? [$id] : []);
    $c = $tickets->fetchAll(PDO::FETCH_ASSOC);
    $ticketIds = array_column($c, 'id');
    $a = [];
    $k = [];
    if ($ticketIds) {
        $marks = implode(',', array_fill(0, count($ticketIds), '?'));
        $stmt = $db->prepare("SELECT id, chamado_id AS chId, quando, situacao AS st, observacao AS obs, autor AS por FROM andamentos WHERE chamado_id IN ($marks) ORDER BY id");
        $stmt->execute($ticketIds);
        $a = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!$student) {
            $stmt = $db->prepare("SELECT id, chamado_id AS chId, tipo, descricao AS `desc`, quantidade AS q, valor AS v FROM custos WHERE chamado_id IN ($marks) ORDER BY id");
            $stmt->execute($ticketIds);
            $k = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    $invites = [];
    if (!$student) {
        $invites = $db->query('SELECT id, email, expires_at AS expiresAt, used_at AS usedAt, created_at AS createdAt FROM admin_invites ORDER BY id DESC')->fetchAll(PDO::FETCH_ASSOC);
    }
    return [
        'user' => $user,
        'csrf' => $_SESSION['csrf'],
        'db' => [
            'l' => $db->query('SELECT id, nome, tipo FROM locais ORDER BY nome')->fetchAll(PDO::FETCH_ASSOC),
            'e' => $db->query('SELECT id, local_id AS localId, nome, pat FROM equipamentos ORDER BY nome')->fetchAll(PDO::FETCH_ASSOC),
            'c' => $c, 'a' => $a, 'k' => $k, 'i' => $invites,
        ],
    ];
}

try {
    $db = database();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') reply(snapshot($db));
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Método não permitido.', 405);
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) fail('Dados inválidos.');
    if (!hash_equals($_SESSION['csrf'], (string) ($data['csrf'] ?? ''))) fail('Sessão expirada. Recarregue a página.', 403);
    $action = (string) ($data['action'] ?? '');

    if ($action === 'register') {
        $name = required($data, 'name', 100);
        $email = mb_strtolower(required($data, 'email', 254));
        $password = (string) ($data['password'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 12) fail('Informe um e-mail válido e senha com pelo menos 12 caracteres.');
        $stmt = $db->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'student')");
        try {
            $stmt->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') fail('Este e-mail já está cadastrado.');
            throw $e;
        }
        session_regenerate_id(true);
        $_SESSION['user'] = ['id' => (int) $db->lastInsertId(), 'name' => $name, 'role' => 'student'];
        reply(snapshot($db));
    }
    if ($action === 'login') {
        $email = mb_strtolower(required($data, 'email', 254));
        $stmt = $db->prepare('SELECT id, name, role, password_hash FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $found = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$found || !password_verify((string) ($data['password'] ?? ''), $found['password_hash'])) fail('E-mail ou senha inválidos.', 401);
        session_regenerate_id(true);
        $_SESSION['user'] = ['id' => (int) $found['id'], 'name' => $found['name'], 'role' => $found['role']];
        reply(snapshot($db));
    }
    if ($action === 'logout') {
        unset($_SESSION['user']);
        session_regenerate_id(true);
        reply(snapshot($db));
    }
    if ($action === 'invite_info') {
        $invite = activeInvite($db, field($data, 'token', 200));
        reply(['invite' => ['email' => $invite['email'], 'expiresAt' => $invite['expiresAt']]]);
    }
    if ($action === 'accept_invite') {
        $invite = activeInvite($db, field($data, 'token', 200));
        $name = required($data, 'name', 100);
        $password = (string) ($data['password'] ?? '');
        if (strlen($password) < 12) fail('A senha precisa ter pelo menos 12 caracteres.');
        $email = mb_strtolower($invite['email']);
        $stmt = $db->prepare('SELECT 1 FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetchColumn()) fail('Este e-mail já possui uma conta.');
        $db->beginTransaction();
        try {
            $stmt = $db->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')");
            $stmt->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
            $userId = (int) $db->lastInsertId();
            $stmt = $db->prepare('UPDATE admin_invites SET used_at = ? WHERE id = ? AND used_at IS NULL');
            $stmt->execute([date('Y-m-d H:i:s'), $invite['id']]);
            if ($stmt->rowCount() !== 1) throw new RuntimeException('Convite já utilizado.');
            $db->commit();
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            throw $e;
        }
        session_regenerate_id(true);
        $_SESSION['user'] = ['id' => $userId, 'name' => $name, 'role' => 'admin'];
        reply(snapshot($db));
    }
    if (!isset($_SESSION['user'])) fail('Entre na sua conta para continuar.', 401);

    if ($action === 'novo') {
        $local = (int) ($data['l'] ?? 0);
        $equip = (int) ($data['e'] ?? 0);
        $prio = (int) ($data['p'] ?? 0);
        if (!exists($db, 'locais', $local) || $prio < 1 || $prio > 4) fail('Local ou prioridade inválidos.');
        if ($equip) {
            $stmt = $db->prepare('SELECT 1 FROM equipamentos WHERE id = ? AND local_id = ?');
            $stmt->execute([$equip, $local]);
            if (!$stmt->fetchColumn()) fail('O equipamento não pertence ao local escolhido.');
        }
        $titulo = required($data, 't', 80);
        $descricao = required($data, 'd', 2000);
        $user = $_SESSION['user'];
        $db->beginTransaction();
        $stmt = $db->prepare("INSERT INTO chamados (user_id, local_id, equip_id, titulo, descricao, prioridade, situacao, solicitante, aberto) VALUES (?, ?, ?, ?, ?, ?, 'a', ?, ?)");
        $stmt->execute([$user['id'], $local, $equip ?: null, $titulo, $descricao, $prio, $user['name'], date('Y-m-d')]);
        $id = (int) $db->lastInsertId();
        $stmt = $db->prepare("INSERT INTO andamentos (chamado_id, quando, situacao, observacao, autor) VALUES (?, ?, 'a', 'Chamado aberto.', ?)");
        $stmt->execute([$id, date('Y-m-d H:i:s'), $user['name']]);
        $db->commit();
        reply(['id' => $id]);
    }
    admin();
    if ($action === 'invite') {
        $email = mb_strtolower(required($data, 'email', 254));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Informe um e-mail válido.');
        $stmt = $db->prepare('SELECT 1 FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetchColumn()) fail('Este e-mail já possui uma conta.');
        $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $created = date('Y-m-d H:i:s');
        $expires = date('Y-m-d H:i:s', time() + 72 * 3600);
        $stmt = $db->prepare('INSERT INTO admin_invites (email, token_hash, expires_at, created_at, created_by) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$email, inviteHash($token), $expires, $created, $_SESSION['user']['id']]);
        reply(['token' => $token, 'expiresAt' => $expires]);
    }
    if ($action === 'sit') {
        $id = (int) ($data['id'] ?? 0);
        $stmt = $db->prepare('SELECT aberto, situacao FROM chamados WHERE id = ?');
        $stmt->execute([$id]);
        $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$ticket) fail('Chamado não encontrado.', 404);
        if (in_array($ticket['situacao'], ['c', 'x'], true)) fail('Este chamado já foi encerrado.');
        $st = field($data, 'st', 1);
        if (!in_array($st, ['a', 'p', 'm', 'c', 'x'], true)) fail('Situação inválida.');
        $resp = field($data, 'resp', 100);
        $obs = field($data, 'obs', 1000);
        $dc = field($data, 'dc', 10);
        $serv = field($data, 'serv', 2000);
        if ($st === 'c' && (!$dc || !$serv)) fail('Para concluir, informe data e serviço realizado.');
        if ($st === 'c' && (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dc) || !checkdate((int) substr($dc, 5, 2), (int) substr($dc, 8, 2), (int) substr($dc, 0, 4)) || $dc < $ticket['aberto'] || $dc > date('Y-m-d'))) fail('Data de conclusão inválida.');
        $db->beginTransaction();
        $stmt = $db->prepare('UPDATE chamados SET situacao = ?, responsavel = ?, concluido = ?, servico = ? WHERE id = ?');
        $stmt->execute([$st, $resp, $st === 'c' ? $dc : null, $st === 'c' ? $serv : '', $id]);
        $stmt = $db->prepare('INSERT INTO andamentos (chamado_id, quando, situacao, observacao, autor) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$id, date('Y-m-d H:i:s'), $st, $obs ?: ($st === 'c' ? 'Serviço concluído.' : 'Situação atualizada.'), $_SESSION['user']['name']]);
        $db->commit();
        reply(snapshot($db));
    }
    if ($action === 'custo') {
        $id = (int) ($data['id'] ?? 0);
        $tipo = field($data, 'tipo', 20);
        $q = filter_var($data['q'] ?? null, FILTER_VALIDATE_FLOAT);
        $v = filter_var($data['v'] ?? null, FILTER_VALIDATE_FLOAT);
        if (!exists($db, 'chamados', $id) || !in_array($tipo, ['Material', 'Serviço'], true) || $q === false || $q <= 0 || $v === false || $v < 0) fail('Dados do custo inválidos.');
        $stmt = $db->prepare('INSERT INTO custos (chamado_id, tipo, descricao, quantidade, valor) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$id, $tipo, required($data, 'desc', 200), $q, $v]);
        reply(snapshot($db));
    }
    if ($action === 'local') {
        $tipo = field($data, 'tipo', 50);
        if (!in_array($tipo, ['Sala de aula', 'Laboratório', 'Alojamento', 'Instalação', 'Área externa', 'Administrativo'], true)) fail('Tipo de local inválido.');
        $stmt = $db->prepare('INSERT INTO locais (nome, tipo) VALUES (?, ?)');
        $stmt->execute([required($data, 'nome', 100), $tipo]);
        reply(snapshot($db));
    }
    if ($action === 'equip') {
        $local = (int) ($data['l'] ?? 0);
        if (!exists($db, 'locais', $local)) fail('Local inválido.');
        $stmt = $db->prepare('INSERT INTO equipamentos (local_id, nome, pat) VALUES (?, ?, ?)');
        $stmt->execute([$local, required($data, 'nome', 100), field($data, 'pat', 80)]);
        reply(snapshot($db));
    }
    fail('Ação desconhecida.', 404);
} catch (Throwable $e) {
    error_log((string) $e);
    fail($e instanceof RuntimeException ? $e->getMessage() : 'Não foi possível concluir a operação.', 500);
}
