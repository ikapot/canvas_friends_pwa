import re

path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Check what's currently at the end of the main inline script
scripts = re.findall(r'<script(?! src)[^>]*>(.*?)</script>', content, re.DOTALL)
if not scripts:
    print("No inline scripts found!")
    exit()

main_script = scripts[0]

# Check for window.onload pattern
for pattern in ['window.onload', 'ItaplaRadio.init']:
    idx = main_script.find(pattern)
    print(f'"{pattern}" at script offset: {idx}')
    if idx != -1:
        print(repr(main_script[idx:idx+100]))

# Find the insert point in the full content - just before ItaplaRadio.init()
insert_marker = 'ItaplaRadio.init();'
idx = content.rfind(insert_marker)  # last occurrence
print(f'\n{insert_marker} at content offset: {idx}')
print(repr(content[idx-300:idx+100]))
