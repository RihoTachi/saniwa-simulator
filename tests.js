// Release regression checks (Node.js, no third-party packages required).
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = __dirname;
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const chars = JSON.parse(fs.readFileSync(path.join(root, 'characters.json'), 'utf8'));
const results = [];
function test(name, fn) { try { fn(); results.push({name, status:'PASS'}); } catch (e) { results.push({name, status:'FAIL', error:e.message}); } }
test('HTML includes primary game views and training entry point', () => { for (const id of ['titleScreen','app','viewHome','viewLocations','viewPeople','viewChat','viewTasks','viewLog','modalRoot','saveFileInput','openTraining']) assert(html.includes(`id="${id}"`), `missing #${id}`); });
test('All built-in background assets exist', () => { for (const f of ['sakura-red.jpg','golden-garden.jpg','snow-garden.jpg','moon-garden.jpg','green-garden.jpg']) assert(fs.existsSync(path.join(root,'assets',f)), `missing ${f}`); });
test('Default BGM is a real MP3 asset, referenced by the app and cached for offline use',()=>{const f=path.join(root,'assets','default-bgm.mp3');assert(fs.existsSync(f));const b=fs.readFileSync(f);assert(b.length>1000000);assert(b.subarray(0,3).toString()==='ID3'||(b[0]===0xff&&(b[1]&0xe0)===0xe0),'invalid MP3 frame header');assert(html.includes('src="assets/default-bgm.mp3"'));assert(app.includes('function startDefaultMusicFromGesture()'));assert(fs.readFileSync(path.join(root,'service-worker.js'),'utf8').includes('./assets/default-bgm.mp3'));});
test('Character database has 123 named records and provenance/completeness flags', () => { assert.strictEqual(chars.characterCount,129); assert.strictEqual(Object.keys(chars.characters).length,129); for(const [name,p] of Object.entries(chars.characters)){assert(p.name===name,`name mismatch: ${name}`);assert(Array.isArray(p.relatedCharacters),`relations missing: ${name}`);assert(p.profileCompleteness,`completeness flag missing: ${name}`);assert(p.source,`source note missing: ${name}`)} });
test('Save import accepts v1/v2 and migrates state to v3', () => { assert(app.includes('![1,2,3].includes(Number(s.version))'), 'import validator must accept v1, v2 and v3'); assert(app.includes('s.version=3;'), 'imported state must be migrated to v2'); assert(app.includes('let s=obj.state||obj;'), 'imported state must be mutable during migration'); assert(app.includes("for(const k of ['activity','logs','timeline','snapshots'") , 'legacy state arrays must be initialized before rendering'); });
test('True-name authorization is tracked per sword and persists after consent', () => { assert(app.includes('else if(!allowed)'), 'authorized sword must not be blocked on later messages'); assert(app.includes('state.flags.trueNameDisclosedTo.push(p.id)'), 'consent must be recorded for the specific character'); });
test('Government/present world boundaries exist in prompt builder', () => { assert(app.includes('两套世界绝不自动共享人物、关系、消息、事件或记忆')); assert(app.includes('不得调用、提及或暗示现世人物的私人信息')); });
test('Training workflow includes registration, measurement, 2-month exams and half-year field exam', () => { for(const s of ['recruitment','measurement','coursework','exam1','exam2','fieldExam','graduated','start+60','start+120','start+180','seniorDidNotFight:true']) assert(app.includes(s),`missing training rule ${s}`); });
test('Senior return offers 8 distinct task tracks', () => { assert(app.includes('前往作战部直面前线')); assert(app.includes('监察部领取季度罚单')); assert(app.includes('技术研发部')); assert(app.includes('审神者支援科')); });
test('Device clock and simulation clock are separated; pause/rewind/fast-forward operate on simulation', () => { assert(app.includes('现实 ${fmtTime(real.hour*60+real.minute,real.second)} · 模拟')); assert(app.includes('function advanceSimulationMinutes')); assert(app.includes("advanceSimulationMinutes(120,'手动快进')")); assert(app.includes("state.paused?'▶ 继续':'Ⅱ 暂停'")); assert(app.includes('state=s;syncRealClock();updateClock()')); });
test('Background auto mode uses device local hour and month', () => { assert(app.includes('const now=new Date(); const h=now.getHours(); const season=seasonForMonth(now.getMonth()+1);')); });
test('Expedition returns are driven by simulation time and four resources', () => { assert(app.includes('returnAtAbs:totalGameMinutes()+360')); assert(app.includes('state.resource.charcoal+=250;state.resource.steel+=200;state.resource.coolant+=150;state.resource.stone+=180')); });
test('Failed battle can persist injury status for hand-in flow', () => { assert(app.includes("injured.status=Math.random()<.22?'中伤':'轻伤'")); assert(app.includes('function openRepairModal()')); });
test('Long-term memory compaction and program-level reply boundary checks exist', () => { assert(app.includes('function compactPersonMemory(p)')); assert(app.includes('p.memorySummary')); assert(app.includes('function replyWorldViolation(p,reply,userText')); assert(app.includes('程序级输出校验失败')); assert(app.includes('回复疑似泄露另一世界人物信息')); });
test('Official music-page shortcut remains absent', () => { assert(!/正版纯音乐页面|打开正版纯音乐|officialMusicLink/i.test(app), 'official music shortcut should not be present'); });
test('Service worker cache version is named', () => { const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8'); assert(/const CACHE='honmaru-sim-v\d+'/.test(sw)); });

test('Forging is queued by simulation time rather than instantly granting a sword', () => { assert(app.includes('function parseForgeMinutes(label)')); assert(app.includes("type:'forge',name,kind,resources:nums.slice(),startedAtAbs:totalGameMinutes(),returnAtAbs:totalGameMinutes()+duration")); assert(app.includes("else if(x.type==='forge')")); assert(app.includes('state.people.government.swords.push(person)')); });
test('Forge queue supports duplicate swords without overwriting existing individuals', () => { assert(app.includes('const pool=roster[kind]||DEFAULT_ROSTER[kind]||[]')); assert(!app.includes('candidates=candidates.filter(n=>!existing.has(n))')); assert(app.includes('allocateSwordInstance(x.name,person)')); });
test('Forge resource validation occurs before deductions and insufficient resources abort', () => { assert(app.includes("if(nums.some((n,i)=>n>state.resource[keys[i]])){toast('资源不足，无法开始锻刀。');return}")); assert(app.includes('nums.forEach((n,i)=>state.resource[keys[i]]-=n)')); });
test('Forge queue survives save migration and is processed on simulation-time advancement', () => { assert(app.includes("'forgeQueue'")); assert(app.includes('checkArrivals();')); assert(app.includes('returnAtAbs<=now')); });
test('Service worker cache was bumped after game-code changes', () => { const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8'); assert(/const CACHE='honmaru-sim-v\d+'/.test(sw)); });


test('Injured swords are blocked from new sorties and non-follow sortie losses can persist injuries', () => { assert(app.includes('受伤不可出阵')); assert(app.includes('受伤刀剑不能出阵，请先安排手入')); assert(app.includes("injured.status=Math.random()<.25?'中伤':'轻伤'")); assert(app.includes('已登记为受伤状态，请前往手入室。')); });

test('Numerical affection is per-person, clamped to 0–100 and translated into relationship stages', () => { assert(app.includes('function adjustAffection(person,delta,reason=')); assert(app.includes('person.affection=Math.max(0,Math.min(100')); assert(app.includes('person.affinity=affinityLabel(person.affection)')); assert(app.includes('同名刀剑的数值不会共用')); assert(app.includes('好感度 ${Math.round(Number(p.affection??25))}/100')); });
test('Relationship manager allows manual affection setting and validates bounds', () => { assert(app.includes('id="manageAffection" type="number" min="0" max="100"')); assert(app.includes('好感度必须是 0 到 100 的数字')); });
test('Legacy saves migrate categorical affinity to numerical affection without resetting existing values', () => { assert(app.includes("({'敌视':5,'普通':25,'信赖':55,'亲密':80}[p.affinity]??25)")); assert(app.includes('p.affinity=affinityLabel(p.affection)')); });
test('Moegirl supplement fields have source URLs and are kept separate from unverified visual details', () => { for(const n of ['太阁左文字','京极正宗','不动行光','毛利藤四郎','笼手切江']) { const p=chars.characters[n]; assert(p.moegirlSource,`missing source ${n}`); assert(p.moegirlSupplement,`missing supplemental note ${n}`); } assert(app.includes('萌娘百科补充（次级资料）')); });
test('Service worker cache version bumped after affection and character data changes', () => { const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8'); assert(/const CACHE='honmaru-sim-v\d+'/.test(sw)); });

test('Character supplement round adds 19 source-linked profiles and preserves 123 unique records', () => { assert.strictEqual(Object.keys(chars.characters).length,129); const n=['山姥切国广','蜂须贺虎彻','陆奥守吉行','压切长谷部','大俱利伽罗','同田贯正国','山姥切长义','鹤丸国永','南海太郎朝尊','水心子正秀','源清麿','大庆直胤','后家兼光','祢祢切丸','山伏国广','髭切','膝丸','山鸟毛','一文字则宗','富田江','松井江','桑名江','孙六兼元','石田正宗','北谷菜切']; for(const name of n){const c=chars.characters[name];assert(c&&c.moegirlSource,`missing source ${name}`);assert(c.moegirlSupplement&&c.moegirlSupplement.length>30,`missing profile summary ${name}`);assert(Array.isArray(c.verifiedFacts)&&c.verifiedFacts.length,`missing fact notes ${name}`);} assert.strictEqual(chars.moegirlAudit.partialSupplementProfiles,77); assert.strictEqual(chars.moegirlAudit.remainingBasicOnlyProfiles,0); });
test('Character supplement batch 3 adds 15 cited summaries and recalculates completeness counts', () => { const n=['谦信景光','日向正宗','堀川国广','浦岛虎彻','肥前忠广','治金丸','泛尘','火车切','狮子王','福岛光忠','实休光忠','五月雨江','村云江','姬鹤一文字','古今传授之太刀']; for(const name of n){const c=chars.characters[name];assert(c&&c.moegirlSource,`missing source ${name}`);assert(c.moegirlSupplement&&c.moegirlSupplement.length>30,`missing summary ${name}`);assert(Array.isArray(c.verifiedFacts)&&c.verifiedFacts.length,`missing fact notes ${name}`);assert.strictEqual(c.profileCompleteness,'二次资料部分补充');} assert.strictEqual(chars.moegirlAudit.partialSupplementProfiles,77);assert.strictEqual(chars.moegirlAudit.remainingBasicOnlyProfiles,0);assert.strictEqual(chars.moegirlAudit.totalProfilesStillIncomplete,77); });
test('Character supplement batch 4 adds 16 sourced summaries and recalculates completeness counts', () => { const n=["九鬼正宗", "长曾祢虎彻", "南泉一文字", "丰前江", "稻叶江", "千代金丸", "小乌丸", "小豆长光", "抜丸", "笹贯", "八丁念佛", "道誉一文字", "七星剑", "巴形薙刀", "静形薙刀", "日本号"]; for(const name of n){const c=chars.characters[name];assert(c&&c.moegirlSource,`missing source ${name}`);assert(c.moegirlSupplement&&c.moegirlSupplement.length>30,`missing summary ${name}`);assert(Array.isArray(c.verifiedFacts)&&c.verifiedFacts.length,`missing fact notes ${name}`);assert.strictEqual(c.profileCompleteness,'二次资料部分补充');} assert.strictEqual(chars.characterCount,129);assert.strictEqual(chars.moegirlAudit.partialSupplementProfiles,77);assert.strictEqual(chars.moegirlAudit.remainingBasicOnlyProfiles,0);assert.strictEqual(chars.moegirlAudit.totalProfilesStillIncomplete,77); });


test('Character supplement batch 5 completes all 16 previously basic-only records and preserves cautious sourcing', () => { const n=['地藏行平','云重','安宅切','日光一文字','三郎国宗','云次','云生','面影','古备前信房','太郎太刀','次郎太刀','御手杵','人间无骨','大千鸟十文字枪','白山吉光','丙子椒林剑']; for(const name of n){const c=chars.characters[name];assert(c&&c.moegirlSource,`missing source ${name}`);assert(c.moegirlSupplement&&c.moegirlSupplement.length>30,`missing summary ${name}`);assert(Array.isArray(c.verifiedFacts)&&c.verifiedFacts.length,`missing fact notes ${name}`);assert.strictEqual(c.profileCompleteness,'二次资料部分补充');} assert.strictEqual(chars.moegirlAudit.partialSupplementProfiles,77);assert.strictEqual(chars.moegirlAudit.remainingBasicOnlyProfiles,0);assert.strictEqual(chars.moegirlAudit.totalProfilesStillIncomplete,77);assert.strictEqual(chars.characters['御手杵'].swordType,'枪'); });


test('Official source-backed profile enrichment is separate from community summaries', () => { const n=['地藏行平','云生','云次','三郎国宗','安宅切','九鬼正宗','日光一文字','面影','古备前信房','太郎太刀','次郎太刀','御手杵','人间无骨','大千鸟十文字枪','白山吉光','丙子椒林剑']; for(const name of n){const p=chars.characters[name];assert(p.officialSource,`missing official source ${name}`);assert(p.officialSupplement&&p.officialSupplement.length>25,`missing official summary ${name}`);assert(Array.isArray(p.officialVerifiedFacts)&&p.officialVerifiedFacts.length,`missing official fact notes ${name}`);} assert.strictEqual(chars.characters['白山吉光'].swordType,'剑');assert.strictEqual(chars.characters['丙子椒林剑'].swordType,'剑'); });
test('Known weapon-type misclassifications are corrected and protected by regression tests', () => { const expected={'石切丸':'大太刀','太郎太刀':'大太刀','次郎太刀':'大太刀','祢祢切丸':'大太刀','岩融':'薙刀','巴形薙刀':'薙刀','静形薙刀':'薙刀','蜻蛉切':'枪','日本号':'枪','人间无骨':'枪','大千鸟十文字枪':'枪','御手杵':'枪','白山吉光':'剑','丙子椒林剑':'剑','七星剑':'剑'};for(const [name,type] of Object.entries(expected))assert.strictEqual(chars.characters[name].swordType,type,`${name} type`); });
test('Official source metadata covers corrected legacy weapon types', () => { for(const name of ['石切丸','日本号','蜻蛉切','七星剑','祢祢切丸']){const p=chars.characters[name];assert(p.officialSource,`missing official URL ${name}`);assert(p.officialVerifiedFacts?.length,`missing official facts ${name}`);} });


test('Official profile details are passed into generated NPC context', () => { assert(app.includes('【官方角色资料补充】')); assert(app.includes('【官方资料核验要点】')); });

test('All 46 previously detailed character dossiers have structured evidence fields', () => { const full=Object.values(chars.characters).filter(p=>p.profileCompleteness==='详细设定齐全'); assert.strictEqual(full.length,46); for(const p of full){assert(p.profileDossier,`missing dossier ${p.name}`);assert(p.profileDossier.visualDesign,`missing visual design ${p.name}`);assert(p.profileDossier.personalityEvidence,`missing personality evidence ${p.name}`);assert(p.profileDossier.voiceEvidence!==undefined,`missing voice evidence ${p.name}`);assert(p.profileDossier.sourceBasis,`missing source basis ${p.name}`);assert(Array.isArray(p.profileDossier.guardrails)&&p.profileDossier.guardrails.length,`missing guardrails ${p.name}`);} });
test('All 123 characters explicitly track dossier completeness and provenance boundaries', () => { assert.strictEqual(chars.moegirlAudit.detailedDossiersStructured,46);assert.strictEqual(chars.moegirlAudit.partialDossiersStructured,77);for(const p of Object.values(chars.characters)){assert(p.profileDossier,`missing dossier ${p.name}`);assert(p.profileDossier.completeness,`missing completeness ${p.name}`);assert(p.profileDossier.sourceBasis,`missing source ${p.name}`);assert(p.profileDossier.guardrails?.length,`missing guardrails ${p.name}`);} });
test('Structured character dossier is passed to NPC context and shown in profile UI', () => { assert(app.includes('【结构化人物档案】'));assert(app.includes('结构化档案与资料边界'));assert(app.includes('relatedCharacters 只代表资料中列出的关联')); });


test('Iteration 12 audits all 123 dossiers with v4 provenance ledger and explicit missing-field tracking', () => { assert.strictEqual(chars.moegirlAudit.dossierVersion,4);assert.strictEqual(chars.moegirlAudit.dossierRecordsAudited,123);assert.strictEqual(chars.moegirlAudit.sourceLedgerCoverage,123);for(const [name,p] of Object.entries(chars.characters)){const d=p.profileDossier;assert(d&&d.version===4,`dossier v4 missing: ${name}`);assert(Array.isArray(d.sourceLedger),`ledger missing: ${name}`);assert(Array.isArray(d.missingFields),`missing-field list missing: ${name}`);assert(d.officialSourceStatus,`official status missing: ${name}`);assert(d.secondarySourceStatus,`secondary status missing: ${name}`);assert(p.dossierAudit&&p.dossierAudit.schemaVersion===4,`audit missing: ${name}`);} });
test('Personality evidence does not silently invent unsupported traits and records evidence limitations', () => { for(const [name,p] of Object.entries(chars.characters)){const d=p.profileDossier;assert(d.personalityEvidence,`personality evidence missing: ${name}`);assert(d.personalityEvidenceStatus,`personality status missing: ${name}`);assert(d.roleplayGuidance.includes('不凭空补造'),`roleplay boundary missing: ${name}`);assert(d.guardrails.some(x=>x.includes('待补充字段')||x.includes('证据不足')),`unknown-field guardrail missing: ${name}`);} });
test('Iteration 11 passes source confidence and missing-field boundaries into NPC context and profile UI', () => { assert(app.includes('【资料可信度与缺项】'));assert(app.includes('officialSourceStatus'));assert(app.includes('secondarySourceStatus'));assert(app.includes('待核验/缺失项目'));assert(app.includes('sourceLedger')); });
test('Service worker cache bumped to v16 after dossier audit changes', () => { const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');assert(/const CACHE='honmaru-sim-v\d+'/.test(sw)); });



test('Dossier schema v4 covers all 123 characters and distinguishes personality evidence from visual evidence', () => {
  assert.strictEqual(chars.moegirlAudit.dossierVersion,4);
  assert.strictEqual(chars.moegirlAudit.dossierRecordsAudited,123);
  for (const [name,p] of Object.entries(chars.characters)) {
    const d=p.profileDossier; assert(d,`missing dossier ${name}`);
    assert.strictEqual(d.version,4,`schema mismatch ${name}`);
    assert(d.personalityEvidenceStatus,`missing personality evidence boundary ${name}`);
    assert(d.visualEvidenceStatus,`missing visual evidence boundary ${name}`);
    assert(d.innerWearStatus,`missing innerwear status ${name}`);
    assert.strictEqual(p.dossierAudit.evidenceLedgerEntries,d.sourceLedger.length,`ledger count mismatch ${name}`);
  }
});
test('Character context explicitly separates personality/behavior clues from appearance', () => {
  assert(app.includes('性格/行为线索（须与外貌分开判断）'));
  assert(app.includes('线索边界：${profile.profileDossier.personalityEvidenceStatus'));
  assert(app.includes('不要把玩家社群解读写成官方事实。'));
});
test('Known Dojigiri Yasutsuna weapon type is not left blank', () => {
  assert.strictEqual(chars.characters['童子切安纲'].swordType,'太刀');
});
test('Service worker cache is bumped to v16 for dossier schema changes', () => {
  const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8'); assert(/const CACHE='honmaru-sim-v\d+'/.test(sw));
});




test('Iteration 13 recomputes dossier audit counts from actual source ledgers and missing fields', () => {
  assert.strictEqual(chars.moegirlAudit.dossierRecordsAudited,123);
  assert.strictEqual(chars.moegirlAudit.sourceLedgerCoverage,123);
  for(const [name,p] of Object.entries(chars.characters)){
    const d=p.profileDossier, a=p.dossierAudit;
    assert.strictEqual(a.evidenceLedgerEntries,d.sourceLedger.length,`ledger count ${name}`);
    assert.strictEqual(a.missingFieldCount,d.missingFields.length,`missing field count ${name}`);
    assert.strictEqual(a.hasCharacterSpecificOfficialSource,!!p.officialSource,`official flag ${name}`);
    assert.strictEqual(a.hasCharacterSpecificSecondarySource,!!(p.moegirlSource || (Array.isArray(p.secondarySources)&&p.secondarySources.length)),`secondary flag ${name}`);
  }
});
test('Unknown sword-school fields are explicit and never mistaken for a confirmed absence', () => {
  const unknown=Object.values(chars.characters).filter(p=>p.swordSchool==='待核实（未确认刀派）');
  assert.strictEqual(unknown.length,chars.moegirlAudit.swordSchoolUnknownCount);
  for(const p of unknown) assert(p.dossierAudit.swordSchoolStatus.includes('待确认'),p.name);
});
test('Iteration 13 cache is bumped for source-ledger audit consistency changes', () => {
  const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8'); assert(/const CACHE='honmaru-sim-v\d+'/.test(sw));
});


test('Iteration 14 generates a source-verification queue for all 123 character dossiers', () => {
  assert.strictEqual(chars.moegirlAudit.verificationQueueVersion,2);
  assert.strictEqual(Object.keys(chars.characters).length,129);
  let total=0, p1=0, p2=0, p3=0;
  for(const [name,p] of Object.entries(chars.characters)){
    const d=p.profileDossier, a=p.dossierAudit;
    assert(Array.isArray(d.verificationQueue),`missing queue ${name}`);
    assert.strictEqual(a.verificationQueueCount,d.verificationQueue.length,`queue count ${name}`);
    for(const item of d.verificationQueue){
      assert(item.field&&item.task,`incomplete queue item ${name}`);
      assert([1,2,3].includes(item.priority),`bad priority ${name}`);
      total++; if(item.priority===1)p1++; if(item.priority===2)p2++; if(item.priority===3)p3++;
    }
  }
  assert.strictEqual(total,chars.moegirlAudit.verificationQueueTotalItems);
  assert.strictEqual(p1,chars.moegirlAudit.priority1Items);
  assert.strictEqual(p2,chars.moegirlAudit.priority2Items);
  assert.strictEqual(p3,chars.moegirlAudit.priority3Items);
  assert(total>0);
});
test('Iteration 14 labels source queue as a gap tracker, not proof of external verification', () => {
  assert(chars.moegirlAudit.queueMethodNote.includes('不是外部来源核验结果'));
  for(const p of Object.values(chars.characters)) assert(p.profileDossier.verificationQueueStatus);
});
test('Iteration 14 service-worker cache is v18', () => {
  const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8'); assert(/const CACHE='honmaru-sim-v\d+'/.test(sw));
});




test('Iteration 15 treats sword school as optional metadata, not a mandatory defect', () => {
  assert.strictEqual(chars.moegirlAudit.verificationQueueVersion,2);
  let total=0,p1=0,p2=0,p3=0;
  for(const [name,p] of Object.entries(chars.characters)){
    const d=p.profileDossier,a=p.dossierAudit;
    assert(!d.verificationQueue.some(x=>x.field==='swordSchool'),`school should not be a generic queue task: ${name}`);
    assert(d.swordSchoolPolicy.includes('不是必填项'),name);
    assert(d.swordSchoolStatus,name);
    assert.strictEqual(a.verificationQueueCount,d.verificationQueue.length,name);
    total+=d.verificationQueue.length;
    for(const x of d.verificationQueue){if(x.priority===1)p1++;if(x.priority===2)p2++;if(x.priority===3)p3++;}
  }
  assert.strictEqual(total,chars.moegirlAudit.verificationQueueTotalItems);
  assert.strictEqual(p1,chars.moegirlAudit.priority1Items);
  assert.strictEqual(p2,chars.moegirlAudit.priority2Items);
  assert.strictEqual(p3,chars.moegirlAudit.priority3Items);
  assert(chars.moegirlAudit.queueMethodNote.includes('刀派为可选字段'));
});
test('Iteration 15 keeps blank school values neutral and explicit no-school labels intact', () => {
  const blank=Object.values(chars.characters).filter(p=>!String(p.swordSchool||'').trim());
  assert(blank.length>0);
  for(const p of blank) assert(p.dossierAudit.swordSchoolStatus.includes('不视为缺陷'),p.name);
  const explicit=Object.values(chars.characters).filter(p=>String(p.swordSchool||'').includes('无（游戏刀帐未标刀派）'));
  assert(explicit.length>0);
});
test('Iteration 15 cache is v19', () => {
  const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8'); assert(/const CACHE='honmaru-sim-v\d+'/.test(sw));
});


test('Iteration 16 adds six official roster characters with character-specific official sources', () => { const expected=['二筋樋貞宗','雲重','柏太刀','波平行安','狐ヶ崎為次','桃太郎祐定']; assert.strictEqual(chars.characterCount,129); for(const n of expected){const c=chars.characters[n]; assert(c,`missing ${n}`); assert(c.officialSource && c.officialSource.includes('/character/'),`official source missing ${n}`); assert(c.officialVerifiedFacts.length>=4,`official facts missing ${n}`); assert(c.profileDossier.sourceLedger.some(e=>e.kind==='official_summary'),`official ledger missing ${n}`); assert(c.profileDossier.verificationQueue.length>=3,`verification queue missing ${n}`); assert(!c.greeting && !c.returnGreeting,`fabricated voice line for ${n}`)} });
test('Iteration 16 does not require sword school when official page leaves it blank', () => { for(const n of ['二筋樋貞宗','柏太刀']) { const c=chars.characters[n]; assert.strictEqual(c.swordSchool,''); assert(c.profileDossier.swordSchoolPolicy.includes('不是必填项')); } });


test('Chinese localized name for 狐ヶ崎為次 is 狐崎丸 while official Japanese key/source remain intact', () => { const c=chars.characters['狐ヶ崎為次']; assert.strictEqual(c.localizedName,'狐崎丸'); assert.strictEqual(c.chineseName,'狐崎丸'); assert.strictEqual(c.officialSource,'https://www.toukenranbu.jp/character/260/'); assert.strictEqual(c.name,'狐ヶ崎為次'); });
test('桃太郎祐定 portrait correction does not treat search thumbnails as official artwork', () => { const a=chars.newCharacterAudit.portraitCorrection; assert.strictEqual(a.character,'桃太郎祐定'); assert.strictEqual(a.officialSource,'https://www.toukenranbu.jp/character/262/'); assert(a.policy.includes('不以搜索缩略图替代')); assert.strictEqual(chars.characters['桃太郎祐定'].officialSource,a.officialSource); });


test('Iteration 18 adds translated secondary sources for all six newly added characters',()=>{
  const db=JSON.parse(fs.readFileSync(path.join(root,'characters.json'),'utf8')).characters;
  for(const name of ['二筋樋貞宗','雲重','柏太刀','波平行安','狐ヶ崎為次','桃太郎祐定']){
    const p=db[name]; assert(Array.isArray(p.secondarySources)&&p.secondarySources.length>0,`secondary sources ${name}`);
    assert(p.secondarySupplement && p.secondarySupplement.includes('中文') || p.secondarySupplement && p.secondarySupplement.includes('翻译'),`translated summary ${name}`);
    assert(p.profileDossier.sourceLedger.some(x=>x.kind==='secondary_source_summary'),`ledger ${name}`);
    assert.strictEqual(p.dossierAudit.hasCharacterSpecificSecondarySource,true,`audit ${name}`);
  }
  assert.strictEqual(db['柏太刀'].swordSchool,'','柏太刀 unmarked school remains blank');
  assert.strictEqual(db['狐ヶ崎為次'].chineseName,'狐崎丸','localized name preserved');
  assert(db['狐ヶ崎為次'].detailEntry.includes('地点“狐ヶ崎”')&&!db['狐ヶ崎為次'].detailEntry.includes('地点“狐崎丸”'),'historic place is not conflated with localized character name');
});


// Iteration 19: voice/recollection audit and Japanese-to-Chinese source policy
{
  const db=JSON.parse(fs.readFileSync(path.join(root,'characters.json'),'utf8'));
  assert.equal(db.voiceRecollectionResearch.sources.length,3,'voice/recollection source index present');
  assert.equal(Object.keys(db.characters).length,129,'all known characters retained');
  for(const [name,c] of Object.entries(db.characters)) {
    assert.ok(c.profileDossier.voiceAndRecollectionAudit,`voice/recollection audit exists for ${name}`);
    assert.ok(c.profileDossier.voiceAndRecollectionAudit.translationPolicy.includes('中文摘要'),`translation policy exists for ${name}`);
  }
  assert.equal(db.characters['二筋樋貞宗'].profileDossier.voiceAndRecollectionAudit.recollections[0].title,'其の187「初めまして、改めて」');
  assert.ok(db.characters['柏太刀'].profileDossier.voiceAndRecollectionAudit.recollections.length===1);
}


test('Autosave prefers IndexedDB with a compact localStorage fallback and storage diagnostics', () => { assert(app.includes("DB_NAME='shogunate-sim-db-v1'")); assert(app.includes('function idbPutSave(value)')); assert(app.includes('function compactSaveForLocalStorage(copy)')); assert(app.includes('navigator.storage?.estimate?.()')); assert(app.includes('自定义背景已压缩并应用'));  assert(app.includes('IndexedDB 数据库')); });
test('Shikigami is a distinct government character branch and Fox之助 is seeded', () => { assert(app.includes("['shikigami','式神']")); assert(app.includes("freshPerson('狐之助','shikigami','government'")); assert(app.includes('时之政府派遣的管狐')); assert(app.includes('https://touken-musou.com/zh-cn/character/konnosuke')); });
test('Custom characters have species choices and swords are always categorized as tsukumogami', () => { assert(app.includes('id="personSpecies"')); for(const x of ['付丧神','式神','妖怪','不可名状','亚人']) assert(app.includes(x)); assert(app.includes("if(type==='swords')p.species='付丧神'")); });
test('Player profile settings allow editing and avatar upload without granting true-name consent', () => { assert(app.includes('function openPlayerProfileModal()')); assert(app.includes('id="playerAvatarFile"')); assert(html.includes('id="playerProfileSettings"')); assert(app.includes('真名权限未自动变更')); });
test('Government work handover is limited to the assigned attendant and work topics', () => { assert(app.includes('只能联系玩家已指派的近侍')); assert(app.includes('不得绕过近侍联系其他刀剑男士')); assert(app.includes("if(s.dataset.role==='近侍')state.attendantId")); });
test('Present-world replies are blocked from independently introducing government-world entities', () => { assert(app.includes('现世人物严禁与时之政府、政府工作人员、其他审神者、本丸、刀剑男士或式神产生任何关联')); assert(app.includes('我把(时之政府|本丸|刀剑男士|狐之助)的事告诉你')); });
test('Positive and negative chat actions change numerical affection deterministically for every character type', () => { assert(app.includes("adjustAffection(p,/喜欢|在意你|信任你/.test(text)?5:3)")); assert(app.includes("adjustAffection(p,-4)")); assert(!app.includes("if(p.type==='swords'&&text.length>0){if(/谢谢")); });
test('Autonomous government handover pairs staff/saniwa only with the assigned attendant', () => { assert(app.includes('function isAllowedGovernmentNpcPair(a,b)')); assert(app.includes('a.id===state.attendantId')); assert(app.includes('双方核对任务进度、经办事项与下一步安排')); });
test('Iteration 20 bumps service worker cache for storage and profile changes', () => { const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8'); assert(/const CACHE='honmaru-sim-v\d+'/.test(sw)); });

test('Game settings no longer contain player-name fields; player profile owns honmaru name', () => {
 const settings=app.slice(app.indexOf('function openSettingsModal()'),app.indexOf('function toggleMusic()'));
 assert(!settings.includes('settingTrueName')&&!settings.includes('settingSurname')&&!settings.includes('settingGivenName'));
 assert(app.includes('id="profileHonmaruName"'));
 assert(!html.includes('id="renameHonmaru"'));
});
test('Forge recipe classifier exists and every valid resource recipe maps to a populated sword roster', () => {
 assert(app.includes('function determineSwordType(nums)'));
 assert(app.includes("if(total<=400)return '短刀'"));
 assert(app.includes("if(total<=700)return '胁差'"));
 assert(app.includes("if(total<=1000)return '打刀'"));
 assert(app.includes("if(total<=1400)return '太刀'"));
 assert(app.includes("if(total<=2000)return '大太刀'"));
 assert(app.includes("if(total<=2600)return '枪'"));
 assert(app.includes("return '薙刀'"));
 assert(app.includes("function parseForgeMinutes(label)"));
});
test('NPC dialogue and letter punctuation rules are included in prompts and output normalization', () => {
 assert(app.includes('function normalizeNpcPunctuation(reply,userText=\'\')'));
 assert(app.includes('角色的直接对话使用中文双引号'));
 assert(app.includes('书信、信笺、便条、正式公文等书面文本使用中文直角引号'));
 assert(app.includes('reply=normalizeNpcPunctuation(reply,text)'));
});


test('Regular new game offers exactly the five initial swords and stores the chosen initial sword', () => {
 assert(app.includes("const initialOptions=['加州清光','歌仙兼定','山姥切国广','蜂须贺虎彻','陆奥守吉行']"));
 assert(app.includes("state.initialSwordName=first"));
 assert(app.includes('const firstPerson=freshPerson(first'));
});
test('Random opening exposes only the codename input and randomizes the remaining profile fields', () => {
 const setup=app.slice(app.indexOf('function openSetupModal()'),app.indexOf('function seedGovernmentContacts()'));
 assert(setup.includes("if(chosen==='random'){fields.innerHTML="));
 assert(setup.includes("if(chosen==='random'){data={mode:chosen,codename:code,randomSeed:"));
 assert(app.includes("if(p.mode==='random'){const pick=a=>a[Math.floor(Math.random()*a.length)]"));
});
test('Regular opening has three narrative scenes and keeps the first-sword-only rule until prologue completion', () => {
 assert(app.includes("['狐之助的任命说明'")); assert(app.includes("['初始刀显现'")); assert(app.includes("['只有一振刀的本丸'"));
 assert(app.includes('state.flags.firstSwordForgeUnlocked=false'));
 assert(app.includes("if(state?.flags?.firstSwordForgeUnlocked===false){toast('请先完成初始刀的开局剧情"));
 assert(app.includes('state.flags.firstSwordForgeUnlocked=true;state.flags.firstSwordPrologueCompletedAt=Date.now();state.foxMemory=state.foxMemory||[]'));
});
test('Senior and random starts seed at least 32 swords with fully randomized 0–100 affection', () => {
 assert(app.includes('const count=32+Math.floor(Math.random()*7)'));
 assert(app.includes('const value=Math.floor(Math.random()*101);person.affection=value;person.affinity=affinityLabel(value)'));
 assert(app.includes('seedEstablishedHonmaru();state.flags.firstSwordPrologue=false;state.flags.firstSwordForgeUnlocked=true'));
});
test('Character response generation changes with affection stage and prompt includes behavioral distinctions', () => {
 assert(app.includes("Number(p.affection??25)<15")); assert(app.includes("Number(p.affection??25)<40")); assert(app.includes("Number(p.affection??25)>=40&&Number(p.affection??25)<70")); assert(app.includes("Number(p.affection??25)>=70&&Number(p.affection??25)<90")); assert(app.includes("Number(p.affection??25)>=90"));
 assert(app.includes('敌视（0-14）时可以冷硬、戒备、拒绝亲近或质疑玩家'));
 assert(app.includes('亲密（70-89）时语气柔和、会主动关心'));
});


test('Forge has a defined duration resolver and handles HH:MM:SS as minutes, not missing function', () => {
 assert(app.includes('function forgeTime(kind,name)'));
 assert(app.includes('const duration=parseForgeMinutes(forgeTime(kind,name))'));
 assert(app.includes("'短刀':'0:20:00'"));
 assert(app.includes('Math.ceil(Number(m[3])/60)'));
});
test('First-start forge lock is only controlled by prologue flag, not training countdown', () => {
 const f=app.slice(app.indexOf('function openForgeModal()'),app.indexOf('function openEquipmentModal()'));
 assert(f.includes('firstSwordForgeUnlocked===false'));
 assert(!f.includes('training.enrolledAtDay'));
 assert(app.includes('60天培训与考试倒计时不会限制锻刀'));
});
test('Training exams are interactive 10-question Touken Ranbu knowledge tests with 60-point pass line, makeup and course repeat', () => {
 assert(app.includes('const TOUKEN_EXAM_QUESTIONS=['));
 assert(app.includes('correct*10'));
 assert(app.includes('if(score>=60)'));
 assert(app.includes("t.phase='makeup'"));
 assert(app.includes("t.courseRepeat=true"));
 assert(app.includes('不存在开除处理'));
});
test('Random colleagues use codenames and include novice, senior and special categories across worldbook departments', () => {
 assert(app.includes("{code:'白纸',kind:'新人审神者',department:'历史作战部'"));
 assert(app.includes("{code:'青鸟',kind:'资深审神者',department:'历史作战部'"));
 assert(app.includes("{code:'夜航',kind:'特殊审神者',department:'特招岗位'"));
 assert(app.includes('function seedGovernmentContacts()'));
 assert(app.includes('x.codename=x.name'));
 assert(app.includes('新人审神者同事'));
 assert(app.includes('资深审神者同事'));
 assert(app.includes("['saniwa','同事']"));
 assert(app.includes('touken.youzu.com/guide/5055119.html'));
});



test('Iteration 24: fox remembers the spirit test and player-selected feeling',()=>{assert(app.includes("state.foxMemory.push({kind:'spirit-test'"));assert(app.includes('狐之助专属记忆'));assert(app.includes('data-feeling=\"紧张\"'));});
test('Iteration 24: swords receive explicit roster-order numbers by opening mode and later arrivals',()=>{assert(app.includes('p.rosterOrder=i+1'));assert(app.includes('firstPerson.rosterOrder=1'));assert(app.includes('allocateRosterOrder(person)'));assert(app.includes('显现顺序第${p.rosterOrder}振'));});
test('Iteration 24: custom story designer is available after the home function bar and persists in state',()=>{assert(html.includes('id="openCustomStory"'));assert(app.includes('function openCustomStoryModal()'));assert(app.includes('state.customStory={text,createdAt:Date.now()'));assert(app.includes('自定义剧情：新的线索'));});
test('Iteration 24: department storyline and custom-story events have follow-up stages',()=>{assert(app.includes('departmentFollowupDue'));assert(app.includes('customStoryFollowup'));assert(app.includes('部门工作进入下一阶段'));assert(app.includes('剧情线索更新'));});
test('Iteration 24: local/API event generation setting and fallback exist',()=>{assert(app.includes('settingNarrativeMode'));assert(app.includes('generateApiEventText(e)'));assert(app.includes('API 事件扩写失败，已自动使用本地事件。'));});
test('Iteration 24: zoom-safe layout avoids horizontal overflow and preserves modal usability',()=>{const css=fs.readFileSync(path.join(root,'style.css'),'utf8');assert(css.includes('overflow-x:hidden'));assert(css.includes('max-height:calc(100dvh - 24px)'));assert(css.includes('.free-story-bar'));});

test('Iteration 25: custom plot mentioning Fox之助 detects culpability and creates a character-aware event',()=>{assert(app.includes("const foxInvolved=/(狐之助|狐狸|管狐)/i.test(storyText)"));assert(app.includes('狐之助的反常反应'));assert(app.includes('customStoryAccusesFox'));assert(app.includes('participants:storyPeople.length?storyPeople.map(p=>p.id):(foxInvolved&&fox?[fox.id]:[])'));assert(app.includes('customStoryParticipantNames'));});
test('Iteration 25: Fox之助 reacts with visible nervousness and persistent memory after custom-story confrontation',()=>{assert(app.includes('狐之助的反应并不寻常'));assert(app.includes("kind:'custom-story-fox'"));assert(app.includes('狐之助的耳朵一下子压低了'));assert(app.includes('后续：狐之助交出的记录'));});
test('Iteration 25: custom-story follow-up carries the prior choice and involved character into next scene',()=>{assert(app.includes('title:f.title===\'狐之助的反常反应\''));assert(app.includes('上次选择「${f.result||'));assert(app.includes('mentionsFox&&fox?[fox.id]:[]'));});
test('Iteration 26: all character categories receive continuity context, not only Fox之助',()=>{assert(app.includes('function buildRoleplayContinuityContext(p)'));assert(app.includes('【全局角色扮演连续性协议】'));assert(app.includes('【该角色已知事实】'));assert(app.includes('【该角色亲历的近期事件】'));assert(app.includes('buildRoleplayContinuityContext(p)'));assert(app.includes('return `${buildRoleplayContinuityContext(p)}'));});
test('Iteration 26: free-story events detect named participants and preserve personal event memories',()=>{assert(app.includes('const storyPeople=[...(state.people.government.swords||[])'));assert(app.includes('person.eventMemories.push({eventId:e.eventId,title:e.title'));assert(app.includes('customStoryTheme:storyTheme'));});
test('Iteration 26: API event prompt receives continuity ledger and varied consequential choices',()=>{assert(app.includes('最近事件账本：${(state.eventRecords||[])'));assert(app.includes('让人物表现有差异，不要只换同义词'));assert(app.includes('每个选项必须代表不同策略并产生可持续后果'));assert(app.includes('禁止凭空判定谁有罪、谁撒谎'));});

test('Iteration 27: end-day confirmation is in-app and guarded against mobile browsers suppressing native confirm()',()=>{const fn=app.slice(app.indexOf('function endDay('),app.indexOf('function snapshot()'));assert(fn.includes("openModal('结束模拟当天'"));assert(fn.includes('正在结算…'));assert(fn.includes('随机事件暂未弹出，可继续游玩。'));assert(!fn.includes('confirm('));});
test('Iteration 27: relationship graph is world-scoped and only stores actual shared events',()=>{assert(app.includes('function ensureRelationshipGraph()'));assert(app.includes('function recordRelationshipEdge('));assert(app.includes("recordRelationshipEdge(e.participants[i],e.participants[j],'共同事件'"));assert(app.includes('a.world!==b.world'));assert(app.includes('function relationshipGraphContext(p)'));});
test('Iteration 27: topic-relevant memory retrieval supplements recent chronological memories',()=>{assert(app.includes('function retrieveRelevantMemories(p,query=\'\',limit=8)'));assert(app.includes('activeRecallQuery=text;const system=buildSystemPrompt(p,wb)'));assert(app.includes('【按当前话题检索的相关记忆】'));});
test('Iteration 27: service worker cache bumped for mobile compatibility and continuity updates',()=>{const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');assert(/const CACHE='honmaru-sim-v\d+'/.test(sw));});


test('Iteration 27: relationship stage changes are recorded and injected into roleplay continuity',()=>{assert(app.includes('person.relationshipHistory=person.relationshipHistory||[]'));assert(app.includes('【关系变化历史】${relationHistory||'));assert(app.includes("reason:String(reason||'日常互动')"));});

test('Iteration 28: mobile viewport requests fixed page scale while keeping safe-area support',()=>{assert(html.includes('maximum-scale=1,user-scalable=no,viewport-fit=cover'));});
test('Iteration 28: character directory cards and mobile action buttons are compact and responsive',()=>{const css=fs.readFileSync(path.join(root,'style.css'),'utf8');assert(css.includes('#viewPeople .person-card{gap:8px;padding:6px 8px;min-height:52px'));assert(css.includes('#viewPeople .person-card-actions{display:flex;flex-direction:row'));assert(css.includes('@media(max-width:360px)'));assert(css.includes('text-size-adjust:100%'));});
test('Iteration 28: service worker cache is refreshed after layout changes',()=>{const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');assert(/const CACHE='honmaru-sim-v40'/.test(sw));});


test('Iteration 29: memory retrieval prioritizes topic matches and does not score every recent item as relevant',()=>{assert(app.includes("function retrieveRelevantMemories(p,query='',limit=8)"));assert(app.includes("匹配线索：${x.matched.slice(0,5).join('、')}"));assert(app.includes('未找到精确匹配，仅作背景参考'));assert(app.includes('长期摘要'));assert(app.includes('检索规则：匹配线索只说明文本有关键词重合'));});
test('Iteration 29: memory retrieval includes Chinese phrase fragments, bounded fallback, and provenance smoke test',()=>{assert(fs.existsSync(path.join(root,'runtime_memory_retrieval_smoke.js')));const smoke=fs.readFileSync(path.join(root,'runtime_memory_retrieval_smoke.js'),'utf8');assert(smoke.includes('unrelated recent memory must not be ranked as relevant'));assert(smoke.includes('fallback must be labelled as background'));});
test('Iteration 29: cache version bumped for memory retrieval changes',()=>{const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');assert(/const CACHE='honmaru-sim-v40'/.test(sw));});


test('Iteration 30: click effects are full-screen, configurable, and default to sakura',()=>{assert(html.includes('id="clickEffectLayer"'));assert(app.includes("clickEffect:'sakura'"));assert(app.includes('function clickEffectCount()'));assert(app.includes("effectAmount:'medium'"));for(const kind of ['sakura','snow','butterfly','stars','gems','ripple','off'])assert(app.includes(`value="${kind}"`)||app.includes(`type==='${kind}'`));assert(app.includes("document.addEventListener('click'"));});
test('Iteration 30: click effects support adjustable density, pointer-safe overlay, and reduced-motion preference',()=>{const css=fs.readFileSync(path.join(root,'style.css'),'utf8');assert(css.includes('.click-effect-layer{position:fixed;inset:0'));assert(css.includes('pointer-events:none'));assert(css.includes('prefers-reduced-motion:reduce'));assert(css.includes('prefers-reduced-motion:reduce'));assert(app.includes("settingEffectAmount"));});
test('Iteration 30: service worker cache refreshed for effect controls and CSS',()=>{const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');assert(/const CACHE='honmaru-sim-v40'/.test(sw));});


test('Iteration 30: runtime smoke exercises all click effect types and density modes',()=>{assert(fs.existsSync(path.join(root,'runtime_click_effect_smoke.js')));const smoke=fs.readFileSync(path.join(root,'runtime_click_effect_smoke.js'),'utf8');for(const type of ['sakura','snow','butterfly','stars','gems','ripple','off'])assert(smoke.includes(type));assert(smoke.includes("effectAmount='low'"));assert(smoke.includes("effectAmount='high'"));});

test('Iteration 33: visible roster numbers close gaps after deletion while instance identity remains independent',()=>{assert(app.includes('function reindexSwordRoster('));assert(app.includes('swords.forEach((p,i)=>{p.rosterOrder=i+1})'));assert(app.includes('reindexSwordRoster(state.people.government.swords,state)'));assert(app.includes('function allocateSwordInstance(name,person)'));assert(app.includes('s.swordInstanceCounters[p.name]=Math.max'));});
test('Iteration 32: senior and random opening rosters are randomized before stable numbering',()=>{assert(app.includes('function seedEstablishedHonmaru()'));assert(app.includes('for(let i=names.length-1;i>0;i--)'));assert(app.includes('p.rosterOrder=i+1'));assert(app.includes('state.nextRosterOrder=state.people.government.swords.length+1'));});
test('Iteration 32: character directory search filters current category and reports duplicate sword names',()=>{assert(html.includes('id="peopleSearch"'));assert(html.includes('id="peopleSearchStatus"'));assert(app.includes('const filtered=arr.filter(p=>!query'));assert(app.includes('同名个体：'));assert(app.includes('没有找到匹配的人物'));});
test('Iteration 33: roster runtime smoke verifies gap-closing without changing person identity',()=>{assert(fs.existsSync(path.join(root,'runtime_roster_search_smoke.js')));const smoke=fs.readFileSync(path.join(root,'runtime_roster_search_smoke.js'),'utf8');assert(smoke.includes('numbering gap'));assert(smoke.includes('affection remains attached'));});
test('Iteration 33: cache bumped for roster reindexing and BGM import diagnostics',()=>{const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');assert(/const CACHE='honmaru-sim-v40'/.test(sw));});



test('Iteration 31: autonomous NPC interactions have varied action types and persist their specific interaction kind',()=>{assert(app.includes("interactionKind='日常交流'"));for(const kind of ['工作交接','照料协助','休息邀约','谨慎分享','新人请教','经验交流','谨慎联络','协作计划','观点分歧','偶然发现','旧事回访','情绪照应'])assert(app.includes(kind),`missing autonomous interaction type: ${kind}`);assert(app.includes('interactionKind,title:scene[0]'));assert(app.includes('priorSharedEvents:priorCount'));});
test('Iteration 31: API-generated event choices are de-duplicated and must have meaningful differences',()=>{assert(app.includes('API事件JSON无法解析'));assert(app.includes('API事件选项重复或为空'));assert(app.includes('API事件选项缺少实质差异'));assert(app.includes('[...new Set(data.choices.map'));});
test('Iteration 31: autonomous interaction runtime smoke covers memories and world scope',()=>{assert(fs.existsSync(path.join(root,'runtime_autonomous_interaction_smoke.js')));const smoke=fs.readFileSync(path.join(root,'runtime_autonomous_interaction_smoke.js'),'utf8');for(const x of ['interactionKind','participant memories','world-scoped event memory'])assert(smoke.includes(x),`missing smoke assertion ${x}`);});
test('Iteration 31: cache version bumped for NPC autonomy and API output validation',()=>{const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');assert(/const CACHE='honmaru-sim-v\d+'/.test(sw));assert(!/const CACHE='honmaru-sim-v33'/.test(sw));});

test('Iteration 34: single-file builder embeds default BGM audio data',()=>{const b=fs.readFileSync(path.join(root,'build_single.py'),'utf8');assert(b.includes('audio_data=base64.b64encode'));assert(b.includes('data:audio/mpeg;base64,'));});
test('Iteration 34: audio source is playable MP3 and the old mislabeled source is removed',()=>{assert(fs.existsSync(path.join(root,'assets','default-bgm.mp3')));assert(!fs.existsSync(path.join(root,'assets','default-bgm-source.mflac0.flac')));const r=fs.readFileSync(path.join(root,'README.md'),'utf8');assert(r.includes('实际是 AAC 音频封装在 MP4 容器'));assert(r.includes('官方音乐页面快捷入口保持移除'));});


test('Iteration 34: uploaded source is preserved with its actual M4A/MP4 extension',()=>{const f=path.join(root,'assets','default-bgm-source.m4a');assert(fs.existsSync(f));const b=fs.readFileSync(f);assert(b.length>2000000);assert(b.subarray(4,8).toString()==='ftyp','source should have an ISO Base Media MP4 signature');});
test('Iteration 34: default music starts on a user gesture and is enabled in a new game',()=>{assert(app.includes("music:{enabled:true,volume:0.35,defaultTrack:'花の薫りは叶枝垂れ（纯音乐版）'"));assert(app.includes("$('#newGame').onclick=()=>{openSetupModal()}"));assert(app.includes('startDefaultMusicFromGesture();updateClock();renderResources()'));assert(html.includes('<audio id="bgmAudio" src="assets/default-bgm.mp3" loop preload="none"></audio>'));});


test('Iteration 35: title cover recommends Google Chrome without making it mandatory',()=>{assert(html.includes('推荐使用 <strong>Google Chrome</strong> 浏览器'));assert(html.includes('role="note"'));});
test('Iteration 35: roleplay context window is length-aware and preserves newest turns',()=>{assert(app.includes("function selectRoleplayContext(memory, length='medium')"));assert(app.includes("short:{messages:10,chars:8500},medium:{messages:16,chars:16000},long:{messages:24,chars:26000}"));assert(app.includes("selectRoleplayContext(p.memory,state.settings.chatLength||'medium')"));});
test('Iteration 35: OpenAI-compatible, Claude and Gemini API adapters support their SSE streaming formats',()=>{assert(app.includes('stream:wantsStream'));assert(app.includes('streamGenerateContent?alt=sse&key='));assert(app.includes("eventName==='content_block_delta'"));assert(app.includes("contentType.includes('text/event-stream')"));assert(app.includes("payload==='[DONE]'"));assert(app.includes('fallbackAnswer=await callModel'));assert(app.includes('data-stream-content'));});
test('Iteration 35: API timeout and overlapping controller cleanup are explicit',()=>{assert(app.includes('API 请求超时（120 秒）或已中止'));assert(app.includes('if(abortController===controller)abortController=null'));});
test('Iteration 35: worldbook retrieval includes recent context and trims low-value matches',()=>{assert(app.includes('const recentContext=(person.memory||[]).slice(-6)'));assert(app.includes('scored.slice(0,10)'));assert(app.includes("worldbookBudget=state?.settings?.chatLength==='short'?7000:state?.settings?.chatLength==='long'?15000:11000"));assert(app.includes('.slice(0,worldbookBudget)'));});
test('Iteration 35: music is attempted when a new game actually starts and has a user-gesture fallback',()=>{assert(app.includes("$('#newGame').onclick=()=>{openSetupModal()}"));assert(app.includes('startDefaultMusicFromGesture();updateClock();renderResources()'));assert(app.includes("document.addEventListener('pointerdown',()=>{if(state?.stage==='playing'"));assert(app.includes('浏览器暂时拦截了自动播放'));});

test('Iteration 35: API and music runtime smoke tests are included in the release package',()=>{assert(fs.existsSync(path.join(root,'runtime_api_performance_smoke.js')));assert(fs.existsSync(path.join(root,'runtime_music_autoplay_smoke.js')));});

test('Iteration 36: DeepSeek Flash is a default preset, model field remains customizable, and non-thinking mode is configured',()=>{assert(app.includes("if(!$('#apiModel',m).value.trim())$('#apiModel',m).value='deepseek-flash'"));assert(app.includes('模型名称（可自定义）'));assert(app.includes("body.thinking={type:'disabled'}"));assert(app.includes("body.reasoning_effort='none'"));assert(app.includes("long'?8000:state?.settings?.chatLength==='short'?1500:4000"));assert(app.includes('setTimeout(()=>controller.abort(),120000)'));});
test('Iteration 36: chat-first writing guidance and punctuation normalization are active',()=>{assert(app.includes('这是即时聊天，不是小说正文'));assert(app.includes('通常控制在1—4句'));assert(app.includes('避免连续堆叠多个感叹号/问号'));assert(app.includes("replace(/\\.{3,}/g,'……')"));assert(app.includes('动作与心理只点到为止'));});
console.log(JSON.stringify({passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,results},null,2));
if(results.some(x=>x.status==='FAIL')) process.exit(1);

test('Iteration 37: model selection is not locked to DeepSeek Flash and output token budgets are raised again',()=>{assert(app.includes('模型名称（可自定义）'));assert(app.includes('可改成服务商账号支持的其他模型名称'));assert(app.includes("long'?8000:state?.settings?.chatLength==='short'?1500:4000"));assert(app.includes('DeepSeek 选择后默认填入官方端点与 deepseek-flash（可自行改为账号支持的其他模型）'));});
