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
            
            # DrawRandomness fix
            if f == 'DrawRandomness.t.sol':
                content = content.replace('uint256 requestId = draw.resolveDraw(period);', 'draw.resolveDraw(period);\n        uint256 requestId = 1;')
            
            # YieldAdapter multi-line fix
            # Find new YieldAdapter( ... )
            # We can just replace 'aToken,' with 'aToken, treasury,' if it's there
            # Or we can do a regex that handles newlines.
            
            # Look for 5 arguments in YieldAdapter. Usually it's:
            # new YieldAdapter(
            #     token,
            #     vault,
            #     pool,
            #     aToken,
            #     cap
            # )
            
            # Simple approach: Replace the cap line if it's preceded by aToken
            # The exact lines usually look like:
            #             IERC20(address(aToken)),
            #             cap
            # Or similar. Let's just find the `new YieldAdapter` and count commas.
            
            # Since there are only 4 files with YieldAdapter error:
            # Invariant.t.sol:185
            # PotVaultGuards.t.sol:59
            # PotVaultYield.integration.t.sol:37
            # YieldAdapter.t.sol:33
            # YieldAdapter.fork.t.sol
            
            # Let's replace:
            # IPoolAddressesProvider(address(pool)),
            # aToken,
            # 100_000e18
            # with
            # IPoolAddressesProvider(address(pool)),
            # aToken,
            # treasury,
            # 100_000e18
            
            # We'll just regex for `(aToken|IERC20\(address\(aToken\)\)),\s+([0-9_e]+)\s*\)`
            content = re.sub(r'(aToken|IERC20\(address\(aToken\)\)),(\s+)([0-9_eA-Z]+)\s*\)', r'\1,\2treasury,\2\3)', content)
            
            # YieldAdapter.fork.t.sol:
            content = re.sub(r'(IERC20\(A_CUSD\)),(\s+)([0-9_e]+)\s*\)', r'\1,\2treasury,\2\3)', content)

            if content != original:
                with open(path, 'w') as file:
                    file.write(content)
                    print(f"Updated {path}")
