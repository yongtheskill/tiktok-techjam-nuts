// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TTCoin
 * @dev An ERC20 token with transfer restrictions.
 * Only the owner and authorized contracts can initiate transfers.
 * This prevents users from trading coins directly with each other.
 */
contract TTCoin is ERC20, Ownable {
    mapping(address => bool) private _authorizedContracts;

    event ContractAuthorized(address indexed contractAddress);
    event ContractAuthorizationRevoked(address indexed contractAddress);

    constructor() ERC20("TTCoin", "TTC") Ownable(msg.sender) {}

    /**
     * @dev Allow transfers only if initiated by the owner or an authorized contract.
     * Allow minting (from address 0) and burning (to address 0).
     */
    function _update(address from, address to, uint256 value) internal virtual override {
        if (from != address(0) && to != address(0)) {
            require(
                _msgSender() == owner() || _authorizedContracts[_msgSender()],
                "TTCoin: Direct user-to-user transfers are disabled"
            );
        }
        
        super._update(from, to, value);
    }

    /**
     * @dev Mints new coins for a user. Can only be called by the contract owner.
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burns a user's tokens. Designed to be called by an authorized contract
     * (like PaymentProcessor) after the user has approved it.
     * @param from The address whose tokens are being burned.
     * @param amount The amount of tokens to burn.
     */
    function burnFrom(address from, uint256 amount) public {
        require(_authorizedContracts[msg.sender], "TTCoin: Caller is not authorized");
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
    }

    /**
     * @dev Authorizes a contract to initiate token transfers. Only callable by the owner.
     * @param contractAddress The address of the contract to authorize.
     */
    function authorizeContract(address contractAddress) public onlyOwner {
        require(contractAddress != address(0), "TTCoin: Cannot authorize the zero address");
        _authorizedContracts[contractAddress] = true;
        emit ContractAuthorized(contractAddress);
    }

    /**
     * @dev Revokes a contract's authorization. Only callable by the owner.
     * @param contractAddress The address of the contract to de-authorize.
     */
    function revokeContractAuthorization(address contractAddress) public onlyOwner {
        _authorizedContracts[contractAddress] = false;
        emit ContractAuthorizationRevoked(contractAddress);
    }

    /**
     * @dev Public view function to check if a contract is authorized.
     */
    function isAuthorized(address contractAddress) public view returns (bool) {
        return _authorizedContracts[contractAddress];
    }
}