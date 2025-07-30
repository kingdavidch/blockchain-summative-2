const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
    console.log("Deploying HealthcareRecords contract...");
    
    // Get the contract factory
    const HealthcareRecords = await ethers.getContractFactory("HealthcareRecords");
    
    // Deploy the contract
    const healthcareRecords = await HealthcareRecords.deploy();
    
    // Wait for deployment to finish
    await healthcareRecords.waitForDeployment();
    
    const contractAddress = await healthcareRecords.getAddress();
    
    console.log("HealthcareRecords deployed to:", contractAddress);
    console.log("Contract owner:", await healthcareRecords.owner());
    console.log("Initial record counter:", await healthcareRecords.getTotalRecords());
    
    // Save deployment info
    const deploymentInfo = {
        contractAddress: contractAddress,
        network: hre.network.name,
        deploymentTime: new Date().toISOString()
    };
    
    console.log("\n=== Deployment Summary ===");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    
    return healthcareRecords;
}

// Run the deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
