import re
with open(r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

def print_snippet(name, regex):
    match = re.search(regex, text)
    if match:
        print(f'--- {name} ---')
        print(match.group(0)[:500])
    else:
        print(f'{name} NOT FOUND')

print_snippet('mapModal', r'<div id="mapModal"[\s\S]*?</div>\s*</div>')
print_snippet('header', r'<header id="main-header">[\s\S]*?</header>')
print_snippet('worldBanner', r'<div class="world-banner" id="worldBanner">.*?</div>')
print_snippet('timeline', r'<div class="timeline" id="timeline"></div>')
print_snippet('settingsModal', r'<div id="settingsModal">[\s\S]*?</div>\s*</div>')
