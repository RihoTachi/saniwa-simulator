const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/app.js','utf8');
function extract(start,end){const a=src.indexOf(start),b=src.indexOf(end,a);assert(a>=0&&b>a,`extract ${start}`);return src.slice(a,b)}
const calls=[];let inputs={charcoal:50,steel:50,coolant:50,stone:50};
const context={
 state:{flags:{firstSwordForgeUnlocked:true},resource:{charcoal:2500,steel:2500,coolant:2500,stone:2500},forgeQueue:[],tasks:{},day:1,minute:500,people:{government:{swords:[]}}},
 DEFAULT_ROSTER:{短刀:['今剑'],胁差:['笑面青江'],打刀:['加州清光'],太刀:['烛台切光忠'],大太刀:['石切丸'],枪:['御手杵'],薙刀:['岩融'],剑:['白山吉光']},
 characterProfile:n=>({forgeTime:n==='今剑'?'0:20:00':''}),uid:()=>`id${Math.random()}`,totalGameMinutes:()=>500,
 $:(sel)=>({value:String(inputs[sel.replace('#forge','').toLowerCase()]??'')}),
 openModal:(title,body,actions)=>{const btns={};const m={querySelector(sel){return btns[sel]||(btns[sel]={onclick:null})}};calls.push({title,body,m});return m},modalActions:()=>'',toast:msg=>calls.push({toast:msg}),
 advanceTime:()=>{},pushActivity:(...a)=>calls.push({activity:a}),renderResources:()=>{},renderTasks:()=>{},saveGame:()=>{},closeModal:()=>{},esc:x=>String(x)
};
vm.createContext(context);
vm.runInContext(extract('function determineSwordType(nums){','function openEquipmentModal()'),context);
context.roster=context.DEFAULT_ROSTER;
vm.runInContext(extract('function openForgeModal(){','function openEquipmentModal()'),context);
function startForge(){context.openForgeModal();const item=calls.filter(x=>x.title==='锻刀室').at(-1);assert(item,'forge modal opened');const handler=item.m.querySelector('[data-confirm]');assert(handler.onclick,'confirm handler registered');handler.onclick();}
startForge();
assert.strictEqual(context.state.forgeQueue.length,1);assert.strictEqual(context.state.forgeQueue[0].name,'今剑');assert.strictEqual(context.state.forgeQueue[0].durationMinutes,20);assert.strictEqual(context.state.resource.charcoal,2450);assert(calls.some(x=>x.title==='锻刀开始'));
inputs={charcoal:350,steel:350,coolant:350,stone:350};startForge();
assert.strictEqual(context.state.forgeQueue.length,2);assert.strictEqual(context.state.forgeQueue[1].kind,'太刀');assert.strictEqual(context.state.forgeQueue[1].durationMinutes,180);assert.strictEqual(context.state.resource.charcoal,2100);
assert.strictEqual(context.parseForgeMinutes('0:20:00'),20);assert.strictEqual(context.parseForgeMinutes('3:00:00'),180);
console.log(JSON.stringify({forgeModalOpened:true,confirmHandlerRan:true,recipesTested:2,queueLength:context.state.forgeQueue.length,results:context.state.forgeQueue.map(x=>({name:x.name,kind:x.kind,durationMinutes:x.durationMinutes})),resourceDeducted:context.state.resource.charcoal===2100,errors:[]},null,2));
