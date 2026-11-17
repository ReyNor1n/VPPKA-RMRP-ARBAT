#!/usr/bin/env python3
"""v286: ФИО полностью (3–4 слова). Прогон против эмулятора Firestore (по умолчанию 127.0.0.1:8089).
  python3 tools/emutest-v286.py [rules-file] [--old live.rules]
Каждый кейс — после предыдущего (состояние копится); A2/N2 сначала убирают документ A1/N1.
Использует сид и помощники из emutest-v285.py (Печкин, Ермолаев, член, гость).
"""
import importlib.util, sys, time
from pathlib import Path
import requests

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('e285', HERE / 'emutest-v285.py')
e = importlib.util.module_from_spec(spec); spec.loader.exec_module(e)

N_UID = 'newUid000000000000000000000001'
N_DID = '222222222222222222'
e.ACTORS['new'] = {'uid': N_UID, 'email': N_DID + '@vppka.local'}
OWN_UID = 'ownerUid0000000000000000000001'
e.ACTORS['owner'] = {'uid': OWN_UID, 'email': 'owner@vppka.local'}
_seed0 = e.seed
def seed():
    _seed0()
    e.put_admin('config/owners', {'uids': [OWN_UID]})
e.seed = seed

def ans(fio):
    return {'fio': fio, 'passport': '000-001', 'discord': 'x', 'source': 'x', 'reason': 'x', 'bio': ''}

def commit(actor, path, data, ts=('createdAt',), exists=False):
    w = {'update': {'name': f'projects/{e.P}/databases/(default)/documents/{path}', **e.body(data)},
         'currentDocument': {'exists': exists},
         'updateTransforms': [{'fieldPath': f, 'setToServerValue': 'REQUEST_TIME'} for f in ts]}
    return requests.post(f'{e.DOCS}:commit', headers=e.H(actor), json={'writes': [w]})

def upd(actor, path, data):
    mask = '&'.join('updateMask.fieldPaths=' + k for k in data)
    return requests.patch(f'{e.DOCS}/{path}?currentDocument.exists=true&{mask}', headers=e.H(actor), json=e.body(data))

def updel(actor, path, field):
    return requests.patch(f'{e.DOCS}/{path}?currentDocument.exists=true&updateMask.fieldPaths={field}', headers=e.H(actor), json={'fields': {}})

M = 'users/' + e.M_UID
CASES = [  # (имя, ждём на v286, ждём на живых v285, функция)
    ('A1 заявка с сайта: «Гость Гостевич» (2 слова) — отказ', 'DENY', 'ALLOW',
     lambda: commit('guest', 'applications/' + e.G_UID, {'answers': ans('Гость Гостевич'), 'status': 'new', 'uid': e.G_UID, 'discordId': e.G_DID})),
    ('A2 заявка с сайта: «Гостев Гость Гостевич» — можно', 'ALLOW', 'ALLOW',
     lambda: e.del_admin('applications/' + e.G_UID) or commit('guest', 'applications/' + e.G_UID, {'answers': ans('Гостев Гость Гостевич'), 'status': 'new', 'uid': e.G_UID, 'discordId': e.G_DID})),
    ('A3 заявка из Discord (бот/владелец) с 2 словами — по-прежнему можно (проверку делает бот)', 'ALLOW', 'ALLOW',
     lambda: commit('owner', 'applications/discordTest1', {'answers': ans('Гость Гостевич'), 'status': 'new', 'source': 'discord', 'discordSourceId': '123', 'discordId': '333333333333333333'})),
    ('U1 член с ФИО из 2 слов меняет «о себе», ФИО не трогает — можно', 'ALLOW', 'ALLOW',
     lambda: upd('member', M, {'about': 'привет'})),
    ('U2 член сохраняет то же ФИО из 2 слов (кабинет шлёт поле) — можно', 'ALLOW', 'ALLOW',
     lambda: upd('member', M, {'fio': 'Член Членович', 'about': 'привет2'})),
    ('U3 член меняет ФИО на другое из 2 слов — отказ', 'DENY', 'ALLOW',
     lambda: upd('member', M, {'fio': 'Членов Член'})),
    ('U4 член стирает ФИО — отказ', 'DENY', 'ALLOW',
     lambda: updel('member', M, 'fio')),
    ('U5 член дописывает отчество «Членов Член Членович» — можно', 'ALLOW', 'ALLOW',
     lambda: upd('member', M, {'fio': 'Членов Член Членович'})),
    ('U6 после смены ФИО член читает состав (членство на месте)', 'ALLOW', 'ALLOW',
     lambda: e.req('list', 'member', 'members')),
    ('U7 после смены ФИО карточка члена на месте', 'ALLOW', 'ALLOW',
     lambda: e.req('get', 'member', 'members/p_' + e.M_UID)),
    ('N1 новый профиль с ФИО из 2 слов — отказ', 'DENY', 'ALLOW',
     lambda: commit('new', 'users/' + N_UID, {'discordId': N_DID, 'discordLink': 'https://discord.com/users/' + N_DID, 'displayName': 'Новиков Новик', 'fio': 'Новиков Новик'})),
    ('N2 новый профиль с ФИО из 3 слов — можно', 'ALLOW', 'ALLOW',
     lambda: e.del_admin('users/' + N_UID) or commit('new', 'users/' + N_UID, {'discordId': N_DID, 'discordLink': 'https://discord.com/users/' + N_DID, 'displayName': 'Новиков Новик Новикович', 'fio': 'Новиков Новик Новикович'})),
]

def run(src):
    e.load_rules(src); e.seed()
    out = {}
    for n, _new, _old, fn in CASES:
        r = fn()
        out[n] = ('ALLOW' if r.ok else 'DENY', '' if r.ok else r.text[:300].replace('\n', ' '))
    return out

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    new = Path(args[0]) if args else HERE / 'firestore-v286.rules'
    old = Path(sys.argv[sys.argv.index('--old') + 1]) if '--old' in sys.argv else None
    rn = run(new.read_text())
    ro = run(old.read_text()) if old else {}
    bad = 0
    for n, wn, wo, _ in CASES:
        g, err = rn[n]; ok = g == wn; extra = ''
        if ro:
            go = ro[n][0]; extra = f' | живые {go} (ждём {wo})'
            if go != wo: ok = False
        bad += not ok
        print('OK  ' if ok else 'FAIL', n, '| v286', g, '| ждём', wn, extra, '' if ok else err)
    print('failures', bad)
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main()
