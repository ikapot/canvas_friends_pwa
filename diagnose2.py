import re

path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

lines = content.split('\n')

# ===== 1. Check for murder-wall ID in HTML =====
print("=== IDs related to map ===")
for elem_id in ['murder-wall', 'mapModal', 'murder-wall-board', 'map-board', 'antique-map', 'antiqueMap']:
    idx = content.find(f'id="{elem_id}"')
    if idx != -1:
        print(f'id="{elem_id}" found')
        print(content[idx:idx+200])
        print()
    else:
        print(f'id="{elem_id}" NOT FOUND')

# ===== 2. Check publishPost =====
print("\n=== publishPost ===")
idx3 = content.find('function publishPost')
print(f"function publishPost: {'found at line ' + str(content[:idx3].count(chr(10))) if idx3 != -1 else 'NOT FOUND'}")

# Also check what calls publishPost (what's on line 1516)
print(f"\nLine 1514-1520:")
for i in range(1513, min(1520, len(lines))):
    print(f"  {i+1}: {lines[i]}")

# ===== 3. Check what 'murder-wall' modal looks like in HTML =====
print("\n=== Map modal HTML (first occurrence of 'modal' in HTML) ===")
idx4 = content.find('mapModal')
if idx4 != -1:
    print(content[idx4:idx4+600])
else:
    # Look for murder-wall in HTML
    idx5 = content.find('murder-wall')
    print(f"murder-wall found at: {idx5}")
    if idx5 != -1:
        print(content[idx5-100:idx5+300])
