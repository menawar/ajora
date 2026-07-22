import os
import re

for root, _, files in os.walk('test/'):
    for f in files:
        if f.endswith('.t.sol'):
            path = os.path.join(root, f)
            with open(path, 'r') as file:
                content = file.read()
            original = content
            
            # Replace the 0x1337 treasury with MockTreasury
            if '0x1337' in content:
                content = content.replace('treasury = Treasury(address(0x1337));', 'treasury = Treasury(address(new MockTreasury()));')
                
                # Add import if missing
                if 'import { MockTreasury }' not in content:
                    content = content.replace('import { Treasury }', 'import { Treasury }\nimport { MockTreasury } from "./mocks/MockTreasury.sol";')
                    if 'import { MockTreasury }' not in content:
                        content = 'import { MockTreasury } from "./mocks/MockTreasury.sol";\n' + content
            
            if content != original:
                with open(path, 'w') as file:
                    file.write(content)
                    print(f'Updated {path}')
