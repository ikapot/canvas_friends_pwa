import re

path = r'c:\Users\ikapo\Desktop\アンチｇ\canvas_friends_pwa\index.html'

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# The block I inserted earlier (around line 3316) contains duplicate declarations
# Find the inserted block by its unique comment
inserted_block_start = content.find('\n        // --- Global state variables ---\n')
if inserted_block_start == -1:
    print("Inserted block not found by comment")
else:
    inserted_block_end = content.find('\n        // Initialize Archive', inserted_block_start)
    if inserted_block_end == -1:
        inserted_block_end = content.find('        ItaplaRadio.init();', inserted_block_start)
    print(f"Inserted block: {inserted_block_start} to {inserted_block_end}")
    print("Block content:")
    print(content[inserted_block_start:inserted_block_end])

# Check what's at line 1524 already
lines = content.split('\n')
print(f"\nLines 1520-1540:")
for i in range(1519, min(1540, len(lines))):
    print(f"  {i+1}: {lines[i]}")
