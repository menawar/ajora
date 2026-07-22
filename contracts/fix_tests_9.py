import os

path = 'test/SprayFaucet.t.sol'
with open(path, 'r') as f:
    content = f.read()

# 1. test_FundSponsorPoolAccruesToCampaign
content = content.replace(
'''    function test_FundSponsorPoolAccruesToCampaign() public {
        _fund(MTN, 10e18);
        assertEq(faucet.campaignBalance(MTN), 10e18);
        assertEq(cusd.balanceOf(address(faucet)), 10e18);
    }''',
'''    function test_FundSponsorPoolAccruesToCampaign() public {
        _fund(MTN, 10e18);
        assertEq(faucet.campaignBalance(MTN), 9.5e18);
        assertEq(cusd.balanceOf(address(faucet)), 9.5e18);
    }''')

# 2. test_WelcomeTicketCreditsOddsAndBacksJara
content = content.replace(
'''    function test_WelcomeTicketCreditsOddsAndBacksJara() public {
        _fund(MTN, 10e18);
        _verify(amara);
        uint256 period = vault.currentPeriod();

        faucet.welcomeTicket(amara);

        assertEq(vault.ticketsOf(amara, period), 1, "1 ticket of odds");
        assertEq(vault.principalOf(amara, period), 0, "no principal claim");
        assertEq(vault.periodInfo(period).jaraPot, MIN, "backing moved to jara pot");
        assertEq(faucet.campaignBalance(MTN), 10e18 - MIN, "campaign debited");
    }''',
'''    function test_WelcomeTicketCreditsOddsAndBacksJara() public {
        _fund(MTN, 10e18);
        _verify(amara);
        uint256 period = vault.currentPeriod();

        faucet.welcomeTicket(amara);

        assertEq(vault.ticketsOf(amara, period), 1, "1 ticket of odds");
        assertEq(vault.principalOf(amara, period), 0, "no principal claim");
        assertEq(vault.periodInfo(period).jaraPot, MIN, "backing moved to jara pot");
        assertEq(faucet.campaignBalance(MTN), 9.5e18 - MIN, "campaign debited");
    }''')

# 3. test_CampaignBudgetsAreIsolated
content = content.replace(
'''    function test_CampaignBudgetsAreIsolated() public {
        _fund(MTN, 1e18);
        _fund(SAFARICOM, 5e18);
        assertEq(faucet.activeCampaign(), MTN, "first campaign stays active");

        // Drain MTN (10 tickets at 0.1) — Safaricom's budget must be untouchable.
        _verify(amara);
        for (uint256 i = 0; i < 10; i++) {
            address user = address(uint160(0x1000 + i));
            vm.prank(verifier);
            faucet.setVerified(user, true);
            faucet.welcomeTicket(user);
        }
        assertEq(faucet.campaignBalance(MTN), 0);
        assertEq(faucet.campaignBalance(SAFARICOM), 5e18, "isolated");

        vm.expectRevert(SprayFaucet.InsufficientCampaignBudget.selector);
        faucet.welcomeTicket(amara);
    }''',
'''    function test_CampaignBudgetsAreIsolated() public {
        _fund(MTN, 1.1e18); // 1.1 - 5% = 1.045
        _fund(SAFARICOM, 5e18);
        assertEq(faucet.activeCampaign(), MTN, "first campaign stays active");

        // Drain MTN (10 tickets at 0.1) — Safaricom's budget must be untouchable.
        _verify(amara);
        for (uint256 i = 0; i < 10; i++) {
            address user = address(uint160(0x1000 + i));
            vm.prank(verifier);
            faucet.setVerified(user, true);
            faucet.welcomeTicket(user);
        }
        assertEq(faucet.campaignBalance(MTN), 0.045e18);
        assertEq(faucet.campaignBalance(SAFARICOM), 4.75e18, "isolated");

        vm.expectRevert(SprayFaucet.InsufficientCampaignBudget.selector);
        faucet.welcomeTicket(amara);
    }''')

# 4. test_DrainResistance_SpendNeverExceedsFunding
content = content.replace(
'''    function test_DrainResistance_SpendNeverExceedsFunding() public {
        _fund(MTN, 1e18); // backs exactly 10 free tickets
        address[] memory ring = new address[](5);
        for (uint256 i = 0; i < 5; i++) {
            ring[i] = address(uint160(0x2000 + i));
            vm.prank(verifier);
            faucet.setVerified(ring[i], true);
        }

        uint256 issued = 0;
        for (uint256 i = 0; i < 5; i++) {
            // Each ring member welcomes + sprays the next member up to the limit.
            try faucet.welcomeTicket(ring[i]) {
                issued++;
            } catch { }
            for (uint256 s = 0; s < 3; s++) {
                vm.prank(ring[i]);
                try faucet.spray(ring[(i + 1) % 5]) {
                    issued++;
                } catch { }
            }
        }

        assertEq(issued, 10, "exactly the funded ticket count issued");
        assertEq(faucet.campaignBalance(MTN), 0);
        uint256 period = vault.currentPeriod();
        assertEq(vault.periodInfo(period).jaraPot, 1e18, "every issued ticket fully backed");
    }''',
'''    function test_DrainResistance_SpendNeverExceedsFunding() public {
        _fund(MTN, 1e18); // 0.95e18 net, backs exactly 9 free tickets
        address[] memory ring = new address[](5);
        for (uint256 i = 0; i < 5; i++) {
            ring[i] = address(uint160(0x2000 + i));
            vm.prank(verifier);
            faucet.setVerified(ring[i], true);
        }

        uint256 issued = 0;
        for (uint256 i = 0; i < 5; i++) {
            // Each ring member welcomes + sprays the next member up to the limit.
            try faucet.welcomeTicket(ring[i]) {
                issued++;
            } catch { }
            for (uint256 s = 0; s < 3; s++) {
                vm.prank(ring[i]);
                try faucet.spray(ring[(i + 1) % 5]) {
                    issued++;
                } catch { }
            }
        }

        assertEq(issued, 9, "exactly the funded ticket count issued");
        assertEq(faucet.campaignBalance(MTN), 0.05e18); // 0.95e18 - 9*0.1e18 = 0.05e18
        uint256 period = vault.currentPeriod();
        assertEq(vault.periodInfo(period).jaraPot, 0.9e18, "every issued ticket fully backed");
    }''')

with open(path, 'w') as f:
    f.write(content)
print("Updated SprayFaucet.t.sol assertions")
