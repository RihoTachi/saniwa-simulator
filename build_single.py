from pathlib import Path
import base64, json, re
ROOT=Path(__file__).parent
html=(ROOT/'index.html').read_text(encoding='utf-8')
css=(ROOT/'style.css').read_text(encoding='utf-8')
js=(ROOT/'app.js').read_text(encoding='utf-8')
worldbook=(ROOT/'worldbook.txt').read_text(encoding='utf-8')
for name in ['sakura-red.jpg','golden-garden.jpg','snow-garden.jpg','moon-garden.jpg','green-garden.jpg']:
    data=base64.b64encode((ROOT/'assets'/name).read_bytes()).decode('ascii')
    uri='data:image/jpeg;base64,'+data
    css=css.replace('assets/'+name,uri)
    js=js.replace('assets/'+name,uri)
audio_data=base64.b64encode((ROOT/'assets'/'default-bgm.mp3').read_bytes()).decode('ascii')
html=html.replace('src="assets/default-bgm.mp3"','src="data:audio/mpeg;base64,'+audio_data+'"')
html=re.sub(r'<link rel="manifest"[^>]*>','',html)
html=re.sub(r'<link rel="stylesheet" href="style.css">',lambda _: '<style>\n'+css+'\n</style>',html)
html=re.sub(r'<script src="app.js"></script>',lambda _: '<script>window.EMBEDDED_WORLDBOOK='+json.dumps(worldbook,ensure_ascii=False)+';\n'+js+'\n</script>',html)
(ROOT/'standalone.html').write_text(html,encoding='utf-8')
print(f'Built {ROOT / "standalone.html"} ({(ROOT/"standalone.html").stat().st_size} bytes)')
