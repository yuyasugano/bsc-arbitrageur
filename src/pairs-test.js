// https://bsc.kiemtienonline360.com/
// https://amm.kiemtienonline360.com/#BSC
const pancake = {
    router: "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3",
    factory: "0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc"
};
const bakery = {
    router: "0xCDe540d7eAFE93aC5fE6233Bee57E1270D3E330F",
    factory: "0x01bF7C66c6BD861915CdaaE475042d3c4BaE16A7"
};

module.exports.getPairs = () => {

    const BNB_TESTNET = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd';
    const BUSD_TESTNET = '0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7';

    const pairs = [
        {
            name: 'BUSD/BNB pancake>bakery',
            tokenBorrow: BUSD_TESTNET,
            amountTokenPay: 1000,
            tokenPay: BNB_TESTNET,
            sourceRouter: pancake.router,
            targetRouter: bakery.router,
            sourceFactory: pancake.factory,
        },
        {
            name: 'BUSD/BNB bakery>pancake',
            tokenBorrow: BUSD_TESTNET,
            amountTokenPay: 1000,
            tokenPay: BNB_TESTNET,
            sourceRouter: bakery.router,
            targetRouter: pancake.router,
            sourceFactory: bakery.factory,
        }
    ]

    return pairs
}
