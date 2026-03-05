import re

path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# The functions to insert - placed before ItaplaRadio.init();
# We insert them in the main inline script, before the last ItaplaRadio.init() call

new_functions = """
        // --- Global state variables ---
        let userName = localStorage.getItem('user_name') || '';
        let currentLocation = localStorage.getItem('itapla_location') || 'cafe';
        let posts = [];

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
            // Hide entrance and show location select
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
            // Init timeline
            if (typeof loadPosts === 'function') loadPosts();
            if (typeof updateHeader === 'function') updateHeader();
        }

"""

# Find the last ItaplaRadio.init(); occurrence in content
marker = '        ItaplaRadio.init();'
idx = content.rfind(marker)
if idx == -1:
    marker = 'ItaplaRadio.init();'
    idx = content.rfind(marker)

if idx == -1:
    print("ERROR: Could not find ItaplaRadio.init() insertion point!")
else:
    # Check if functions already exist
    if 'function submitName' in content:
        print("submitName already exists, skipping insert.")
    else:
        content = content[:idx] + new_functions + content[idx:]
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Inserted submitName, enterWorld, and userName variable.")

# Verify brace balance in inline script
scripts = re.findall(r'<script(?! src)[^>]*>(.*?)</script>', content, re.DOTALL)
if scripts:
    s = scripts[0]
    o = s.count('{')
    c2 = s.count('}')
    print(f"Brace check: open={o}, close={c2}, diff={o-c2}")
    print("OK" if o == c2 else "MISMATCH")
