// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TransparentUpgradeableProxy
 * @dev A minimal EIP1967 transparent upgradeable proxy:
 *      - Only the admin can call `upgradeTo()`
 *      - All other calls are delegated to the implementation
 */
contract TransparentUpgradeableProxy {
    // EIP1967 Slots
bytes32 private constant _IMPLEMENTATION_SLOT = bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1);
bytes32 private constant _ADMIN_SLOT = bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);

    /**
     * @dev Constructor: sets admin, implementation, and calls _data (initializer).
     * @param _logic The initial implementation contract.
     * @param admin_ The admin address controlling upgrades.
     * @param _data Data to delegatecall into the implementation (e.g., initialize()).
     */
    constructor(address _logic, address admin_, bytes memory _data) payable {
        _setAdmin(admin_);
        _setImplementation(_logic);

        if (_data.length > 0) {
            (bool success, ) = _logic.delegatecall(_data);
            require(success, "TransparentUpgradeableProxy: initialization failed");
        }
    }

    fallback() external payable {
        _fallback();
    }

    receive() external payable {
        _fallback();
    }

    /**
     * @dev Admin-only function to upgrade the implementation.
     */
    function upgradeTo(address newImplementation) external {
        require(msg.sender == _admin(), "TransparentUpgradeableProxy: caller is not admin");
        _setImplementation(newImplementation);
    }

    function _fallback() internal {
        address impl = _implementation();
        require(impl != address(0), "TransparentUpgradeableProxy: impl not set");

        assembly {
            // Copy msg.data
            calldatacopy(0, 0, calldatasize())
            // Delegatecall to the implementation
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            // Retrieve return data
            returndatacopy(0, 0, returndatasize())

            switch result
            // If delegatecall fails, revert
            case 0 {
                revert(0, returndatasize())
            }
            // If delegatecall succeeds, return data
            default {
                return(0, returndatasize())
            }
        }
    }

    function _implementation() internal view returns (address impl) {
        bytes32 slot = _IMPLEMENTATION_SLOT;
        assembly {
            impl := sload(slot)
        }
    }

    function _setImplementation(address newImplementation) private {
        bytes32 slot = _IMPLEMENTATION_SLOT;
        assembly {
            sstore(slot, newImplementation)
        }
    }

    function _admin() internal view returns (address adm) {
        bytes32 slot = _ADMIN_SLOT;
        assembly {
            adm := sload(slot)
        }
    }

    function _setAdmin(address newAdmin) private {
        bytes32 slot = _ADMIN_SLOT;
        assembly {
            sstore(slot, newAdmin)
        }
    }

    // Optional: expose admin for external read
    function admin() external view returns (address) {
        return _admin();
    }
}
