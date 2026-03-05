path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# 1. Check name-input existence
print("=== name-input ===")
idx = content.find('name-input')
if idx != -1:
    print(content[idx-200:idx+300])
else:
    print("NOT FOUND - this is the bug!")

# 2. Check entrance-form html structure
print("\n=== entrance-form HTML ===")
idx2 = content.find('id="entrance-form"')
if idx2 == -1:
    idx2 = content.find("id='entrance-form'")
if idx2 != -1:
    print(content[idx2:idx2+800])
else:
    print("entrance-form not found!")

# 3. Check if worldLocations is defined in the script (not just used)
print("\n=== worldLocations ===")
for variant in ['const worldLocations', 'let worldLocations', 'var worldLocations', 'worldLocations = ']:
    idx3 = content.find(variant)
    if idx3 != -1:
        print(f"Found '{variant}' at {idx3}")
        print(content[idx3:idx3+200])
        print()
