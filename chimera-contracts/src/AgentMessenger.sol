// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract AgentMessenger is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    // Slot 0: missionId (4) + fromTokenId (4) + toTokenId (4) + timestamp (4) = 16 bytes
    // Slot 1: payloadHash (32 bytes)
    // Dynamic: messageType
    struct MessageLog {
        uint32 missionId;
        uint32 fromTokenId;
        uint32 toTokenId;
        uint32 timestamp;
        // --- slot 1 ---
        bytes32 payloadHash;
        // --- dynamic ---
        string messageType;
    }

    uint256 private _nextLogId;
    mapping(uint256 => MessageLog) public logs;

    event AgentMessageLogged(
        uint256 indexed logId,
        uint32 indexed missionId,
        uint32 indexed fromTokenId,
        uint32 toTokenId,
        string messageType,
        bytes32 payloadHash,
        uint32 timestamp
    );

    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) external initializer {
        __Ownable_init(initialOwner);
    }

    function logMessage(
        uint32 missionId,
        uint32 fromTokenId,
        uint32 toTokenId,
        string calldata messageType,
        bytes32 payloadHash
    ) external returns (uint256 logId) {
        logId = _nextLogId++;
        uint32 timestamp = uint32(block.timestamp);

        logs[logId] = MessageLog({
            missionId: missionId,
            fromTokenId: fromTokenId,
            toTokenId: toTokenId,
            timestamp: timestamp,
            payloadHash: payloadHash,
            messageType: messageType
        });

        emit AgentMessageLogged(logId, missionId, fromTokenId, toTokenId, messageType, payloadHash, timestamp);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
