// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title RouterEvents
 * @dev Events emitted by the Router contract
 */
abstract contract RouterEvents {
    event CrossChainExecuted(
        bytes32 indexed messageId,
        address indexed receiver,
        uint64 indexed chain,
        address token,
        uint256 amount,
        uint256 ccipFee,
        bytes payload
    );

    event ReceivedSuccess(
        bytes32 indexed messageId,
        uint64 indexed sourceChain,
        address indexed sender,
        address strategy,
        address token,
        uint256 amount,
        uint64 action,
        bytes data
    );

    event ReceivedError(
        bytes32 indexed messageId,
        uint64 indexed sourceChain,
        address indexed sender,
        address strategy,
        address token,
        uint256 amount,
        uint64 action,
        bytes data,
        string reason
    );

    event ExecutionRetried(bytes32 indexed txId, bool recovered);

    event EmergencyWithdraw(bytes32 indexed txId, address indexed user, uint256 amount);

    event ProtocolConfigured(
        uint64 indexed chainSelector,
        address indexed protocol,
        bool allowed
    );

    event StrategyConfigured(
        address indexed protocol,
        address indexed strategy,
        bool allowed
    );

    event ActionConfigured(
        address indexed strategy,
        uint64 indexed action,
        bool allowed
    );

    event ValidationParamsSet(
        address indexed strategy,
        uint64 indexed action,
        uint256 tokenPosition,
        uint256 amountPosition,
        bool validateToken,
        bool validateAmount
    );
}