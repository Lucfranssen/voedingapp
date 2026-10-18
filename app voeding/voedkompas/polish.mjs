import fs from 'node:fs';
const file='dist/app.js';let s=fs.readFileSync(file,'utf8');
s=s.replaceAll('fmt(target(n))','fmt(target(n),2)').replaceAll('fmt(target(n),1)','fmt(target(n),2)');
s=s.replace("s.note?' — '+esc(s.note):''","(s.note||s.description)?' — '+esc(s.note||s.description):''");
s=s.replace('${fmt(v.value,precision(n))}<small>${n.unit}</small>','${v.total&&!v.known?\'—\':fmt(v.value,precision(n))}<small>${n.unit}</small>');
s=s.replace('${fmt(t.energy.value)} kcal','${t.energy.known?fmt(t.energy.value):\'—\'} kcal');
s=s.replace("${n.kind==='limit'?'Grens':n.kind==='reference'?'Referentie':'Etiketreferentie'}","${n.kind==='limit'?'Grens':v.total&&!v.complete?'Deels bekend':n.kind==='minimum'&&v.complete&&v.value<target(n)?'Onder referentie':'Referentie'}");
s=s.replace("const precision=n=>n.unit==='µg'?1:['energy','water'].includes(n.id)?0:1;","const precision=n=>['energy','water'].includes(n.id)?0:2;");
fs.writeFileSync(file,s);
