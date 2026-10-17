// Usage: node tools/reset-password.mjs --discord <link|id|username>
// Sets a random temporary password for the site user <discordId>@vppka.local.
// Credentials: /workspace/.vppka-firebase-sa.json (never commit). firebase-admin lives in /workspace/vppka-admin.
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { randomInt } from 'crypto';
const require = createRequire('/workspace/vppka-admin/package.json');
const admin = require('firebase-admin');
const i = process.argv.indexOf('--discord'); const raw = i > 0 ? process.argv[i + 1] : '';
if (!raw) { console.error('Usage: node tools/reset-password.mjs --discord <link|id|username>'); process.exit(1); }
const m = raw.trim().match(/discord(?:app)?\.com\/users\/(\d+)/);
const id = (m ? m[1] : raw.trim().replace(/^@/, '')).toLowerCase();
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync('/workspace/.vppka-firebase-sa.json', 'utf8'))) });
let u;
try { u = await admin.auth().getUserByEmail(`${id}@vppka.local`); }
catch (e) { console.error(`User not found: ${id}@vppka.local`); process.exit(2); }
const C = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let pw; do { pw = Array.from({ length: 12 }, () => C[randomInt(C.length)]).join(''); } while (!/\d/.test(pw) || !/[a-z]/.test(pw) || !/[A-Z]/.test(pw));
await admin.auth().updateUser(u.uid, { password: pw });
let name = u.displayName || '';
try { const d = await admin.firestore().doc(`users/${u.uid}`).get(); if (d.exists) name = d.data().displayName || d.data().name || name; } catch {}
console.log(`User: ${name || '(no name)'} | uid ${u.uid} | ${u.email}`);
console.log(`Temporary password: ${pw}`);
