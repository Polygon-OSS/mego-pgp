const PGPME = artifacts.require("./PGPME.sol");
const fs = require('fs')

module.exports = async(deployer, network) => {
    let PolygonMEAddress = process.env.ME_ADDRESS
    await deployer.deploy(PGPME, PolygonMEAddress);
    const contract = await PGPME.deployed();

    let configs = JSON.parse(fs.readFileSync(process.env.CONFIG).toString())
    console.log('Saving address in config file..')
    configs.contract_address = contract.address
    fs.writeFileSync(process.env.CONFIG, JSON.stringify(configs, null, 4))
    console.log('--')
};