const ProxyAdmin = artifacts.require("ProxyAdmin");
const TransparentUpgradeableProxy = artifacts.require("TransparentUpgradeableProxy");
const ImplementationV1 = artifacts.require("ImplementationV1");
const ImplementationV2 = artifacts.require("ImplementationV2");

module.exports = async function (deployer, network, accounts) {
  // 1) Deploy ProxyAdmin
  await deployer.deploy(ProxyAdmin);
  const proxyAdmin = await ProxyAdmin.deployed();
  console.log("ProxyAdmin deployed at:", proxyAdmin.address);

  // 2) Deploy V1
  await deployer.deploy(ImplementationV1);
  const implV1 = await ImplementationV1.deployed();
  console.log("ImplementationV1 deployed at:", implV1.address);

  // 3) Deploy Proxy
  await deployer.deploy(
    TransparentUpgradeableProxy,
    implV1.address,   // _logic
    proxyAdmin.address, // admin
    "0x"
  );
  const proxy = await TransparentUpgradeableProxy.deployed();
  console.log("Proxy deployed at:", proxy.address);

  // 4) Initialize ImplementationV1 via proxy
  const proxiedV1 = await ImplementationV1.at(proxy.address);
  await proxiedV1.initialize("Hello Tron!", "HTR", 1000);
  console.log("Initialized V1 via proxy.");

  // 5) Deploy V2
  await deployer.deploy(ImplementationV2);
  const implV2 = await ImplementationV2.deployed();
  console.log("ImplementationV2 deployed at:", implV2.address);

  // 6) Upgrade
  //await proxyAdmin.upgrade(proxy.address, implV2.address);
  //console.log("Proxy upgraded to V2");
};
