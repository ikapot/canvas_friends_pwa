path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

lines = content.split('\n')

# Find ALL remaining murder-wall references
print("=== All 'murder-wall' occurrences ===")
for i, line in enumerate(lines):
    if 'murder-wall' in line:
        print(f"Line {i+1}: {line.strip()}")

# Also check what's at line 2705 now (the error line)
print(f"\n=== Lines around 2705 ===")
for j in range(2700, min(2715, len(lines))):
    print(f"{j+1}: {lines[j]}")

# Also check openMap is actually at 2733 (not 2705)
# The browser may be using a different version!
# Let's count how many openMap functions there are
count = sum(1 for l in lines if 'function openMap' in l)
print(f"\nNumber of 'function openMap' definitions: {count}")
for i, l in enumerate(lines):
    if 'function openMap' in l:
        print(f"  Line {i+1}: {l.strip()}")
