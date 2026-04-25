// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IERC8004.sol";

contract ReputationRegistry is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    IERC8004ReputationRegistry
{
    // Slot 0: submitter (20) + timestamp (4) + score (1) = 25 bytes
    // Slot 1: taskRef (32 bytes)
    // Dynamic: evidenceURI
    struct FeedbackEntry {
        address submitter;   // 20 bytes
        uint32 timestamp;    // 4 bytes
        uint8 score;         // 1 byte
        // --- slot 1 ---
        bytes32 taskRef;
        // --- dynamic ---
        string evidenceURI;
    }

    // Fits in one slot: totalScore (16) + totalCount (16) = 32 bytes
    struct ScoreSummary {
        uint128 totalScore;
        uint128 totalCount;
    }

    mapping(uint256 => FeedbackEntry[]) private _feedback;
    mapping(uint256 => ScoreSummary) public scoreSummary;
    mapping(address => bool) public authorizedSubmitters;

    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) external initializer {
        __Ownable_init(initialOwner);
    }

    function setSubmitterAuthorization(address submitter, bool authorized) external onlyOwner {
        authorizedSubmitters[submitter] = authorized;
    }

    function submitFeedback(
        uint256 agentTokenId,
        uint8 score,
        bytes32 taskRef,
        string calldata evidenceURI
    ) external override {
        require(authorizedSubmitters[msg.sender], "Not authorized");
        require(score <= 100, "Score out of range");

        _feedback[agentTokenId].push(FeedbackEntry({
            submitter: msg.sender,
            timestamp: uint32(block.timestamp),
            score: score,
            taskRef: taskRef,
            evidenceURI: evidenceURI
        }));

        unchecked {
            scoreSummary[agentTokenId].totalScore += score;
            scoreSummary[agentTokenId].totalCount += 1;
        }

        emit FeedbackSubmitted(agentTokenId, msg.sender, score, taskRef, evidenceURI);
    }

    function getFeedbackCount(uint256 agentTokenId) external view override returns (uint256) {
        return _feedback[agentTokenId].length;
    }

    function getAverageScore(uint256 agentTokenId) external view override returns (uint256) {
        ScoreSummary memory s = scoreSummary[agentTokenId];
        if (s.totalCount == 0) return 0;
        return s.totalScore / s.totalCount;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
