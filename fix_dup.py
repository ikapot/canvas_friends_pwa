import re

path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Find all userName declarations
lines = content.split('\n')
for i, line in enumerate(lines, 1):
    if 'userName' in line and ('let ' in line or 'var ' in line or 'const ' in line):
        print(f"Line {i}: {line.strip()}")

# Also find all occurrences
print("\nAll 'let userName' occurrences:")
for i, line in enumerate(lines, 1):
    if 'let userName' in line or 'var userName' in line:
        print(f"Line {i}: {line.strip()}")
