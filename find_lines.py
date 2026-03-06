import os

file_path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html.ichizen.bak'
ids = ['timeline', 'mapModal', 'settingsModal', 'google', 'main-header']

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    for i, line in enumerate(f, 1):
        for id_val in ids:
            if id_val in line:
                print(f"Line {i}: {id_val} -> {line.strip()[:100]}")
