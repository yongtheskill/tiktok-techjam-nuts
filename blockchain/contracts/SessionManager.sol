// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SessionManager
 * @dev Manages payment-receiving sessions for users.
 * The owner can start and stop sessions, setting a fee percentage for each.
 */
contract SessionManager is Ownable {
    struct Session {
        bool isActive;
        uint32 feeRatio; // Share * 100,000 e.g., 1000 for 1% fee
    }

    mapping(address => Session) public sessions;

    event SessionStarted(address indexed user, uint32 feeRatio);
    event SessionEnded(address indexed user);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Starts a payment receiving session for a user. Only callable by the owner.
     * @param user The address of the user who will receive payments.
     * @param feeRatio The fee ratio (0-100000) to be taken from payments.
     */
    function startSession(address user, uint32 feeRatio) public onlyOwner {
        require(user != address(0), "SessionManager: Cannot use zero address");
        require(feeRatio <= 100000, "SessionManager: Fee cannot exceed 100%");

        sessions[user] = Session({isActive: true, feeRatio: feeRatio});

        emit SessionStarted(user, feeRatio);
    }

    /**
     * @dev Ends a payment receiving session for a user. Only callable by the owner.
     * @param user The address of the user whose session will be ended.
     */
    function endSession(address user) public onlyOwner {
        require(sessions[user].isActive, "SessionManager: Session not active");
        delete sessions[user]; // Deletes the struct, setting isActive to false.
        emit SessionEnded(user);
    }

    /**
     * @dev Gets the session details for a user.
     * @return A boolean indicating if the session is active and the fee percentage.
     */
    function getSessionDetails(
        address user
    ) public view returns (bool, uint32) {
        Session memory session = sessions[user];
        return (session.isActive, session.feeRatio);
    }
}
