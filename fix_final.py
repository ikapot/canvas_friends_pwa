path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# 1. Remove the entire inserted block (it added duplicate declarations)
block_start_marker = '\n        // --- Global state variables ---\n'
block_start = content.find(block_start_marker)
if block_start == -1:
    print("Inserted block not found!")
    exit()

# The block ends just before ItaplaRadio.init();
# Find the ItaplaRadio.init() that comes AFTER the block
itapla_after = content.find('        ItaplaRadio.init();', block_start)
if itapla_after == -1:
    print("ItaplaRadio.init() not found after block!")
    exit()

# Remove the entire inserted block
content = content[:block_start] + '\n' + content[itapla_after:]
print(f"Removed inserted block from position {block_start}")

# 2. Now insert ONLY the two functions (no variable declarations) in the correct spot
# Find where userName is first declared (line 1524 area) to understand context
lines = content.split('\n')
for i, line in enumerate(lines, 1):
    if 'let userName' in line:
        print(f"Line {i}: {line.strip()}")

# Insert the functions right after the userName declaration area
# Find "userName = localStorage" then go to end of that section
insert_after = "let userName = localStorage.getItem('user_name') || \"\";"
idx = content.find(insert_after)
if idx == -1:
    insert_after = "let userName = localStorage.getItem('user_name') || '';"
    idx = content.find(insert_after)

if idx == -1:
    print("ERROR: Could not find userName declaration to anchor insertion point!")
    # Try alternative 
    for alt in ["let userName"]:
        idx = content.find(alt)
        print(f"  '{alt}' found at: {idx}")
else:
    print(f"\nuserName declaration found at: {idx}")
    # Find end of this line
    line_end = content.find('\n', idx)
    # Find a good anchor: end of variable declarations section before functions
    # Look for first 'function ' after userName
    first_fn = content.find('\n        function ', idx)
    print(f"First function def after userName at: {first_fn}")
    # Insert our functions just before the first function defined after userName
    
    new_fns = """\n
        // --- Entrance functions ---
        function submitName() {
            const input = document.getElementById('name-input');
            const name = input ? input.value.trim() : '';
            if (!name) {
                if (input) {
                    input.style.border = '2px solid red';
                    setTimeout(() => { input.style.border = ''; }, 1000);
                }
                return;
            }
            userName = name;
            localStorage.setItem('user_name', userName);
            // Show location select, hide name form
            const locSelect = document.getElementById('location-select');
            if (locSelect) locSelect.style.display = 'flex';
            const nameForm = document.getElementById('name-form');
            if (nameForm) nameForm.style.display = 'none';
        }

        function enterWorld(loc) {
            if (!loc) return;
            currentLocation = loc;
            localStorage.setItem('itapla_location', currentLocation);
            // Hide entrance layer
            const entrance = document.getElementById('entrance-layer');
            if (entrance) {
                entrance.style.opacity = '0';
                entrance.style.pointerEvents = 'none';
                setTimeout(() => { entrance.style.display = 'none'; }, 1500);
            }
            // Show main app
            const mainApp = document.getElementById('main-app') || document.getElementById('app-container');
            if (mainApp) mainApp.style.display = 'block';
            if (typeof loadPosts === 'function') loadPosts();
            if (typeof updateHeader === 'function') updateHeader();
        }

"""
    
    if first_fn != -1:
        content = content[:first_fn] + new_fns + content[first_fn:]
        print(f"Inserted functions before first function at {first_fn}")
    else:
        content = content[:line_end+1] + new_fns + content[line_end+1:]
        print(f"Inserted functions after userName declaration at {line_end}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Saved!")

# Final verification
import re
with open(path, 'r', encoding='utf-8') as f:
    verify = f.read()

scripts = re.findall(r'<script(?! src)[^>]*>(.*?)</script>', verify, re.DOTALL)
if scripts:
    s = scripts[0]
    o = s.count('{')
    c2 = s.count('}')
    print(f"\nBrace balance: open={o}, close={c2}, diff={o-c2} {'OK' if o==c2 else 'MISMATCH'}")

vlines = verify.split('\n')
username_lines = [(i+1, l.strip()) for i, l in enumerate(vlines) if 'let userName' in l]
print(f"let userName declarations: {len(username_lines)}")
for ln, l in username_lines:
    print(f"  Line {ln}: {l}")

print("submitName defined:", 'function submitName' in verify)
print("enterWorld defined:", 'function enterWorld' in verify)
