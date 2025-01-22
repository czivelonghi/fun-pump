// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

import {Token} from "./Token.sol";

contract Factory{
    uint256 public constant TARGET = 3 ether; // funding target
    uint256 public constant TOKEN_LIMIT = 500_000 ether;

    uint256 public immutable fee; //payable to developer
    address public owner;
    address[] public tokens;
    uint256 public totalTokens;

    event Created(address token, string name, address creator);
    event Buy(address token, uint256 amount);

    mapping (address => TokenSale) public tokenToSale;

    struct TokenSale{
        address token;
        string name;
        address creator;
        uint256 sold;
        uint256 raised;
        bool isOpen;
    }

    constructor(uint256 _fee){
        fee = _fee;
        owner = msg.sender;
    }

    function getTokenSale(uint256 _index) public view returns (TokenSale memory){
        return tokenToSale[tokens[_index]];
    }

    //each new purchase increases cost
    function getCost(uint256 _sold) public pure returns (uint256){
        uint256 floor = 0.0001 ether;
        uint256 step = 0.0001 ether;
        uint256 increment = 10000 ether;

        uint256 cost = (step * (_sold / increment)) + floor;

        return cost;
    }

    function create(string memory _name, string memory _symbol) external payable {
        //make sure fee is correct
        require(msg.value >= fee, "Incorrect fee");

        //create a new token with 1m supply
        Token token = new Token(msg.sender, _name, _symbol, 1_000_000 ether);
        
        //save token
        tokens.push(address(token));
        totalTokens++;
        
        // list for sale
        TokenSale memory tokenSale  = TokenSale(address(token), _name, msg.sender, 0, 0, true);
        tokenToSale[address(token)] = tokenSale;

        //tell its live
        emit Created(address(token), _name, msg.sender);
    }

    function buy(address _token, uint256 _amount) external payable {
        TokenSale storage tokenSale = tokenToSale[_token];

        require(tokenSale.isOpen, "Token is not live");
        require(_amount >= 1 ether, "Amount too low");
        require(_amount <= 10000 ether, "Amount exceeded funding goal");

        // calculate cost
        uint256 cost = getCost(tokenSale.sold);
        uint256 price = cost * (_amount / 10 ** 18);

        require(msg.value >= price, "Incorrect price");
        
        // make sure enough eth is sent
        tokenSale.sold += _amount;
        tokenSale.raised += price;

        if(tokenSale.sold >= TOKEN_LIMIT || tokenSale.raised >= TARGET){
            tokenSale.isOpen = false;
        }

        //buy token
        Token(_token).transfer(msg.sender, _amount);   

        emit Buy(_token, _amount);
    }

    function deposit(address _token) external {
        Token token = Token(_token);
        TokenSale memory tokenSale = tokenToSale[_token];

        require(tokenSale.isOpen == false, "Target not reached");

        //transfer ownership
        token.transfer(tokenSale.creator, token.balanceOf(address(this)));

        // transfer ETH raised
        (bool success, ) = payable(tokenSale.creator).call{value: tokenSale.raised}("");

        require(success, "Transfer failed");
    }

    function withdraw(uint256 _amount) external {   
        require(msg.sender == owner, "Only owner can withdraw");

        (bool success, ) = payable(owner).call{value: _amount}("");

        require(success, "Transfer failed");
    }
}
