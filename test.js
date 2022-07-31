require('dotenv').config();
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const { performance } = require('perf_hooks');

const FlashswapApi = require('./abi/index').flashswapv2;
const BlockSubscriber = require('./src/block_subscriber');
const Prices = require('./src/prices');

let FLASHSWAP_CONTRACT = process.env.CONTRACT_TEST;
let FLASHSWAP_CONTRACT_OWNER = process.env.OWNER_TEST;
const TransactionSender = require('./src/transaction_send_test');

const fs = require('fs');
const util = require('util');
var log_file = fs.createWriteStream(__dirname + '/log_arbitrage_test.txt', { flags: 'w' });
var log_stdout = process.stdout;

console.log = function (d) {
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
};

const web3 = new Web3(
    new Web3.providers.WebsocketProvider(process.env.WSS_BLOCKS_TEST, {
        // Enable auto reconnection
        reconnect: {
            auto: true,
            delay: process.env.DELAY, // ms
            maxAttempts: process.env.MAX_ATTEMPTS,
            onTimeout: false
        }
    })
);

const { address: admin } = web3.eth.accounts.wallet.add(process.env.TESTNET_KEY);

const prices = {};
const flashswap = new web3.eth.Contract(FlashswapApi, FLASHSWAP_CONTRACT);

const pairs = require('./src/pairs-test').getPairs();
for (let i = 0; i < pairs.length; i++) {
    console.log(`pair ${[i]}: ${pairs[i].name}`);
}

const init = async () => {
    // console.log('starting: ', JSON.stringify(pairs.map(p => p.name)));

    const transactionSender = TransactionSender.factory(process.env.WSS_BLOCKS_TEST.split(','));

    let nonce = await web3.eth.getTransactionCount(admin);
    let gasPrice = await web3.eth.getGasPrice();

    setInterval(async () => {
        nonce = await web3.eth.getTransactionCount(admin);
    }, 1000 * 19);

    setInterval(async () => {
        gasPrice = await web3.eth.getGasPrice()
    }, 1000 * 60 * 3);

    const owner = FLASHSWAP_CONTRACT_OWNER;

    console.log(`started: wallet ${admin} - gasPrice ${gasPrice} - contract owner: ${owner}`);

    let handler = async () => {
        const myPrices = await Prices.getPrices();
        console.log(myPrices);
        if (Object.keys(myPrices).length > 0) {
            for (const [key, value] of Object.entries(myPrices)) {
                prices[key.toLowerCase()] = value;
            }
        }
    };

    await handler();
    setInterval(handler, 1000 * 60 * 5);

    const onBlock = async (block, web3, provider) => {
        const start = performance.now();

        const calls = [];

        const flashswap = new web3.eth.Contract(FlashswapApi, FLASHSWAP_CONTRACT);

        pairs.forEach((pair) => {
            calls.push(async () => {
                const check = await flashswap.methods.check(pair.tokenBorrow, pair.tokenPay, new BigNumber(pair.amountTokenPay * 1e18), pair.sourceRouter, pair.targetRouter).call();

                const profit = check[0];

                let s = pair.tokenPay.toLowerCase();
                const price = prices[s];
                if (!price) {
                    console.log('invalid price: ', pair.tokenPay);
                    return;
                }

                const profitUsd = profit / 1e18 * price;
                const percentage = (100 * (profit / 1e18)) / pair.amountTokenPay;
                console.log(`[${block.number}] [${new Date().toLocaleString()}]: [${provider}] [${pair.name}] Arbitrage checked! Expected profit: ${(profit / 1e18).toFixed(3)} $${profitUsd.toFixed(2)} - ${percentage.toFixed(2)}%`);

                if (profit > 0) {
                    console.log(`[${block.number}] [${new Date().toLocaleString()}]: [${provider}] [${pair.name}] Arbitrage opportunity found! Expected profit: ${(profit / 1e18).toFixed(3)} $${profitUsd.toFixed(2)} - ${percentage.toFixed(2)}%`);

                    const tx = flashswap.methods.startArbitrage(
                        block.number + process.env.BLOCK_NUMBER,
                        pair.tokenBorrow,
                        pair.tokenPay,
                        new BigNumber(pair.amountTokenPay * 1e18),
                        pair.sourceRouter,
                        pair.targetRouter,
                        pair.sourceFactory,
                    );

                    let estimateGas
                    try {
                        estimateGas = await tx.estimateGas({from: admin});
                    } catch (e) {
                        console.log(`[${block.number}] [${new Date().toLocaleString()}]: [${pair.name}]`, 'gasCost error', e.message);
                        return;
                    }

                    const myGasPrice = new BigNumber(gasPrice).plus(gasPrice * process.env.GAS_MULTIPLIER).toString();
                    const txCostBNB = Web3.utils.toBN(estimateGas) * Web3.utils.toBN(myGasPrice);

                    let gasCostUsd = (txCostBNB / 1e18) * prices[process.env.BNB_MAINNET.toLowerCase()];
                    const profitMinusFeeInUsd = profitUsd - gasCostUsd;

                    if (profitMinusFeeInUsd < EFFECTIVE_PROFIT) {
                        console.log(`[${block.number}] [${new Date().toLocaleString()}] [${provider}]: [${pair.name}] stopped: `, JSON.stringify({
                            profit: "$" + profitMinusFeeInUsd.toFixed(2),
                            profitWithoutGasCost: "$" + profitUsd.toFixed(2),
                            gasCost: "$" + gasCostUsd.toFixed(2),
                            duration: `${(performance.now() - start).toFixed(2)} ms`,
                            provider: provider,
                            myGasPrice: myGasPrice.toString(),
                            txCostBNB: txCostBNB / 1e18,
                            estimateGas: estimateGas,
                        }));
                    }

                    if (profitMinusFeeInUsd >= EFFECTIVE_PROFIT) {
                        console.log(`[${block.number}] [${new Date().toLocaleString()}] [${provider}]: [${pair.name}] and go: `, JSON.stringify({
                            profit: "$" + profitMinusFeeInUsd.toFixed(2),
                            profitWithoutGasCost: "$" + profitUsd.toFixed(2),
                            gasCost: "$" + gasCostUsd.toFixed(2),
                            duration: `${(performance.now() - start).toFixed(2)} ms`,
                            provider: provider,
                        }));

                        const data = tx.encodeABI();
                        const txData = {
                            from: admin,
                            to: flashswap.options.address,
                            data: data,
                            gas: estimateGas,
                            gasPrice: new BigNumber(myGasPrice),
                            nonce: nonce
                        };

                        let number = performance.now() - start;
                        if (number > 1500) {
                            console.error('out of time window: ', number);
                            return;
                        }

                        console.log(`[${block.number}] [${new Date().toLocaleString()}] [${provider}]: sending transactions...`, JSON.stringify(txData))

                        try {
                            await transactionSender.sendTransaction(txData);
                        } catch (e) {
                            console.error('transaction error', e);
                        }
                    }
                }
            })
        })

        try {
            await Promise.all(calls.map(fn => fn()));
        } catch (e) {
            console.log('promise error', e)
        }

        let number = performance.now() - start;
        if (number > 1500) {
            console.error('warning to slow', number);
        }

        if (block.number % 40 === 0) {
            console.log(`[${block.number}] [${new Date().toLocaleString()}]: alive (${provider}) - took ${number.toFixed(2)} ms`);
        }
    };

    BlockSubscriber.subscribe(process.env.WSS_BLOCKS_TEST.split(','), onBlock);
}

init();
 

