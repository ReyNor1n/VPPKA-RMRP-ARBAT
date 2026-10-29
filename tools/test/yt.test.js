// node tools/test/yt.test.js — проверка разбора ссылок YouTube (yt.js)
const Y=require('../../yt.js');const I='dQw4w9WgXcQ',L='PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI';
const T=[
 // [ссылка, id, list, start]
 [I,I,'',0],
 ['https://www.youtube.com/watch?v='+I,I,'',0],
 ['https://youtube.com/watch?v='+I,I,'',0],
 ['http://www.youtube.com/watch?v='+I,I,'',0],
 ['www.youtube.com/watch?v='+I,I,'',0],
 ['youtube.com/watch?v='+I,I,'',0],
 ['//www.youtube.com/watch?v='+I,I,'',0],
 ['https://m.youtube.com/watch?v='+I+'&feature=share',I,'',0],
 ['https://music.youtube.com/watch?v='+I+'&si=AbCdEf12345',I,'',0],
 ['https://gaming.youtube.com/watch?v='+I,I,'',0],
 ['https://www.youtube.com/watch?feature=youtu.be&v='+I+'&pp=ygUJcmljayByb2xs',I,'',0],
 ['https://www.youtube.com/watch?v='+I+'&t=90',I,'',90],
 ['https://www.youtube.com/watch?v='+I+'&t=90s',I,'',90],
 ['https://www.youtube.com/watch?v='+I+'&t=1m30s',I,'',90],
 ['https://www.youtube.com/watch?v='+I+'&t=1h2m3s',I,'',3723],
 ['https://www.youtube.com/watch?v='+I+'#t=1m5s',I,'',65],
 ['https://www.youtube.com/watch?v='+I+'&start=42',I,'',42],
 ['https://www.youtube.com/watch?time_continue=17&v='+I,I,'',17],
 ['https://www.youtube.com/watch?v='+I+'&list='+L+'&index=3',I,L,0],
 ['https://www.youtube.com/watch?v='+I+'&list=RD'+I+'&start_radio=1',I,'RD'+I,0],
 ['https://www.youtube.com/watch?v='+I+'&list=WL',I,'',0],
 ['https://youtu.be/'+I,I,'',0],
 ['youtu.be/'+I,I,'',0],
 ['https://youtu.be/'+I+'?si=Xy_12-ab&t=75',I,'',75],
 ['https://youtu.be/'+I+'?list='+L,I,L,0],
 ['https://www.youtube.com/shorts/'+I,I,'',0],
 ['https://youtube.com/shorts/'+I+'?si=abc123',I,'',0],
 ['https://www.youtube.com/live/'+I+'?si=abc&t=600',I,'',600],
 ['https://www.youtube.com/embed/'+I,I,'',0],
 ['https://www.youtube.com/embed/'+I+'?start=30&autoplay=1',I,'',30],
 ['https://www.youtube-nocookie.com/embed/'+I+'?rel=0',I,'',0],
 ['https://www.youtube.com/embed/videoseries?list='+L,'',L,0],
 ['https://www.youtube.com/v/'+I+'?version=3',I,'',0],
 ['https://www.youtube.com/e/'+I,I,'',0],
 ['https://www.youtube.com/watch/'+I,I,'',0],
 ['https://www.youtube.com/playlist?list='+L,'',L,0],
 ['https://music.youtube.com/playlist?list='+L+'&si=zz','',L,0],
 ['https://m.youtube.com/playlist?list='+L,'',L,0],
 ['https://www.youtube.com/attribution_link?a=xyz&u=%2Fwatch%3Fv%3D'+I+'%26feature%3Dshare',I,'',0],
 ['https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D'+I+'&format=json',I,'',0],
 ['https://consent.youtube.com/m?continue=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D'+I+'%26cbrd%3D1',I,'',0],
 ['https://www.youtube.com/#/watch?v='+I,I,'',0],
 ['https://www.youtube.com/watch#!v='+I,I,'',0],
 ['https://www.youtube.com/watch_videos?video_ids='+I+',abcdefghijk',I,'',0],
 ['  <https://WWW.YOUTUBE.COM/watch?v='+I+'>  ',I,'',0],
 ['https://www.youtube.com/watch?v='+I+'.',I,'',0],
 ['HTTPS://YOUTU.BE/'+I,I,'',0],
 // не YouTube / нет видео → null
 ['https://www.youtube.com/@channel',null],
 ['https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv',null],
 ['https://www.youtube.com/watch?v=short',null],
 ['https://notyoutube.com/watch?v='+I,null],
 ['https://youtube.com.evil.ru/watch?v='+I,null],
 ['javascript:alert(1)//youtube.com/watch?v='+I,null],
 ['https://www.youtube.com/playlist?list=WL',null],
 ['',null],['hello world',null],
];
let ok=0,bad=0;for(const [u,id,list,start] of T){const r=Y.parse(u);const pass=id===null?r===null:!!r&&r.id===id&&r.list===list&&r.start===start;
 if(pass)ok++;else{bad++;console.log('FAIL',JSON.stringify(u),'→',JSON.stringify(r),'expected',id===null?null:{id,list,start})}}
// встраивание
const e1=Y.embed(Y.parse('https://youtu.be/'+I+'?t=90'),{autoplay:1,api:1,origin:'https://vppka-arbat-rmrp.ru'});
const e2=Y.embed(Y.parse('https://www.youtube.com/playlist?list='+L));
const e3=Y.embed(Y.parse('https://www.youtube.com/watch?v='+I+'&list='+L));
const chk=[[e1.startsWith('https://www.youtube-nocookie.com/embed/'+I+'?')&&/start=90/.test(e1)&&/autoplay=1/.test(e1)&&/enablejsapi=1/.test(e1),'embed video+start'],
 [e2==='https://www.youtube-nocookie.com/embed/videoseries?list='+L+'&rel=0&playsinline=1','embed playlist'],
 [e3.startsWith('https://www.youtube-nocookie.com/embed/'+I+'?list='+L),'embed video in playlist'],
 [Y.canon(Y.parse('youtu.be/'+I+'?t=1m30s'))==='https://www.youtube.com/watch?v='+I+'&t=90s','canon'],
 [Y.canon(Y.parse(I))==='https://www.youtube.com/watch?v='+I,'canon bare id']];
for(const [c,n] of chk){if(c)ok++;else{bad++;console.log('FAIL',n)}}
console.log(`yt.js: ${ok} passed, ${bad} failed (${T.length} ссылок + ${chk.length} проверок встраивания)`);process.exit(bad?1:0);
