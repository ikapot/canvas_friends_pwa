path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Current broken entrance-layer HTML
old_entrance = '''<div id="entrance-layer">
        <div class="k-dialog-box" id="k-dialog">
            <div style="font-size:40px; margin-bottom:20px;">🚪</div>      
            <span id="k-typewriter"></span>
        </div>
        <div id="entrance-form" style="display: flex; flex-direction: colum
                                                                          font-size:16px; line-height:1.8;"></div>
        </div>iv id="k-map-intro"smic" onclick="submitName()">名乗る</buttoold
    </div>      style="width:100%; text-align:center; margin-bottom:20px; f
            style="display: none; flex-wrap: wrap; justify-content: center;'''

# New clean entrance-layer HTML
new_entrance = '''<div id="entrance-layer">
        <div class="k-dialog-box" id="k-dialog">
            <div style="font-size:40px; margin-bottom:20px;">🚪</div>
            <span id="k-typewriter"></span>
        </div>
        <div id="entrance-form" style="display: flex; flex-direction: column; align-items: center; gap: 20px; margin-top: 30px;">
            <div id="k-greeting" style="width:100%; text-align:center; font-size:16px; line-height:1.8;"></div>
            <div id="name-form" style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                <input id="name-input" class="k-input" type="text" placeholder="あなたの名を…"
                    onkeydown="if(event.key==='Enter') submitName();" />
                <button class="btn-cosmic" onclick="submitName()">名乗る</button>
            </div>
            <div id="location-select" style="display: none; flex-wrap: wrap; justify-content: center; gap: 12px; max-width: 600px;"></div>
        </div>
        <div id="k-map-intro" style="margin-top: 20px; font-size: 14px; opacity: 0.6;"></div>
    </div>'''

if old_entrance in content:
    content = content.replace(old_entrance, new_entrance, 1)
    print("Direct replacement succeeded!")
else:
    print("Direct pattern not found. Trying approximate match...")
    # Find by ID and replace the whole block
    entrance_start = content.find('<div id="entrance-layer">')
    if entrance_start == -1:
        print("ERROR: entrance-layer not found!")
        exit()
    
    # Find end by tracking depth
    pos = entrance_start + len('<div id="entrance-layer">')
    depth = 1
    entrance_end = -1
    while depth > 0 and pos < len(content):
        next_open = content.find('<div', pos)
        next_close = content.find('</div>', pos)
        if next_close == -1:
            break
        if next_open != -1 and next_open < next_close:
            depth += 1
            pos = next_open + 4
        else:
            depth -= 1
            if depth == 0:
                entrance_end = next_close + 6
            pos = next_close + 6
    
    if entrance_end != -1:
        content = content[:entrance_start] + new_entrance + content[entrance_end:]
        print(f"Replaced entrance-layer block ({entrance_start} to {entrance_end})")
    else:
        print("ERROR: Could not find end of entrance-layer!")
        exit()

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Saved successfully.")

# Verify
with open(path, 'r', encoding='utf-8') as f:
    verify = f.read()
print("name-input exists:", 'id="name-input"' in verify)
print("entrance-layer exists:", 'id="entrance-layer"' in verify)
