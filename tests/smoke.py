"""Run only against a disposable local database and PHP server."""
import json
import os
import urllib.error
import urllib.request
from http.cookiejar import CookieJar
from uuid import uuid4

base = os.environ.get("TEST_BASE_URL", "")
assert base.startswith("http://127.0.0.1:") or base.startswith("http://localhost:"), "Use a local test server"
admin_email = os.environ["TEST_ADMIN_EMAIL"]
admin_password = os.environ["TEST_ADMIN_PASSWORD"]


def client():
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))


def call(browser, action=None, **fields):
    payload = None if action is None else json.dumps({"action": action, **fields}).encode()
    request = urllib.request.Request(base + "/api.php", payload, {"Content-Type": "application/json"})
    try:
        with browser.open(request) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, json.load(error)


student = client()
status, initial = call(student)
assert status == 200 and initial["user"] is None
csrf = initial["csrf"]
status, created = call(student, "register", csrf=csrf, name="Aluno Teste", email=f"aluno-{uuid4().hex}@example.test", password="SenhaDeTeste123")
assert status == 200 and created["user"]["role"] == "student"
assert created["db"]["c"] == [] and created["db"]["k"] == []
status, forbidden = call(student, "local", csrf=csrf, nome="Proibido", tipo="Instalação")
assert status == 403 and forbidden["error"]
status, forbidden = call(student, "invite", csrf=csrf, email=f"admin-{uuid4().hex}@example.test")
assert status == 403 and forbidden["error"]
status, ticket = call(student, "novo", csrf=csrf, l=1, e=1, t="Teste do aluno", d="Descrição do teste", p=2)
assert status == 200 and ticket["id"] > 0
ticket_id = ticket["id"]
status, own = call(student)
assert status == 200 and [x["id"] for x in own["db"]["c"]] == [ticket_id]
status, forbidden = call(student, "sit", csrf=csrf, id=ticket_id, st="c", dc="2026-10-24", serv="Teste")
assert status == 403 and forbidden["error"]

manager = client()
status, initial = call(manager)
assert status == 200
status, dashboard = call(manager, "login", csrf=initial["csrf"], email=admin_email, password=admin_password)
assert status == 200 and dashboard["user"]["role"] == "admin"
assert ticket_id in [x["id"] for x in dashboard["db"]["c"]]
status, invalid = call(manager, "sit", csrf=initial["csrf"], id=ticket_id, st="c", resp="Equipe", dc="", serv="")
assert status == 400 and invalid["error"]
status, updated = call(manager, "sit", csrf=initial["csrf"], id=ticket_id, st="p", resp="Equipe", obs="Em análise")
assert status == 200 and next(x for x in updated["db"]["c"] if x["id"] == ticket_id)["st"] == "p"
status, cost = call(manager, "custo", csrf=initial["csrf"], id=ticket_id, tipo="Material", desc="Peça de teste", q=1, v=10)
assert status == 200 and any(x["chId"] == ticket_id for x in cost["db"]["k"])
status, own = call(student)
assert status == 200 and own["db"]["k"] == []
assert next(x for x in own["db"]["c"] if x["id"] == ticket_id)["st"] == "p"

invitee = client()
status, invitee_initial = call(invitee)
assert status == 200 and invitee_initial["user"] is None
invite_email = f"admin-{uuid4().hex}@example.test"
status, issued = call(manager, "invite", csrf=initial["csrf"], email=invite_email)
assert status == 200 and issued["token"] and issued["expiresAt"]
status, invite_info = call(invitee, "invite_info", csrf=invitee_initial["csrf"], token=issued["token"])
assert status == 200 and invite_info["invite"]["email"] == invite_email
status, accepted = call(invitee, "accept_invite", csrf=invitee_initial["csrf"], token=issued["token"], name="Admin convidado", password="SenhaDeTeste123")
assert status == 200 and accepted["user"]["role"] == "admin" and accepted["user"]["name"] == "Admin convidado"
reuser = client()
status, reuser_initial = call(reuser)
assert status == 200 and reuser_initial["user"] is None
status, reused = call(reuser, "invite_info", csrf=reuser_initial["csrf"], token=issued["token"])
assert status == 410 and reused["error"]
print("OK: cadastro, isolamento, autorização, convites de administrador, conclusão, custos e persistência")
