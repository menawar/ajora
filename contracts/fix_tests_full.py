import os
import re

test_dir = 'test/'

imports_to_add = """
import { Treasury } from "../src/Treasury.sol";
import { MockPoolAddressesProvider } from "./mocks/MockPoolAddressesProvider.sol";
"""

for root, _, files in os.walk(test_dir):
    for f in files:
        if f.endswith('.t.sol'):
            path = os.path.join(root, f)
            with open(path, 'r') as file:
                content = file.read()
                
            original = content
            
            # Add missing imports (only replace the first instance of '^contract ' at line start)
            if 'import { Treasury }' not in content:
                content = re.sub(r'(?m)^contract ', imports_to_add + 'contract ', content, count=1)
                
            # Inject treasury variable
            if 'Treasury internal treasury;' not in content and 'Treasury public treasury;' not in content:
                content = re.sub(r'(contract [a-zA-Z0-9_]+ is Test(.*?)\{)', r'\1\n    Treasury internal treasury;\n', content, count=1)
                
            # Fix DrawManager
            content = re.sub(r'new DrawManager\(([^,]+), ([^)]+)\);', r'new DrawManager(\1, \2, address(0x1234), 1, bytes32(0));', content)
            
            content = re.sub(r'new SprayFaucet\(([^,]+), ([^)]+)\);', r'new SprayFaucet(\1, \2, treasury);', content)
            content = re.sub(r'new StreakSBT\(\);', r'new StreakSBT(IERC20(address(cusd)), treasury);', content)
            content = re.sub(r'new StreakSBT\(token\);', r'new StreakSBT(IERC20(address(token)), treasury);', content)
            
            # YieldAdapter
            content = re.sub(r'new YieldAdapter\(([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^)]+)\);', r'new YieldAdapter(\1, \2, IPoolAddressesProvider(address(new MockPoolAddressesProvider(address(\3)))), \4, treasury, \5);', content)
            
            if content != original:
                with open(path, 'w') as file:
                    file.write(content)
                    print(f"Updated {path}")
                    
# Fix MockStreakSBT
mock_path = 'test/mocks/MockStreakSBT.sol'
with open(mock_path, 'r') as file:
    content = file.read()
if 'rescueStreak' not in content:
    content = content.replace('    function checkIn() external {\n        streak[msg.sender] += 1;\n        emit CheckedIn(msg.sender, streak[msg.sender], mult[msg.sender]);\n    }', '    function checkIn() external {\n        streak[msg.sender] += 1;\n        emit CheckedIn(msg.sender, streak[msg.sender], mult[msg.sender]);\n    }\n\n    function rescueStreak() external {}')
with open(mock_path, 'w') as file:
    file.write(content)
