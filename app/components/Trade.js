import { useEffect, useState } from "react"
import { ethers } from "ethers"

function Trade({ toggleTrade, token, provider, factory }) {
  const [target, setTarget] = useState(0)
  const [limit, setLimit] = useState(0)
  const [cost, setCost] = useState(0)

  async function getSalesDetails() {
    const target = await factory.TARGET()
    setTarget(target)

    const limit = await factory.TOKEN_LIMIT()
    setLimit(limit)

    const cost = await factory.getCost(token.sold)
    setCost(cost)
  }

  async function buyHandler(form) {
    const amount = form.get("amount")

    const cost = await factory.getCost(token.sold)
    const totalCost = cost * BigInt(amount)

    const signer = await provider.getSigner()
    const tx = await factory.connect(signer).buy(
      token.token, 
      ethers.parseUnits(amount, 18), 
      {value: totalCost}
    )
    const receipt = await tx.wait()
    toggleTrade()
  }

  useEffect(() => {
    getSalesDetails()
  }, [])

  return (
    <div className="trade">
      <h2>trade</h2>
      <div className="token__details">
        <p className="name">{token.name}</p>
        <p> created by {token.creator.slice(0, 6) + "..." + token.creator.slice(38, 62)}</p>
        <img src={token.image} alt="token image" width={256} height={256} />
        <p> market cap: {ethers.formatUnits(token.raised, 18)} ETH</p>
        <p> base cost: {ethers.formatUnits(cost, 18)} ETH</p>
      </div>
      {
        token.sold >= limit || token.raised >= target ? (
          <p className="disclaimer">target reached</p>
        ) : (
          <form action={buyHandler}>
            <input type="number" name="amount" min={1} max={10000} placeholder="1" />
            <input type="submit" value="[ buy ]" />
          </form>
        )
      }
      <button onClick={toggleTrade} className="btn--fancy">[ cancel ]</button>
    </div>
  );
}

export default Trade;