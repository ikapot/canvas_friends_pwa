import chardet
import os

def check_file(path):
    if not os.path.exists(path):
        print(f"{path} not found")
        return
    with open(path, 'rb') as f:
        data = f.read(10000)
    result = chardet.detect(data)
    print(f"Path: {path}")
    print(f"Detected: {result}")
    
    if result['encoding']:
        try:
            text = data.decode(result['encoding'])
            print("First 200 chars:")
            print(text[:200])
        except Exception as e:
            print(f"Error decoding with {result['encoding']}: {e}")
    else:
        print("No encoding detected")

check_file(r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html.bak')
check_file(r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html.ichizen.bak')
check_file(r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html')
