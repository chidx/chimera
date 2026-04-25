// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC8004IdentityRegistry {
    event AgentRegistered(uint256 indexed tokenId, address indexed agentWallet, string agentURI);
    event AgentURIUpdated(uint256 indexed tokenId, string newURI);

    function registerAgent(address agentWallet, string calldata agentURI) external returns (uint256 tokenId);
    function setAgentURI(uint256 tokenId, string calldata newURI) external;
    function getAgentURI(uint256 tokenId) external view returns (string memory);
}

interface IERC8004ReputationRegistry {
    event FeedbackSubmitted(
        uint256 indexed agentTokenId,
        address indexed submitter,
        uint8 score,
        bytes32 taskRef,
        string evidenceURI
    );

    function submitFeedback(uint256 agentTokenId, uint8 score, bytes32 taskRef, string calldata evidenceURI) external;
    function getFeedbackCount(uint256 agentTokenId) external view returns (uint256);
    function getAverageScore(uint256 agentTokenId) external view returns (uint256);
}

interface IERC8004ValidationRegistry {
    event ValidationRequested(
        uint256 indexed requestId,
        uint256 indexed agentTokenId,
        address indexed validator,
        bytes32 requestHash
    );
    event ValidationResultPosted(uint256 indexed requestId, bool success, string evidenceURI);

    function requestValidation(
        uint256 agentTokenId,
        address validator,
        string calldata requestURI,
        bytes32 requestHash
    ) external returns (uint256 requestId);

    function postValidationResult(uint256 requestId, bool success, string calldata evidenceURI) external;
}
