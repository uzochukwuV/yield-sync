// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@chainlink/contracts@1.3.0/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {IYieldStrategy} from "contracts/interfaces/IYieldStrategy.sol";


contract Vault is IYieldStrategy {
    // hard coded to Base Sepolia
    
    mapping(address => uint256) public balances;

    event Deposit(address indexed account, uint256 amount);
    event Withdraw(address indexed account, uint256 amount);

    error Vault__InsufficientBalance(uint256 currentBalance, uint256 requiredAmount);
    error Vault__FailedToTransfer(address to, uint256 amount);
    error Vault__FailedToDeposit(address to, uint256 amount);
    error Vault__FailedToWithdraw(address to, uint256 amount);
    error Invalid__Action(uint64 action);


    // usdc addres  on base sepolia
    IERC20 usdc = IERC20(0x036CbD53842c5426634e7929541eC2318f3dCF7e);

  // 0x0b08a6b201D4Da4Ea3F40EA3156f303B7afB0e6a
  // 0x931e6b5560d7C3d68422cC6FCbF76e2789DB5d46

    uint64 public constant DEPOSIT_ACTION = 1;
    uint64 public constant WITHDRAW_ACTION =2 ;

    function executeFunction(
        address ,
        uint64 action,
        address token,
        uint256 amount,
        bytes calldata data
    ) external returns (bool success, bytes memory result){
        require(token == address(usdc), "INVALID_TOKEN");


        if(action == DEPOSIT_ACTION ){
            if (token == address(0) ) {
                revert Vault__FailedToDeposit(address(0), amount);
            }
            // u can decode data to get relavant
            (address acc, ,  ) = abi.decode(data, (address, address, uint256));
            deposit(acc, token, amount);
            
            return (true, "Success");
        }else if(action == WITHDRAW_ACTION) {
            if (token == address(0) ) {
                revert Vault__FailedToWithdraw(address(0), amount);
            }
             (address acc, ,  ) = abi.decode(data, (address, address, uint256));
            withdraw(acc, token, amount);
            
            return (true, "Success");
        }else {
            revert Invalid__Action(action);
        }
        
    }

    function getBalance(address user) public view returns (uint256) {
        return balances[user];
    }
    // r   0x8b89815cd00BE3D48465a4C7674D4f7F64D45250   v 0x2422c5B06CE0d790cd9A4a3FdE6C7923648F4aaC

    // Allow anyone to deposit USDC
    // Make sure you approve this contract before calling!
    function deposit(address account, address token, uint256 amount) public  {
        balances[account] += amount;
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        emit Deposit(account, amount);
    }

    function withdraw(address sender,address token,  uint256 amount ) public {
        if(balances[sender] < amount) {
            revert Vault__InsufficientBalance(balances[sender], amount);
        }
        balances[sender] -= amount;
        IERC20(token).transfer(sender, amount);
        emit Withdraw(sender, amount);
    }

    function encodeDepositData(address token, uint256 amount) external pure returns (bytes memory) {
        return abi.encode(token, amount);
    }

    function encodeWithdrawData(address token, uint256 amount) external pure returns (bytes memory) {
        return abi.encode(token, amount);
    }



    function getStrategyName() external pure returns (string memory name){
        return "Vault";
    }
    
    function getStrategyVersion() external pure returns (string memory version){
        return "1.0.0";
    }

    function getSupportedActions() external pure returns (uint64[] memory actions){
        actions[0] = DEPOSIT_ACTION ;
        actions[1] = WITHDRAW_ACTION ;
    }

    function isActionSupported( uint64 action) external pure override returns(bool supported) {
        if (action == DEPOSIT_ACTION || action == WITHDRAW_ACTION ){
            supported= true;
        }else  {
            supported= false;
        }
    }

    function userPositions(address user) external view returns (TokenBalance[] memory positions){
        positions[0] = TokenBalance(balances[user] ,address(usdc));
    }

    
}