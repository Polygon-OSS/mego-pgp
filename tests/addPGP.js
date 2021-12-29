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
            const canAdd = await nftContract.methods.canAdd("polygonme", "dao").call({ from: configs.owner_address });
            if (canAdd) {
                console.log('Can add, generating keys..')
                const keys = await openpgp.generateKey({
                    userIDs: [{ name: "polygonme", email: "polygonme@icloud.com" }],
                    curve: "p521",
                    passphrase: "qwerty",
                });
                console.log('--')
                console.log(keys.privateKey);
                console.log(keys.publicKey);
                console.log('--')
                const hexed = Buffer.from(keys.publicKey).toString('hex')
                console.log(hexed)
                console.log('--')
                console.log('Adding pubkey to name..')
                const nonce = await web3Instance.eth.getTransactionCount(configs.proxy_address)
                console.log('Using nonce: ' + nonce)
                await nftContract.methods.addPGP("polygonme", "dao", hexed).send({
                    from: configs.owner_address,
                    nonce: nonce,
                    gasPrice: "200000000000"
                }).on('transactionHash', tx => {
                    console.log('Pending transaction: ' + tx)
                })
                console.log('Retrieving PGP from contract..')
                const retrieve = await nftContract.methods.returnPGP("polygonme", "dao").call();
                const publicKeyArmored = Buffer.from(retrieve, 'hex').toString()
                console.log('Using PGP to encrypt message..')
                const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
                const encrypted = await openpgp.encrypt({
                    message: await openpgp.createMessage({ text: 'Hello, World!' }),
                    encryptionKeys: publicKey
                });
                console.log(encrypted)
                console.log('Decrypting message..')
                const message = await openpgp.readMessage({
                    armoredMessage: encrypted // parse armored message
                });
                const privateKey = await openpgp.decryptKey({
                    privateKey: await openpgp.readPrivateKey({ armoredKey: keys.privateKey }),
                    passphrase: "qwerty"
                });
                const { data: decrypted } = await openpgp.decrypt({
                    message,
                    decryptionKeys: privateKey
                });
                console.log(decrypted);
                console.log('Saving keys to file..')
                fs.writeFileSync('./keys/private.asc', keys.privateKey)
                fs.writeFileSync('./keys/public.asc', keys.publicKey)
            }
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