// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IRouterClient} from "@chainlink/contracts@1.3.0/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts@1.3.0/src/v0.8/ccip/libraries/Client.sol";
import {IERC20} from "@chainlink/contracts@1.3.0/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts@1.3.0/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts@5.2.0/access/Ownable.sol";
import {CCIPReceiver} from "@chainlink/contracts@1.3.0/src/v0.8/ccip/applications/CCIPReceiver.sol";

import {IYieldStrategy} from "./interfaces/IYieldStrategy.sol";
import {IRouter} from "./interfaces/IRouter.sol";
import {RouterStorage} from "./RouterStorage.sol";
import {RouterEvents} from "./RouterEvents.sol";
import {RouterErrors} from "./RouterErrors.sol";

/**
 * @title Yield Sync Protocol(Uniting cross chain Yields)
 * @dev Cross-chain router for yield strategies using Chainlink CCIP
 * @author YourTeam
 */
contract Router is 
    IRouter,
    CCIPReceiver, 
    Ownable, 
    RouterStorage, 
    RouterEvents, 
    RouterErrors 
{
    using SafeERC20 for IERC20;

    // Immutable variables
    IERC20 public  immutable LINK_TOKEN;
    uint256 public sent;

    modifier validChain(uint64 chainSelector) {
        if (!chains[chainSelector]) revert ChainNotSupported(chainSelector);
        _;
    }

    modifier validProtocol(uint64 chainSelector, address protocol) {
        if (!protocols[chainSelector][protocol]) {
            revert ProtocolNotAllowed(chainSelector, protocol);
        }
        _;
    }

    modifier validStrategy(address protocol, address strategy) {
        if (!strategies[protocol][strategy]) {
            revert StrategyNotAllowed(protocol, strategy);
        }
        _;
    }

    modifier validAction(address strategy, uint64 action) {
        if (!actions[strategy][action]) {
            revert ActionNotAllowed(action, strategy, 0);
        }
        _;
    }

    constructor(
        address _router,
        address _link
    ) CCIPReceiver(_router) Ownable(msg.sender) {
        if (_router == address(0) || _link == address(0)) {
            revert InvalidReceiver(address(0));
        }
        LINK_TOKEN = IERC20(_link);
    }

    /**
     * @dev Synchronous cross-chain execution
     */
    function crossChainSync(
        uint64 destinationChain,
        address receiver,
        address strategy,
        uint64 action,
        address token,
        uint256 amount,
        bytes calldata data
    ) 
        external 
        validChain(destinationChain)
        validStrategy(receiver, strategy)
        validAction(strategy, action)
        returns (bytes32 messageId) 
    {
        if (receiver == address(0)) revert InvalidReceiver(receiver);

      
         return _executeCrossChain(
            destinationChain,
            receiver,
            strategy,
            action,
            token,
            amount,
            data
        );
     
    }

    /**
     * @dev Internal function to execute cross-chain transactions
     */
    function _executeCrossChain(
        uint64 destinationChain,
        address receiver,
        address strategy,
        uint64 action,
        address token,
        uint256 amount,
        bytes calldata data
    ) internal returns (bytes32 messageId) {
        uint64 chainSelector = destinationChain;
        // Transfer tokens from user
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(token).approve(address(this.getRouter()), amount);

        // Prepare token amounts
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: token,
            amount: amount
        });

        // Prepare payload
        bytes memory payload = abi.encode(strategy, action, data);

        // Prepare CCIP message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: payload,
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: DEFAULT_GAS_LIMIT})
            ),
            feeToken: address(LINK_TOKEN)
        });
        IRouterClient router = IRouterClient(this.getRouter());

        // Calculate and check fee
        uint256 ccipFee = router.getFee(chainSelector, message);
        uint256 linkBalance = LINK_TOKEN.balanceOf(address(this));
        if (linkBalance < ccipFee) {
            revert InsufficientLinkBalance(ccipFee, linkBalance);
        }

        // Approve and send
        if (token  == address(LINK_TOKEN)){
            LINK_TOKEN.safeIncreaseAllowance(address(this.getRouter()), ccipFee);
        }else {
            LINK_TOKEN.approve(address(this.getRouter()), ccipFee);
        }

        
        messageId = router.ccipSend(chainSelector, message);
        
        
        emit CrossChainExecuted(
            messageId,
            msg.sender,
            chainSelector,
            token,
            amount,
            ccipFee,
            payload
        );

        return messageId;
    }

    /**
     * @dev Handles incoming CCIP messages
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override {
        ( address strategy, uint64 action, bytes memory data) = 
            abi.decode(any2EvmMessage.data, (address, uint64, bytes));

        receivedMessages++;

        if (data.length == 0) {
            return;
        }

        address tokenA = any2EvmMessage.destTokenAmounts[0].token;
        uint256 amountA = any2EvmMessage.destTokenAmounts[0].amount;

        // Approve token for strategy if needed
        (address user) = abi.decode(any2EvmMessage.sender, (address));
        
        if (amountA > 0) {
            IERC20(tokenA).approve(strategy, amountA);
        }

        // Execute strategy
        IYieldStrategy yieldStrategy = IYieldStrategy(strategy);

        
        try yieldStrategy.executeFunction(user, action, tokenA, amountA, data) {
            _emitSuccessEvent(any2EvmMessage, user, strategy, action);
        } catch Error(string memory reason) {
            _storeFailed(any2EvmMessage, user, strategy, action, data, reason);
        } catch {
            _storeFailed(any2EvmMessage, user, strategy, action, data, "Unknown error");
        }
    }

    /**
     * @dev Emit success event
     */
    function _emitSuccessEvent(
        Client.Any2EVMMessage memory any2EvmMessage,
        address user,
        address strategy,
        uint64 action
    ) internal {
        if (any2EvmMessage.destTokenAmounts.length > 0) {
            emit ReceivedSuccess(
                any2EvmMessage.messageId,
                any2EvmMessage.sourceChainSelector,
                user,
                strategy,
                any2EvmMessage.destTokenAmounts[0].token,
                any2EvmMessage.destTokenAmounts[0].amount,
                action,
                any2EvmMessage.data
            );
        } else {
            emit ReceivedSuccess(
                any2EvmMessage.messageId,
                any2EvmMessage.sourceChainSelector,
                user,
                strategy,
                address(0),
                0,
                action,
                any2EvmMessage.data
            );
        }
    }

    /**
     * @dev Store failed execution
     */
    function _storeFailed(
        Client.Any2EVMMessage memory any2EvmMessage,
        address user,
        address strategy,
        uint64 action,
        bytes memory data,
        string memory reason
    ) internal {
        address token = address(0);
        uint256 amount = 0;

        if (any2EvmMessage.destTokenAmounts.length > 0) {
            token = any2EvmMessage.destTokenAmounts[0].token;
            amount = any2EvmMessage.destTokenAmounts[0].amount;

            // Update balances
            uint256 contractBalance = IERC20(token).balanceOf(address(this));
            if (tokenBalances[token] + amount == contractBalance) {
                balances[user][token] += amount;
                tokenBalances[token] += amount;
            }
        }

        failedExecutions[any2EvmMessage.messageId] = FailedExecution({
            user: user,
            token: token,
            amount: amount,
            strategy: strategy,
            action: action,
            data: data,
            timestamp: block.timestamp,
            recovered: false
        });

        userFailedTransactions[user].push(any2EvmMessage.messageId);

        emit ReceivedError(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector,
            abi.decode(any2EvmMessage.sender, (address)),
            strategy,
            token,
            amount,
            action,
            any2EvmMessage.data,
            reason
        );
    }

    /**
     * @dev Retry failed execution
     */
    function retryExecution(bytes32 txId, bytes calldata data) external {
        FailedExecution storage failed = failedExecutions[txId];
        
        if (failed.user != msg.sender && msg.sender != owner()) {
            revert NotYourTransaction();
        }
        if (failed.recovered) revert AlreadyRecovered();
        if (block.timestamp <= failed.timestamp + RETRY_DELAY) {
            revert TooEarlyToRetry();
        }

        try IYieldStrategy(failed.strategy).executeFunction(failed.user, failed.action, failed.token, failed.amount, data) {
            failed.recovered = true;
            if (failed.amount > 0) {
                balances[failed.user][failed.token] -= failed.amount;
                tokenBalances[failed.token] -= failed.amount;
            }
            emit ExecutionRetried(txId, true);
        } catch Error(string memory reason) {
            emit ExecutionRetried(txId, false);
            revert ExecutionFailed(reason);
        }
    }

    /**
     * @dev Emergency withdrawal for failed executions
     */
    function emergencyWithdraw(bytes32 txId) external {
        FailedExecution storage failed = failedExecutions[txId];
        
        if (failed.user != msg.sender) revert NotYourTransaction();
        if (failed.recovered) revert AlreadyRecovered();
        if (block.timestamp <= failed.timestamp + EMERGENCY_DELAY) {
            revert EmergencyPeriodNotReached();
        }

        failed.recovered = true;
        
        if (failed.amount > 0) {
            balances[failed.user][failed.token] -= failed.amount;
            tokenBalances[failed.token] -= failed.amount;
            IERC20(failed.token).safeTransfer(failed.user, failed.amount);
        }

        emit EmergencyWithdraw(txId, failed.user, failed.amount);
    }

    // Admin functions
    function setAction(
        uint64 chainSelector,
        address protocol,
        address strategy,
        uint64 action
    ) external onlyOwner {
        chains[chainSelector] = true;
        protocols[chainSelector][protocol] = true;
        strategies[protocol][strategy] = true;
        actions[strategy][action] = true;
        
        emit ProtocolConfigured(chainSelector, protocol, true);
        emit StrategyConfigured(protocol, strategy, true);
        emit ActionConfigured(strategy, action, true);
    }

    
    /// @notice Allows the owner of the contract to withdraw all tokens of a specific ERC20 token.
    /// @dev This function reverts with a 'NothingToWithdraw' error if there are no tokens to withdraw.
    /// @param _beneficiary The address to which the tokens will be sent.
    /// @param _token The contract address of the ERC20 token to be withdrawn.
    function withdrawToken(
        address _beneficiary,
        address _token
    ) public onlyOwner {
        // Retrieve the balance of this contract
        uint256 amount = IERC20(_token).balanceOf(address(this));

        // Revert if there is nothing to withdraw
        if (amount == 0) revert NothingToWithdraw();

        IERC20(_token).safeTransfer(_beneficiary, amount);
    }

     receive() external payable {}
}