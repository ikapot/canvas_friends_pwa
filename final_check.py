import re

path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

scripts = re.findall(r'<script(?! src)[^>]*>(.*?)</script>', content, re.DOTALL)
s = scripts[0]

# 1. Brace balance check
o = s.count('{')
c2 = s.count('}')
print(f"Brace balance: open={o}, close={c2}, diff={o-c2} {'OK' if o==c2 else 'MISMATCH'}")

# 2. Key functions exist
fns = ['submitName', 'enterWorld', 'openMap', 'closeMap', 'getPopArtAvatar']
for fn in fns:
    found = f'function {fn}' in s
    print(f"  function {fn}: {'OK' if found else 'MISSING'}")

# 3. Key variables
vars_ = ['userName', 'currentLocation', 'wordLocations', 'worldLocations', 'aiPersonalities', 'popArtColors']
for v in vars_:
    found = v in s
    print(f"  var {v}: {'OK' if found else 'MISSING'}")

# 4. window.onload
print("\nwindow.onload snippet:")
idx = s.find('window.onload')
print(s[idx:idx+300])

# 5. Show the HTML structure for entrance
html_idx = content.find('<div id="entrance-layer">')
if html_idx == -1:
    html_idx = content.find('entrance-layer')
print("\nEntrance layer HTML (first 600 chars):")
print(content[html_idx:html_idx+600])

# 6. Show the name input
name_input_idx = content.find('name-input')
if name_input_idx != -1:
    print("\nname-input context:")
    print(content[name_input_idx-100:name_input_idx+300])
else:
    print("\nname-input: NOT FOUND in HTML")
