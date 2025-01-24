import { ethers } from "ethers"

function List({ toggleCreate, fee, provider, factory }) {

  async function listHandler(form) {
    const name = form.get("name")
    const symbol = form.get("symbol")
    const signer = await provider.getSigner()

    const tx = await factory.connect(signer).create(name, symbol, {value: fee})
    const receipt = await tx.wait()

    toggleCreate()
  }

  return (
    <div className="list">
      <h2>list new token</h2>
      <div className="list_description">
        <p>fee: {ethers.formatEther(fee)}</p>
      </div>
      
      <form action={listHandler}>
        <input type="text" name="name" placeholder="name" />
        <input type="text" name="symbol" placeholder="symbol" />
        <input type="submit" value="[ list ]" />
      </form>
      <button onClick={() => toggleCreate()} className="btn--fancy">[cancel]</button>
    </div>
  );
}

export default List;