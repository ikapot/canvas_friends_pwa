import re

path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# ===== 1. Fix openMap: replace 'murder-wall' references with 'mapModal' =====
# Find the current openMap function
open_map_start = content.find('function openMap()')
open_map_end = content.find('\n        function closeMap', open_map_start)
if open_map_start == -1:
    print("openMap not found!")
else:
    old_open_map = content[open_map_start:open_map_end]
    print("Current openMap:")
    print(old_open_map[:500])
    
    # Replace the whole function with a corrected version
    new_open_map = """function openMap() {
            const modal = document.getElementById('mapModal');
            if (!modal) return;
            modal.style.display = 'block';
            const board = document.getElementById('antiqueMapParticipants');
            if (board) board.innerHTML = '';
            
            // Map markers for active world participants
            Object.entries(aiPersonalities).forEach(([key, p]) => {
                const targetLoc = p.loc || p.location;
                if (!targetLoc) return;
                
                const avatar = getPopArtAvatar(key);
                if (avatar && board) {
                    board.appendChild(avatar);
                }
            });
        }"""
    
    content = content[:open_map_start] + new_open_map + content[open_map_end:]
    print("\nReplaced openMap function.")

# ===== 2. Also fix closeMap to use mapModal =====
close_map_start = content.find('function closeMap')
close_map_end = content.find('\n        function ', close_map_start + 20)
if close_map_start != -1:
    old_close = content[close_map_start:close_map_end]
    print("\nCurrent closeMap:")
    print(old_close[:300])
    
    new_close_map = """function closeMap() {
            const modal = document.getElementById('mapModal');
            if (modal) modal.style.display = 'none';
        }"""
    
    content = content[:close_map_start] + new_close_map + content[close_map_end:]
    print("Replaced closeMap.")

# ===== 3. Add publishPost function =====
if 'function publishPost' not in content:
    # Find where to insert: look for what line 1516 is about - it's a button onclick
    # Find the publish button context
    idx_pub = content.find("onclick=\"publishPost")
    if idx_pub != -1:
        print(f"\npublishPost onclick found at: {idx_pub}")
        print(content[idx_pub-200:idx_pub+100])
    
    # Insert publishPost before submitName
    insert_before = '        // --- Entrance functions ---'
    new_publish = """        // --- Post publishing ---
        function publishPost() {
            const textarea = document.getElementById('post-input') || document.querySelector('textarea');
            if (!textarea) return;
            const text = textarea.value.trim();
            if (!text) return;
            
            const newPost = {
                id: Date.now(),
                author: userName || 'anonymous',
                text: text,
                timestamp: Date.now(),
                loc: currentLocation,
                likes: 0
            };
            
            posts.unshift(newPost);
            
            // Save to localStorage
            try {
                const saved = JSON.parse(localStorage.getItem('itapla_posts') || '[]');
                saved.unshift(newPost);
                localStorage.setItem('itapla_posts', JSON.stringify(saved.slice(0, 1000)));
            } catch(e) {}
            
            textarea.value = '';
            if (typeof renderTimeline === 'function') renderTimeline();
        }

"""
    idx_insert = content.find(insert_before)
    if idx_insert != -1:
        content = content[:idx_insert] + new_publish + content[idx_insert:]
        print("\nInserted publishPost function.")
    else:
        print("\nCould not find insertion point for publishPost!")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("\nSaved!")

# Final check
scripts = re.findall(r'<script(?! src)[^>]*>(.*?)</script>', content, re.DOTALL)
if scripts:
    s = scripts[0]
    o = s.count('{')
    c2 = s.count('}')
    print(f"Brace balance: open={o}, close={c2}, diff={o-c2} {'OK' if o==c2 else 'MISMATCH'}")
    print("publishPost:", 'function publishPost' in s)
    print("openMap:", 'function openMap' in s)
    print("murder-wall remaining:", 'murder-wall' in s)
