import re

paths = [
    r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html.bak',
    r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html.ichizen.bak',
]

for p in paths:
    print(f"=== {p} ===")
    try:
        with open(p, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()
        
        header = text.find('<header id="main-header">')
        print("Header offset:", header)
        
        if header != -1:
            timeline = text.find('<div class="timeline"', header)
            if timeline != -1:
                end_timeline = text.find('</div>', timeline) + 6
                print("Timeline offset:", timeline, "to", end_timeline)
                print("CONTENT:")
                print(text[header:end_timeline][:500] + "\n...\n" + text[header:end_timeline][-500:])
                
                # We can save this exact content to a temporary file
                with open('c:\\Users\\ikapo\\Desktop\\アンチｇ\\canvas_friends_pwa\\missing_dom.txt', 'w', encoding='utf-8') as mf:
                    mf.write(text[header:end_timeline])
                print("Wrote missing DOM to missing_dom.txt")
                break
    except Exception as e:
        print("Error reading:", e)
