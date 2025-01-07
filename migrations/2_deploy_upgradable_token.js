require('dotenv').config();
const ProxyAdmin = artifacts.require("ProxyAdmin");
const TransparentUpgradeableProxy = artifacts.require("TransparentUpgradeableProxy");
const ImplementationV1 = artifacts.require("ImplementationV1");
const ImplementationV2 = artifacts.require("ImplementationV2");

// 1) Import TronWeb locally (not from a global TronBox variable).
const {TronWeb} = require("tronweb");

module.exports = async function (deployer, network, accounts) {
  // --------------------------------------------------------------------------
  // A) Create a local TronWeb instance using the same private key as your TronBox config.
  //    For demonstration, we hardcode it here. 
  //    In production or CI, you can read from an env var: process.env.PRIVATE_KEY
  // --------------------------------------------------------------------------
  const PRIVATE_KEY = process.env.PRIVATE_KEY_DEVELOPMENT; // same as tronbox.js. Coming from .env file
  const FULL_NODE = process.env.FULL_NODE_DEVELOPMENT; // the node you’re using. Coming from .env file

  const localTronWeb = new TronWeb({
    fullHost: FULL_NODE,
    privateKey: PRIVATE_KEY,
  });
  const deployerBase58 = localTronWeb.address.fromPrivateKey(PRIVATE_KEY);
  console.log("Deployer base58 address:", deployerBase58);

  // --------------------------------------------------------------------------
  // B) Deploy the ProxyAdmin
  // --------------------------------------------------------------------------
  await deployer.deploy(ProxyAdmin);
  const proxyAdmin = await ProxyAdmin.deployed();
  console.log("ProxyAdmin deployed at:", proxyAdmin.address);

  // --------------------------------------------------------------------------
  // C) Deploy ImplementationV1
  // --------------------------------------------------------------------------
  await deployer.deploy(ImplementationV1);
  const implV1 = await ImplementationV1.deployed();
  console.log("ImplementationV1 deployed at:", implV1.address);

  // --------------------------------------------------------------------------
  // D) Deploy the TransparentUpgradeableProxy
  // --------------------------------------------------------------------------
  await deployer.deploy(
    TransparentUpgradeableProxy,
    implV1.address,     // _logic
    proxyAdmin.address, // admin
    "0x"                // no initialization data
  );
  const proxy = await TransparentUpgradeableProxy.deployed();
  console.log("TransparentUpgradeableProxy deployed at:", proxy.address);

  // --------------------------------------------------------------------------
  // E) Initialize ImplementationV1 (via proxy)
  //    ImplementationV1.initialize(string name, string symbol, uint256 supply, address owner)
  // --------------------------------------------------------------------------
  const proxiedV1 = await ImplementationV1.at(proxy.address);
  await proxiedV1.initialize(
    "Aziz Tron!",  // name
    "AUA",          // symbol
    1000,           // initialSupply
    deployerBase58  // initialOwner
  );
  console.log("Initialized V1 via proxy. Owner set to:", deployerBase58);

  // --------------------------------------------------------------------------
  // F) Deploy ImplementationV2
  // --------------------------------------------------------------------------
  await deployer.deploy(ImplementationV2);
  const implV2 = await ImplementationV2.deployed();
  console.log("ImplementationV2 deployed at:", implV2.address);

  // --------------------------------------------------------------------------
  // G) (Optional) Immediately upgrade to V2
  // --------------------------------------------------------------------------
  // await proxyAdmin.upgrade(proxy.address, implV2.address);
  // console.log("Proxy upgraded to V2");
};
