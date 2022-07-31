const pancake = {
    router: "0x10ed43c718714eb63d5aa57b78b54704e256024e",
    factory: "0xca143ce32fe78f1f7019d7d551a6402fc5350c73",
    routerV1: "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F",
    factoryV1: "0xBCfCcbde45cE874adCB698cC183deBcF17952812"
};
const panther = {
    router: "0xbe65b8f75b9f20f4c522e0067a3887fada714800",
    factory: "0x0eb58e5c8aa63314ff5547289185cc4583dfcbd5"
};
const ape = {
    router: "0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7",
    factory: "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6"
};
const amount = 10000;
 
module.exports.getPairs = () => {

    const BNB_MAINNET = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
    const BUSD_MAINNET = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';
    const USDC_MAINNET = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d';
    const BTCB_MAINNET = '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c';
    const LINK_MAINNET = '0x404460C6A5EdE2D891e8297795264fDe62ADBB75';
    const LTC_MAINNET = '0x4338665CBB7B2485A8855A139b75D5e34AB0DB94';
    const SUSHI_MAINNET = '0x947950BcC74888a40Ffa2593C5798F11Fc9124C4';
    const UNI_MAINNET = '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1';
    const ETH_MAINNET = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';

    const pairs = [
        {
            name: 'BUSD/BNB pancake>panther',
            tokenBorrow: BUSD_MAINNET,
            amountTokenPay: amount,
            tokenPay: BNB_MAINNET,
            sourceRouter: pancake.router,
            targetRouter: panther.router,
            sourceFactory: pancake.factory,
        },
        {
            name: 'BUSD/BNB panther>pancake',
            tokenBorrow: BUSD_MAINNET,
            amountTokenPay: amount,
            tokenPay: BNB_MAINNET,
            sourceRouter: panther.router,
            targetRouter: pancake.router,
            sourceFactory: panther.factory,
        },
        {
            name: 'BUSD/BNB pancake>ape',
            tokenBorrow: BUSD_MAINNET,
            amountTokenPay: amount,
            tokenPay: BNB_MAINNET,
            sourceRouter: pancake.router,
            targetRouter: ape.router,
            sourceFactory: pancake.factory,
        },
        {
            name: 'BUSD/BNB ape>pancake',
            tokenBorrow: BUSD_MAINNET,
            amountTokenPay: amount,
            tokenPay: BNB_MAINNET,
            sourceRouter: ape.router,
            targetRouter: pancake.router,
            sourceFactory: ape.factory,
        },
        {
            name: 'BUSD/USDC pancake>panther',
            tokenBorrow: BUSD_MAINNET,
            amountTokenPay: amount,
            tokenPay: USDC_MAINNET,
            sourceRouter: pancake.router,
            targetRouter: panther.router,
            sourceFactory: pancake.factory,
        },
        {
            name: 'BUSD/USDC panther>pancake',
            tokenBorrow: BUSD_MAINNET,
            amountTokenPay: amount,
            tokenPay: USDC_MAINNET,
            sourceRouter: panther.router,
            targetRouter: pancake.router,
            sourceFactory: panther.factory,
        },
        {
            name: 'BUSD/USDC pancake>ape',
            tokenBorrow: BUSD_MAINNET,
            amountTokenPay: amount,
            tokenPay: USDC_MAINNET,
            sourceRouter: pancake.router,
            targetRouter: ape.router,
            sourceFactory: pancake.factory,
        },
        {
            name: 'BUSD/USDC ape>pancake',
            tokenBorrow: BUSD_MAINNET,
            amountTokenPay: amount,
            tokenPay: USDC_MAINNET,
            sourceRouter: ape.router,
            targetRouter: pancake.router,
            sourceFactory: ape.factory,
        }
    ]

    return pairs
}
