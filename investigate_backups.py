import os

backups = [
    r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html.bak',
    r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html.ichizen.bak'
]

components = [
    'mapModal',
    'timeline',
    'settingsModal',
    'worldBanner',
    'protocol-warning',
    'main-header',
    'entrance-layer'
]

for b in backups:
    if not os.path.exists(b):
        continue
    print(f"\n--- Scanning {b} ---")
    with open(b, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()
    
    for c in components:
        idx = text.find(c)
        if idx != -1:
            print(f"Component '{c}' found at offset {idx}")
            # Get tag start
            tag_start = text.rfind('<', 0, idx)
            # Find the closing tag or unique block
            # For simplicity, just get 200 chars around it
            snippet = text[tag_start:tag_start+200].strip().replace('\n', ' ')
            print(f"  Snippet: {snippet}...")
        else:
            print(f"Component '{c}' NOT FOUND")
