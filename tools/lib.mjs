// Общие функции для служебных скриптов (запускаются только на компьютере администратора).
// Учётные данные keymaster хранятся ВНЕ репозитория: /workspace/.vppka-keymaster (JSON {email,password,uid}).
import fs from 'node:fs'; import crypto from 'node:crypto';
export const API_KEY='AIzaSyAkQy3J_73B9vwFBnZ0mS8xt2ZMG3Twn-8', PROJECT='vppca-rmrp';
export const CRED=process.env.VPPKA_KEYMASTER||'/workspace/.vppka-keymaster';
const BASE=process.env.FIRESTORE_EMULATOR_HOST?`http://${process.env.FIRESTORE_EMULATOR_HOST}/v1`:'https://firestore.googleapis.com/v1';
const AUTH=process.env.FIREBASE_AUTH_EMULATOR_HOST?`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1`:'https://identitytoolkit.googleapis.com/v1';
export const DOCS=`${BASE}/projects/${PROJECT}/databases/(default)/documents`;
export const sha256=t=>crypto.createHash('sha256').update(t,'utf8').digest('hex');
// та же нормализация, что и на сайте (auth.js → did)
export function did(raw){const s=String(raw||'').trim();let m=s.match(/^(?:https?:\/\/)?(?:www\.)?(?:discord(?:app)?\.com)\/users\/(\d{15,21})\/?$/i);if(m)return m[1];
 m=s.replace(/^@/,'').toLowerCase();if(/^(?!.*\.\.)[a-z0-9_.]{2,32}$/.test(m))return m;return null;}
export async function authCall(method,body){const r=await fetch(`${AUTH}/accounts:${method}?key=${API_KEY}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw new Error(method+': '+(j.error&&j.error.message));return j;}
export async function login(){if(!fs.existsSync(CRED))throw new Error(`Нет файла ${CRED}. Сначала: node tools/create-keymaster.mjs`);const c=JSON.parse(fs.readFileSync(CRED,'utf8'));
 const j=await authCall('signInWithPassword',{email:c.email,password:c.password,returnSecureToken:true});return {token:j.idToken,uid:j.localId};}
export const enc=v=>v===null?{nullValue:null}:typeof v==='boolean'?{booleanValue:v}:Number.isInteger(v)?{integerValue:String(v)}:typeof v==='number'?{doubleValue:v}:v instanceof Date?{timestampValue:v.toISOString()}:Array.isArray(v)?{arrayValue:{values:v.map(enc)}}:typeof v==='object'?{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,enc(x)]))}}:{stringValue:String(v)};
export const dec=x=>'stringValue' in x?x.stringValue:'integerValue' in x?Number(x.integerValue):'booleanValue' in x?x.booleanValue:'doubleValue' in x?x.doubleValue:'timestampValue' in x?x.timestampValue:'nullValue' in x?null:'arrayValue' in x?(x.arrayValue.values||[]).map(dec):'mapValue' in x?Object.fromEntries(Object.entries(x.mapValue.fields||{}).map(([k,v])=>[k,dec(v)])):x;
export const fields=o=>({fields:Object.fromEntries(Object.entries(o).map(([k,v])=>[k,enc(v)]))});
export async function fs_(token,method,path,body,query=''){const r=await fetch(`${DOCS}/${path}${query}`,{method,headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});const t=await r.text();let j={};try{j=JSON.parse(t)}catch{};return {status:r.status,json:j};}
export const docData=d=>d&&d.fields?Object.fromEntries(Object.entries(d.fields).map(([k,v])=>[k,dec(v)])):null;
export async function listKeys(token){const out=[];let pt='';do{const r=await fs_(token,'GET','accessKeys',null,`?pageSize=300${pt?'&pageToken='+pt:''}`);if(r.status!==200)throw new Error('Чтение ключей: '+r.status+' '+JSON.stringify(r.json));(r.json.documents||[]).forEach(d=>out.push({hash:d.name.split('/').pop(),...docData(d)}));pt=r.json.nextPageToken||'';}while(pt);return out;}
export function args(){const a={},p=process.argv.slice(2);for(let i=0;i<p.length;i++){if(p[i].startsWith('--')){const k=p[i].slice(2);a[k]=p[i+1]&&!p[i+1].startsWith('--')?p[++i]:true}else(a._??=[]).push(p[i])}return a;}
