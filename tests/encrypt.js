const HDWalletProvider = require("@truffle/hdwallet-provider");
const web3 = require("web3");
require('dotenv').config()
const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs')
const contract_name = argv._[0]
const NFT_CONTRACT_ABI = require('../abi.json')
const openpgp = require("openpgp");

async function main() {
    try {
        const configs = JSON.parse(fs.readFileSync('./configs/' + argv._ + '.json').toString())
        const provider = new HDWalletProvider(
            configs.owner_mnemonic,
            configs.provider
        );
        const web3Instance = new web3(provider);
        const nftContract = new web3Instance.eth.Contract(
            NFT_CONTRACT_ABI,
            configs.contract_address, { gasLimit: "2000000" }
        );
        console.log('Testing contract: ' + argv._)
        console.log('--')
        try {
            const retrieve = await nftContract.methods.returnPGP("polygonme", "dao").call();
            const publicKeyArmored = Buffer.from(retrieve, 'hex').toString()
            console.log(publicKeyArmored)
            console.log('Using PGP to encrypt message..')
            const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
            const encrypted = await openpgp.encrypt({
                message: await openpgp.createMessage({ text: 'Hello, World!' }),
                encryptionKeys: publicKey
            });
            console.log(encrypted)
            fs.writeFileSync('./tests/message', encrypted)
        } catch (e) {
            console.log(e.message)
        }
        process.exit();
    } catch (e) {
        console.log(e.message)
        process.exit();
    }
}

if (argv._ !== undefined) {
    main();
} else {
    console.log('Provide a deployed contract first.')
}