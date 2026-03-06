import re

path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. remove drawMapConnections entirely
text = re.sub(r'function drawMapConnections\(\) \{[\s\S]*?\n\s*\}', 'function drawMapConnections() { console.log("Connections disabled for Grid Map."); }', text)

# 2. remove createLocationPins entirely
text = re.sub(r'function createLocationPins\(\) \{[\s\S]*?\n\s*\}', 'function createLocationPins() { console.log("Location pins disabled for Grid Map."); }', text)

# 3. Clean up the HTML for mapModal
old_html = r'<svg class="map-svg-layer"[^>]*>[\s\S]*?</svg>'
text = re.sub(old_html, '', text)
old_html_loc = r'<div id="antiqueMapLocations"></div>'
text = re.sub(old_html_loc, '', text)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Physical map metaphors removed successfully.')
