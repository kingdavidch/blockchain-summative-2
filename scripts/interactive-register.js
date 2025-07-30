const { ethers } = require("hardhat");
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function main() {
    console.log("🏥 Interactive Patient Registration");
    console.log("==================================\n");
    
    // Deploy contract
    console.log("📋 Deploying Healthcare Contract...");
    const HealthcareRecords = await ethers.getContractFactory("HealthcareRecords");
    const healthcareRecords = await HealthcareRecords.deploy();
    await healthcareRecords.waitForDeployment();
    
    const contractAddress = await healthcareRecords.getAddress();
    console.log(`✅ Contract deployed at: ${contractAddress}\n`);
    
    // Get patient account
    const [owner, patient] = await ethers.getSigners();
    console.log(`👤 Your patient wallet: ${patient.address}\n`);
    
    // Get user input
    console.log("Please enter your registration details:\n");
    
    const name = await askQuestion("👤 Enter your name: ");
    const ageInput = await askQuestion("🎂 Enter your age: ");
    const contact = await askQuestion("📞 Enter contact info: ");
    
    // Calculate date of birth from age
    const age = parseInt(ageInput);
    const dateOfBirth = Math.floor(Date.now() / 1000) - (age * 365 * 24 * 60 * 60);
    
    console.log("\n📝 Registration Summary:");
    console.log("----------------------");
    console.log(`Name: ${name}`);
    console.log(`Age: ${age} years`);
    console.log(`Contact: ${contact}`);
    console.log(`Wallet: ${patient.address}\n`);
    
    const confirm = await askQuestion("✅ Confirm registration? (y/n): ");
    
    if (confirm.toLowerCase() !== 'y') {
        console.log("❌ Registration cancelled.");
        rl.close();
        return;
    }
    
    // Execute registration
    console.log("\n🔄 Registering on blockchain...");
    try {
        const registerTx = await healthcareRecords.connect(patient).registerPatient(
            name,
            dateOfBirth,
            contact
        );
        
        console.log(`⏳ Transaction: ${registerTx.hash}`);
        await registerTx.wait();
        console.log("✅ Registration successful!\n");
        
        // Verify registration
        const patientInfo = await healthcareRecords.connect(patient).getMyInfo();
        console.log("🔍 Verification Complete:");
        console.log(`✅ Registered: ${patientInfo.isRegistered}`);
        console.log(`✅ Name: ${patientInfo.name}`);
        console.log(`✅ Records: ${patientInfo.recordIds.length}\n`);
        
        console.log("🎉 You are now registered in the healthcare blockchain!");
        
    } catch (error) {
        console.error("❌ Registration failed:", error.message);
    }
    
    rl.close();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        rl.close();
        process.exit(1);
    });
