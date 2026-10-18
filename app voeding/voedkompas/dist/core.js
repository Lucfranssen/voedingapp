export const VERSION = 1;
export const MEALS = ['Ontbijt','Lunch','Avondeten','Tussendoor','Supplementen'];
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const shiftDate = (key,n) => { const d=new Date(key+'T12:00:00');d.setDate(d.getDate()+n);return dateKey(d); };
export const fmt = (n,d=0) => Number.isFinite(n)?new Intl.NumberFormat('nl-NL',{maximumFractionDigits:d}).format(n):'—';
export const escapeHTML = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const emptyState = () => ({version:VERSION,entries:[],water:{},notes:{},foods:[],favorites:[],goals:{},profile:{name:'',waterGoal:2000},completed:[],createdAt:new Date().toISOString()});
const finite = n => typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1e9;
export function totals(entries,nutrients) {
  const result={};
  for(const n of nutrients){
    let sum=0,known=0;
    for(const e of entries){const v=e.food?.values?.[n.id];if(finite(v)){sum+=v*e.amount/(e.food.basis==='dose'?1:100);known++;}}
    result[n.id]={value:sum,known,total:entries.length,complete:entries.length>0&&known===entries.length};
  }return result;
}
export function daily(state,date,nutrients){
  const entries=state.entries.filter(e=>e.date===date);
  const values=totals(entries,nutrients);
  if(values.water)values.water={value:state.water[date]||0,known:1,total:1,complete:true};
  return {entries,values};
}
export function daysSummary(state,end,length,nutrients){
  return Array.from({length},(_,i)=>{const date=shiftDate(end,i-length+1);return {date,...daily(state,date,nutrients),completed:state.completed.includes(date)};});
}
export function average(days,id){
  const recorded=days.filter(d=>d.entries.length);
  const known=recorded.filter(d=>d.values[id]?.known>0);
  return {value:known.length?known.reduce((s,d)=>s+d.values[id].value,0)/known.length:null,days:known.length,recorded:recorded.length,complete:known.length>0&&known.every(d=>d.values[id].complete)};
}
export function cleanFood(raw,nutrients){
  if(!raw||typeof raw!=='object'||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>160)throw new Error('Een productnaam ontbreekt of is te lang.');
  if(!raw.values||typeof raw.values!=='object'||Array.isArray(raw.values))throw new Error('Productwaarden ontbreken.');
  const values={};for(const n of nutrients){const v=raw.values[n.id];if(v===null||v===undefined||v==='')continue;if(!finite(v))throw new Error('Ongeldige voedingswaarde voor '+n.name);values[n.id]=v;}
  if(!Object.keys(values).length)throw new Error('Vul minstens één voedingswaarde in.');
  return {id:typeof raw.id==='string'?raw.id.slice(0,100):uid(),name:raw.name.trim(),emoji:typeof raw.emoji==='string'?raw.emoji.slice(0,12):'🥣',category:typeof raw.category==='string'?raw.category.slice(0,60):'Eigen producten',serving:finite(raw.serving)&&raw.serving>0?raw.serving:100,basis:raw.basis==='dose'?'dose':'100g',values,source:typeof raw.source==='string'&&/^https:\/\//.test(raw.source)?raw.source:'',sourceName:typeof raw.sourceName==='string'?raw.sourceName.slice(0,180):'Eigen invoer',ingredients:typeof raw.ingredients==='string'?raw.ingredients.slice(0,3000):'',allergens:typeof raw.allergens==='string'?raw.allergens.slice(0,500):''};
}
export function validateBackup(raw,nutrients){
  if(!raw||raw.version!==VERSION||!Array.isArray(raw.entries)||!Array.isArray(raw.foods))throw new Error('Dit is geen geldige VoedKompas-back-up (versie 1).');
  if(raw.entries.length>100000||raw.foods.length>10000)throw new Error('De back-up is te groot.');
  const s=emptyState();const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&dateKey(new Date(d+'T12:00:00'))===d;
  s.foods=raw.foods.map(f=>cleanFood(f,nutrients));
  s.entries=raw.entries.map(e=>{if(!validDate(e.date)||!MEALS.includes(e.meal)||!finite(e.amount)||e.amount<=0||e.amount>100000)throw new Error('Een dagboekregel is ongeldig.');return {id:uid(),date:e.date,meal:e.meal,amount:e.amount,food:cleanFood(e.food,nutrients)};});
  for(const [d,v] of Object.entries(raw.water||{})){if(!validDate(d)||!finite(v)||v>30000)throw new Error('Ongeldige waterregistratie.');s.water[d]=v;}
  for(const [d,v] of Object.entries(raw.notes||{})){if(validDate(d)&&typeof v==='string')s.notes[d]=v.slice(0,3000);}
  for(const n of nutrients){const v=raw.goals?.[n.id];if(v!==undefined){if(!finite(v)||v<=0)throw new Error('Ongeldig dagdoel.');s.goals[n.id]=v;}}
  s.favorites=Array.isArray(raw.favorites)?raw.favorites.filter(x=>typeof x==='string').slice(0,10000):[];
  s.completed=Array.isArray(raw.completed)?raw.completed.filter(validDate):[];
  s.profile={name:typeof raw.profile?.name==='string'?raw.profile.name.slice(0,60):'',waterGoal:finite(raw.profile?.waterGoal)&&raw.profile.waterGoal>0?raw.profile.waterGoal:2000};
  return s;
}
export function recipeFood(name,parts,cookedWeight,nutrients){
  if(!parts.length||parts.some(p=>p.food.basis==='dose')||!Number.isFinite(cookedWeight)||cookedWeight<=0)throw new Error('Voeg ingrediënten en een geldig totaalgewicht toe.');
  const result=totals(parts,nutrients),values={};
  for(const n of nutrients){if(result[n.id].complete)values[n.id]=result[n.id].value*100/cookedWeight;}
  return cleanFood({id:uid(),name,emoji:'🍲',category:'Recepten',values,serving:Math.min(300,cookedWeight),sourceName:'Eigen recept · berekend uit ingrediënten',ingredients:parts.map(p=>`${p.amount} g ${p.food.name}`).join(', ')},nutrients);
}
export function fromOpenFoodFacts(product,barcode,nutrients){
  if(!product||!product.product_name&&!product.product_name_nl)throw new Error('Dit product heeft nog geen bruikbare productnaam.');
  const map={energy:'energy-kcal',protein:'proteins',carbs:'carbohydrates',fat:'fat',saturatedFat:'saturated-fat',sugar:'sugars',fiber:'fiber',salt:'salt',vitaminA:'vitamin-a',vitaminD:'vitamin-d',vitaminE:'vitamin-e',vitaminK:'vitamin-k',vitaminC:'vitamin-c',vitaminB1:'vitamin-b1',vitaminB2:'vitamin-b2',vitaminB3:'vitamin-pp',vitaminB6:'vitamin-b6',folate:'folates',vitaminB12:'vitamin-b12',biotin:'biotin',vitaminB5:'pantothenic-acid',potassium:'potassium',chloride:'chloride',calcium:'calcium',phosphorus:'phosphorus',magnesium:'magnesium',iron:'iron',zinc:'zinc',copper:'copper',manganese:'manganese',fluoride:'fluoride',selenium:'selenium',chromium:'chromium',molybdenum:'molybdenum',iodine:'iodine'};
  const values={};for(const n of nutrients){const raw=product.nutriments?.[map[n.id]+'_100g'];if(raw===undefined||raw===null||raw==='')continue;let v=Number(raw);if(!Number.isFinite(v)||v<0)continue;if(n.group!=='macro')v*=n.unit==='µg'?1e6:n.unit==='mg'?1000:1;values[n.id]=v;}
  const energyKj=product.nutriments?.energy_100g;
  if(values.energy===undefined&&energyKj!==null&&energyKj!==undefined&&energyKj!==''&&finite(Number(energyKj)))values.energy=Number(energyKj)/4.184;
  return cleanFood({id:'off-'+barcode,name:product.product_name_nl||product.product_name,emoji:'📦',category:'Barcodeproducten',serving:100,values,source:`https://world.openfoodfacts.org/product/${barcode}`,sourceName:'Open Food Facts · controleer het etiket',ingredients:product.ingredients_text_nl||product.ingredients_text||'',allergens:product.allergens||''},nutrients);
}
