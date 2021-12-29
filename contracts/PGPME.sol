// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IME.sol";

/**
 * @title PGPME
 * PGPME - Extending PolygonME with PGP
 */
contract PGPME is Ownable {

    IME private _me;
    string private gate = "dao";
    bool public gateActive = false;
    mapping(uint256 => string) public _nameToPGP;

    constructor (address PolygonME) {
        _me = IME(PolygonME);
    }

    /**
     * Admin functions to fix base address or gate if needed
     */
    function fixME(address PolygonME) public onlyOwner {
        _me = IME(PolygonME);
    }

    function fixGate(string memory _gate) public onlyOwner {
        gate = _gate;
    }

    function setGate(bool _status) public onlyOwner {
        gateActive = _status;
    }

    /**
     * Internal function to return the tokenId for a specific name
     */
    function returnTokenId(string memory _name, string memory _gate) internal view returns (uint256) {
        uint256 tknId = _me._nameToTokenId(string(abi.encodePacked(_name, '.', _gate)));
        require(tknId > 0, "PGPME: This name doesn't exists.");
        return tknId;
    }

    /**
     * Check if sender can add or not a PGP key
     */
    function canAdd(string memory _name, string memory _gate) public view returns (bool) {
        uint256 bal = _me.balanceOf(msg.sender);
        require(bal > 0, "PGPME: Must own at least one ME.");
        if(gateActive == true) {
            require(keccak256(abi.encodePacked(_gate)) == keccak256(abi.encodePacked(gate)), "PGPME: Selected gate doesn't matches given one.");
        }
        uint256 tknId = returnTokenId(_name, _gate);
        require(_me.ownerOf(tknId) == msg.sender, "PGPME: You must own that name.");
        return true;
    }

    /**
     * Add PGP for specific name
     */
    function addPGP(string memory _name, string memory _gate, string memory _pgp) public {
        require(canAdd(_name, _gate), "PGPME: Seems you cannot add PGP to that name.");
        uint256 tknId = returnTokenId(_name, gate);
        _nameToPGP[tknId] = _pgp;
    }

    /**
     * Get PGP for specific name
     */
    function returnPGP(string memory _name, string memory _gate) public view returns (string memory) {
        uint256 tknId = returnTokenId(_name, _gate);
        return _nameToPGP[tknId];
    }
}
