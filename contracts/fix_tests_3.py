import os

test_dir = 'test/'
import_str = 'import { IPoolAddressesProvider } from "../src/interfaces/IPoolAddressesProvider.sol";'

for root, _, files in os.walk(test_dir):
    for f in files:
        if f.endswith('.t.sol'):
            path = os.path.join(root, f)
            with open(path, 'r') as file:
                content = file.read()
            
            if 'IPoolAddressesProvider(' in content and 'import { IPoolAddressesProvider }' not in content:
                content = content.replace('import { MockPoolAddressesProvider }', f'{import_str}\nimport {{ MockPoolAddressesProvider }}')
                with open(path, 'w') as file:
                    file.write(content)
                    print(f"Updated {path}")
