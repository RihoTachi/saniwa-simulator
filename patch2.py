from pathlib import Path
p=Path('/mnt/data/iter20/app.js');s=p.read_text()
s=s.replace("const all=[...s.people.government.swords,...s.people.government.saniwa,...s.people.government.staff,...s.people.present.friends];", "const all=[...s.people.government.swords,...s.people.government.saniwa,...s.people.government.staff,...s.people.government.shikigami,...s.people.present.friends];")
s=s.replace("s.people.government=gov;s.people.present.friends=present;return s;", "s.people.government=gov;s.people.present.friends=present;if(s.stage==='playing'&&!gov.shikigami.length)gov.shikigami=[freshPerson('狐之助','shikigami','government',{role:'时之政府派遣的管狐',summary:'【官方资料中文摘要】狐之助是由时之政府派遣到本丸的管狐；《刀剑乱舞无双》官方介绍其在强袭调查中负责于出阵目的地带路。不同作品版本的细节不自动视为完全相同。来源：https://touken-musou.com/zh-cn/character/konnosuke',isCanon:true})];return s;")
s=s.replace("const categoryRules=p.type==='swords'?'你是刀剑男士，才使用刀种、刀派、锻刀时间等刀剑相关字段。':p.type==='saniwa'", "const categoryRules=p.type==='swords'?'你是刀剑男士，物种为付丧神；才使用刀种、刀派、锻刀时间等刀剑相关字段。':p.type==='shikigami'?'你是式神角色。狐之助属于管狐，负责时之政府与本丸之间的工作联络、日课提醒及必要的引导；不使用刀种、刀派、锻刀时间等刀剑字段，也不能充当现世世界的联络渠道。':p.type==='saniwa'")
s=s.replace("if(p.type==='swords'&&text.length>0){if(/谢谢|辛苦|拜托|帮忙|一起|关心|喜欢/.test(text)&&Math.random()<.55){adjustAffection(p,5);p.relation=p.relation==='无'?'友情':p.relation}}", "if(text.length>0){if(/谢谢|辛苦|拜托|帮忙|一起|关心|喜欢|在意你|辛苦了|做得好|我信任你/.test(text)){adjustAffection(p,/喜欢|在意你|信任你/.test(text)?5:3);if(p.relation==='无'||p.relation==='未定义')p.relation='友情'}else if(/讨厌你|滚开|闭嘴|没用|不信任你|都是你的错/.test(text)){adjustAffection(p,-4)}}")
# Add current attendant constraint in prompt explicitly and direct system rule if staff/saniwa
s=s.replace("其他审神者或政府工作人员若需要交接工作，只能联系玩家已指派的近侍，且交接范围限于工作事务；不得绕过近侍联系其他刀剑男士。", "其他审神者或政府工作人员若需要交接工作，只能联系玩家已指派的近侍，且交接范围限于工作事务；不得绕过近侍联系其他刀剑男士。当前近侍姓名为：${(findPerson(state.attendantId)?.name)||'尚未指派'}。未指派近侍时，不得擅自挑选其他刀剑男士代为交接。")
# The above template literal interpolation sits in JS template literal and is intended to interpolate.
# fix categories label / person species and data
s=s.replace("currentCategory==='swords'?(p.swordType||p.kind):(p.role||p.location||p.kind)", "currentCategory==='swords'?(p.swordType||p.kind):(p.role||p.species||p.location||p.kind)")
s=s.replace("const body=`<div class=\"form-grid\"><div class=\"field\"><label>所属世界</label>", "const body=`<div class=\"form-grid\"><div class=\"field\"><label>所属世界</label>")
# Better affinity actions for events: if NPC participation, update on event choice? Add in event choice generic when event resolves? chat now deterministic enough.
# IDB support on old protocol gracefully, export button status hints
s=s.replace("存档包含游戏状态、人物关系、各世界各自的对话记忆与设置。API Key 和临时音乐文件不会导出。", "存档优先写入 IndexedDB 数据库，并保留精简的 localStorage 备份；图片背景不放入精简备份。存档包含游戏状态、人物关系、各世界各自的对话记忆与设置。API Key 和临时音乐文件不会导出。")
# migrate player species and avatar field default
s=s.replace("s.player.trueName ||= '';s.player.surname ||= '';s.player.givenName ||= '';", "s.player.trueName ||= '';s.player.surname ||= '';s.player.givenName ||= '';s.player.avatarData ||= '';s.player.species ||= '人类';")
# profile save should ensure image save then data state
# use IDB storage estimate info in save modal
s=s.replace("<button id=\"saveNowBtn\" class=\"btn btn-secondary\">立即保存</button>`;", "<button id=\"saveNowBtn\" class=\"btn btn-secondary\">立即保存</button><button id=\"storageInfoBtn\" class=\"btn btn-secondary\">检查浏览器存储空间</button><p id=\"storageInfo\" class=\"soft-copy\">存档优先写入 IndexedDB，避免大型人物记忆和头像挤满 localStorage。</p>`;")
s=s.replace("$('#saveNowBtn',m).onclick=()=>saveGame(false)}", "$('#saveNowBtn',m).onclick=()=>saveGame(false);$('#storageInfoBtn',m).onclick=async()=>{const out=$('#storageInfo',m);out.textContent='正在检查……';try{const e=await navigator.storage?.estimate?.();if(!e){out.textContent='当前浏览器不支持存储空间估算；IndexedDB 仍会尝试保存。';return}out.textContent=`浏览器估算已用 ${(e.usage/1048576).toFixed(2)} MB / ${(e.quota/1048576).toFixed(2)} MB。此数值是估算值，不代表保证可用空间。`;try{const persisted=await navigator.storage?.persist?.();if(persisted)out.textContent+=' 浏览器已允许更持久的存储。'}catch{}}catch{out.textContent='无法读取存储估算；请使用导出存档作为额外备份。'}}}")
p.write_text(s)
