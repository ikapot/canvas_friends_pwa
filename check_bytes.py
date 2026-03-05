import os

def check_bytes(path):
    if not os.path.exists(path):
        print(f"{path} not found")
        return
    with open(path, 'rb') as f:
        data = f.read(512)
    print(f"Path: {path}")
    print(f"Hex: {data.hex(' ')}")
    try:
        print(f"UTF-8: {data.decode('utf-8', errors='ignore')[:100]}")
    except:
        pass
    try:
        print(f"UTF-16: {data.decode('utf-16', errors='ignore')[:100]}")
    except:
        pass

check_bytes(r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html.bak')
check_bytes(r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html.ichizen.bak')
