# Upgradable TRON Smart Contracts Using the Transparent Proxy Pattern

This project showcases a minimal transparent upgradeable proxy setup on the Tron network using TronWeb, TronBox, and OpenZeppelin-inspired upgradeable contracts, alongside an exploration of the UUPS (Universal Upgradeable Proxy Standard) approach. Below is an outline of each file, what it does, and how to use them.

## Contracts:

1. **ImplementationV1.sol**  
   - First version of our token-like contract.  
   - Inherits `Initializable`, `ERC20Upgradeable`, and `OwnableUpgradeable (v5)`.  
   - Defines `initialize(...)` which mints an initial supply and sets the owner via `__Ownable_init(initialOwner_)`.  

2. **ImplementationV2.sol**  
   - Second version of the token contract, preserving V1’s storage layout in the exact same order.  
   - Introduces `_newValue` and `_initializedV2`, plus functions `initializeV2()`, `setNewValue()`, etc.  
   - Does not re-initialize `OwnableUpgradeable` to avoid overwriting the existing owner.  

3. **ProxyAdmin.sol**  
   - Minimal admin contract for `TransparentUpgradeableProxy`.  
   - Only the `owner()` of `ProxyAdmin` can call `upgrade(proxy, newImplementation)`.  
   - Also allows the admin to call arbitrary functions on the proxy (e.g. `initializeV2()`) and transfer ownership of the `ProxyAdmin` itself.  

4. **TransparentUpgradeableProxy.sol**  
   - Stores the implementation and admin addresses in EIP1967-defined slots.  
   - Forwards all user calls (except those from the admin to `upgradeTo(...)`) to the implementation via `delegatecall`.  
   - Ensures only the admin can perform upgrades, while normal users interact with token functions through the proxy address. 
   - This contract's address acts as a permanent entry point for users, even if the underlying implementation is upgraded, making it the primary address that end users interact with.

## Migrations:

1. **1_initial_migration.js**  
   - Standard TronBox migration that deploys the `Migrations` contract.  

2. **2_deploy_upgradable_token.js**  
   - Deploys and configures the entire upgradeable system:  
     1. Deploys `ProxyAdmin`.  
     2. Deploys `ImplementationV1`.  
     3. Deploys `TransparentUpgradeableProxy` pointing to `ImplementationV1` and controlled by `ProxyAdmin`.  
     4. Calls `ImplementationV1.initialize(...)` via the proxy to set up initial token params (name, symbol, supply, owner).  
     5. Deploys `ImplementationV2`.  
     6. (Optional) Immediately upgrades the proxy to `ImplementationV2`.  

## Test Script (TestContracts.js):

1. **Direct Calls (Unlikely)** to `ImplementationV1` and `ImplementationV2` to show they each have their own internal states (not used by proxy).  
2. **Interact with the Proxy as V1** to read `name()`, `symbol()`, `totalSupply()`, transfer tokens, etc.  
3. **Upgrade to V2** via `ProxyAdmin.upgrade(...)`.  
4. **Initialize V2** by calling `initializeV2()` through `ProxyAdmin.callProxy(...)` or directly.
5. **Interact with Proxy as V2** (use `getNewValue()`, `setNewValue()`, confirm old V1 data remains).  
6. **Transfer Ownership** of the proxied contract to a new owner, ensuring only that new owner can call `onlyOwner` functions.  
7. **Transfer Ownership** of `ProxyAdmin` so the new admin can still upgrade the proxy.  
8. **Demonstrate** the old owner cannot `setSomeValue()` anymore.  
9. **Upgrade back** to V1 as the new owner, showing that the storage state is preserved.  

## Setup and Installation

**Clone the Repository:** 
   ```bash
   git clone https://github.com/aziz1975/tron-upgradeable.git
   cd tron-upgradeable
   npm install
   ```
Update the .env file with your private key, Tron node host, and deployed contract addresses etc so they are properly used by tronbox.js, 2_deploy_upgradable_token.js, and TestContracts.js.

**Compile and Deploy:**  
   ```bash
   npx tronbox compile
   npx tronbox migrate --network development
   ```

After deployment, you will see addresses of the deployed contracts:
1. ProxyAdmin at some Tron address
2. ImplementationV1 at some Tron address
3. TransparentUpgradeableProxy at some Tron address
4. ImplementationV2 at some Tron address \

Copy those addresses and update the .env file accordingly.
**Test Script:** \
 Test script is under tests folder.
 ```bash
   cd tests
   npm install
   node TestContracts.js
```
## Notes on Storage Layout 
When using upgradeable contracts, storage layout must remain consistent across versions to avoid corrupting stored data. In ImplementationV2, the original state variables from ImplementationV1 appear in the same order at the top.

## Security Considerations
The ProxyAdmin is a critical role that can change the underlying implementation.
Always safeguard your admin keys.
For production, consider using multi-signature or a DAO governance mechanism.

## How ProxyAdmin Is Connected to TransparentUpgradeableProxy
-	The TransparentUpgradeableProxy has an admin slot. The address in that slot is allowed to invoke the proxy’s upgradeTo(...) function.
-	During deployment, you set the admin of the TransparentUpgradeableProxy to be the ProxyAdmin contract’s address.
-	Because of that, only the ProxyAdmin contract can successfully call:
proxyAddress.call(abi.encodeWithSignature("upgradeTo(address)", newImplementation))
…which changes the implementation reference inside the proxy. \
Essentially:
1.	TransparentUpgradeableProxy stores the admin (which is the ProxyAdmin address).
2.	ProxyAdmin is the “boss” that can upgrade the proxy to new logic.

## How TransparentUpgradeableProxy Is Connected to ImplementationV1/ImplementationV2
-	The proxy (TransparentUpgradeableProxy) also has an implementation slot that points to the current logic (e.g., ImplementationV1 or ImplementationV2).
-	When non-admin users call the proxy, the call goes into the fallback function, which delegates to the current implementation.
-	After an upgrade, that implementation slot is changed to the new implementation address (e.g., from V1 to V2). \
In short:
1.	TransparentUpgradeableProxy holds a reference to “the current Implementation contract.”
2.	If you upgrade via ProxyAdmin.upgrade(...), the slot is updated from the old logic (V1) to the new logic (V2).
3.	The same proxy address is used; only the underlying logic changes.

## Explanation of Each Component
1.	ProxyAdmin
-	A non-upgradeable admin contract.
-	Has an owner (inherited from Ownable).
-	Can call upgrade(proxy, newImplementation) on the proxy to change the implementation.
-	Can also call other admin functions (e.g., callProxy(...)) if needed.
2.	TransparentUpgradeableProxy
-	A minimal EIP1967 proxy.
-	Stores two critical addresses in EIP1967 storage slots: \
	 _IMPLEMENTATION_SLOT: Points to the current implementation contract (V1 or V2). \
	_ADMIN_SLOT: Points to the ProxyAdmin contract.
-	All user interactions go through the proxy’s fallback() or receive() function, which delegatecalls the logic in the current implementation.
-	Only its admin (i.e., the ProxyAdmin) can invoke upgradeTo(...).
3.	ImplementationV1 / ImplementationV2
-	Actual logic (ERC20 + custom code).
-	Use OwnableUpgradeable for ownership checks (like onlyOwner).
-	Deployed once each as separate contracts, but they do not hold user balances directly in their own storage—rather, the proxy uses their storage layout.
-	The “initialize” function(s) (initialize(...), initializeV2()) set up the state behind the proxy.
-	ImplementationV2 inherits from the same storage layout as V1, ensuring no collisions.
4.	Users / External Calls
-	When a user calls a function like transfer(...), they actually call it on the proxy address.
-	The proxy delegates to the implementation contract code.
-	Storage updates happen in the proxy’s storage (EIP1967).
