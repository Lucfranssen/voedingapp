import fs from 'node:fs';
let s=fs.readFileSync('dist/app.js','utf8');
s=s.replace('data-action="${action}">Bevestigen','data-action="${esc(action)}">Bevestigen');
s=s.replace('<span class="badge">Vandaag</span>','<span class="badge">${selectedDate===dateKey()?\'Vandaag\':\'Deze dag\'}</span>');
fs.writeFileSync('dist/app.js',s);
