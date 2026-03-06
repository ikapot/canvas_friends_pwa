import re

path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update CSS Variables (Safe regex)
old_vars = r':root\s*\{[\s\S]*?--spacing-base:\s*1\.5rem;\s*\}'
new_vars = r'''
        :root {
            --bg-color: #050505;
            --surface-color: #121212;
            --surface-deep: #1a1a1a;
            --text-primary: #F5F5F5;
            --text-secondary: #A0A0A0;
            --accent-orange: #FF5722;
            --accent-blue: #E0F7FA;
            --border-soft: rgba(255, 255, 255, 0.1);
            --radius-xl: 20px;
            --radius-lg: 12px;
            --font-sans: "BIZ UDPGothic", "UD Digikyo", "Noto Sans JP", sans-serif;
            --font-serif: "BIZ UDPMincho", "Noto Serif JP", serif;
            --font-outfit: "Outfit", sans-serif;
            --transition-smooth: all 0.4s ease;
            --spacing-base: 1rem;
        }
'''
if re.search(old_vars, text):
    text = re.sub(old_vars, new_vars.strip(), text)

# 2. Update Global Body CSS and remove location-specific backgrounds
text = re.sub(r'body\s*\{\s*margin: 0;[\s\S]*?\}',
              'body {\n            margin: 0;\n            background: var(--bg-color);\n            color: var(--text-primary);\n            font-family: var(--font-sans);\n            overflow-x: hidden;\n            transition: var(--transition-smooth);\n            line-height: 1.6;\n            letter-spacing: 0.05em;\n        }', text, count=1)
text = re.sub(r'body\[data-location="[^"]*"\]\s*\{\s*background:[^}]+}\n?', '', text)
text = re.sub(r'body::before\s*\{[\s\S]*?\}', r'/* removed body::before pattern */', text)

# 3. Grid map CSS
new_map_css = r'''
        .antique-map-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: var(--bg-color); z-index: 9000; overflow: hidden; font-family: var(--font-sans); }
        .antique-map-container { position: relative; width: 100%; height: 100%; padding: 60px 20px 20px; box-sizing: border-box; }
        .map-close-btn { position: absolute; top: 20px; left: 20px; background: transparent; color: var(--text-primary); border: 1px solid var(--border-soft); padding: 8px 16px; border-radius: var(--radius-lg); font-size: 14px; cursor: pointer; z-index: 9010; font-family: var(--font-sans); }
        .antique-map-board {
            width: 100%; height: 100%; position: relative;
            background-image: linear-gradient(var(--border-soft) 1px, transparent 1px), linear-gradient(90deg, var(--border-soft) 1px, transparent 1px);
            background-size: 50px 50px;
            background-position: center;
            overflow: hidden;
            border: 1px solid var(--border-soft);
            border-radius: var(--radius-lg);
        }
        #antiqueMapParticipants {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 20px;
            padding: 30px;
            height: 100%;
            overflow-y: auto;
            position: absolute;
            top:0; left:0; right:0; bottom:0;
            z-index: 5;
        }
        .grid-node {
            background: var(--surface-color);
            border: 1px solid var(--border-soft);
            border-radius: var(--radius-lg);
            padding: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            transition: var(--transition-smooth);
            position: relative;
        }
        .grid-node-color {
            width: 12px; height: 12px; border-radius: 50%; margin-bottom: 8px;
            border: 1px solid var(--accent-blue);
        }
        .grid-node-name {
            font-size: 12px; font-weight: bold; color: var(--text-primary); text-transform: uppercase;
        }
        .grid-node-loc {
            font-size: 10px; color: var(--text-secondary); margin-top: 4px; border-top: 1px solid var(--border-soft); padding-top: 4px; width: 100%;
        }
'''
if '.antique-map-modal {' in text:
    old_css_match = re.search(r'\.antique-map-modal \{[\s\S]*?\.polaroid-on-map:hover \{[\s\S]*?\}', text)
    if old_css_match:
         text = text.replace(old_css_match.group(0), new_map_css.strip())

# 4. Remove HTML parts cleanly using index matching instead of generic regex
# Map HTML inner contents
board_start = text.find('<div class="antique-map-board" id="antiqueMapBoard">')
if board_start != -1:
    board_end = text.find('</div>', board_start)
    text = re.sub(r'<svg class="map-svg-layer"[^>]*>[\s\S]*?</svg>\s*', '', text)
    text = re.sub(r'<div id="antiqueMapLocations"></div>\s*', '', text)

# Entrance Layer
ent_start = text.find('<div id="entrance-layer">')
if ent_start != -1:
    ent_end = text.find('<div id="k-map-intro"', ent_start)
    if ent_end != -1:
        ent_end_close = text.find('</div>', ent_end)
        if ent_end_close != -1:
            ent_final_close = text.find('</div>', ent_end_close + 6)
            if ent_final_close != -1:
                text = text[:ent_start] + text[ent_final_close + 6:]

# Radio Container
radio_start = text.find('<div id="radio-container"')
if radio_start != -1:
    radio_end = text.find('</button>', text.find('ItaplaRadio.next()', radio_start))
    if radio_end != -1:
        radio_close1 = text.find('</div>', radio_end)
        if radio_close1 != -1:
            radio_close2 = text.find('</div>', radio_close1 + 6)
            if radio_close2 != -1:
                radio_close3 = text.find('</div>', radio_close2 + 6)
                if radio_close3 != -1:
                    text = text[:radio_start] + text[radio_close3 + 6:]

# Radio Header Button
text = re.sub(r'<button id="radio-header-btn"[\s\S]*?</button>\n\s*', '', text)

# Soul Power
text = re.sub(r'<div id="soul-power" class="soul-power-container"[^>]*>[\s\S]*?</div>\n\s*', '', text)

# 5. JS logical replacements
# entrance functions
text = re.sub(r'// --- Entrance functions ---[\s\S]*?function enterWorld\(loc\) \{[\s\S]*?\}\n', '', text)

# Radio logic
rad_init = text.find('const ItaplaRadio = {')
if rad_init != -1:
    rad_end = text.find('ItaplaRadio.init();', rad_init)
    if rad_end != -1:
        text = text[:rad_init] + text[rad_end + 19:]

# Map Avatar JS
new_avatar = r'''function getPopArtAvatar(key) {
            const avatar = document.createElement('div');
            avatar.className = 'grid-node';
            const color = popArtColors[key] || "#555";
            const p = aiPersonalities[key];
            if (!p) return null;
            avatar.innerHTML = `
                <div class="grid-node-color" style="background: ${color}"></div>
                <div class="grid-node-name">${p.name}</div>
                <div class="grid-node-loc">${p.loc || p.location || 'Unknown'}</div>
            `;
            avatar.onclick = () => {
                const loc = p.loc || p.location;
                if(loc) {
                    currentLocation = loc;
                    applyLocation(loc);
                    closeMap();
                }
            };
            return avatar;
        }'''
text = re.sub(r'function getPopArtAvatar\(key\) \{[\s\S]*?\n\s*\}', new_avatar, text)

# Connections/Pins
text = re.sub(r'function drawMapConnections\(\) \{[\s\S]*?\n\s*\}', 'function drawMapConnections() {}', text)
text = re.sub(r'function createLocationPins\(\) \{[\s\S]*?\n\s*\}', 'function createLocationPins() {}', text)

# entrance display bypass in window.onload
text = re.sub(r'(window\.onload = \(\) => {\s*)if \(!userName\) \{[\s\S]*?\} else \{[\s\S]*?\}', 
              r'\1// Entrance bypassed', text)

# Fix Soul Power UI update
soul_ui = r'''function updateSoulPowerUI() {
            const valEl = document.getElementById('soul-power-value');
            const containerEl = document.getElementById('soul-power');
            const badge = document.getElementById('ai-status-badge');

            if (valEl) valEl.textContent = soulPower;

            const hasUserKey = checkIfUserHasKey();
            if (hasUserKey) {
                if (containerEl) { containerEl.style.opacity = "0.5"; containerEl.title = "自前のAPIキーを使用中（無限）"; }
                if (badge) { badge.textContent = "Premium"; badge.style.color = "#ffd700"; }
            } else if (soulPower > 0) {
                if (containerEl) containerEl.style.opacity = "1";
                if (badge) { badge.textContent = "Cloud"; badge.style.color = "#00d4ff"; }
            } else {
                if (containerEl) containerEl.style.opacity = "0.3";
                if (badge) { badge.textContent = currentAIMode === "LOCAL" ? "Local" : "Lite"; badge.style.color = "#fff"; }
            }
            if (currentAIMode === 'OAUTH' && badge) {
                badge.textContent = '🔗 Google';
                badge.style.color = '#34A853';
            }
        }'''
text = re.sub(r'function updateSoulPowerUI\(\) \{[\s\S]*?\n        \}', soul_ui, text)

# Refine Google OAuth Button style
oauth_btn_old = r'<button id="btn-google-connect"[\s\S]*?>🔗 Googleアカウントで接続</button>'
oauth_btn_new = r'''<button id="btn-google-connect" onclick="startGoogleOAuth()" style="
                    width: 100%; padding: 14px 20px; border: 1px solid var(--border-soft); border-radius: var(--radius-lg);
                    background: var(--surface-color); color: var(--text-primary);
                    font-size: 14px; font-weight: bold; cursor: pointer;
                    font-family: var(--font-sans); letter-spacing: 0.05em;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                ">🔗 Googleアカウントで接続</button>'''
text = re.sub(oauth_btn_old, oauth_btn_new, text)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Complete safe overhaul applied strictly.")
