"use client"

import { useEffect, useState } from "react"
import { ethers } from 'ethers'

// Components
import Header from "./components/Header"
import List from "./components/List"
import Token from "./components/Token"
import Trade from "./components/Trade"

// ABIs & Config
import Factory from "./abis/Factory.json"
import config from "./config.json"
import images from "./images.json"

export default function Home() {
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState(null)
  const [factory, setFactory] = useState(null)
  const [fee, setFee] = useState(0)
  const [token, setToken] = useState(null)
  const [tokens, setTokens] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [showTrade, setShowTrade] = useState(false)

  function toggleCreate() {
    setShowCreate(!showCreate)
  }

  function toggleTrade(token) {
    setToken(token)
    setShowTrade(!showTrade)
  }

  async function loadBlockChainData() {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const network = await provider.getNetwork()
    setProvider(provider)

    const factory = new ethers.Contract( config[network.chainId].factory.address, Factory, provider)
    setFactory(factory)

    const fee = await factory.fee()
    setFee(fee)

    const totalTokens = await factory.totalTokens()
    const tokens = []

    for (let i = 0; i < totalTokens; i++) {
      const sale = await factory.getTokenSale(i)
      const token = {
        token: sale.token, 
        name: sale.name, 
        creator: sale.creator, 
        sold: sale.sold, 
        raised: sale.raised, 
        isOpen:sale.isOpen, 
        image: images[i]
      }
      tokens.push(token)
    }

    setTokens(tokens.reverse())
  }

  useEffect(() => {
    loadBlockChainData()
  }, [])

  return (
    <div className="page">
      <Header account={account} setAccount={setAccount}></Header>
      
      <main>
        <div className="create"> 
          <button onClick={factory && account &&toggleCreate} className="btn--fancy">
            { !factory ?  (
              "[ contract not deployed ]"
            ) : !account ? (
              "[ connect wallet ]"
            ) : (
              "[ create a new token ]"
            )}
          </button>
        </div>
        <div className="listings">
          <h1>new listings</h1>
          <div className="tokens">
            { !account ? (
              <p>please connect wallet</p>
            ) : tokens.length === 0 ? (
              <p>no tokens listed</p>
            ) : (
              tokens.map((token, index) => (
                <Token toggleTrade={toggleTrade} token={token} key={index}></Token>
              ))
            )}
            
          </div>
        </div>
        
      </main>
      
      {showCreate && (
        <List toggleCreate={toggleCreate} fee={fee} provider={provider} factory={factory}></List>
      )}

      {showTrade && (
        <Trade toggleTrade={toggleTrade} token={token} provider={provider} factory={factory}></Trade>
      )}
    </div>
  );
}
