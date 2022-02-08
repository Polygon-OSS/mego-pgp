# MEGO (Previously PolygonME) - PGP extension

This is an example on how to use MEGO in other contracts, MEGO is a composable identity provider based on NFT and fully on-chain.
In this case we're extending it with PGP, so we'll be able to add and retrieve PGP public keys, for a given name. 
This can be very useful if we want to create a private messaging dapp or enhanced decentralized e-mail systems.

The contract is published on polygon network at: `0x591dF50d33663dDb18375De1CeC17c9C820DB67A`.

## Smart Contract

Smart contract is simple enough to be read and we'll focus on the core concepts behind it. You can find the contract in `contracts` folder.

### Importing ME

First of all we must import the interface of ME, which can be found in `interfaces` folder:

```
import "../interfaces/IME.sol";
```

After the import we must a variable to instantiate the contract:

```
IME private _me;
```

And, at the end, we must pass to the constructor the correct contract address:

```
constructor (address PolygonME) {
    _me = IME(PolygonME);
}
```

We're now ready to read from main contract!

### Return token Id for specific name

With this function we're asking the core contract a specific name + gate, let's say we're trying to search `turinglabs.dao`. 
In this case `turinglabs` is the name and `dao` is the gate.
The function will fail if no name exists for that specific combination.

```
function returnTokenId(string memory _name, string memory _gate) internal view returns (uint256){
    uint256 tknId = _me._nameToTokenId(string(abi.encodePacked(_name, '.', _gate)));
    require(tknId > 0, "PGPME: This name doesn't exists.");
    return tknId;
}
```

### Check if sender can add the PGP

Of course we need to be sure that owner is the only that can change it's PGP key, so we created this function.
If you read at line 2, there's a `gateActive` variable, which is checked. This variable can setted up (default is `false`) to *limit* the contract to just one gate.
This kind of limit can be useful if you want to restrict the contract to a specific gate (or community).

```
function canAdd(string memory _name, string memory _gate) public view returns (bool){
    uint256 bal = _me.balanceOf(msg.sender);
    require(bal > 0, "PGPME: Must own at least one ME.");
    if(gateActive == true) {
        require(keccak256(abi.encodePacked(_gate)) == keccak256(abi.encodePacked(gate)), "PGPME: Selected gate doesn't matches given one.");
    }
    uint256 tknId = returnTokenId(_name, _gate);
    require(_me.ownerOf(tknId) == msg.sender, "PGPME: You must own that name.");
    return true;
}
```

### Add or return PGP

We can finally add our PGP key to our previously declared mapping.

```
function addPGP(string memory _name, string memory _gate, string memory _pgp) public {
    require(canAdd(_name, _gate), "PGPME: Seems you cannot add PGP to that name.");
    uint256 tknId = returnTokenId(_name, gate);
    _nameToPGP[tknId] = _pgp;
}

function returnPGP(string memory _name, string memory _gate) public view returns (string memory) {
    uint256 tknId = returnTokenId(_name, _gate);
    return _nameToPGP[tknId];
}
```

## Deploy and make tests

If you want to deploy this contract you must create a `configs` folder adding a json file for a specified network, let's say `ganache` with this content:

```
{
    "network": "ganache",
    "contract_address": "",
    "owner_mnemonic": "YourMnemonic",
    "owner_address": "OwnerAddress",
    "me_address": "MEAddress",
    "provider": "http://localhost:7545"
}
```

After we've created it we'll be able to run the deploy with:

```
npm run deploy ganache
```

This script will call the native `truffle` compilation, will extract the address of the contract inserting in our `ganache.json` file and will extract the `abi.json` file automatically.

After we've deployed our contract we'll be able to run tests:

```
npm run test:add ganache
```

This test will check if the name exists (turinglabs.dao), we'll create a new PGP key with `openpgp` module and will write it into the contract in form of `hexadecimal` string.

Then it will retrieve it from the contract and will encrypt a message (Hello, World!) with specified key.

Done!
