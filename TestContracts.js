/**
 * testUpgradeSequence.mjs
 *
 * A single script that:
 *  1) Connects to a local Tron node (or Nile, if you change config).
 *  2) Loads artifacts for:
 *       - ImplementationV1
 *       - ImplementationV2
 *       - ProxyAdmin
 *       - TransparentUpgradeableProxy
 *  3) Demonstrates direct calls to ImplementationV1/ImplementationV2 addresses
 *      (usually uninitialized if you never called `initialize` on them).
 *  4) Interacts with the proxy as V1 (transfers, sets someValue, etc.).
 *  5) Uses ProxyAdmin to upgrade the proxy from V1 -> V2.
 *  6) Interacts with the proxy as V2 (initializeV2, setNewValue, etc.).
 *  7) Transfers ownership of the ProxyAdmin to a new address
 *     and demonstrates the new owner can still upgrade.
 *
 * To run:
 *  1) Edit your package.json to have: "type": "module"
 *  2) "npm install tronweb"
 *  3) "npx tronbox compile --network development"
 *  4) "npx tronbox migrate --network development"
 *  5) Update the addresses below from the migration logs.
 *  6) "node testUpgradeSequence.mjs"
 */

import { TronWeb } from 'tronweb';

// For Node >=16 with "type":"module" in package.json, you can import JSON like this:
import ImplementationV1Artifact from './build/contracts/ImplementationV1.json' assert { type: 'json' };
import ImplementationV2Artifact from './build/contracts/ImplementationV2.json' assert { type: 'json' };
import ProxyAdminArtifact from './build/contracts/ProxyAdmin.json' assert { type: 'json' };
import TransparentUpgradeableProxyArtifact from './build/contracts/TransparentUpgradeableProxy.json' assert { type: 'json' };

// 1) Configure TronWeb
//    Replace PRIVATE_KEY with the same one you used for local deployment.
const PRIVATE_KEY = "7d62b54ad1b154a74570cf4d928324335365d70265fd8e6eb72d22738b85f559"; // from tronbox.js
const FULL_NODE = "http://127.0.0.1:9090";

const tronWeb = new TronWeb({
  fullHost: FULL_NODE,
  privateKey: PRIVATE_KEY,
});

// 2) Addresses from your migration logs
const proxyAdminAddress = "TSLwW7tb7Hpb9mdPAq4hKtqBbDsJ4DBEd6";
const implementationV1Address = "TL1a6Mr6jVNZqYav9wayHRTq9gcyU5Xmid";
const implementationV2Address = "TM4NWSCodjuoGP83br2yYKcWBkvukZAz2Z";
const proxyAddress = "TAHLRfPejpmoyEJ6o3gAmVsDxMLNvfhib4"; // The actual token (TransparentUpgradeableProxy)

// We'll define a new owner for ProxyAdmin ownership transfer:
const NEW_OWNER_PRIVATE_KEY = "8116f3fe30317da10cef0451b1c407201adf6c0f6751fc470572d4b31587b9e2";
let newOwnerBase58 = "";

async function main() {
  console.log("=== Starting testUpgradeSequence ===\n");

  // Derive the base58 address from the new owner's private key
  newOwnerBase58 = tronWeb.address.fromPrivateKey(NEW_OWNER_PRIVATE_KEY);
  console.log("New owner address (base58):", newOwnerBase58);

  // -----------------------------------------------------------
  // A) Direct calls to ImplementationV1 and ImplementationV2
  //    (In an upgradeable scenario, these are typically unused.)
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

  // setSomeValue(...)
  console.log("Current someValue (V1):", (await proxiedV1.getSomeValue().call()).toString());
  console.log("Setting someValue to 123...");
  await proxiedV1.setSomeValue(123).send();
  console.log("New someValue:", (await proxiedV1.getSomeValue().call()).toString());

  // Transfer tokens
  const recipient = "TGTPykpkMhG2ddSVcGRodioRvonPuxyP95";
  console.log(`Transferring 50 tokens to ${recipient} (via proxy, still V1)...`);
  await proxiedV1.transfer(recipient, 50).send();
  const recipBalance = await proxiedV1.balanceOf(recipient).call();
  console.log("Recipient balance:", recipBalance.toString());

  // -----------------------------------------------------------
  // C) Upgrade from V1 to V2 via ProxyAdmin
  // -----------------------------------------------------------
  console.log("\n--- Upgrading to V2 ---");
  const proxyAdmin = await tronWeb.contract(ProxyAdminArtifact.abi, proxyAdminAddress);
  await proxyAdmin.upgrade(proxyAddress, implementationV2Address).send();
  console.log("Proxy upgraded to V2.");

  // -----------------------------------------------------------
  // D) Interact with V2
  // -----------------------------------------------------------
  console.log("\n--- Interacting with the Proxy as V2 ---");
  const proxiedV2 = await tronWeb.contract(ImplementationV2Artifact.abi, proxyAddress);

  console.log("Initializing V2 (initializeV2)...");
  await proxiedV2.initializeV2().send();
  console.log("Called initializeV2().");

  // setNewValue(...)
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
  // Create a TronWeb instance for new owner
  const tronWebNewOwner = new TronWeb({
    fullHost: FULL_NODE,
    privateKey: NEW_OWNER_PRIVATE_KEY,
  });

  // New owner's ProxyAdmin instance
  const proxyAdminNewOwner = await tronWebNewOwner.contract(ProxyAdminArtifact.abi, proxyAdminAddress);

  // We'll just re-upgrade to V2 again as a no-op, to prove it works
  console.log("New owner upgrading to V2 again (redundant, but proves the point)...");
  await proxyAdminNewOwner.upgrade(proxyAddress, implementationV2Address).send();
  console.log("Upgrade from new owner succeeded.");

  console.log("\n=== All steps completed successfully ===");
}

// Execute main
main()
  .then(() => console.log("\nFinished testUpgradeSequence.mjs successfully"))
  .catch((err) => console.error("Error in testUpgradeSequence.mjs:", err));
