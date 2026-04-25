// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IERC8004.sol";

contract ChimeraRegistry is
    Initializable,
    ERC721URIStorageUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    IERC8004IdentityRegistry
{
    // Slot 0: creator (20) + tasksCompleted (4) + createdAt (4) + franchiseOpen (1) + isActive (1) = 30 bytes
    // Slot 1: stakedAmount (16) + reputationScore (12) = 28 bytes
    // Slot 2: agentWallet (20 bytes)
    struct AgentIdentity {
        address creator;        // 20 bytes
        uint32 tasksCompleted;  // 4 bytes
        uint32 createdAt;       // 4 bytes
        bool franchiseOpen;     // 1 byte
        bool isActive;          // 1 byte
        // --- slot 1 ---
        uint128 stakedAmount;   // 16 bytes
        uint96 reputationScore; // 12 bytes
        // --- slot 2 ---
        address agentWallet;    // 20 bytes
    }

    uint256 private _nextTokenId;
    mapping(uint256 => AgentIdentity) public agents;
    mapping(address => uint256[]) public creatorAgents;
    mapping(address => uint256) public walletToTokenId;
    mapping(uint256 => mapping(bytes32 => bool)) private _capabilityIndex;
    mapping(uint256 => bytes32[]) private _capabilityList;
    uint32 public franchiseThreshold;

    event AgentMinted(uint256 indexed tokenId, address indexed creator, address agentWallet);
    event FranchiseOpened(uint256 indexed tokenId);
    event CapabilityGranted(uint256 indexed tokenId, bytes32 indexed capabilityId);
    event CapabilityRevoked(uint256 indexed tokenId, bytes32 indexed capabilityId);

    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner, uint32 _franchiseThreshold, uint256 initialNextTokenId)
        external
        initializer
    {
        __ERC721_init("ChimeraRegistry", "CHIMERA");
        __ERC721URIStorage_init();
        __Ownable_init(initialOwner);
        franchiseThreshold = _franchiseThreshold;
        _nextTokenId = initialNextTokenId;
    }

    // -------------------------------------------------------------------------
    // IERC8004IdentityRegistry
    // -------------------------------------------------------------------------

    function registerAgent(address agentWallet, string calldata agentURI)
        external
        override
        returns (uint256 tokenId)
    {
        tokenId = _mintAgent(agentWallet, agentURI, 0);
        emit AgentRegistered(tokenId, agentWallet, agentURI);
    }

    function setAgentURI(uint256 tokenId, string calldata newURI) external override onlyOwner {
        _setTokenURI(tokenId, newURI);
        emit AgentURIUpdated(tokenId, newURI);
    }

    function getAgentURI(uint256 tokenId) external view override returns (string memory) {
        return tokenURI(tokenId);
    }

    // -------------------------------------------------------------------------
    // Extended minting
    // -------------------------------------------------------------------------

    /// @notice Mints a new agent NFT with capabilities; stake is stored for reputation/trust (no USDC is escrowed by this call).
    function mintAgent(
        address agentWallet,
        string calldata agentURI,
        bytes32[] calldata capabilityIds,
        uint128 stakedAmount
    ) external returns (uint256 tokenId) {
        tokenId = _mintAgent(agentWallet, agentURI, stakedAmount);
        for (uint256 i = 0; i < capabilityIds.length; i++) {
            _grantCapability(tokenId, capabilityIds[i]);
        }
    }

    // -------------------------------------------------------------------------
    // Capability management
    // -------------------------------------------------------------------------

    function grantCapability(uint256 tokenId, bytes32 capabilityId) external onlyOwner {
        _grantCapability(tokenId, capabilityId);
    }

    function revokeCapability(uint256 tokenId, bytes32 capabilityId) external onlyOwner {
        _capabilityIndex[tokenId][capabilityId] = false;
        emit CapabilityRevoked(tokenId, capabilityId);
    }

    function hasCapability(uint256 tokenId, bytes32 capabilityId) external view returns (bool) {
        return _capabilityIndex[tokenId][capabilityId];
    }

    function capabilitiesOf(uint256 tokenId) external view returns (bytes32[] memory) {
        return _capabilityList[tokenId];
    }

    // -------------------------------------------------------------------------
    // Agent management
    // -------------------------------------------------------------------------

    function openFranchise(uint256 tokenId) external onlyOwner {
        require(agents[tokenId].tasksCompleted >= franchiseThreshold, "Threshold not met");
        agents[tokenId].franchiseOpen = true;
        emit FranchiseOpened(tokenId);
    }

    function incrementTaskCount(uint256 tokenId) external onlyOwner {
        agents[tokenId].tasksCompleted += 1;
    }

    function updateReputation(uint256 tokenId, uint96 newScore) external onlyOwner {
        agents[tokenId].reputationScore = newScore;
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------

    function _mintAgent(address agentWallet, string calldata agentURI, uint128 stakedAmount)
        internal
        returns (uint256 tokenId)
    {
        tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, agentURI);

        agents[tokenId] = AgentIdentity({
            creator: msg.sender,
            tasksCompleted: 0,
            createdAt: uint32(block.timestamp),
            franchiseOpen: false,
            isActive: true,
            stakedAmount: stakedAmount,
            reputationScore: 0,
            agentWallet: agentWallet
        });

        creatorAgents[msg.sender].push(tokenId);
        walletToTokenId[agentWallet] = tokenId;

        emit AgentMinted(tokenId, msg.sender, agentWallet);
    }

    function _grantCapability(uint256 tokenId, bytes32 capabilityId) internal {
        if (_capabilityIndex[tokenId][capabilityId]) return;
        _capabilityIndex[tokenId][capabilityId] = true;
        _capabilityList[tokenId].push(capabilityId);
        emit CapabilityGranted(tokenId, capabilityId);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
