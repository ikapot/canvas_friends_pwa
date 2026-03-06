import re

path_curr = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'
path_missing = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\missing_dom.txt'

with open(path_missing, 'r', encoding='utf-8') as f:
    dom = f.read()

# Filter out the obsolete parts (radio, soul power)
dom = re.sub(r'<button id="radio-header-btn"[\s\S]*?</button>', '', dom)
dom = re.sub(r'<div id="soul-power" class="soul-power-container"[\s\S]*?</div>', '', dom)

with open(path_curr, 'r', encoding='utf-8') as f:
    text = f.read()

# Find where to insert. The best place is right before <div id="settingsModal"> or after mapModal
# mapModal is:
#     <div id="mapModal" class="antique-map-modal">
#         ...
#     </div>
# Let's target </canvas>\s*<!-- Antique Map..." block
mapModalMatch = re.search(r'(<div id="mapModal" class="antique-map-modal">[\s\S]*?</div>\s*</div>)', text)

if mapModalMatch:
    original_map = mapModalMatch.group(1)
    new_text = text.replace(original_map, original_map + "\n\n" + dom + "\n")
    with open(path_curr, 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("DOM Successfully Injected.")
else:
    print("Could not find mapModal boundary.")
