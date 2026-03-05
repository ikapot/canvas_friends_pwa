import re

path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Find the entrance-layer div and its full extent
# First locate where it starts
entrance_start = content.find('<div id="entrance-layer">')
if entrance_start == -1:
    print("entrance-layer not found!")
    exit()

# Find the closing </div> for entrance-layer (need to count nested divs)
pos = entrance_start + len('<div id="entrance-layer">')
depth = 1
while depth > 0 and pos < len(content):
    open_pos = content.find('<div', pos)
    close_pos = content.find('</div>', pos)
    if close_pos == -1:
        break
    if open_pos != -1 and open_pos < close_pos:
        depth += 1
        pos = open_pos + 4
    else:
        depth -= 1
        if depth == 0:
            entrance_end = close_pos + 6  # include </div>
        pos = close_pos + 6

print(f"Entrance layer: {entrance_start} to {entrance_end}")
print("Current content:")
print(content[entrance_start:entrance_end])
print("\nLength:", entrance_end - entrance_start)
