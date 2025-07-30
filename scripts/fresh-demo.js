const { ethers } = require("hardhat");

async function main() {
    console.log("🏥 Healthcare Blockchain Demo - Fresh Deployment & Interaction\n");
    
    // Deploy fresh contract
    console.log("📋 STEP 1: Deploying Fresh Contract");
    console.log("-----------------------------------");
    const HealthcareRecords = await ethers.getContractFactory("HealthcareRecords");
    const healthcareRecords = await HealthcareRecords.deploy();
    await healthcareRecords.waitForDeployment();
    
    const contractAddress = await healthcareRecords.getAddress();
    console.log(`✅ Contract deployed at: ${contractAddress}\n`);
    
    // Get signers (accounts)
    const [owner, patient1, patient2, provider1, provider2] = await ethers.getSigners();
    
    console.log("👥 STEP 2: Demo Accounts");
    console.log("------------------------");
    console.log(`Owner (Admin): ${owner.address}`);
    console.log(`Patient 1: ${patient1.address}`);
    console.log(`Provider 1 (Dr. Smith): ${provider1.address}\n`);
    
    // Register healthcare provider
    console.log("🏥 STEP 3: Registering Healthcare Provider");
    console.log("------------------------------------------");
    const tx1 = await healthcareRecords.connect(owner).registerProvider(provider1.address);
    await tx1.wait();
    console.log(`✅ Registered Dr. Smith (${provider1.address})\n`);
    
    // Register patient
    console.log("👤 STEP 4: Patient Registration");
    console.log("-------------------------------");
    const tx2 = await healthcareRecords.connect(patient1).registerPatient(
        "John Doe", 
        Math.floor(Date.now() / 1000) - (25 * 365 * 24 * 60 * 60), // 25 years old
        "encrypted_contact_info_john"
    );
    await tx2.wait();
    console.log(`✅ Patient John Doe registered\n`);
    
    // Grant access
    console.log("🔐 STEP 5: Granting Provider Access");
    console.log("-----------------------------------");
    const tx3 = await healthcareRecords.connect(patient1).grantAccess(provider1.address);
    await tx3.wait();
    console.log(`✅ John Doe granted access to Dr. Smith\n`);
    
    // Add medical record
    console.log("📋 STEP 6: Adding Medical Record");
    console.log("--------------------------------");
    const tx4 = await healthcareRecords.connect(provider1).addMedicalRecord(
        patient1.address,
        "Blood Test",
        "Annual blood work - All levels normal. Cholesterol: 180mg/dL",
        "QmBloodTest123ABC"
    );
    await tx4.wait();
    console.log(`✅ Dr. Smith added Blood Test for John Doe\n`);
    
    // View records
    console.log("📊 STEP 7: Viewing Patient Records");
    console.log("----------------------------------");
    const records = await healthcareRecords.connect(patient1).getPatientRecords(patient1.address);
    console.log(`📋 John Doe has ${records.length} medical record(s):`);
    
    for (let i = 0; i < records.length; i++) {
        const recordId = records[i];
        const record = await healthcareRecords.connect(patient1).getMedicalRecord(recordId, patient1.address);
        const date = new Date(Number(record[4]) * 1000).toLocaleDateString();
        console.log(`   ${i + 1}. ${record[1]} - ${record[2]} (Added: ${date})`);
    }
    
    // System statistics
    console.log(`\n📈 STEP 8: System Statistics`);
    console.log("----------------------------");
    const totalRecords = await healthcareRecords.getTotalRecords();
    const isProviderRegistered = await healthcareRecords.isRegisteredProvider(provider1.address);
    const hasAccess = await healthcareRecords.hasAccess(patient1.address, provider1.address);
    
    console.log(`📊 Total medical records in system: ${totalRecords}`);
    console.log(`🏥 Dr. Smith is registered provider: ${isProviderRegistered}`);
    console.log(`🔐 Dr. Smith has access to John's records: ${hasAccess}`);
    
    console.log(`\n🎉 Healthcare Blockchain Demo Complete!`);
    console.log(`✅ All core functionality successfully demonstrated`);
    console.log(`📋 Contract Address: ${contractAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Demo failed:", error);
        process.exit(1);
    });
