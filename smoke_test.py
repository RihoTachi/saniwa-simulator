from pathlib import Path
from playwright.sync_api import sync_playwright
import os, json
root=Path(__file__).resolve().parent
errors=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_content((root/'standalone.html').read_text(encoding='utf-8'),wait_until='domcontentloaded',timeout=60000)
    page.wait_for_timeout(1200)
    title=page.title()
    # Skip intro and open new game setup
    if page.locator('#skipIntro').count(): page.locator('#skipIntro').click(timeout=5000)
    page.wait_for_timeout(400)
    page.locator('#newGame').click(timeout=5000)
    page.wait_for_timeout(300)
    setup=page.locator('#setupCodename').count()==1
    page.locator('#setupCodename').fill('白狐测试')
    page.locator('[data-confirm]').last.click()
    page.wait_for_timeout(700)
    app_visible=page.locator('#app').evaluate("el=>!el.classList.contains('hidden')")
    # open player profile menu
    page.locator('#menuToggle').click()
    page.wait_for_timeout(150)
    has_profile=page.locator('#playerProfileSettings').count()==1
    page.locator('#playerProfileSettings').click()
    page.wait_for_timeout(250)
    profile_modal=page.get_by_text('玩家资料设定',exact=True).count()>0
    print(json.dumps({'title':title,'setup_opened':setup,'app_visible_after_start':app_visible,'player_profile_menu':has_profile,'profile_modal_opened':profile_modal,'page_errors':errors},ensure_ascii=False))
    browser.close()

