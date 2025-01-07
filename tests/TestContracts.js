/**
 * TestContracts.js
 *
 * Demonstrates:
 *  1) Direct calls to ImplementationV1/ImplementationV2
 *  2) Interacting with the proxy as V1
 *  3) Upgrading to V2
 *  4) Calling initializeV2 on the proxy using ProxyAdmin.callProxy
 *  5) Interacting with the proxy as V2
 *  6) Transfer ownership of the proxied contract
 *  7) Transfer ownership of ProxyAdmin
 *  8) Demonstrate the new owner can still upgrade
 *  9) Show old owner can no longer call setSomeValue
 * 10) New owner can upgrade back to V1 and call a function on it
 */

require('dotenv').config({ path: '../.env' });
const {TronWeb} = require("tronweb");

const ImplementationV1Artifact = require('../build/contracts/ImplementationV1.json');
const ImplementationV2Artifact = require('../build/contracts/ImplementationV2.json');
const ProxyAdminArtifact = require('../build/contracts/ProxyAdmin.json');

// 1) Configure TronWeb
const PRIVATE_KEY = process.env.PRIVATE_KEY_DEVELOPMENT; // Coming from .env file
const FULL_NODE = process.env.FULL_NODE_DEVELOPMENT; // Coming from .env file

const tronWeb = new TronWeb({
  fullHost: FULL_NODE,
  privateKey: PRIVATE_KEY,
});

// We'll define a new owner for ProxyAdmin ownership transfer:
const NEW_OWNER_PRIVATE_KEY = process.env.NEW_OWNER_PRIVATE_KEY_DEVELOPMENT; // Coming from .env file
let newOwnerBase58 = "";

// 2) Addresses from your deployment logs
const proxyAdminAddress = process.env.PROXY_ADMIN_ADDRESS_DEVELOPMENT;  // The deployed ProxyAdmin. Coming from .env file
const implementationV1Address = process.env.IMPLEMENTATION_V1_ADDRESS_DEVELOPMENT; // Coming from .env file
const implementationV2Address = process.env.IMPLEMENTATION_V2_ADDRESS_DEVELOPMENT; // Coming from .env file
const proxyAddress = process.env.PROXY_ADDRESS_DEVELOPMENT;   // This is the TransparentUpgradeableProxy. Coming from .env file

async function main() {
  console.log("=== Starting TestContracts.js ===\n");

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
  const v1Name = await proxiedV1.name().call();
  const v1Symbol = await proxiedV1.symbol().call();
  const v1Supply = await proxiedV1.totalSupply().call();
  console.log("V1 name:", v1Name);
  console.log("V1 symbol:", v1Symbol);
  console.log("V1 totalSupply:", v1Supply.toString());

  // Check owner in V1
  const actualOwnerHex = await proxiedV1.owner().call();
  const actualOwnerBase58 = tronWeb.address.fromHex(actualOwnerHex);
  console.log("V1 Contract owner (via proxy):", actualOwnerBase58);

  // Read & set someValue
  console.log("Current someValue (V1):", (await proxiedV1.getSomeValue().call()).toString());
  console.log("Setting someValue to 123...");
  await proxiedV1.setSomeValue(123).send();
  console.log("New someValue:", (await proxiedV1.getSomeValue().call()).toString());

  // Transfer tokens (example of ERC20 usage)
  const recipient = process.env.RECIPIENT_ADDRESS_DEVELOPMENT; // Coming from .env file
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

  // --------------------------------
  // D) Call "initializeV2" via ProxyAdmin.callProxy
  // --------------------------------
  console.log("\n--- Calling 'initializeV2' via ProxyAdmin.callProxy ---");
  // Manually encode the function signature for "initializeV2()"
  const initializeV2Signature = tronWeb.utils.abi.encodeParamsV2ByABI("initializeV2()",[]);
  // Now call the proxy via ProxyAdmin.callProxy
  await proxyAdmin.callProxy(proxyAddress, initializeV2Signature).send();
  console.log("Called 'initializeV2' via ProxyAdmin.callProxy.");

  // -----------------------------------------------------------
  // E) Interact with the Proxy as V2 (post-initialization)
  // -----------------------------------------------------------
  console.log("\n--- Interacting with the Proxy as V2 ---");
  const proxiedV2 = await tronWeb.contract(ImplementationV2Artifact.abi, proxyAddress);

  console.log("Calling initializeV2 via the Proxy as V2...");
  await proxiedV2.initializeV2().send();
  console.log("initializeV2 has been called successfully");

  console.log("Reading existing value of newValue in V2...");
  let existingNewValue = await proxiedV2.getNewValue().call();
  console.log("Existing NewValue:", existingNewValue.toString());

  console.log("Setting newValue to 158 in V2...");
  await proxiedV2.setNewValue(158).send();
  let newValue = await proxiedV2.getNewValue().call();
  console.log("NewValue:", newValue.toString());

  // Confirm old V1 data is still present
  const oldValFromV1 = await proxiedV2.getSomeValue().call();
  console.log("someValue carried over from V1:", oldValFromV1.toString());

  // -----------------------------------------------------------
  // F) Transfer the proxied contract's owner to NEW_OWNER
  // -----------------------------------------------------------
  console.log("\n--- Transferring proxied contract ownership to new owner ---");
  const currentProxiedOwnerHex = await proxiedV2.owner().call();
  console.log("Current proxied contract owner:", tronWeb.address.fromHex(currentProxiedOwnerHex));

  console.log("Transferring proxied contract ownership to:", newOwnerBase58);
  await proxiedV2.transferOwnership(newOwnerBase58).send();
  const checkNewProxiedOwnerHex = await proxiedV2.owner().call();
  console.log("Proxied contract owner after transfer:", tronWeb.address.fromHex(checkNewProxiedOwnerHex));

  // -----------------------------------------------------------
  // G) Transfer ownership of ProxyAdmin
  // -----------------------------------------------------------
  console.log("\n--- Transferring ProxyAdmin ownership to new owner ---");
  const currentAdminOwnerHex = await proxyAdmin.owner().call();
  console.log("Current ProxyAdmin owner:", tronWeb.address.fromHex(currentAdminOwnerHex));

  await proxyAdmin.transferProxyAdminOwnership(newOwnerBase58).send();
  console.log("ProxyAdmin ownership transferred to", newOwnerBase58);

  const afterTransferOwnerHex = await proxyAdmin.owner().call();
  console.log("ProxyAdmin owner after transfer:", tronWeb.address.fromHex(afterTransferOwnerHex));

  // -----------------------------------------------------------
  // H) Demonstrate new owner can still upgrade
  // -----------------------------------------------------------
  console.log("\n--- Demonstrate new owner usage ---");
  const tronWebNewOwner = new TronWeb({
    fullHost: FULL_NODE,
    privateKey: NEW_OWNER_PRIVATE_KEY,
  });
  const proxyAdminNewOwner = await tronWebNewOwner.contract(ProxyAdminArtifact.abi, proxyAdminAddress);

  console.log("New owner upgrading to V2 again (redundant, but proof of ownership)...");
  await proxyAdminNewOwner.upgrade(proxyAddress, implementationV2Address).send();
  console.log("Upgrade from new owner succeeded.");

  // -----------------------------------------------------------
  // I) Previous owner cannot modify setSomeValue
  // -----------------------------------------------------------
  console.log("\n--- Checking that old owner cannot call setSomeValue anymore ---");
  const tronWebOldOwner = new TronWeb({
    fullHost: FULL_NODE,
    privateKey: PRIVATE_KEY,
  });
  const proxiedV2OldOwner = await tronWebOldOwner.contract(ImplementationV2Artifact.abi, proxyAddress);

  const beforeAttemptValue = await proxiedV2OldOwner.getSomeValue().call();
  console.log("someValue before old owner tries to modify:", beforeAttemptValue.toString());

  console.log("Old owner attempting setSomeValue(777)...");
  try {
    await proxiedV2OldOwner.setSomeValue(777).send();
  } catch (err) {
    console.error("As expected, old owner is not allowed to setSomeValue:", err.message);
  }
  const afterAttemptValue = await proxiedV2OldOwner.getSomeValue().call();
  console.log("someValue after old owner attempt:", afterAttemptValue.toString());

  // -----------------------------------------------------------
  // J) New owner can upgrade back to V1
  // -----------------------------------------------------------
  console.log("\n--- New owner upgrading proxy back to ImplementationV1 ---");
  await proxyAdminNewOwner.upgrade(proxyAddress, implementationV1Address).send();
  console.log("Upgrade to V1 from new owner succeeded.");

  // Let's verify we can call a function from ImplementationV1 now:
  const proxiedBackToV1 = await tronWebNewOwner.contract(ImplementationV1Artifact.abi, proxyAddress);

  console.log("Reading name() from V1 after re-upgrade...");
  const nameAfterReUpgrade = await proxiedBackToV1.name().call();
  console.log("ImplementationV1 name after re-upgrade:", nameAfterReUpgrade);

  // We can also check someValue
  const someValueAfterReUpgrade = await proxiedBackToV1.getSomeValue().call();
  console.log("someValue in V1 after re-upgrade:", someValueAfterReUpgrade.toString());

  // (Optional) Transfer ProxyAdmin ownership back to the old deployer
  await proxyAdminNewOwner.transferProxyAdminOwnership(deployerBase58).send();
  console.log("ProxyAdmin ownership transferred back to old deployer.");

  console.log("\n=== All steps completed successfully ===");
}

// Execute main
main()
  .then(() => console.log("\nFinished TestContracts.js successfully"))
  .catch((err) => console.error("Error in TestContracts.js:", err));
