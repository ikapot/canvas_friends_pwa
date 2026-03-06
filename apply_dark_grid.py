import re

path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update CSS Variables
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
text = re.sub(old_vars, new_vars.strip(), text)

# 2. Update Global Body CSS
text = re.sub(r'body\s*\{\s*margin: 0;\s*background: var\(--bg-dark\);\s*color: var\(--text-main\);[\s\S]*?\}',
              'body {\n            margin: 0;\n            background: var(--bg-color);\n            color: var(--text-primary);\n            font-family: var(--font-sans);\n            overflow-x: hidden;\n            transition: var(--transition-smooth);\n            line-height: 1.6;\n            letter-spacing: 0.05em;\n        }', text)

# 3. Remove body[data-location=...] radial gradients that bloat the CSS
text = re.sub(r'body\[data-location="[^"]*"\]\s*\{\s*background:[^}]+}\n', '', text)

# 4. Redefine Map CSS (Antique map to Grid map)
# We will just inject the new CSS safely into the head
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
        .grid-node::before {
            content: '';
            position: absolute;
            top: 50%; left: -20px; width: 20px; height: 1px;
            background: var(--accent-orange);
            opacity: 0.5;
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
        #mapSvgLayer { position: absolute; top:0; left:0; width:100%; height:100%; z-index: 1; pointer-events: none; opacity: 0.3; }
'''
# Replace old map css
if '.antique-map-modal {' in text:
    old_css_match = re.search(r'\.antique-map-modal \{[\s\S]*?\.polaroid-on-map:hover \{[\s\S]*?}', text)
    if old_css_match:
         text = text.replace(old_css_match.group(0), new_map_css.strip())

# 5. Overwrite getPopArtAvatar
old_avatar = r'function getPopArtAvatar\(key\) \{[\s\S]*?\n\s*\}'
new_avatar = r'''function getPopArtAvatar(key) {
            const avatar = document.createElement('div');
            avatar.className = 'grid-node';
            const color = popArtColors[key] || "linear-gradient(135deg, #333, #000)";
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
text = re.sub(old_avatar, new_avatar, text)

# Write to file
with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Dark Mode & Grid Map CSS/JS applied successfully.')
