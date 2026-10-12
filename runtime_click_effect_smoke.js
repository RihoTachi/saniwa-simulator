const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/app.js','utf8');
const start=src.indexOf('function clickEffectCount()');const end=src.indexOf('\nfunction startIntro',start);assert(start>=0&&end>start,'effect functions must exist');
const layer={children:[],get childElementCount(){return this.children.length},append(el){this.children.push(el);el.remove=()=>{this.children=this.children.filter(x=>x!==el)}},get firstElementChild(){return this.children[0]||null},removeChild(el){this.children=this.children.filter(x=>x!==el)}};
const document={createElement(){return {style:{setProperty(k,v){this[k]=v}},className:'',textContent:'',remove(){}}}};
const context={settings:{animations:true,clickEffect:'sakura',effectAmount:'medium'},document,$:(s)=>s==='#clickEffectLayer'?layer:null,setTimeout:()=>0,Math,};
vm.createContext(context);vm.runInContext(src.slice(start,end),context);
const cases=[['sakura','effect-sakura'],['snow','effect-snow'],['butterfly','effect-butterfly'],['stars','effect-stars'],['gems','effect-gems']];
for(const [type,cls] of cases){layer.children=[];context.settings.clickEffect=type;context.petalBurst(120,220);assert.strictEqual(layer.children.length,6,`${type} should use standard density`);assert(layer.children.every(x=>x.className===`click-effect ${cls}`),`${type} class`)}
layer.children=[];context.settings.clickEffect='ripple';context.petalBurst(12,34);assert.strictEqual(layer.children.length,1);assert.strictEqual(layer.children[0].className,'click-effect ripple');
layer.children=[];context.settings.clickEffect='off';context.petalBurst(1,1);assert.strictEqual(layer.children.length,0);
context.settings.clickEffect='sakura';context.settings.effectAmount='low';layer.children=[];context.petalBurst(1,1);assert.strictEqual(layer.children.length,3);
context.settings.effectAmount='high';layer.children=[];context.petalBurst(1,1);assert.strictEqual(layer.children.length,10);
context.settings.animations=false;layer.children=[];context.petalBurst(1,1);assert.strictEqual(layer.children.length,0);
console.log(JSON.stringify({status:'PASS',checks:10,details:['five particle effects render at the configured density','ripple renders a single expanding ring','off disables effects','low/medium/high density works','animation accessibility toggle disables effects']},null,2));
