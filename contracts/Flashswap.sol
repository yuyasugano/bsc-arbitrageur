// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.6.6 <0.8.0;

// import "hardhat/console.sol";
import './interfaces/IUniswapV2Router.sol';
import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IUniswapV2Factory.sol';
import './interfaces/IERC20.sol';

// @author Daniel Espendiller - https://github.com/Haehnchen/uniswap-arbitrage-flash-swap - espend.de
//
// e00: out of block
// e01: no profit
// e10: Requested pair is not available
// e11: token0 / token1 does not exist
// e12: src/target router empty
// e13: call function not enough tokens for buyback
// e14: call function msg.sender transfer failed
// e15: call function owner transfer failed

contract Flashswap {

    address private owner;

    constructor() public {
        owner = msg.sender;
    }

    // https://github.com/Haehnchen/uniswap-arbitrage-flash-swap/blob/main/contracts/Flashswap.sol
    function startArbitrage(
        uint _maxBlockNumber,
        address _tokenPay, // source currency when we will get; example BNB
        address _tokenSwap, // swapped currency with the source currency; example BUSD
        uint _amountTokenPay, // example: BNB => 10 * 1e18
        address _sourceRouter,
        address _targetRouter,
        address _sourceFactory
    ) external {
        require(block.number <= _maxBlockNumber, 'e00');

        // recheck for stopping and gas usage
        (int profit, uint _tokenBorrowAmount) = check(_tokenPay, _tokenSwap, _amountTokenPay, _sourceRouter, _targetRouter);
        require(profit > 0, 'e01');

        // https://docs.uniswap.org/protocol/V2/reference/smart-contracts/factory#getpair
        address pairAddress = IUniswapV2Factory(_sourceFactory).getPair(_tokenPay, _tokenSwap);
        require(pairAddress != address(0), 'e10');

        address token0 = IUniswapV2Pair(pairAddress).token0();
        address token1 = IUniswapV2Pair(pairAddress).token1();

        // scope for token{0,1}, avoids stack too deep errors
        require(token0 != address(0) && token1 != address(0), 'e11');

        // https://docs.uniswap.org/protocol/V2/guides/smart-contract-integration/using-flash-swaps
        // the amount of _tokenPay can be zero because they should be sent back from the callback function
        // that the pair triggers on the to address, to address is address(this) in thie contract
        IUniswapV2Pair(pairAddress).swap(
            _tokenSwap == token0 ? _tokenBorrowAmount : 0,
            _tokenSwap == token1 ? _tokenBorrowAmount : 0,
            address(this), // call back to this contract
            abi.encode(_sourceRouter, _targetRouter)
        );
    }

    function check(
        address _tokenPay, // source currency when we will get; example BNB
        address _tokenSwap, // swapped currency with the source currency; example BUSD
        uint _amountTokenPay, // example: BNB => 10 * 1e18
        address _sourceRouter,
        address _targetRouter
    ) public view returns(int, uint) {

        address[] memory path1 = new address[](2);
        address[] memory path2 = new address[](2);

        // path1 represents the forwarding exchange from source currency to swapped currency
        path1[0] = path2[1] = _tokenPay;
        // path2 represents the backward exchange from swapeed currency to source currency
        path1[1] = path2[0] = _tokenSwap;

        uint amountOut = IUniswapV2Router(_sourceRouter).getAmountsOut(_amountTokenPay, path1)[1];
        uint amountRepay = IUniswapV2Router(_targetRouter).getAmountsOut(amountOut, path2)[1];

        return (
            int(amountRepay - _amountTokenPay), // our profit or loss; example output: BNB
            amountOut // the amount we get from our input "_amountTokenPay"; example: BUSD amount
        );
    }

    function execute(
        address _sender,
        uint _amount0,
        uint _amount1,
        bytes memory _data
    ) internal {

        // obtain an amount of token that you exchanged, for example BUSD
        uint amountToken = _amount0 == 0 ? _amount1 : _amount0;

        IUniswapV2Pair iUniswapV2Pair = IUniswapV2Pair(msg.sender);
        address token0 = iUniswapV2Pair.token0();
        address token1 = iUniswapV2Pair.token1();

        require(token0 != address(0) && token1 != address(0), 'e11');

        // if _amount0 is zero sell token1 for token0
        // else sell token0 for token1 as a result
        address[] memory path1 = new address[](2);
        address[] memory path2 = new address[](2);

        address forward = _amount0 == 0 ? token1 : token0;
        address backward = _amount0 == 0 ? token0 : token1;

        // path1 represents the forwarding exchange from source currency to swapped currency
        // path1[0] = path2[1] = _amount0 == 0 ? token1 : token0;
        path1[0] = path2[1] = forward;
        // path2 represents the backward exchange from swapeed currency to source currency
        // path1[1] = path2[0] = _amount0 == 0 ? token0 : token1;
        path1[1] = path2[0] = backward;

        (address sourceRouter, address targetRouter) = abi.decode(_data, (address, address));
        require(sourceRouter != address(0) && targetRouter != address(0), 'e12');

        IERC20 token = IERC20(forward);
        token.approve(targetRouter, amountToken);

        // calculate the amount of token how much input token should be reimbursed, BNB -> BUSD
        uint amountRequired = IUniswapV2Router(sourceRouter).getAmountsIn(amountToken, path2)[0];

        // swap token and obtain equivalent otherToken amountRequired as a result, BUSD -> BNB
        uint amountReceived = IUniswapV2Router(targetRouter).swapExactTokensForTokens(
            amountToken,
            amountRequired, // we already now what we need at least for payback; get less is a fail; slippage can be done via - ((amountRequired * 19) / 981) + 1,
            path1,
            address(this), // its a foreign call; from router but we need contract address also equal to "_sender"
            block.timestamp + 60
        )[1];

        // fail if we didn't get enough tokens
        require(amountReceived > amountRequired, 'e13');

        IERC20 otherToken = IERC20(backward);

        // callback should send the funds to the pair address back
        otherToken.transfer(msg.sender, amountRequired); // send back borrow
        // transfer the profit to the contract owner
        otherToken.transfer(owner, amountReceived - amountRequired);
    }

    // c&p
    // pancake, pancakeV2, apeswap, kebab
    function pancakeCall(address _sender, uint256 _amount0, uint256 _amount1, bytes calldata _data) external {
        execute(_sender, _amount0, _amount1, _data);
    }

    function waultSwapCall(address _sender, uint256 _amount0, uint256 _amount1, bytes calldata _data) external {
        execute(_sender, _amount0, _amount1, _data);
    }

    function uniswapV2Call(address _sender, uint256 _amount0, uint256 _amount1, bytes calldata _data) external {
        execute(_sender, _amount0, _amount1, _data);
    }

    // mdex
    function swapV2Call(address _sender, uint256 _amount0, uint256 _amount1, bytes calldata _data) external {
        execute(_sender, _amount0, _amount1, _data);
    }

    // pantherswap
    function pantherCall(address _sender, uint256 _amount0, uint256 _amount1, bytes calldata _data) external {
        execute(_sender, _amount0, _amount1, _data);
    }

    // jetswap
    function jetswapCall(address _sender, uint256 _amount0, uint256 _amount1, bytes calldata _data) external {
        execute(_sender, _amount0, _amount1, _data);
    }

    // cafeswap
    function cafeCall(address _sender, uint256 _amount0, uint256 _amount1, bytes calldata _data) external {
        execute(_sender, _amount0, _amount1, _data);
    }

    receive() external payable {}
}

