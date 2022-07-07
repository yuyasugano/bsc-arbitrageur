async function main() {

    const [deployer] = await ethers.getSigners();
    console.log(`Address deploying the contract --> ${deployer.address}`);

    // we get the contract to deploy
    const tokenFactory = await ethers.getContractFactory("Flashswap");
    const contract = await tokenFactory.deploy();

    console.log(`Flashswap Contract address --> ${contract.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
