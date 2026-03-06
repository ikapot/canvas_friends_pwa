import re

path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Entrance layer
text = re.sub(r'<div id="entrance-layer">[\s\S]*?<div id="k-map-intro"[^>]*></div>\s*</div>', '', text)

# 2. Radio container
text = re.sub(r'<div id="radio-container"[\s\S]*?id="radio-volume"[\s\S]*?</div>\s*</div>\s*</div>', '', text)

# 3. Radio Header Button
text = re.sub(r'<button id="radio-header-btn"[\s\S]*?</button>', '', text)

# 4. Soul Power
text = re.sub(r'<div id="soul-power"[\s\S]*?</div>', '', text)

# 5. Entrance JS
text = re.sub(r'// --- Entrance functions ---[\s\S]*?function enterWorld\(loc\)\s*{[\s\S]*?}\n', '', text)

# 6. Radio JS
# We can't rely just on one big regex for ItaplaRadio. Let's find index.
if 'const ItaplaRadio = {' in text:
    idx_start = text.find('const ItaplaRadio = {')
    idx_end = text.find('ItaplaRadio.init();')
    if idx_end != -1:
        text = text[:idx_start] + text[idx_end + len('ItaplaRadio.init();'):]

# 7. window.onload logic removal (specifically removing greeting typewriter and entrance logic)
# Just find everything inside window.onload until setWorldState
onload_match = re.search(r'(window\.onload = \(\) => {)[\s\S]*?(setWorldState\(worldState\);)', text)
if onload_match:
    original = onload_match.group(0)
    new_onload = onload_match.group(1) + '\n            ' + onload_match.group(2)
    text = text.replace(original, new_onload)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Cleanup script executed.')
