path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

lines = content.split('\n')

# Show current openMap
start_line = None
for i, line in enumerate(lines):
    if 'function openMap' in line:
        start_line = i
        break

if start_line is not None:
    print(f"openMap starts at line {start_line+1}")
    for j in range(start_line, min(start_line+30, len(lines))):
        print(f"{j+1}: {lines[j]}")
else:
    print("openMap not found!")
