// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ChimeraRegistry} from "../src/ChimeraRegistry.sol";

contract ChimeraRegistryTest is Test {
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    ChimeraRegistry internal registry;

    address internal constant AGENT_WALLET = address(0xBEEF);
    string  internal constant AGENT_URI    = "ipfs://QmTest";

    function setUp() public {
        ChimeraRegistry impl = new ChimeraRegistry();

        bytes memory initData = abi.encodeWithSelector(
            ChimeraRegistry.initialize.selector,
            address(this),
            uint32(10),
            uint256(0)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        registry = ChimeraRegistry(address(proxy));
    }

    // -------------------------------------------------------------------------
    // 1. Mint agent
    // -------------------------------------------------------------------------

    function test_MintAgent() public {
        uint256 tokenId = registry.mintAgent(AGENT_WALLET, AGENT_URI, new bytes32[](0), 0);

        assertEq(tokenId, 0);

        (address creator,,,,,,,address agentWallet) = registry.agents(tokenId);
        assertEq(creator, address(this));
        assertEq(agentWallet, AGENT_WALLET);

        assertEq(registry.tokenURI(tokenId), AGENT_URI);
    }

    // -------------------------------------------------------------------------
    // 2. Grant capability
    // -------------------------------------------------------------------------

    function test_GrantCapability() public {
        uint256 tokenId = registry.mintAgent(AGENT_WALLET, AGENT_URI, new bytes32[](0), 0);

        bytes32 cap = keccak256("capability.inference");
        registry.grantCapability(tokenId, cap);

        assertTrue(registry.hasCapability(tokenId, cap));

        bytes32[] memory caps = registry.capabilitiesOf(tokenId);
        assertEq(caps.length, 1);
        assertEq(caps[0], cap);
    }

    // -------------------------------------------------------------------------
    // 3. Revoke capability
    // -------------------------------------------------------------------------

    function test_RevokeCapability() public {
        uint256 tokenId = registry.mintAgent(AGENT_WALLET, AGENT_URI, new bytes32[](0), 0);

        bytes32 cap = keccak256("capability.inference");
        registry.grantCapability(tokenId, cap);
        assertTrue(registry.hasCapability(tokenId, cap));

        registry.revokeCapability(tokenId, cap);
        assertFalse(registry.hasCapability(tokenId, cap));
    }

    // -------------------------------------------------------------------------
    // 4. openFranchise reverts below threshold
    // -------------------------------------------------------------------------

    function test_OpenFranchise_RevertsBelowThreshold() public {
        uint256 tokenId = registry.mintAgent(AGENT_WALLET, AGENT_URI, new bytes32[](0), 0);

        vm.expectRevert("Threshold not met");
        registry.openFranchise(tokenId);
    }

    // -------------------------------------------------------------------------
    // 5. openFranchise succeeds at threshold
    // -------------------------------------------------------------------------

    function test_OpenFranchise_SucceedsAtThreshold() public {
        uint256 tokenId = registry.mintAgent(AGENT_WALLET, AGENT_URI, new bytes32[](0), 0);

        for (uint256 i = 0; i < 10; i++) {
            registry.incrementTaskCount(tokenId);
        }

        registry.openFranchise(tokenId);

        (,,,bool franchiseOpen,,,, ) = registry.agents(tokenId);
        assertTrue(franchiseOpen);
    }

    // -------------------------------------------------------------------------
    // 6. Capability is semantically blind
    // -------------------------------------------------------------------------

    function test_CapabilityIsSemanticallBlind() public {
        uint256 tokenId = registry.mintAgent(AGENT_WALLET, AGENT_URI, new bytes32[](0), 0);

        bytes32 arbCap = keccak256("anything");
        registry.grantCapability(tokenId, arbCap);

        assertTrue(registry.hasCapability(tokenId, arbCap));

        bytes32[] memory caps = registry.capabilitiesOf(tokenId);
        assertEq(caps.length, 1);
        assertEq(caps[0], arbCap);

        // A different hash is not present — registry is purely value-blind
        assertFalse(registry.hasCapability(tokenId, keccak256("something_else")));
    }
}
