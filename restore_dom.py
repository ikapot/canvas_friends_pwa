import re

# We will read the backup and the current file
path_curr = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'
path_bak = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html.bak'

with open(path_bak, 'r', encoding='utf-8', errors='ignore') as f:
    bak = f.read()

with open(path_curr, 'r', encoding='utf-8', errors='ignore') as f:
    curr = f.read()

# Grab the header and timeline parts from the backup
# Backup structure:
# <header id="main-header"> ... </header>
# <div id="trend-ticker-area" ... </div>
# <div class="world-banner" ... </div>
# <div class="timeline" id="timeline"></div>

header_ptn = r'(<header id="main-header">[\s\S]*?</header>\s*<div id="trend-ticker-area"[\s\S]*?</div>\s*<div class="world-banner" id="worldBanner">.*?</div>\s*<div class="timeline" id="timeline"></div>)'
match = re.search(header_ptn, bak)

if match:
    dom_to_restore = match.group(1)
    # Check if they are actually missing in curr
    if 'id="timeline"' not in curr:
        # We need to insert it. Where?
        # Probably after <canvas id="bg-canvas"></canvas> or mapModal
        insert_ptn = r'(<div id="mapModal" class="antique-map-modal">[\s\S]*?</div>\s*</div>)'
        
        # Or better yet, just replace what's right after bg-canvas
        # Let's find bg-canvas and insert there
        if 'id="mapModal"' in curr:
            curr = re.sub(insert_ptn, r'\1\n\n' + dom_to_restore.replace('\\', '\\\\'), curr)
        else:
            curr = re.sub(r'(<canvas id="bg-canvas"></canvas>)', r'\1\n\n' + dom_to_restore.replace('\\', '\\\\'), curr)

        with open(path_curr, 'w', encoding='utf-8') as f:
            f.write(curr)
        print("Restored missing DOM blocks.")
    else:
        print("Timeline is already there?")
else:
    print("Could not find the blocks in the backup.")

