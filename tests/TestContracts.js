/**
 * TestContracts.js
 *
 * Demonstrates:
 *  1) Direct calls to ImplementationV1/ImplementationV2
 *  2) Interacting with the proxy as V1
 *  3) Upgrading to V2
 *  4) Interacting with the proxy as V2
 *  5) Transfer ownership of ProxyAdmin
 *  6) Demonstrate the new owner can still upgrade
 *
 * This version is updated for ImplementationV1 having:
 *    function initialize(string memory, string memory, uint256, address) external initializer
 */

import { TronWeb } from 'tronweb';

// For Node >=16 with "type":"module" in package.json, you can import JSON like this:
import ImplementationV1Artifact from '../build/contracts/ImplementationV1.json' assert { type: 'json' };
import ImplementationV2Artifact from '../build/contracts/ImplementationV2.json' assert { type: 'json' };
import ProxyAdminArtifact from '../build/contracts/ProxyAdmin.json' assert { type: 'json' };
import TransparentUpgradeableProxyArtifact from '../build/contracts/TransparentUpgradeableProxy.json' assert { type: 'json' };

// 1) Configure TronWeb
//    Replace PRIVATE_KEY with the same one used for local deployment.
const PRIVATE_KEY = "bbd1ff759128a5729fd24ec1ad3d1a60f644d087c01b4a8edc337522d6eb3e75"; 
const FULL_NODE = "http://127.0.0.1:9090";

const tronWeb = new TronWeb({
  fullHost: FULL_NODE,
  privateKey: PRIVATE_KEY,
});

// We'll define a new owner for ProxyAdmin ownership transfer:
const NEW_OWNER_PRIVATE_KEY = "443dcf76d1a921d10f7eac3a9dc3eb11485312771a74730f0f44bf64ff1fd4a9";
let newOwnerBase58 = "";

// 2) Addresses from your deployment logs
//    Update these as needed from the actual deployment output.
const proxyAdminAddress = "TKJS9VYnAcdGHwiKZ6LCzwPfjpHZ3zR5BT";
const implementationV1Address = "TYWPwUaVLYkj1T1NcWxqSQEFcFWAbFxNPb";
const implementationV2Address = "TLXDtHjBHjX2NVm4V7WwXQ7Jxh9w7AZNvq";
const proxyAddress = "TDNxS3qPr2jDqWGHCDG6tQZi6puxP6F893";

async function main() {
  console.log("=== Starting testUpgradeSequence ===\n");

  // Derive addresses from private keys
  const deployerBase58 = tronWeb.address.fromPrivateKey(PRIVATE_KEY);
  newOwnerBase58 = tronWeb.address.fromPrivateKey(NEW_OWNER_PRIVATE_KEY);

  console.log("Deployer address (base58):", deployerBase58);
  console.log("New owner address (base58):", newOwnerBase58);

  // -----------------------------------------------------------
  // A) Direct calls to ImplementationV1 and ImplementationV2
  // -----------------------------------------------------------
  console.log("\n--- Directly reading ImplementationV1 at", implementationV1Address, "---");
  const directImplV1 = await tronWeb.contract(ImplementationV1Artifact.abi, implementationV1Address);
  try {
    const directV1Name = await directImplV1.name().call();
    console.log("ImplementationV1 (direct) name:", directV1Name);
    const directV1Symbol = await directImplV1.symbol().call();
    console.log("ImplementationV1 (direct) symbol:", directV1Symbol);
  } catch (err) {
    console.error("Error calling direct ImplementationV1:", err);
  }

  console.log("\n--- Directly reading ImplementationV2 at", implementationV2Address, "---");
  const directImplV2 = await tronWeb.contract(ImplementationV2Artifact.abi, implementationV2Address);
  try {
    const directV2Name = await directImplV2.name().call();
    console.log("ImplementationV2 (direct) name:", directV2Name);
    const directV2Symbol = await directImplV2.symbol().call();
    console.log("ImplementationV2 (direct) symbol:", directV2Symbol);
  } catch (err) {
    console.error("Error calling direct ImplementationV2:", err);
  }

  // -----------------------------------------------------------
  // B) Interact with the Proxy as V1
  // -----------------------------------------------------------
  console.log("\n--- Interacting with the Proxy as V1 ---");
  const proxiedV1 = await tronWeb.contract(ImplementationV1Artifact.abi, proxyAddress);

  console.log("Reading V1 name/symbol/totalSupply via proxy...");
  // name(), symbol(), totalSupply() come from ERC20
  const v1Name = await proxiedV1.name().call();
  const v1Symbol = await proxiedV1.symbol().call();
  const v1Supply = await proxiedV1.totalSupply().call();
  console.log("V1 name:", v1Name);
  console.log("V1 symbol:", v1Symbol);
  console.log("V1 totalSupply:", v1Supply.toString());

  // Check owner
  const actualOwnerHex = await proxiedV1.owner().call();
  const actualOwnerBase58 = tronWeb.address.fromHex(actualOwnerHex);
  console.log("V1 Contract owner (via proxy):", actualOwnerBase58);

  // Read & set someValue
  console.log("Current someValue (V1):", (await proxiedV1.getSomeValue().call()).toString());
  console.log("Setting someValue to 123...");
  await proxiedV1.setSomeValue(123).send();
  console.log("New someValue:", (await proxiedV1.getSomeValue().call()).toString());

  // Transfer tokens
  const recipient = "TWpLKxV6PgK6CN2YZJATkHWT39Q5djSqf3";
  console.log(`Transferring 50 tokens to ${recipient}...`);
  await proxiedV1.transfer(recipient, 50).send();
  const recipBalance = await proxiedV1.balanceOf(recipient).call();
  console.log("Recipient balance:", recipBalance.toString());

  // -----------------------------------------------------------
  // C) Upgrade to V2 via ProxyAdmin
  // -----------------------------------------------------------
  console.log("\n--- Upgrading to V2 ---");
  const proxyAdmin = await tronWeb.contract(ProxyAdminArtifact.abi, proxyAdminAddress);
  await proxyAdmin.upgrade(proxyAddress, implementationV2Address).send();
  console.log("Proxy upgraded to V2.");

  // -----------------------------------------------------------
  // D) Interact with the Proxy as V2
  // -----------------------------------------------------------
  console.log("\n--- Interacting with the Proxy as V2 ---");
  const proxiedV2 = await tronWeb.contract(ImplementationV2Artifact.abi, proxyAddress);

  console.log("Initializing V2 (initializeV2)...");
  await proxiedV2.initializeV2().send();
  console.log("Called initializeV2().");

  console.log("Setting newValue to 999 in V2...");
  await proxiedV2.setNewValue(999).send();
  const newValue = await proxiedV2.getNewValue().call();
  console.log("NewValue:", newValue.toString());

  // Confirm old V1 data is still present
  const oldValFromV1 = await proxiedV2.getSomeValue().call();
  console.log("someValue carried over from V1:", oldValFromV1.toString());

  // -----------------------------------------------------------
  // E) Transfer ownership of ProxyAdmin
  // -----------------------------------------------------------
  console.log("\n--- Transferring ProxyAdmin ownership to new owner ---");
  const currentAdminOwnerHex = await proxyAdmin.owner().call();
  console.log("Current ProxyAdmin owner:", tronWeb.address.fromHex(currentAdminOwnerHex));

  await proxyAdmin.transferProxyAdminOwnership(newOwnerBase58).send();
  console.log("Ownership transferred to", newOwnerBase58);

  const afterTransferOwnerHex = await proxyAdmin.owner().call();
  console.log("ProxyAdmin owner after transfer:", tronWeb.address.fromHex(afterTransferOwnerHex));

  // -----------------------------------------------------------
  // F) Demonstrate new owner can still upgrade
  // -----------------------------------------------------------
  console.log("\n--- Demonstrate new owner usage ---");
  const tronWebNewOwner = new TronWeb({
    fullHost: FULL_NODE,
    privateKey: NEW_OWNER_PRIVATE_KEY,
  });

  // New owner's ProxyAdmin instance
  const proxyAdminNewOwner = await tronWebNewOwner.contract(ProxyAdminArtifact.abi, proxyAdminAddress);

  // We'll just re-upgrade to V2 again (no-op) to prove the new owner can do it
  console.log("New owner upgrading to V2 again (redundant, but a proof of ownership)...");
  await proxyAdminNewOwner.upgrade(proxyAddress, implementationV2Address).send();
  console.log("Upgrade from new owner succeeded.");

  console.log("\n=== All steps completed successfully ===");
}

// Execute main
main()
  .then(() => console.log("\nFinished TestContracts.js successfully"))
  .catch((err) => console.error("Error in TestContracts.js:", err));
