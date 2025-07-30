const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HealthcareRecords", function () {
    let healthcareRecords;
    let owner;
    let patient1;
    let patient2;
    let provider1;
    let provider2;
    let unauthorized;
    
    beforeEach(async function () {
        // Get signers
        [owner, patient1, patient2, provider1, provider2, unauthorized] = await ethers.getSigners();
        
        // Deploy the contract
        const HealthcareRecords = await ethers.getContractFactory("HealthcareRecords");
        healthcareRecords = await HealthcareRecords.deploy();
        await healthcareRecords.waitForDeployment();
    });
    
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await healthcareRecords.owner()).to.equal(owner.address);
        });
        
        it("Should initialize record counter to 0", async function () {
            expect(await healthcareRecords.getTotalRecords()).to.equal(0);
        });
    });
    
    describe("Patient Registration", function () {
        it("Should allow patient registration", async function () {
            const name = "John Doe";
            const dateOfBirth = Math.floor(Date.now() / 1000) - (25 * 365 * 24 * 60 * 60); // 25 years ago
            const contactInfo = "encrypted_contact_info";
            
            await expect(
                healthcareRecords.connect(patient1).registerPatient(name, dateOfBirth, contactInfo)
            ).to.emit(healthcareRecords, "PatientRegistered")
             .withArgs(patient1.address, name);
            
            const patientInfo = await healthcareRecords.connect(patient1).getMyInfo();
            expect(patientInfo.name).to.equal(name);
            expect(patientInfo.isRegistered).to.be.true;
        });
        
        it("Should not allow duplicate patient registration", async function () {
            const name = "John Doe";
            const dateOfBirth = Math.floor(Date.now() / 1000) - (25 * 365 * 24 * 60 * 60);
            const contactInfo = "encrypted_contact_info";
            
            // First registration should succeed
            await healthcareRecords.connect(patient1).registerPatient(name, dateOfBirth, contactInfo);
            
            // Second registration should fail
            await expect(
                healthcareRecords.connect(patient1).registerPatient(name, dateOfBirth, contactInfo)
            ).to.be.revertedWith("Patient already registered");
        });
        
        it("Should not allow empty name", async function () {
            await expect(
                healthcareRecords.connect(patient1).registerPatient("", 123456789, "contact")
            ).to.be.revertedWith("Name cannot be empty");
        });
    });
    
    describe("Provider Registration", function () {
        it("Should allow owner to register providers", async function () {
            await healthcareRecords.connect(owner).registerProvider(provider1.address);
            expect(await healthcareRecords.isRegisteredProvider(provider1.address)).to.be.true;
        });
        
        it("Should not allow non-owner to register providers", async function () {
            await expect(
                healthcareRecords.connect(patient1).registerProvider(provider1.address)
            ).to.be.revertedWith("Only owner can perform this action");
        });
        
        it("Should not allow zero address as provider", async function () {
            await expect(
                healthcareRecords.connect(owner).registerProvider(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid provider address");
        });
    });
    
    describe("Access Management", function () {
        beforeEach(async function () {
            // Register patient and provider
            await healthcareRecords.connect(patient1).registerPatient("John Doe", 123456789, "contact");
            await healthcareRecords.connect(owner).registerProvider(provider1.address);
        });
        
        it("Should allow patient to grant access to provider", async function () {
            await expect(
                healthcareRecords.connect(patient1).grantAccess(provider1.address)
            ).to.emit(healthcareRecords, "AccessGranted")
             .withArgs(patient1.address, provider1.address);
            
            expect(await healthcareRecords.hasAccess(patient1.address, provider1.address)).to.be.true;
        });
        
        it("Should allow patient to revoke access from provider", async function () {
            // First grant access
            await healthcareRecords.connect(patient1).grantAccess(provider1.address);
            
            // Then revoke access
            await expect(
                healthcareRecords.connect(patient1).revokeAccess(provider1.address)
            ).to.emit(healthcareRecords, "AccessRevoked")
             .withArgs(patient1.address, provider1.address);
            
            expect(await healthcareRecords.hasAccess(patient1.address, provider1.address)).to.be.false;
        });
        
        it("Should not allow granting access to unregistered provider", async function () {
            await expect(
                healthcareRecords.connect(patient1).grantAccess(unauthorized.address)
            ).to.be.revertedWith("Provider not registered");
        });
        
        it("Should not allow unregistered patient to grant access", async function () {
            await expect(
                healthcareRecords.connect(patient2).grantAccess(provider1.address)
            ).to.be.revertedWith("Patient not registered");
        });
    });
    
    describe("Medical Records", function () {
        beforeEach(async function () {
            // Setup: register patient and provider, grant access
            await healthcareRecords.connect(patient1).registerPatient("John Doe", 123456789, "contact");
            await healthcareRecords.connect(owner).registerProvider(provider1.address);
            await healthcareRecords.connect(patient1).grantAccess(provider1.address);
        });
        
        it("Should allow authorized provider to add medical records", async function () {
            const recordType = "Blood Test";
            const description = "Annual blood work - all levels normal";
            const ipfsHash = "QmTest123";
            
            await expect(
                healthcareRecords.connect(provider1).addMedicalRecord(
                    patient1.address, recordType, description, ipfsHash
                )
            ).to.emit(healthcareRecords, "RecordAdded")
             .withArgs(patient1.address, 1, recordType);
            
            expect(await healthcareRecords.getTotalRecords()).to.equal(1);
            
            // Check patient's records
            const patientRecords = await healthcareRecords.connect(patient1).getPatientRecords(patient1.address);
            expect(patientRecords.length).to.equal(1);
            expect(patientRecords[0]).to.equal(1);
        });
        
        it("Should not allow unauthorized provider to add records", async function () {
            await healthcareRecords.connect(owner).registerProvider(provider2.address);
            
            await expect(
                healthcareRecords.connect(provider2).addMedicalRecord(
                    patient1.address, "Test", "Description", "ipfs"
                )
            ).to.be.revertedWith("No permission to add records for this patient");
        });
        
        it("Should not allow unregistered provider to add records", async function () {
            await expect(
                healthcareRecords.connect(unauthorized).addMedicalRecord(
                    patient1.address, "Test", "Description", "ipfs"
                )
            ).to.be.revertedWith("Only registered providers can add records");
        });
        
        it("Should allow patient to view their own records", async function () {
            // Add a record first
            await healthcareRecords.connect(provider1).addMedicalRecord(
                patient1.address, "X-Ray", "Chest X-Ray normal", "QmXray123"
            );
            
            const patientRecords = await healthcareRecords.connect(patient1).getPatientRecords(patient1.address);
            expect(patientRecords.length).to.equal(1);
            
            const recordResult = await healthcareRecords.connect(patient1).getMedicalRecord(1, patient1.address);
            expect(recordResult[1]).to.equal("X-Ray"); // recordType
            expect(recordResult[2]).to.equal("Chest X-Ray normal"); // description
            expect(recordResult[5]).to.equal(provider1.address); // addedBy
        });
        
        it("Should allow authorized provider to view patient records", async function () {
            // Add a record
            await healthcareRecords.connect(provider1).addMedicalRecord(
                patient1.address, "Blood Test", "Normal results", "QmBlood123"
            );
            
            const patientRecords = await healthcareRecords.connect(provider1).getPatientRecords(patient1.address);
            expect(patientRecords.length).to.equal(1);
            
            await expect(
                healthcareRecords.connect(provider1).accessMedicalRecord(1, patient1.address)
            ).to.emit(healthcareRecords, "RecordAccessed")
             .withArgs(patient1.address, provider1.address, 1);
             
            // Also test that provider can view the record
            const recordResult = await healthcareRecords.connect(provider1).getMedicalRecord(1, patient1.address);
            expect(recordResult[1]).to.equal("Blood Test"); // recordType
        });
        
        it("Should not allow unauthorized access to patient records", async function () {
            // Add a record
            await healthcareRecords.connect(provider1).addMedicalRecord(
                patient1.address, "Blood Test", "Normal results", "QmBlood123"
            );
            
            await expect(
                healthcareRecords.connect(unauthorized).getPatientRecords(patient1.address)
            ).to.be.revertedWith("Not authorized to view records");
            
            await expect(
                healthcareRecords.connect(unauthorized).getMedicalRecord(1, patient1.address)
            ).to.be.revertedWith("Not authorized to view this record");
        });
        
        it("Should handle multiple records correctly", async function () {
            // Add multiple records
            await healthcareRecords.connect(provider1).addMedicalRecord(
                patient1.address, "Blood Test", "Normal", "QmBlood123"
            );
            await healthcareRecords.connect(provider1).addMedicalRecord(
                patient1.address, "X-Ray", "Normal", "QmXray123"
            );
            await healthcareRecords.connect(provider1).addMedicalRecord(
                patient1.address, "Prescription", "Vitamin D", "QmPrescription123"
            );
            
            expect(await healthcareRecords.getTotalRecords()).to.equal(3);
            
            const patientRecords = await healthcareRecords.connect(patient1).getPatientRecords(patient1.address);
            expect(patientRecords.length).to.equal(3);
            
            // Check each record
            for (let i = 1; i <= 3; i++) {
                const recordResult = await healthcareRecords.connect(patient1).getMedicalRecord(i, patient1.address);
                expect(recordResult[0]).to.equal(i); // id
                expect(recordResult[5]).to.equal(provider1.address); // addedBy
            }
        });
    });
    
    describe("Edge Cases and Security", function () {
        it("Should not allow access to non-existent records", async function () {
            await healthcareRecords.connect(patient1).registerPatient("John Doe", 123456789, "contact");
            
            await expect(
                healthcareRecords.connect(patient1).getMedicalRecord(999, patient1.address)
            ).to.be.revertedWith("Record does not exist");
        });
        
        it("Should maintain separate records for different patients", async function () {
            // Register two patients and one provider
            await healthcareRecords.connect(patient1).registerPatient("John Doe", 123456789, "contact1");
            await healthcareRecords.connect(patient2).registerPatient("Jane Smith", 987654321, "contact2");
            await healthcareRecords.connect(owner).registerProvider(provider1.address);
            
            // Grant access for both patients
            await healthcareRecords.connect(patient1).grantAccess(provider1.address);
            await healthcareRecords.connect(patient2).grantAccess(provider1.address);
            
            // Add records for each patient
            await healthcareRecords.connect(provider1).addMedicalRecord(
                patient1.address, "Blood Test", "Patient 1 record", "QmP1"
            );
            await healthcareRecords.connect(provider1).addMedicalRecord(
                patient2.address, "X-Ray", "Patient 2 record", "QmP2"
            );
            
            // Check that each patient only sees their own records
            const patient1Records = await healthcareRecords.connect(patient1).getPatientRecords(patient1.address);
            const patient2Records = await healthcareRecords.connect(patient2).getPatientRecords(patient2.address);
            
            expect(patient1Records.length).to.equal(1);
            expect(patient2Records.length).to.equal(1);
            
            const record1Result = await healthcareRecords.connect(patient1).getMedicalRecord(1, patient1.address);
            const record2Result = await healthcareRecords.connect(patient2).getMedicalRecord(2, patient2.address);
            
            expect(record1Result[2]).to.equal("Patient 1 record"); // description
            expect(record2Result[2]).to.equal("Patient 2 record"); // description
        });
    });
});
