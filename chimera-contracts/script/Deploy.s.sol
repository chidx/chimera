// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../src/ChimeraRegistry.sol";
import "../src/ReputationRegistry.sol";
import "../src/ValidationRegistry.sol";
import "../src/MissionVault.sol";
import "../src/FranchiseLicense.sol";
import "../src/AgentComposer.sol";
import "../src/AgentMessenger.sol";

contract Deploy is Script {
    function run() external {
        address deployer    = vm.envAddress("DEPLOYER_ADDRESS");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");

        vm.startBroadcast(deployer);

        // ── 1. ChimeraRegistry ────────────────────────────────────────────────
        ChimeraRegistry registryImpl = new ChimeraRegistry();
        address registryProxy = address(new ERC1967Proxy(
            address(registryImpl),
            abi.encodeCall(ChimeraRegistry.initialize, (deployer, 10, 37))
        ));

        // ── 2. ReputationRegistry ─────────────────────────────────────────────
        ReputationRegistry reputationImpl = new ReputationRegistry();
        address reputationProxy = address(new ERC1967Proxy(
            address(reputationImpl),
            abi.encodeCall(ReputationRegistry.initialize, (deployer))
        ));

        // ── 3. ValidationRegistry ─────────────────────────────────────────────
        ValidationRegistry validationImpl = new ValidationRegistry();
        address validationProxy = address(new ERC1967Proxy(
            address(validationImpl),
            abi.encodeCall(ValidationRegistry.initialize, (deployer))
        ));

        // ── 4. MissionVault ───────────────────────────────────────────────────
        MissionVault vaultImpl = new MissionVault();
        address vaultProxy = address(new ERC1967Proxy(
            address(vaultImpl),
            abi.encodeCall(MissionVault.initialize, (usdcAddress, deployer, reputationProxy, 100))
        ));

        // ── 5. FranchiseLicense ───────────────────────────────────────────────
        FranchiseLicense franchiseImpl = new FranchiseLicense();
        address franchiseProxy = address(new ERC1967Proxy(
            address(franchiseImpl),
            abi.encodeCall(FranchiseLicense.initialize, (registryProxy, usdcAddress, deployer))
        ));

        // ── 6. AgentComposer ──────────────────────────────────────────────────
        AgentComposer composerImpl = new AgentComposer();
        address composerProxy = address(new ERC1967Proxy(
            address(composerImpl),
            abi.encodeCall(AgentComposer.initialize, (registryProxy, deployer))
        ));

        // ── 7. AgentMessenger ─────────────────────────────────────────────────
        AgentMessenger messengerImpl = new AgentMessenger();
        address messengerProxy = address(new ERC1967Proxy(
            address(messengerImpl),
            abi.encodeCall(AgentMessenger.initialize, (deployer))
        ));

        // ── Post-deploy: authorize MissionVault as submitter ──────────────────
        ReputationRegistry(reputationProxy).setSubmitterAuthorization(vaultProxy, true);

        vm.stopBroadcast();

        // ── Log proxy addresses ───────────────────────────────────────────────
        console.log("ChimeraRegistry proxy:    ", registryProxy);
        console.log("ReputationRegistry proxy: ", reputationProxy);
        console.log("ValidationRegistry proxy: ", validationProxy);
        console.log("MissionVault proxy:        ", vaultProxy);
        console.log("FranchiseLicense proxy:   ", franchiseProxy);
        console.log("AgentComposer proxy:      ", composerProxy);
        console.log("AgentMessenger proxy:     ", messengerProxy);
    }
}
