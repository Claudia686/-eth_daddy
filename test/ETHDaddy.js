const {
  expect
} = require("chai")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("ETHDaddy", () => {
  let ethDaddy
  let deployer, owner1, hacker, buyer, user1, newOwner

  const NAME = "ETH Daddy";
  const SYMBOL = "ETHD";

  beforeEach(async () => {
    [deployer, owner1, hacker, buyer, user1, newOwner] = await ethers.getSigners();

    const ETHDaddy = await ethers.getContractFactory("ETHDaddy")
    ethDaddy = await ETHDaddy.deploy("ETH Daddy", "ETHD")

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
    describe("Success", () => {
      it("Resturns domain attributes", async () => {
        let domain = await ethDaddy.getDomain(1);
        expect(domain.name).to.equal("jack.eth")
        expect(domain.cost).to.equal(tokens(10))
        expect(domain.isOwned).to.equal(false)
      })
    })

    describe("Failure", () => {
      it("Reverts non-owner from listing", async () => {
        await expect(ethDaddy.connect(hacker).list("", ethers.utils.parseEther("1"))).to.be.reverted
      })

      it("Reverts creating a domain with empty name", async () => {
        const emptyName = ""
        await expect(ethDaddy.connect(buyer).list(emptyName, ethers.utils.parseEther("1"))).to.be.reverted
      })

      it("Reverts listing a domain with cost 0", async () => {
        const domainCost = 10
        await expect(ethDaddy.connect(owner1).list("jack.eth", ethers.utils.parseEther("0"))).to.be.reverted
      })

      it("Reverts listing a domain with dublicate id", async () => {
        const existingDomainId = 1
        await expect(ethDaddy.connect(owner1).list("jack.eth", ethers.utils.parseEther("1"))).to.be.reverted
      })
    })
  })

  describe("Domain Name", () => {
    describe("Success", () => {
      it("Changes domain name", async () => {
        const ID = 1;
        const newName = "newName.eth";

        let mintTransaction = await ethDaddy.connect(deployer).mint(ID, {
          value: tokens(12)
        });
        await mintTransaction.wait();

        transaction = await ethDaddy.connect(deployer).changeDomainName(ID, newName);
        await transaction.wait();

        const updatedDomain = await ethDaddy.domainNames(ID);
        expect(updatedDomain).to.equal(newName);
      })
    })

    describe("Failure", () => {
      it("Reverts if the specified domain ID does not exist", async () => {
        const ID = 10;
        const newName = "newName.eth";
        await expect(ethDaddy.connect(deployer).changeDomainName(ID, newName)).to.be.reverted
      })
    })
  })

  describe("Minting", () => {
    describe("Success", () => {
      const ID = 1;
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

      it("Mints tokens with different IDs", async () => {
        const ID = 2
        const AMOUNT = ethers.utils.parseUnits("10", "ether");

        let transaction = await ethDaddy.connect(deployer).list("another.eth", tokens(10))
        await transaction.wait()

        transaction = await ethDaddy.connect(user1).mint(ID, {
          value: AMOUNT
        })
        await transaction.wait()

        const owner2 = await ethDaddy.ownerOf(ID)
        const domain2 = await ethDaddy.getDomain(ID)
        const balance2 = await ethDaddy.getBalance()

        expect(owner2).to.equal(user1.address)
        expect(domain2.isOwned).to.equal(true)
        expect(balance2).to.equal(AMOUNT.mul(2))
      })

      it("Lists multiple domains", async () => {
        await ethDaddy.connect(deployer).list("examples.eth", tokens(5))

        const domain = await ethDaddy.getDomain(2)
        expect(domain.name).to.equal("examples.eth")
        expect(domain.cost).to.equal(tokens(5))
        expect(domain.isOwned).to.equal(false)
      })
    })

    describe("Failure", () => {
      it("Rejects if id is 0", async () => {
        const AMOUNT = ethers.utils.parseUnits("10", "ether")
        await expect(ethDaddy.connect(buyer).mint(0, {
          value: AMOUNT
        })).to.be.reverted
      })

      it("Reverts minting with insufficient value", async () => {
        await expect(ethDaddy.connect(owner1).mint(2, {
          value: tokens(4)
        })).to.be.reverted
      })

      it("Reverts listing domain with existing name", async () => {
        await expect(ethDaddy.connect(deployer).list("jack.eth", tokens(8))).to.be.reverted
      })
    })
  })

  describe("Ownership", () => {
    describe("Success", () => {

      beforeEach(async () => {
        transaction = await ethDaddy.connect(deployer).transferOwnership(newOwner.address)
      })
      
      it("Transfers ownership", async () => {
        const UpdatedOwner = await ethDaddy.owner()
        expect(UpdatedOwner).to.equal(newOwner.address)
      })

      it("Emits OwnershipTransferred event", async () => {
        expect(transaction).to.emit(ethDaddy, "OwnershipTransferred").withArgs(deployer.address, newOwner.address)

        const UpdatedOwner = await ethDaddy.owner()
        expect(UpdatedOwner).to.equal(newOwner.address)
      })

    })

    describe("Failure", () => {
      it("Reverts if already owned by the new owner", async () => {
        await expect(ethDaddy.connect(deployer).transferOwnership(deployer.address)).to.be.reverted
        const UpdatedOwner = await ethDaddy.owner()
        expect(UpdatedOwner).to.equal(deployer.address)
      })

      it("Reverts if called by a non-owner", async () => {
        await expect(ethDaddy.connect(hacker).transferOwnership(newOwner.address)).to.be.reverted
      })
    })
  })

  describe("Domain cost", () => {
    describe("Success", () => {
      it("Updates domain cost", async () => {
        const domainId = 1;
        const newCost = ethers.utils.parseEther("1");

        await ethDaddy.connect(deployer).updateDomainCost(domainId, newCost);
        const updatedDomain = await ethDaddy.getDomain(domainId);
        expect(updatedDomain.cost).to.equal(newCost)
      })
    })

    describe("Failure", () => {
      it("Fails to update domain cost due to non-owner", async () => {
        const domainID = 2;
        const newCost = tokens(16);

        await expect(ethDaddy.connect(hacker).updateDomainCost(domainID, newCost)).to.be.reverted
        const updatedDomain = await ethDaddy.getDomain(domainID)
        expect(updatedDomain.cost).to.equal(0)
      })
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
      it("Reverts non-user from withdrawing", async () => {
        await expect(ethDaddy.connect(hacker).withdraw()).to.be.reverted
      })

      it("Reverts withdraw without balance", async () => {
        await expect(ethDaddy.connect(hacker).withdraw()).to.be.reverted
      })
    })
  })
})