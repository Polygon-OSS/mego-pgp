const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs')
const child_process = require('child_process')

async function deploy() {
    try {
        const configs = JSON.parse(fs.readFileSync('./configs/' + argv._ + '.json').toString())
        if (
            configs.network !== undefined &&
            configs.owner_address !== undefined &&
            configs.owner_mnemonic !== undefined
        ) {

            console.log('Removing existing build..')
            child_process.execSync('sudo rm -rf build')

            console.log('Deploying contract..')
            child_process.execSync('sudo PROVIDER="' + configs.provider + '" MNEMONIC="' + configs.owner_mnemonic + '" ME_ADDRESS="' + configs.me_address + '"  CONFIG="' + './configs/' + argv._ + '.json' + '" truffle deploy --network ' + configs.network + ' --reset', { stdio: 'inherit' })


            console.log('Extrating ABI..')
            child_process.execSync('sudo npm run extract-abi')
            console.log('--')

            console.log('All done, exiting!')
            process.exit();
        } else {
            console.log('Config file missing.')
        }
    } catch (e) {
        console.log(e.message)
        process.exit()
    }
}

if (argv._ !== undefined) {
    deploy();
} else {
    console.log('Provide a config first.')
}