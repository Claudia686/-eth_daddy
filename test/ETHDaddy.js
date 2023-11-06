const {
  expect
} = require("chai")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("ETHDaddy", () => {
  let ethDaddy
  let deployer, owner1, hacker

  const NAME = "ETH Daddy";
  const SYMBOL = "ETHD";

  beforeEach(async () => {
    [deployer, owner1, hacker] = await ethers.getSigners();

    const ETHDaddy = await ethers.getContractFactory("ETHDaddy")
    ethDaddy = await ETHDaddy.deploy("ETH Daddy", "ETHD")

    // list a domain
    const transaction = await ethDaddy.connect(deployer).list("jack.eth", tokens(10))
    await transaction.wait()
  })

  describe("Deployment", () => {
    it("has a name", async () => {
      let result = await ethDaddy.name()
      expect(result).to.equal(NAME)
    })

    it("has a symbol", async () => {
      result = await ethDaddy.symbol()
      expect(result).to.equal(SYMBOL)
    })

    it("Sets the owner", async () => {
      const result = await ethDaddy.owner()
      expect(result).to.equal(deployer.address)
    })

    it("Returns the max supply", async () => {
      const result = await ethDaddy.maxSupply()
      expect(result).to.equal(1)
    })

    it("Returns the total supply", async () => {
      const result = await ethDaddy.totalSupply()
      expect(result).to.equal(0)
    })
  })

  describe("Domain", () => {
    it("Resturns domain attributes", async () => {
      let domain = await ethDaddy.getDomain(1);
      expect(domain.name).to.equal("jack.eth")
      expect(domain.cost).to.equal(tokens(10))
      expect(domain.isOwned).to.equal(false)
    })
  })

  describe("Minting", () => {
    const ID = 1
    const AMOUNT = ethers.utils.parseUnits("10", "ether")

    beforeEach(async () => {
      const transaction = await ethDaddy.connect(owner1).mint(ID, {
        value: AMOUNT
      })
      await transaction.wait()
    })

    it("Updates the owner", async () => {
      const owner = await ethDaddy.ownerOf(ID)
      expect(owner).to.equal(owner1.address)
    })

    it("Updates list status", async () => {
      const domain = await ethDaddy.getDomain(ID)
      expect(domain.isOwned).to.equal(true)
    })

    it("Updates the contract balance", async () => {
      const balance = await ethDaddy.getBalance()
      expect(balance).to.equal(AMOUNT)
    })
  })

  describe("Withdraw", () => {
    describe("Success", () => {
      const ID = 1
      const AMOUNT = ethers.utils.parseUnits("10", "ether")
      let balanceBefore

      beforeEach(async () => {
        //get balancebefore
        balanceBefore = await ethers.provider.getBalance(deployer.address)

        let transaction = await ethDaddy.connect(owner1).mint(ID, {
          value: AMOUNT
        })
        await transaction.wait()

        transaction = await ethDaddy.connect(deployer).withdraw()
        await transaction.wait()
      })

      it("Updates the owner balance", async () => {
        const balanceAfter = await ethers.provider.getBalance(deployer.address)
        expect(balanceAfter).to.be.greaterThan(balanceBefore)
      })

      it("Updates contract balance", async () => {
        const result = await ethDaddy.getBalance()
        expect(result).to.equal(0)
      })
    })
    describe("Failure", () => {
      it("Revert non-user from withdrawing", async () => {
        await expect(ethDaddy.connect(hacker).withdraw()).to.be.reverted

      })
    })
  })

})