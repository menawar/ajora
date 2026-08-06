// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {stdStorage, StdStorage} from "forge-std/StdStorage.sol";

contract FindSlotTest is Test {
    using stdStorage for StdStorage;

    function testFindSlot() public {
        address usdm = 0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b;
        address target = 0x0Cf01057391165EcB2Bb989B2255cd581F075DB7;
        
        // Find the slot for target's balance
        uint256 slot = stdstore.target(usdm).sig("balanceOf(address)").with_key(target).find();
        
        console2.log("SLOT_FOUND:");
        console2.logBytes32(bytes32(slot));
    }
}
