// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ChimeraRegistry.sol";

contract FranchiseLicense is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    // Slot 0: pricePerTask (12) + upfrontFee (12) + activeInstances (4) + royaltyBps (2) + maxInstances (2) = 32 bytes
    struct FranchiseTerm {
        uint96 pricePerTask;      // 12 bytes
        uint96 upfrontFee;        // 12 bytes
        uint32 activeInstances;   // 4 bytes
        uint16 royaltyBps;        // 2 bytes
        uint16 maxInstances;      // 2 bytes
    }

    IERC20 public usdc;
    ChimeraRegistry public registry;
    mapping(uint256 => FranchiseTerm) public terms;
    mapping(address => mapping(uint256 => bool)) public licenses;

    event FranchiseTermsSet(uint256 indexed tokenId, uint16 royaltyBps, uint96 pricePerTask, uint96 upfrontFee, uint16 maxInstances);
    event LicensePurchased(uint256 indexed tokenId, address indexed licensee);
    event RoyaltyPaid(uint256 indexed tokenId, address indexed payer, uint256 royalty);

    constructor() {
        _disableInitializers();
    }

    function initialize(address _registry, address _usdc, address initialOwner) external initializer {
        __Ownable_init(initialOwner);
        registry = ChimeraRegistry(_registry);
        usdc = IERC20(_usdc);
    }

    function setFranchiseTerms(
        uint256 tokenId,
        uint16 royaltyBps,
        uint96 pricePerTask,
        uint96 upfrontFee,
        uint16 maxInstances
    ) external {
        require(registry.ownerOf(tokenId) == msg.sender, "Not token owner");
        (,,, bool franchiseOpen,,,,) = registry.agents(tokenId);
        require(franchiseOpen, "Franchise not open");
        require(royaltyBps <= 3000, "Royalty exceeds 30%");

        terms[tokenId] = FranchiseTerm({
            pricePerTask: pricePerTask,
            upfrontFee: upfrontFee,
            activeInstances: terms[tokenId].activeInstances,
            royaltyBps: royaltyBps,
            maxInstances: maxInstances
        });

        emit FranchiseTermsSet(tokenId, royaltyBps, pricePerTask, upfrontFee, maxInstances);
    }

    function purchaseLicense(uint256 tokenId) external {
        FranchiseTerm storage t = terms[tokenId];
        require(t.maxInstances == 0 || t.activeInstances < t.maxInstances, "Max instances reached");
        require(!licenses[msg.sender][tokenId], "License already held");

        licenses[msg.sender][tokenId] = true;
        t.activeInstances += 1;

        if (t.upfrontFee > 0) {
            usdc.safeTransferFrom(msg.sender, registry.ownerOf(tokenId), t.upfrontFee);
        }

        emit LicensePurchased(tokenId, msg.sender);
    }

    function payRoyalty(uint256 tokenId, uint256 taskFee) external {
        require(licenses[msg.sender][tokenId], "No license held");

        uint256 royalty = (taskFee * terms[tokenId].royaltyBps) / 10000;
        if (royalty > 0) {
            usdc.safeTransferFrom(msg.sender, registry.ownerOf(tokenId), royalty);
        }

        emit RoyaltyPaid(tokenId, msg.sender, royalty);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
