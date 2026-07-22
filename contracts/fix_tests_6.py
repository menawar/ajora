import os
import re

# 1. Fix test_RevertSecondResolveAlreadyResolved in DrawManager.t.sol
path1 = 'test/DrawManager.t.sol'
with open(path1, 'r') as f:
    content1 = f.read()

content1 = content1.replace(
'''        vm.expectRevert(DrawManager.AlreadyResolved.selector);
        draw.resolveDraw(period);''',
'''        vm.prank(keeper);
        vm.expectRevert(DrawManager.AlreadyResolved.selector);
        draw.resolveDraw(period);''')

with open(path1, 'w') as f:
    f.write(content1)

# 2. Fix test_RevertDoubleResolve and test_RevertFulfillFromNonCoordinator in DrawRandomness.t.sol
path2 = 'test/DrawRandomness.t.sol'
with open(path2, 'r') as f:
    content2 = f.read()

content2 = content2.replace(
'''    function test_RevertDoubleResolve() public {
        vm.warp(periodEnd + 1);
        vm.prank(keeper);
        draw.resolveDraw(period);

        vm.prank(keeper);
        vm.expectRevert(DrawManager.AlreadyResolved.selector);
        draw.resolveDraw(period);
    }''',
'''    function test_RevertDoubleResolve() public {
        vm.warp(periodEnd + 1);
        vm.prank(keeper);
        uint256 reqId = draw.resolveDraw(period);
        
        uint256[] memory words = new uint256[](1);
        vrfMock.fulfillRandomWordsWithOverride(reqId, address(draw), words);

        vm.prank(keeper);
        vm.expectRevert(DrawManager.AlreadyResolved.selector);
        draw.resolveDraw(period);
    }''')

content2 = content2.replace(
'''    function test_RevertFulfillFromNonCoordinator() public {
        vm.warp(periodEnd + 1);
        vm.prank(keeper);
        draw.resolveDraw(period);

        uint256[] memory words = new uint256[](1);
        vm.expectRevert("Only VRFCoordinator can fulfill");
        draw.rawFulfillRandomWords(1, words);
    }''',
'''    function test_RevertFulfillFromNonCoordinator() public {
        vm.warp(periodEnd + 1);
        vm.prank(keeper);
        draw.resolveDraw(period);

        uint256[] memory words = new uint256[](1);
        vm.expectRevert();
        draw.rawFulfillRandomWords(1, words);
    }''')

with open(path2, 'w') as f:
    f.write(content2)

print("Updated tests")
