// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ReputationRegistry.sol";

contract MissionVault is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;
    // -------------------------------------------------------------------------
    // Reentrancy guard (inline, upgradeable-safe)
    // -------------------------------------------------------------------------

    uint256 private _reentrancyStatus; // 1 = not entered, 2 = entered

    modifier nonReentrant() {
        require(_reentrancyStatus != 2, "ReentrancyGuard: reentrant call");
        _reentrancyStatus = 2;
        _;
        _reentrancyStatus = 1;
    }
    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------

    // Slot 0: user (20) + status (1) + agentCount (1) + createdAt (8) = 30 bytes
    // Slot 1: budget (16) + platformFeeBps (2) = 18 bytes
    struct Mission {
        address user;           // 20 bytes
        uint8 status;           // 1 byte  — 0=Active, 1=Completed, 2=Cancelled
        uint8 agentCount;       // 1 byte
        uint64 createdAt;       // 8 bytes
        // --- slot 1 ---
        uint128 budget;         // 16 bytes
        uint16 platformFeeBps;  // 2 bytes
        // --- dynamic ---
        address[] agentCreators;
        uint16[] royaltyBps;
        uint256[] agentTokenIds;
    }

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    uint8 private constant STATUS_ACTIVE    = 0;
    uint8 private constant STATUS_COMPLETED = 1;
    uint8 private constant STATUS_CANCELLED = 2;

    uint8  private constant MAX_AGENTS      = 5;
    uint16 private constant MAX_ROYALTY_BPS = 5000; // 50%
    uint16 private constant BPS_DENOMINATOR = 10000;

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    IERC20 public usdc;
    ReputationRegistry public reputationRegistry;
    address public platform;
    uint16 public platformFeeBps;

    uint256 private _nextMissionId;

    mapping(uint256 => Mission) public missions;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event MissionCreated(uint256 indexed missionId, address indexed user, uint128 budget);
    event MissionCompleted(uint256 indexed missionId, uint128 earned);
    event MissionCancelled(uint256 indexed missionId);
    event RewardSplit(uint256 indexed missionId, address indexed recipient, uint256 amount);

    // -------------------------------------------------------------------------
    // Constructor / Initializer
    // -------------------------------------------------------------------------

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _usdc,
        address _platform,
        address _reputationRegistry,
        uint16 _platformFeeBps
    ) external initializer {
        __Ownable_init(msg.sender);
        _reentrancyStatus = 1;

        require(_usdc != address(0), "Invalid USDC");
        require(_platform != address(0), "Invalid platform");
        require(_reputationRegistry != address(0), "Invalid registry");

        usdc = IERC20(_usdc);
        platform = _platform;
        reputationRegistry = ReputationRegistry(_reputationRegistry);
        platformFeeBps = _platformFeeBps;
    }

    // -------------------------------------------------------------------------
    // External functions
    // -------------------------------------------------------------------------

    function createMission(
        uint128 budget,
        uint256[] calldata agentTokenIds,
        address[] calldata agentCreators,
        uint16[] calldata royaltyBps
    ) external nonReentrant returns (uint256 missionId) {
        require(agentTokenIds.length == agentCreators.length && agentCreators.length == royaltyBps.length, "Array length mismatch");
        require(agentTokenIds.length <= MAX_AGENTS, "Too many agents");
        require(budget > 0, "Budget must be > 0");

        uint256 totalRoyaltyBps;
        for (uint256 i; i < royaltyBps.length; ++i) {
            totalRoyaltyBps += royaltyBps[i];
        }
        require(totalRoyaltyBps <= MAX_ROYALTY_BPS, "Royalties exceed 50%");

        usdc.safeTransferFrom(msg.sender, address(this), budget);

        missionId = _nextMissionId++;

        Mission storage m = missions[missionId];
        m.user           = msg.sender;
        m.status         = STATUS_ACTIVE;
        m.agentCount     = uint8(agentTokenIds.length);
        m.createdAt      = uint64(block.timestamp);
        m.budget         = budget;
        m.platformFeeBps = platformFeeBps;
        m.agentCreators  = agentCreators;
        m.royaltyBps     = royaltyBps;
        m.agentTokenIds  = agentTokenIds;

        emit MissionCreated(missionId, msg.sender, budget);
    }

    function completeMission(
        uint256 missionId,
        uint128 totalEarned,
        uint8[] calldata agentScores,
        bytes32 taskRef
    ) external onlyOwner nonReentrant {
        Mission storage m = missions[missionId];

        require(m.status == STATUS_ACTIVE, "Mission not active");
        require(totalEarned <= m.budget, "Earned exceeds budget");
        require(agentScores.length == m.agentCount, "Score count mismatch");

        m.status = STATUS_COMPLETED;

        // Platform fee
        uint256 platformFee = (uint256(totalEarned) * m.platformFeeBps) / BPS_DENOMINATOR;
        uint256 remaining   = totalEarned;

        if (platformFee > 0) {
            remaining -= platformFee;
            usdc.safeTransfer(platform, platformFee);
            emit RewardSplit(missionId, platform, platformFee);
        }

        // Per-agent royalties
        uint256 agentCount = m.agentCount;
        for (uint256 i; i < agentCount; ++i) {
            uint256 royalty = (uint256(totalEarned) * m.royaltyBps[i]) / BPS_DENOMINATOR;
            if (royalty > 0) {
                remaining -= royalty;
                usdc.safeTransfer(m.agentCreators[i], royalty);
                emit RewardSplit(missionId, m.agentCreators[i], royalty);
            }
        }

        // Remainder of earned → user
        if (remaining > 0) {
            usdc.safeTransfer(m.user, remaining);
            emit RewardSplit(missionId, m.user, remaining);
        }

        // Unspent budget refund → user
        uint256 unspent = m.budget - totalEarned;
        if (unspent > 0) {
            usdc.safeTransfer(m.user, unspent);
            emit RewardSplit(missionId, m.user, unspent);
        }

        // Submit reputation feedback for each agent
        for (uint256 i; i < agentCount; ++i) {
            reputationRegistry.submitFeedback(m.agentTokenIds[i], agentScores[i], taskRef, "");
        }

        emit MissionCompleted(missionId, totalEarned);
    }

    function cancelMission(uint256 missionId) external nonReentrant {
        Mission storage m = missions[missionId];

        require(msg.sender == m.user || msg.sender == owner(), "Not authorized");
        require(m.status == STATUS_ACTIVE, "Mission not active");

        m.status = STATUS_CANCELLED;

        usdc.safeTransfer(m.user, m.budget);

        emit MissionCancelled(missionId);
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
