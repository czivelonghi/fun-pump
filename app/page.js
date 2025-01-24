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
  const [showCreate, setShowCreate] = useState(false)

  function toggleCreate() {
    setShowCreate(!showCreate)
  }

  async function loadBlockChainData() {
    const provider = new ethers.BrowserProvider(window.ethereum)
    setProvider(provider)

    const network = await provider.getNetwork()

    const factory = new ethers.Contract( config[network.chainId].factory.address, Factory, provider)
    setFactory(factory)

    const fee = await factory.fee()
    setFee(fee)
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

        {showCreate && (
          <List toggleCreate={toggleCreate} fee={fee} provider={provider} factory={factory}></List>
        )}
        
      </main>
    </div>
  );
}
