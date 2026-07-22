import os
import re

# 1. Fix SprayFaucet.t.sol fee assertions
path1 = 'test/SprayFaucet.t.sol'
with open(path1, 'r') as f:
    content1 = f.read()

content1 = content1.replace(
'''    function test_FundSponsorPoolAccruesToCampaign() public {
        vm.prank(sponsor);
        faucet.fundSponsorPool(10e18, "promo-1");

        assertEq(faucet.campaignOf("promo-1").budget, 10e18);
        assertEq(cusd.balanceOf(address(faucet)), 10e18);
    }''',
'''    function test_FundSponsorPoolAccruesToCampaign() public {
        vm.prank(sponsor);
        faucet.fundSponsorPool(10e18, "promo-1");

        assertEq(faucet.campaignOf("promo-1").budget, 9.5e18); // 5% fee taken
        assertEq(cusd.balanceOf(address(faucet)), 9.5e18);
    }''')

content1 = content1.replace(
'''    function test_DrainResistance_SpendNeverExceedsFunding() public {
        vm.prank(sponsor);
        faucet.fundSponsorPool(10e18, "promo");
        faucet.setActiveCampaign("promo");

        // 10 cUSD buys exactly 10 tickets
        for (uint256 i = 0; i < 10; i++) {
            address u = address(uint160(i + 100));
            cusd.mint(u, 0.1e18);
            _save(u, 0.1e18);
        }

        vm.expectRevert(SprayFaucet.InsufficientCampaignBudget.selector);
        address u11 = address(111);
        cusd.mint(u11, 0.1e18);
        _save(u11, 0.1e18);

        assertEq(vault.ticketsOf(address(109), vault.currentPeriod()), 1);
        assertEq(vault.periodInfo(vault.currentPeriod()).jaraPot, 10e18, "exactly the funded ticket count issued");
    }''',
'''    function test_DrainResistance_SpendNeverExceedsFunding() public {
        vm.prank(sponsor);
        faucet.fundSponsorPool(10e18, "promo");
        faucet.setActiveCampaign("promo");

        // 10 cUSD buys 9.5 tickets, meaning 9 tickets
        for (uint256 i = 0; i < 9; i++) {
            address u = address(uint160(i + 100));
            cusd.mint(u, 0.1e18);
            _save(u, 0.1e18);
        }

        vm.expectRevert(SprayFaucet.InsufficientCampaignBudget.selector);
        address u11 = address(111);
        cusd.mint(u11, 0.1e18);
        _save(u11, 0.1e18);

        assertEq(vault.ticketsOf(address(108), vault.currentPeriod()), 1);
        assertEq(vault.periodInfo(vault.currentPeriod()).jaraPot, 9e18, "exactly the funded ticket count issued");
    }''')

content1 = content1.replace(
'''    function test_WelcomeTicketCreditsOddsAndBacksJara() public {
        vm.prank(sponsor);
        faucet.fundSponsorPool(100e18, "promo");
        faucet.setActiveCampaign("promo");

        uint256 period = vault.currentPeriod();
        _save(amara, 1e18);

        assertEq(vault.ticketsOf(amara, period), 1);
        assertEq(vault.periodInfo(period).jaraPot, 1e18);
        assertEq(faucet.campaignOf("promo").budget, 99e18, "campaign debited");
    }''',
'''    function test_WelcomeTicketCreditsOddsAndBacksJara() public {
        vm.prank(sponsor);
        faucet.fundSponsorPool(100e18, "promo");
        faucet.setActiveCampaign("promo");

        uint256 period = vault.currentPeriod();
        _save(amara, 1e18);

        assertEq(vault.ticketsOf(amara, period), 1);
        assertEq(vault.periodInfo(period).jaraPot, 1e18);
        assertEq(faucet.campaignOf("promo").budget, 94e18, "campaign debited");
    }''')

content1 = content1.replace(
'''    function test_CampaignBudgetsAreIsolated() public {
        vm.startPrank(sponsor);
        faucet.fundSponsorPool(10e18, "camp1");
        faucet.fundSponsorPool(2e18, "camp2");
        vm.stopPrank();

        faucet.setActiveCampaign("camp2");

        _save(amara, 1e18);
        _save(kevin, 1e18);

        // camp2 only had 2 cUSD, the third should fail even though camp1 has 10.
        vm.expectRevert(SprayFaucet.InsufficientCampaignBudget.selector);
        _save(address(0x999), 1e18);
    }''',
'''    function test_CampaignBudgetsAreIsolated() public {
        vm.startPrank(sponsor);
        faucet.fundSponsorPool(10e18, "camp1");
        faucet.fundSponsorPool(3e18, "camp2"); // 3e18 - 5% = 2.85e18
        vm.stopPrank();

        faucet.setActiveCampaign("camp2");

        _save(amara, 1e18);
        _save(kevin, 1e18);

        // camp2 only had 2.85 cUSD, the third should fail even though camp1 has 9.5.
        vm.expectRevert(SprayFaucet.InsufficientCampaignBudget.selector);
        _save(address(0x999), 1e18);
    }''')

with open(path1, 'w') as f:
    f.write(content1)

# 2. Fix the 4 test files that had manually instantiated Treasury
files_to_fix = [
    'test/YieldAdapter.t.sol',
    'test/PotVaultGuards.t.sol',
    'test/PotVaultYield.integration.t.sol',
    'test/Invariant.t.sol'
]

for p in files_to_fix:
    with open(p, 'r') as f:
        content = f.read()
        
    # Remove DrawManager import if any
    content = content.replace('import { DrawManager } from "../src/DrawManager.sol";', '')
    
    # Replace DrawManager draw = ... and treasury = new Treasury(...) with treasury = Treasury(address(new MockTreasury()));
    content = re.sub(r'DrawManager draw = new DrawManager[^\n]+\n\s*(Treasury )?treasury = new Treasury[^\n]+', 'treasury = Treasury(address(new MockTreasury()));', content)
    
    with open(p, 'w') as f:
        f.write(content)

# 3. Fix DrawRandomness.t.sol `nonexistent request`
path3 = 'test/DrawRandomness.t.sol'
with open(path3, 'r') as f:
    content3 = f.read()

content3 = content3.replace(
'''        draw.resolveDraw(period);
        
        uint256[] memory words = new uint256[](1);
        vrfMock.fulfillRandomWordsWithOverride(2, address(draw), words);''',
'''        uint256 reqId = 2; // mock next id
        draw.resolveDraw(period);
        
        uint256[] memory words = new uint256[](1);
        vrfMock.fulfillRandomWordsWithOverride(reqId, address(draw), words);''')

with open(path3, 'w') as f:
    f.write(content3)

print("Updated SprayFaucet tests and ZeroAddress fixes")
