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
            
            # Inject Treasury state variable if it doesn't exist but is needed
            if 'SprayFaucet' in content or 'StreakSBT' in content or 'DrawManager' in content or 'YieldAdapter' in content:
                if 'Treasury internal treasury;' not in content and 'Treasury public treasury;' not in content:
                    content = re.sub(r'contract [a-zA-Z0-9_]+ is Test \{', r'contract \g<0>\n    import { Treasury } from "../src/Treasury.sol";\n    import { ITreasury } from "../src/interfaces/ITreasury.sol";\n    Treasury internal treasury;\n', content)
            
            # Try a safer injection for imports
            if 'Treasury' not in content:
                content = content.replace('contract ', 'import { Treasury } from "../src/Treasury.sol";\nimport { ITreasury } from "../src/interfaces/ITreasury.sol";\ncontract ')
            
            # Constructors
            content = re.sub(r'new DrawManager\(([^,]+), ([^)]+)\)', r'new DrawManager(\1, \2, address(0xVRF), 1, bytes32(0))', content)
            
            content = re.sub(r'new SprayFaucet\(([^,]+), ([^)]+)\)', r'new SprayFaucet(\1, \2, treasury)', content)
            
            content = re.sub(r'new StreakSBT\(\)', r'new StreakSBT(IERC20(address(cusd)), treasury)', content)
            content = re.sub(r'new StreakSBT\(token\)', r'new StreakSBT(IERC20(address(token)), treasury)', content)
            
            content = re.sub(r'new YieldAdapter\(([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^)]+)\)', r'new YieldAdapter(\1, \2, IPoolAddressesProvider(address(0xPOOL)), \4, treasury, \5)', content)
            
            if content != original:
                with open(path, 'w') as file:
                    file.write(content)
