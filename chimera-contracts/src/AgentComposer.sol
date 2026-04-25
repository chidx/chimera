// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./ChimeraRegistry.sol";

contract AgentComposer is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    // Slot 0: owner (20) + agentCount (1) + createdAt (8) = 29 bytes
    // Dynamic: name, agentTokenIds
    struct ChimeraComposition {
        address owner;       // 20 bytes
        uint8 agentCount;    // 1 byte
        uint64 createdAt;    // 8 bytes
        // --- dynamic ---
        string name;
        uint256[] agentTokenIds;
    }

    uint256 private _nextChimeraId;
    mapping(uint256 => ChimeraComposition) public chimeras;
    mapping(address => uint256[]) public userChimeras;
    ChimeraRegistry public registry;

    event ChimeraComposed(
        uint256 indexed chimeraId,
        address indexed owner,
        string name,
        uint256[] agentTokenIds
    );

    event ChimeraDisassembled(uint256 indexed chimeraId);

    constructor() {
        _disableInitializers();
    }

    function initialize(address _registry, address _owner) external initializer {
        __Ownable_init(_owner);
        registry = ChimeraRegistry(_registry);
    }

    function composeChimera(string calldata name, uint256[] calldata agentTokenIds)
        external
        returns (uint256 chimeraId)
    {
        require(agentTokenIds.length >= 2 && agentTokenIds.length <= 5, "Agent count must be 2-5");

        for (uint256 i = 0; i < agentTokenIds.length; i++) {
            (,,, bool franchiseOpen,,,,) = registry.agents(agentTokenIds[i]);
            require(franchiseOpen, "Agent not franchise-open");
        }

        chimeraId = _nextChimeraId++;

        chimeras[chimeraId] = ChimeraComposition({
            owner: msg.sender,
            agentCount: uint8(agentTokenIds.length),
            createdAt: uint64(block.timestamp),
            name: name,
            agentTokenIds: agentTokenIds
        });

        userChimeras[msg.sender].push(chimeraId);

        emit ChimeraComposed(chimeraId, msg.sender, name, agentTokenIds);
    }

    function disassembleChimera(uint256 chimeraId) external {
        require(chimeras[chimeraId].owner == msg.sender, "Not chimera owner");
        delete chimeras[chimeraId];
        emit ChimeraDisassembled(chimeraId);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
