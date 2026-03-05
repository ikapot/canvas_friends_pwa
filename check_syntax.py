import re

def check_js_syntax(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Extract script blocks
    scripts = re.findall(r'<script>(.*?)</script>', content, re.DOTALL)
    for i, script in enumerate(scripts):
        # Check braces
        open_braces = script.count('{')
        close_braces = script.count('}')
        print(f"Script {i}: {open_braces} {{, {close_braces} }}")
        if open_braces != close_braces:
            print(f"Mismatch in script {i}!")
            # Find the imbalance
            depth = 0
            for line_no, line in enumerate(script.split('\n')):
                depth += line.count('{')
                depth -= line.count('}')
                if depth < 0:
                    print(f"Negative depth at line {line_no}: {line}")
                    break

check_js_syntax(r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html')
