// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {MissionVault} from "../src/MissionVault.sol";
import {ReputationRegistry} from "../src/ReputationRegistry.sol";

// ---------------------------------------------------------------------------
// Mock ERC20 — minimal USDC stand-in
// ---------------------------------------------------------------------------

contract MockUSDC {
    string public name     = "Mock USDC";
    string public symbol   = "USDC";
    uint8  public decimals = 6;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        totalSupply        += amount;
        balanceOf[to]      += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "ERC20: insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to]         += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from]            >= amount, "ERC20: insufficient balance");
        require(allowance[from][msg.sender] >= amount, "ERC20: insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from]             -= amount;
        balanceOf[to]               += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

// ---------------------------------------------------------------------------
// Test contract
// ---------------------------------------------------------------------------

contract MissionVaultTest is Test {
    MockUSDC           internal usdc;
    ReputationRegistry internal registry;
    MissionVault       internal vault;

    address internal constant PLATFORM  = address(0xFEE);
    address internal constant CREATOR_1 = address(0xA1);
    address internal constant CREATOR_2 = address(0xA2);
    address internal constant USER      = address(0xBEEF);

    uint16 internal constant PLATFORM_FEE_BPS = 100; // 1 %
    uint128 internal constant BUDGET          = 1_000e6; // 1 000 USDC (6 decimals)

    // Default agent fixtures
    uint256[] internal agentIds;
    address[] internal creators;
    uint16[]  internal royalties; // [300, 200] = 3 %, 2 %

    function setUp() public {
        // Deploy mock USDC
        usdc = new MockUSDC();

        // Deploy ReputationRegistry behind a UUPS proxy (owner = address(this))
        ReputationRegistry regImpl = new ReputationRegistry();
        bytes memory regInit = abi.encodeWithSelector(
            ReputationRegistry.initialize.selector,
            address(this)
        );
        ERC1967Proxy regProxy = new ERC1967Proxy(address(regImpl), regInit);
        registry = ReputationRegistry(address(regProxy));

        // Deploy MissionVault behind a UUPS proxy (owner = address(this))
        MissionVault vaultImpl = new MissionVault();
        bytes memory vaultInit = abi.encodeWithSelector(
            MissionVault.initialize.selector,
            address(usdc),
            PLATFORM,
            address(registry),
            PLATFORM_FEE_BPS
        );
        ERC1967Proxy vaultProxy = new ERC1967Proxy(address(vaultImpl), vaultInit);
        vault = MissionVault(address(vaultProxy));

        // Authorize MissionVault as a reputation submitter
        registry.setSubmitterAuthorization(address(vault), true);

        // Fund USER and approve vault
        usdc.mint(USER, 10_000e6);
        vm.prank(USER);
        usdc.approve(address(vault), type(uint256).max);

        // Build default agent arrays
        agentIds  = new uint256[](2);
        agentIds[0] = 1;
        agentIds[1] = 2;

        creators = new address[](2);
        creators[0] = CREATOR_1;
        creators[1] = CREATOR_2;

        royalties = new uint16[](2);
        royalties[0] = 300; // 3 %
        royalties[1] = 200; // 2 %
    }

    // -------------------------------------------------------------------------
    // 1. test_CreateMission
    // -------------------------------------------------------------------------

    function test_CreateMission() public {
        vm.prank(USER);
        uint256 missionId = vault.createMission(BUDGET, agentIds, creators, royalties);

        // USDC moved from USER → vault
        assertEq(usdc.balanceOf(USER),           10_000e6 - BUDGET);
        assertEq(usdc.balanceOf(address(vault)),  BUDGET);

        // Mission stored as Active (status == 0)
        (address user, uint8 status,,,, , ,) = _missionFields(missionId);
        assertEq(user,   USER);
        assertEq(status, 0); // STATUS_ACTIVE
    }

    // -------------------------------------------------------------------------
    // 2. test_RewardSplit_Math
    // -------------------------------------------------------------------------

    function test_RewardSplit_Math() public {
        vm.prank(USER);
        uint256 missionId = vault.createMission(BUDGET, agentIds, creators, royalties);

        uint128 totalEarned = 1_000e6; // fully spent

        // Expected splits (all calculated on totalEarned per contract logic):
        //   platformFee = 1000 * 100  / 10000 = 10 USDC
        //   agent1      = 1000 * 300  / 10000 = 30 USDC
        //   agent2      = 1000 * 200  / 10000 = 20 USDC
        //   user earned = 1000 - 10 - 30 - 20 = 940 USDC
        //   unspent     = budget - earned      = 0
        uint256 expectedPlatform = 10e6;
        uint256 expectedCreator1 = 30e6;
        uint256 expectedCreator2 = 20e6;
        uint256 expectedUser     = 940e6;

        uint8[] memory scores = new uint8[](2);
        scores[0] = 80;
        scores[1] = 70;

        // completeMission is onlyOwner; owner == address(this) from setUp
        vault.completeMission(missionId, totalEarned, scores, bytes32("task-1"));

        assertEq(usdc.balanceOf(PLATFORM),  expectedPlatform, "platform fee");
        assertEq(usdc.balanceOf(CREATOR_1), expectedCreator1, "creator 1 royalty");
        assertEq(usdc.balanceOf(CREATOR_2), expectedCreator2, "creator 2 royalty");
        assertEq(usdc.balanceOf(USER),      10_000e6 - BUDGET + expectedUser, "user remainder");
    }

    // -------------------------------------------------------------------------
    // 3. test_UnspentBudgetRefund
    // -------------------------------------------------------------------------

    function test_UnspentBudgetRefund() public {
        vm.prank(USER);
        uint256 missionId = vault.createMission(BUDGET, agentIds, creators, royalties);

        uint128 totalEarned = 800e6; // 800 of 1000 spent

        // platformFee = 800 * 100  / 10000 = 8
        // agent1      = 800 * 300  / 10000 = 24
        // agent2      = 800 * 200  / 10000 = 16
        // user earned = 800 - 8 - 24 - 16  = 752
        // unspent     = 1000 - 800          = 200
        // user total  = 752 + 200           = 952
        uint256 expectedUserBalance = 10_000e6 - BUDGET + 752e6 + 200e6;

        uint8[] memory scores = new uint8[](2);
        scores[0] = 60;
        scores[1] = 55;

        vault.completeMission(missionId, totalEarned, scores, bytes32("task-2"));

        assertEq(usdc.balanceOf(USER), expectedUserBalance, "user gets earned remainder + unspent");
        // Vault should be empty
        assertEq(usdc.balanceOf(address(vault)), 0, "vault drained");
    }

    // -------------------------------------------------------------------------
    // 4. test_CancelMission
    // -------------------------------------------------------------------------

    function test_CancelMission() public {
        vm.prank(USER);
        uint256 missionId = vault.createMission(BUDGET, agentIds, creators, royalties);

        uint256 userBalanceBefore = usdc.balanceOf(USER);

        vm.prank(USER);
        vault.cancelMission(missionId);

        // Full budget returned to user
        assertEq(usdc.balanceOf(USER), userBalanceBefore + BUDGET, "full refund on cancel");
        assertEq(usdc.balanceOf(address(vault)), 0, "vault empty after cancel");

        // Status is Cancelled (2)
        (, uint8 status,,,,,,) = _missionFields(missionId);
        assertEq(status, 2);
    }

    // -------------------------------------------------------------------------
    // 5. test_CompleteMission_RevertsIfNotActive
    // -------------------------------------------------------------------------

    function test_CompleteMission_RevertsIfNotActive() public {
        vm.prank(USER);
        uint256 missionId = vault.createMission(BUDGET, agentIds, creators, royalties);

        uint8[] memory scores = new uint8[](2);
        scores[0] = 90;
        scores[1] = 85;

        vault.completeMission(missionId, BUDGET, scores, bytes32("task-3"));

        // Second call must revert
        vm.expectRevert("Mission not active");
        vault.completeMission(missionId, BUDGET, scores, bytes32("task-3"));
    }

    // -------------------------------------------------------------------------
    // 6. test_RoyaltyCapValidation
    // -------------------------------------------------------------------------

    function test_RoyaltyCapValidation() public {
        uint16[] memory excessiveRoyalties = new uint16[](2);
        excessiveRoyalties[0] = 4000; // 40 %
        excessiveRoyalties[1] = 2000; // 20 %  → total 60 % > 50 %

        vm.prank(USER);
        vm.expectRevert("Royalties exceed 50%");
        vault.createMission(BUDGET, agentIds, creators, excessiveRoyalties);
    }

    // -------------------------------------------------------------------------
    // Helper — unpack the public missions() mapping tuple
    // -------------------------------------------------------------------------

    function _missionFields(uint256 missionId)
        internal
        view
        returns (
            address user,
            uint8 status,
            uint8 agentCount,
            uint64 createdAt,
            uint128 budget,
            uint16 fee,
            address[] memory agentCreators,
            uint16[] memory royaltyBps
        )
    {
        // missions() returns a struct; Solidity exposes each field individually
        // via the auto-generated getter — but dynamic arrays are omitted.
        // We use low-level access to the storage mapping instead.
        (user, status, agentCount, createdAt, budget, fee) = _missionScalars(missionId);
        agentCreators = new address[](0);
        royaltyBps    = new uint16[](0);
    }

    function _missionScalars(uint256 missionId)
        internal
        view
        returns (
            address user,
            uint8 status,
            uint8 agentCount,
            uint64 createdAt,
            uint128 budget,
            uint16 fee
        )
    {
        // The auto-generated getter for a struct with dynamic members only
        // returns the value (non-dynamic) fields.
        (user, status, agentCount, createdAt, budget, fee) =
            vault.missions(missionId);
    }
}
