// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IERC8004.sol";

contract ValidationRegistry is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    IERC8004ValidationRegistry
{
    // Slot 0: poster (20) + requestedAt (4) + completed (1) + success (1) = 26 bytes
    // Slot 1: agentTokenId (32 bytes)
    // Slot 2: requestHash (32 bytes)
    // Dynamic: validator, requestURI, evidenceURI
    struct ValidationRequest {
        address poster;         // 20 bytes
        uint32 requestedAt;     // 4 bytes
        bool completed;         // 1 byte
        bool success;           // 1 byte
        // --- slot 1 ---
        uint256 agentTokenId;
        // --- slot 2 ---
        bytes32 requestHash;
        // --- dynamic ---
        address validator;
        string requestURI;
        string evidenceURI;
    }

    uint256 private _nextRequestId;
    mapping(uint256 => ValidationRequest) public requests;
    mapping(address => bool) public registeredValidators;

    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) external initializer {
        __Ownable_init(initialOwner);
    }

    function registerValidator(address validator, bool approved) external onlyOwner {
        registeredValidators[validator] = approved;
    }

    function requestValidation(
        uint256 agentTokenId,
        address validator,
        string calldata requestURI,
        bytes32 requestHash
    ) external override returns (uint256 requestId) {
        require(registeredValidators[validator], "Validator not registered");

        requestId = _nextRequestId++;

        ValidationRequest storage r = requests[requestId];
        r.poster       = msg.sender;
        r.requestedAt  = uint32(block.timestamp);
        r.completed    = false;
        r.success      = false;
        r.agentTokenId = agentTokenId;
        r.requestHash  = requestHash;
        r.validator    = validator;
        r.requestURI   = requestURI;

        emit ValidationRequested(requestId, agentTokenId, validator, requestHash);
    }

    function postValidationResult(
        uint256 requestId,
        bool success,
        string calldata evidenceURI
    ) external override {
        ValidationRequest storage r = requests[requestId];
        require(msg.sender == r.validator, "Not assigned validator");
        require(!r.completed, "Already completed");

        r.completed   = true;
        r.success     = success;
        r.evidenceURI = evidenceURI;

        emit ValidationResultPosted(requestId, success, evidenceURI);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
