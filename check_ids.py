import re
with open(r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

def check(target):
    if target in text:
        print('FOUND:', target)
    else:
        print('MISSING:', target)

check('id="worldBanner"')
check('id="trend-ticker-area"')
check('id="timeline"')
check('id="soul-power-value"')
check('id="soul-power"')
