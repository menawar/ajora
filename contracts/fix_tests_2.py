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
            
            # Fix address(0xVRF)
            content = content.replace('address(0xVRF)', 'address(0x1234)')
            content = content.replace('address(0xPOOL)', 'address(0x5678)')
            
            # Remove bad imports inside contract block
            # In solc, imports inside the contract are syntax errors.
            content = re.sub(r'(?m)^import \{ Treasury \} from "../src/Treasury\.sol";\n?', '', content)
            content = re.sub(r'(?m)^import \{ ITreasury \} from "../src/interfaces/ITreasury\.sol";\n?', '', content)
            content = re.sub(r'(?m)^import \{ MockPoolAddressesProvider \} from "./mocks/MockPoolAddressesProvider\.sol";\n?', '', content)
            
            # Re-add imports at the top
            imports_to_add = """import { Treasury } from "../src/Treasury.sol";
import { ITreasury } from "../src/interfaces/ITreasury.sol";
import { MockPoolAddressesProvider } from "./mocks/MockPoolAddressesProvider.sol";
"""
            if 'Treasury' not in content[:500]:
                content = content.replace('pragma solidity ^0.8.24;\n', 'pragma solidity ^0.8.24;\n\n' + imports_to_add)
            
            if content != original:
                with open(path, 'w') as file:
                    file.write(content)
                    print(f"Updated {path}")
                    
# Fix MockPoolAddressesProvider.sol import path
mock_path = 'test/mocks/MockPoolAddressesProvider.sol'
with open(mock_path, 'r') as file:
    content = file.read()
content = content.replace('../src/interfaces/IPoolAddressesProvider.sol', '../../src/interfaces/IPoolAddressesProvider.sol')
with open(mock_path, 'w') as file:
    file.write(content)
