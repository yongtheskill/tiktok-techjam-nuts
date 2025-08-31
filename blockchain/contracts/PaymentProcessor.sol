// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./TTCoin.sol";
import "./SessionManager.sol";

/**
 * @title PaymentProcessor
 * @dev Handles user-to-user payments with revenue splitting and coin sell-backs.
 * This contract must be authorized in the TTCoin contract to function.
 */
contract PaymentProcessor is Ownable {
    TTCoin public immutable ttCoin;
    SessionManager public immutable sessionManager;

    event PaymentMade(
        address indexed from,
        address indexed to,
        uint256 totalAmount,
        uint256 feeAmount,
        uint256 recipientAmount
    );
    event CoinsSold(address indexed user, uint256 amount);

    constructor(
        address _coinAddress,
        address _sessionManagerAddress
    ) Ownable(msg.sender) {
        require(
            _coinAddress != address(0) && _sessionManagerAddress != address(0),
            "Invalid addresses"
        );
        ttCoin = TTCoin(_coinAddress);
        sessionManager = SessionManager(_sessionManagerAddress);
    }

    /**
     * @dev Allows a user (sender) to pay another user (recipient).
     * It checks for an active session, calculates the fee, and splits the payment.
     * The sender must first approve this contract to spend their TTCoin.
     */
    function pay(address recipient, uint256 amount) public {
        require(
            amount > 0,
            "PaymentProcessor: Amount must be greater than zero"
        );

        // 1. Check if the recipient has an active session
        (bool isActive, uint32 fee) = sessionManager.getSessionDetails(
            recipient
        );
        require(
            isActive,
            "PaymentProcessor: Recipient is not accepting payments"
        );

        // 2. Calculate fee and the recipient's share
        uint256 feeAmount = (amount * fee) / 100000;
        uint256 recipientAmount = amount - feeAmount;

        address sender = msg.sender;

        // 3. Pull the total amount from the sender to this contract.
        // This is allowed because this contract is authorized in TTCoin.
        ttCoin.transferFrom(sender, address(this), amount);

        // 4. Distribute the funds from this contract.
        if (recipientAmount > 0) {
            ttCoin.transfer(recipient, recipientAmount);
        }
        if (feeAmount > 0) {
            ttCoin.transfer(owner(), feeAmount);
        }

        emit PaymentMade(sender, recipient, amount, feeAmount, recipientAmount);
    }
}
