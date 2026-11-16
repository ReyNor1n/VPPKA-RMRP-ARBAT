#!/usr/bin/env python3
"""v285: правила членства не ломают текущие данные.
Прогон против эмулятора Firestore (по умолчанию 127.0.0.1:8089).
  python3 tools/emutest-v285.py [rules-file]
Если файла нет — tools/firestore-v285.rules относительно этого скрипта.
Сравнение с живыми (v282) правилами: второй аргумент или --old FILE.
"""
import json, sys, time, base64, copy, os
from pathlib import Path
import requests

P = 'demo-vppca'
E = os.environ.get('FIRESTORE_EMULATOR_HOST', '127.0.0.1:8089')
if '://' not in E:
    E = 'http://' + E
DOCS = f'{E}/v1/projects/{P}/databases/(default)/documents'
ADM = {'Authorization': 'Bearer owner'}
HERE = Path(__file__).resolve().parent

# Печкин
P_UID = 'ztjronY9qFVAye8k88ZStpIOb9j1'
P_DID = '1128648090044338357'
P_CARD = 'p_' + P_UID
# Ермолаев: принятая заявка, карточки нет
E_UID = 'K9wbXDlXQ3f3fVoLmtnsnpehGoE3'
E_DID = '570130407086096394'
# обычный член (есть mem)
M_UID = 'memberUid00000000000000000001'
M_DID = '111111111111111111'
# гость — вошёл, не член
G_UID = 'guestUid0000000000000000000001'
G_DID = '999999999999999999'

def b64(o):
    return base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip('=')

def tok(uid, email, dv=True):
    now = int(time.time())
    return b64({'alg': 'none', 'typ': 'JWT'}) + '.' + b64({
        'sub': uid, 'user_id': uid, 'email': email, 'email_verified': False, 'dv': dv,
        'iss': 'https://securetoken.google.com/' + P, 'aud': P, 'iat': now, 'exp': now + 3600,
        'auth_time': now, 'firebase': {'sign_in_provider': 'custom'}
    }) + '.'

ACTORS = {
    'pechkin': {'uid': P_UID, 'email': P_DID + '@vppka.local'},
    'ermo':    {'uid': E_UID, 'email': E_DID + '@vppka.local'},
    'member':  {'uid': M_UID, 'email': M_DID + '@vppka.local'},
    'guest':   {'uid': G_UID, 'email': G_DID + '@vppka.local'},
}

def enc(v):
    if v is None:
        return {'nullValue': None}
    if isinstance(v, bool):
        return {'booleanValue': v}
    if isinstance(v, int) and not isinstance(v, bool):
        return {'integerValue': str(v)}
    if isinstance(v, float):
        return {'doubleValue': v}
    if isinstance(v, str):
        return {'stringValue': v}
    if isinstance(v, list):
        return {'arrayValue': {'values': [enc(x) for x in v]}}
    if isinstance(v, dict):
        return {'mapValue': {'fields': {k: enc(x) for k, x in v.items()}}}
    raise TypeError(type(v))

def body(d):
    return {'fields': {k: enc(v) for k, v in d.items()}}

def put_admin(path, d):
    r = requests.patch(f'{DOCS}/{path}', headers=ADM, json=body(d))
    r.raise_for_status()

def del_admin(path):
    requests.delete(f'{DOCS}/{path}', headers=ADM)

def seed():
    r = requests.delete(f'{E}/emulator/v1/projects/{P}/databases/(default)/documents')
    if r.status_code not in (200, 204):
        r.raise_for_status()
    # минимальный состав, чтобы partyMember + linked работали
    put_admin('users/' + P_UID, {'discordId': P_DID, 'displayName': 'Печкин', 'fio': 'Печкин Максим Андреевич'})
    put_admin('users/' + E_UID, {'discordId': E_DID, 'displayName': 'Ермолаев', 'fio': 'Ермолаев'})
    put_admin('users/' + M_UID, {'discordId': M_DID, 'displayName': 'Член', 'fio': 'Член Членович'})
    put_admin('users/' + G_UID, {'discordId': G_DID, 'displayName': 'Гость', 'fio': 'Гость Гостевич'})
    put_admin('mem/' + P_UID, {'ok': True})
    put_admin('mem/' + M_UID, {'ok': True})
    put_admin('members/' + P_CARD, {
        'name': 'Печкин Максим Андреевич', 'role': 'Член партии', 'group': 'Члены партии',
        'rank': 0, 'discordId': P_DID, 'joined': '18.10.2026'
    })
    put_admin('members/p_' + M_UID, {
        'name': 'Член Членович', 'role': 'Член партии', 'group': 'Члены партии',
        'rank': 0, 'discordId': M_DID
    })
    put_admin('applications/' + P_UID, {
        'uid': P_UID, 'discordId': P_DID, 'status': 'accepted',
        'answers': {'fio': 'Печкин Максим Андреевич', 'passport': '868-753',
                    'discord': 'x', 'source': 'x', 'reason': 'x', 'bio': 'x'}
    })
    put_admin('applications/' + E_UID, {
        'uid': E_UID, 'discordId': E_DID, 'status': 'accepted',
        'answers': {'fio': 'Ермолаев', 'passport': '111-111',
                    'discord': 'x', 'source': 'x', 'reason': 'x', 'bio': 'x'}
    })
    put_admin('users/' + P_UID + '/priv/p', {'passport': '868-753', 'birth': '01.01.2000'})
    put_admin('users/' + M_UID + '/priv/p', {'passport': '123-456'})
    put_admin('users/' + G_UID + '/priv/p', {'passport': '000-001'})
    put_admin('pubStatik/' + P_CARD, {'s': '868-753'})

def load_rules(src):
    r = requests.put(f'{E}/emulator/v1/projects/{P}:securityRules',
                     json={'rules': {'files': [{'name': 'firestore.rules', 'content': src}]}})
    if not r.ok:
        print('RULES ERROR', r.text[:4000])
        sys.exit(1)

def H(actor):
    a = ACTORS[actor]
    return {'Authorization': 'Bearer ' + tok(a['uid'], a['email'])}

def req(kind, actor, path, data=None):
    h = H(actor)
    if kind == 'get':
        return requests.get(f'{DOCS}/{path}', headers=h)
    if kind == 'list':
        return requests.get(f'{DOCS}/{path}?pageSize=5', headers=h)
    if kind == 'delete':
        return requests.delete(f'{DOCS}/{path}?currentDocument.exists=true', headers=h)
    if kind == 'create':
        return requests.patch(f'{DOCS}/{path}?currentDocument.exists=false', headers=h, json=body(data))
    if kind == 'update':
        return requests.patch(f'{DOCS}/{path}?currentDocument.exists=true', headers=h, json=body(data))
    raise ValueError(kind)

CASES = [
    # существующие члены читают состав
    ('R1 член читает свою карточку', 'ALLOW', 'get', 'member', 'members/p_' + M_UID, None),
    ('R2 член читает список members', 'ALLOW', 'list', 'member', 'members', None),
    ('R3 Печкин читает свою карточку p_{uid}', 'ALLOW', 'get', 'pechkin', 'members/' + P_CARD, None),
    ('R4 Печкин читает список members', 'ALLOW', 'list', 'pechkin', 'members', None),
    ('R5 Печкин читает mem/{uid}', 'ALLOW', 'get', 'pechkin', 'mem/' + P_UID, None),
    # Ермолаев: принятая заявка без карточки — всё ещё partyMember, состав читает
    ('E1 Ермолаев без карточки читает members (принятая заявка)', 'ALLOW', 'list', 'ermo', 'members', None),
    # гость — не член
    ('G1 гость не читает members', 'DENY', 'list', 'guest', 'members', None),
    ('G2 гость не читает карточку члена', 'DENY', 'get', 'guest', 'members/' + P_CARD, None),
    # нельзя самовыдать членство
    ('G3 гость не пишет mem/{uid}', 'DENY', 'create', 'guest', 'mem/' + G_UID, {'ok': True}),
    ('G4 гость не создаёт свою карточку members/p_{uid}', 'DENY', 'create', 'guest', 'members/p_' + G_UID, {
        'name': 'Гость Гостевич', 'role': 'Член партии', 'group': 'Члены партии', 'rank': 0, 'discordId': G_DID
    }),
    ('G5 гость не меняет статус своей (несуществующей) заявки на accepted', 'DENY', 'create', 'guest', 'applications/' + G_UID, {
        'uid': G_UID, 'discordId': G_DID, 'status': 'accepted',
        'answers': {'fio': 'Гость', 'passport': '000-001', 'discord': 'x', 'source': 'x', 'reason': 'x', 'bio': 'x'}
    }),
    # Печкин не может удалить принятую заявку, пока есть карточка / mem
    ('P1 Печкин не удаляет принятую заявку при живой карточке', 'DENY', 'delete', 'pechkin', 'applications/' + P_UID, None),
    # смена статика в priv/p разрешена, членство остаётся
    ('P2 Печкин меняет статик 868-753 → 111-222 и пишет историю', 'ALLOW', 'update', 'pechkin', 'users/' + P_UID + '/priv/p', {
        'passport': '111-222', 'birth': '01.01.2000', 'passportHist': ['868-753']
    }),
    ('P3 после смены статика Печкин всё ещё читает members', 'ALLOW', 'list', 'pechkin', 'members', None),
    ('P4 после смены статика карточка на месте', 'ALLOW', 'get', 'pechkin', 'members/' + P_CARD, None),
    ('P5 после смены статика заявку с карточкой всё ещё нельзя удалить', 'DENY', 'delete', 'pechkin', 'applications/' + P_UID, None),
    ('P6 нельзя стереть статик', 'DENY', 'update', 'pechkin', 'users/' + P_UID + '/priv/p', {'birth': '01.01.2000'}),
    # Ермолаев: принятая заявка без карточки и без mem — можно удалить (повторная подача)
    ('E2 Ермолаев удаляет принятую заявку без карточки', 'ALLOW', 'delete', 'ermo', 'applications/' + E_UID, None),
]

# Сравнение с v282: P2 (hist) на живых правилах DENY; E2 на живых DENY; остальное SAME
OLD_EXPECT = {
    'P2 Печкин меняет статик 868-753 → 111-222 и пишет историю': 'DENY',  # нет passportHist в hasOnly
    'E2 Ермолаев удаляет принятую заявку без карточки': 'DENY',
}

def run(src):
    load_rules(src)
    seed()
    out = []
    for n, e, kind, actor, path, data in CASES:
        # для P3–P5 seed уже сменил? Нет: P2 пишет как пользователь, данные остаются после P2.
        # Для чистоты: полный seed только до первого кейса, дальше состояние копится
        # НО P6 зависит от passport всё ещё в документе. После P2 passport=111-222, P6 без passport — DENY ок.
        # Если P2 fail, P6 still DENY on original. Good.
        r = req(kind, actor, path, data)
        got = 'ALLOW' if r.ok else 'DENY'
        err = '' if r.ok else r.text[:1500].replace('\n', ' ')
        out.append((n, got, err))
    return out

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    new_path = Path(args[0]) if args else HERE / 'firestore-v285.rules'
    old_path = Path(args[1]) if len(args) > 1 else None
    # --old FILE
    if '--old' in sys.argv:
        old_path = Path(sys.argv[sys.argv.index('--old') + 1])
    new_src = new_path.read_text()
    print('rules', new_path, 'len', len(new_src))
    # ping emu
    try:
        requests.get(f'{E}/', timeout=2)
    except Exception as ex:
        print('EMULATOR DOWN', E, ex)
        sys.exit(2)
    results = run(new_src)
    old_results = None
    if old_path and old_path.exists():
        # отдельный прогон со свежим seed
        old_results = run(old_path.read_text())
        old_map = {n: (g, e) for n, g, e in old_results}
    bad = 0
    for n, expect, *_rest in CASES:
        # find result
        got, err = next((g, e) for nn, g, e in results if nn == n)
        ok = got == expect
        extra = ''
        if old_results:
            og, oe = old_map[n]
            want_old = OLD_EXPECT.get(n, expect)
            extra = f' | v282 {og} (ждём {want_old})'
            if og != want_old:
                ok = False
                extra += ' MISMATCH-OLD ' + oe
        bad += not ok
        print(('OK  ' if ok else 'FAIL'), n, '| стало', got, '| ждём', expect, extra, '' if ok else err)
    print('failures', bad)
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main()
