import re

with open(r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

scripts = re.findall(r'<script(?! src)[^>]*>(.*?)</script>', text, re.DOTALL)
total_diff = 0
for i, sc in enumerate(scripts):
    open_b = sc.count('{')
    close_b = sc.count('}')
    diff = open_b - close_b
    total_diff += diff
print('Syntax Brace Balance:', total_diff)

if '<div class="timeline" id="timeline"></div>' in text:
    print('Timeline FOUND')
else:
    print('Timeline NOT FOUND')
