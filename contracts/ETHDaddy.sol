// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ETHDaddy is ERC721 {
    uint256 public maxSupply;
    uint256 public totalSupply;
    address public owner;

    struct Domain {
        string name;
        uint256 cost;
        bool isOwned;
    }

    mapping(uint256 => Domain) domains;
    mapping(string => bool) public _nameExists;
    mapping(uint256 => string) public domainNames;
    

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor(string memory _name, string memory _symbol)
    ERC721(_name, _symbol) 
    {
        owner = msg.sender;
    }

    function list(string memory _name, uint256 _cost) public onlyOwner {
        maxSupply++;
        require(!_nameExists[_name]);
        domains[maxSupply] = Domain(_name, _cost, false);
        _nameExists[_name] = true;       
    }

    function mint(uint256 _id) public payable {
        require(_id != 0 );
        require(_id <= maxSupply, "Token ID exceeds max supply");
        require(domains[_id].isOwned == false);
        require(msg.value >= domains[_id].cost);

        domains[_id].isOwned = true;
        totalSupply++;
        

        _safeMint(msg.sender, _id);     
    }

     function getDomain(uint256 _id) public view returns (Domain memory) {
            return domains[_id];
    }

   function isDomainOwnedBy(uint256 _id, address _owner) public view returns (bool) {
    require(_id <= maxSupply,  "Invalid domain ID");
    return ownerOf(_id) == _owner;
   }
   
    function changeDomainName(uint256 _id, string memory _newName) public onlyOwner {
        require(_id <= maxSupply);
        domainNames[_id] = _newName;
       }

    function updateDomainCost(uint256 _id, uint256 _newCost) public onlyOwner{
        require(_id <= maxSupply);
        domains[_id].cost = _newCost;
    }

    function transferDomain(uint256 _tokenid, address _to) public {
        require(ownerOf(_tokenid) == msg.sender, "Not the domain owner");
        _transfer(msg.sender, _to, _tokenid);
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != owner, "New owner must be different from the current owner");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }
}

    
        
    
    

    
    