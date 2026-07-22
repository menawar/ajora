import os
import re

test_dir = 'test/'

for root, _, files in os.walk(test_dir):
    for f in files:
        if f.endswith('.t.sol'):
            path = os.path.join(root, f)
            with open(path, 'r') as file:
                content = file.read()
            
            original = content
            
            # Find setUp() and inject treasury = Treasury(address(0x1337)); if missing and treasury is used
            if 'treasury =' not in content and 'Treasury internal treasury;' in content:
                content = re.sub(r'(function setUp\(\)(?: public)? \{)', r'\1\n        treasury = Treasury(address(0x1337));', content, count=1)
                
            if content != original:
                with open(path, 'w') as file:
                    file.write(content)
                    print(f"Updated {path}")
