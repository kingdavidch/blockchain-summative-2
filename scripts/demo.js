const { ethers } = require("hardhat");

async function main() {
    console.log("🏥 Healthcare Blockchain Demo - Live Interaction\n");
    
    // Get signers (accounts)
    const [owner, patient1, patient2, provider1, provider2] = await ethers.getSigners();
    
    console.log("👥 Demo Accounts:");
    console.log(`Owner (Admin): ${owner.address}`);
    console.log(`Patient 1: ${patient1.address}`);
    console.log(`Patient 2: ${patient2.address}`);
    console.log(`Provider 1 (Dr. Smith): ${provider1.address}`);
    console.log(`Provider 2 (Dr. Johnson): ${provider2.address}\n`);
    
    // Connect to deployed contract
    const HealthcareRecords = await ethers.getContractFactory("HealthcareRecords");
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // From deployment
    const healthcareRecords = HealthcareRecords.attach(contractAddress);
    
    console.log(`📋 Connected to contract at: ${contractAddress}\n`);
    
    // Step 1: Register healthcare providers
    console.log("🏥 STEP 1: Registering Healthcare Providers");
    console.log("------------------------------------------");
    
    const tx1 = await healthcareRecords.connect(owner).registerProvider(provider1.address);
    await tx1.wait();
    console.log(`✅ Registered Dr. Smith (${provider1.address})`);
    
    const tx2 = await healthcareRecords.connect(owner).registerProvider(provider2.address);
    await tx2.wait();
    console.log(`✅ Registered Dr. Johnson (${provider2.address})\n`);
    
    // Step 2: Register patients
    console.log("👤 STEP 2: Patient Registration");
    console.log("-------------------------------");
    
    const tx3 = await healthcareRecords.connect(patient1).registerPatient(
        "John Doe", 
        Math.floor(Date.now() / 1000) - (25 * 365 * 24 * 60 * 60), // 25 years old
        "encrypted_contact_info_john"
    );
    await tx3.wait();
    console.log(`✅ Patient John Doe registered (${patient1.address})`);
    
    const tx4 = await healthcareRecords.connect(patient2).registerPatient(
        "Jane Smith",
        Math.floor(Date.now() / 1000) - (30 * 365 * 24 * 60 * 60), // 30 years old
        "encrypted_contact_info_jane"
    );
    await tx4.wait();
    console.log(`✅ Patient Jane Smith registered (${patient2.address})\n`);
    
    // Step 3: Grant access permissions
    console.log("🔐 STEP 3: Managing Access Permissions");
    console.log("--------------------------------------");
    
    const tx5 = await healthcareRecords.connect(patient1).grantAccess(provider1.address);
    await tx5.wait();
    console.log(`✅ John Doe granted access to Dr. Smith`);
    
    const tx6 = await healthcareRecords.connect(patient2).grantAccess(provider1.address);
    await tx6.wait();
    console.log(`✅ Jane Smith granted access to Dr. Smith`);
    
    const tx7 = await healthcareRecords.connect(patient1).grantAccess(provider2.address);
    await tx7.wait();
    console.log(`✅ John Doe granted access to Dr. Johnson\n`);
    
    // Step 4: Add medical records
    console.log("📋 STEP 4: Adding Medical Records");
    console.log("---------------------------------");
    
    const tx8 = await healthcareRecords.connect(provider1).addMedicalRecord(
        patient1.address,
        "Blood Test",
        "Annual blood work - All levels normal. Cholesterol: 180mg/dL, Glucose: 95mg/dL",
        "QmBloodTest123ABC"
    );
    await tx8.wait();
    console.log(`✅ Dr. Smith added Blood Test for John Doe`);
    
    const tx9 = await healthcareRecords.connect(provider1).addMedicalRecord(
        patient1.address,
        "X-Ray",
        "Chest X-Ray - No abnormalities detected. Clear lung fields.",
        "QmXRay456DEF"
    );
    await tx9.wait();
    console.log(`✅ Dr. Smith added X-Ray for John Doe`);
    
    const tx10 = await healthcareRecords.connect(provider2).addMedicalRecord(
        patient1.address,
        "Prescription",
        "Prescribed: Vitamin D 1000IU daily for 3 months. Patient has vitamin D deficiency.",
        "QmPrescription789GHI"
    );
    await tx10.wait();
    console.log(`✅ Dr. Johnson added Prescription for John Doe`);
    
    const tx11 = await healthcareRecords.connect(provider1).addMedicalRecord(
        patient2.address,
        "Blood Test",
        "Routine check - All normal. Blood pressure: 120/80 mmHg",
        "QmBloodTest789XYZ"
    );
    await tx11.wait();
    console.log(`✅ Dr. Smith added Blood Test for Jane Smith\n`);
    
    // Step 5: View patient records
    console.log("📊 STEP 5: Viewing Patient Records");
    console.log("----------------------------------");
    
    // John Doe's records
    const johnRecords = await healthcareRecords.connect(patient1).getPatientRecords(patient1.address);
    console.log(`📋 John Doe has ${johnRecords.length} medical records:`);
    
    for (let i = 0; i < johnRecords.length; i++) {
        const recordId = johnRecords[i];
        const record = await healthcareRecords.connect(patient1).getMedicalRecord(recordId, patient1.address);
        const date = new Date(Number(record[4]) * 1000).toLocaleDateString();
        console.log(`   ${i + 1}. ${record[1]} - ${record[2]} (Added: ${date})`);
    }
    
    // Jane Smith's records  
    const janeRecords = await healthcareRecords.connect(patient2).getPatientRecords(patient2.address);
    console.log(`\n📋 Jane Smith has ${janeRecords.length} medical record:`);
    
    for (let i = 0; i < janeRecords.length; i++) {
        const recordId = janeRecords[i];
        const record = await healthcareRecords.connect(patient2).getMedicalRecord(recordId, patient2.address);
        const date = new Date(Number(record[4]) * 1000).toLocaleDateString();
        console.log(`   ${i + 1}. ${record[1]} - ${record[2]} (Added: ${date})`);
    }
    
    // Step 6: Provider accessing patient records
    console.log(`\n🏥 STEP 6: Provider Access Demonstration`);
    console.log("---------------------------------------");
    
    // Dr. Smith accesses John's records
    console.log(`Dr. Smith accessing John Doe's records:`);
    const johnRecordsForDoctor = await healthcareRecords.connect(provider1).getPatientRecords(patient1.address);
    console.log(`✅ Dr. Smith can access ${johnRecordsForDoctor.length} records for John Doe`);
    
    // Log the access for audit trail
    await healthcareRecords.connect(provider1).accessMedicalRecord(1, patient1.address);
    console.log(`📝 Access logged to blockchain for audit trail`);
    
    // Step 7: System statistics
    console.log(`\n📈 STEP 7: System Statistics`);
    console.log("----------------------------");
    
    const totalRecords = await healthcareRecords.getTotalRecords();
    console.log(`📊 Total medical records in system: ${totalRecords}`);
    
    const isProvider1Registered = await healthcareRecords.isRegisteredProvider(provider1.address);
    const isProvider2Registered = await healthcareRecords.isRegisteredProvider(provider2.address);
    console.log(`🏥 Registered providers: ${isProvider1Registered && isProvider2Registered ? '2' : 'Error'}`);
    
    const hasAccess = await healthcareRecords.hasAccess(patient1.address, provider1.address);
    console.log(`🔐 Dr. Smith has access to John Doe's records: ${hasAccess}`);
    
    // Step 8: Security demonstration - revoke access
    console.log(`\n🔒 STEP 8: Security - Access Revocation`);
    console.log("--------------------------------------");
    
    console.log(`John Doe revoking Dr. Johnson's access...`);
    const tx12 = await healthcareRecords.connect(patient1).revokeAccess(provider2.address);
    await tx12.wait();
    
    const hasAccessAfterRevoke = await healthcareRecords.hasAccess(patient1.address, provider2.address);
    console.log(`✅ Dr. Johnson's access revoked: ${!hasAccessAfterRevoke}`);
    
    console.log(`\n🎉 Demo Complete! Healthcare Blockchain System Working Perfectly!`);
    console.log(`📋 All functionality demonstrated: ✅ Registration ✅ Access Control ✅ Records ✅ Security`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Demo failed:", error);
        process.exit(1);
    });
