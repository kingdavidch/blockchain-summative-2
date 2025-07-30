const { ethers } = require("hardhat");

async function main() {
    console.log("🏥 Interactive Patient Registration Demo");
    console.log("=====================================\n");
    
    // Deploy contract first
    console.log("📋 Deploying Healthcare Contract...");
    const HealthcareRecords = await ethers.getContractFactory("HealthcareRecords");
    const healthcareRecords = await HealthcareRecords.deploy();
    await healthcareRecords.waitForDeployment();
    
    const contractAddress = await healthcareRecords.getAddress();
    console.log(`✅ Contract deployed at: ${contractAddress}\n`);
    
    // Get signers
    const [owner, patient] = await ethers.getSigners();
    
    console.log("👥 Demo Accounts:");
    console.log(`Owner (Admin): ${owner.address}`);
    console.log(`Patient (You): ${patient.address}\n`);
    
    // Patient registration
    console.log("👤 PATIENT REGISTRATION");
    console.log("----------------------");
    
    const patientName = "Demo Patient";
    const dateOfBirth = Math.floor(Date.now() / 1000) - (30 * 365 * 24 * 60 * 60); // 30 years old
    const contactInfo = "encrypted_demo_contact_info";
    
    console.log(`📝 Registering patient: ${patientName}`);
    console.log(`🎂 Age: 30 years old`);
    console.log(`📞 Contact: ${contactInfo}`);
    console.log(`💼 Wallet Address: ${patient.address}\n`);
    
    // Execute registration
    console.log("🔄 Executing registration transaction...");
    const registerTx = await healthcareRecords.connect(patient).registerPatient(
        patientName,
        dateOfBirth,
        contactInfo
    );
    
    console.log(`⏳ Transaction hash: ${registerTx.hash}`);
    await registerTx.wait();
    console.log("✅ Registration successful!\n");
    
    // Verify registration
    console.log("🔍 Verifying Registration:");
    console.log("-------------------------");
    const patientInfo = await healthcareRecords.connect(patient).getMyInfo();
    
    console.log(`✅ Name: ${patientInfo.name}`);
    console.log(`✅ Date of Birth: ${new Date(Number(patientInfo.dateOfBirth) * 1000).toLocaleDateString()}`);
    console.log(`✅ Contact Info: ${patientInfo.contactInfo}`);
    console.log(`✅ Registration Status: ${patientInfo.isRegistered}`);
    console.log(`✅ Medical Records: ${patientInfo.recordIds.length} records\n`);
    
    // Show next steps
    console.log("🎯 Next Steps Available:");
    console.log("------------------------");
    console.log("1. 🏥 Register healthcare providers (admin only)");
    console.log("2. 🔐 Grant access to providers");
    console.log("3. 📋 Add medical records (by authorized providers)");
    console.log("4. 📊 View medical records and audit trail\n");
    
    console.log("🎉 Patient registration demo complete!");
    console.log(`📋 Contract Address: ${contractAddress}`);
    console.log(`👤 Your Patient Address: ${patient.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Registration failed:", error);
        process.exit(1);
    });
