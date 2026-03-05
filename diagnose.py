import re

path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

lines = content.split('\n')

# 1. Check line 2705 - what's around openMap's null error
print("=== openMap (lines 2700-2715) ===")
for i in range(2699, min(2715, len(lines))):
    print(f"{i+1}: {lines[i]}")

# 2. Check what element IDs are referenced in openMap
print("\n=== function openMap content ===")
idx = content.find('function openMap')
print(content[idx:idx+800])

# 3. Check if murder-wall exists in HTML
print("\n=== murder-wall in HTML ===")
for elem_id in ['murder-wall', 'mapModal', 'murder-wall-board', 'map-board']:
    idx2 = content.find(f'id="{elem_id}"')
    if idx2 != -1:
        print(f'  id="{elem_id}" found at {idx2}')
    else:
        print(f'  id="{elem_id}" NOT FOUND')

# 4. Check publishPost
print("\n=== publishPost ===")
idx3 = content.find('function publishPost')
print(f"function publishPost: {'found at ' + str(idx3) if idx3 != -1 else 'NOT FOUND'}")
# Check line 1516 - what's the HTML button
print(f"\nLine 1516: {lines[1515]}")
print(f"Line 1515: {lines[1514]}")
print(f"Line 1517: {lines[1516]}")
