# Deployment Guide - Healthcare Records Blockchain

## Prerequisites

### 1. Node.js and npm
Make sure you have Node.js (v16 or higher) installed:
```bash
node --version
npm --version
```

### 2. Install Dependencies
```bash
cd /Users/king/Documents/summative2
npm install
```

### 3. Set up Environment Variables (Optional for Testnet)
Create a `.env` file in the project root:
```bash
touch .env
```

Add your Infura project ID and private key (for Sepolia testnet deployment):
```
INFURA_PROJECT_ID=your_infura_project_id
PRIVATE_KEY=your_wallet_private_key
```

## Local Development and Testing

### 1. Compile the Smart Contract
```bash
npm run compile
```

### 2. Run Tests
```bash
npm test
```

### 3. Deploy Locally (Hardhat Network)
```bash
npm run deploy-local
```

## Testnet Deployment (Sepolia)

### 1. Update hardhat.config.js
Replace `YOUR_INFURA_PROJECT_ID` and add your private key in the Sepolia network configuration.

### 2. Get Sepolia ETH
- Go to [Sepolia Faucet](https://sepoliafaucet.com/)
- Enter your wallet address
- Get free test ETH

### 3. Deploy to Sepolia
```bash
npm run deploy
```

## Interaction Examples

### Using Hardhat Console
```bash
npx hardhat console --network sepolia
```

Then in the console:
```javascript
// Get the contract
const HealthcareRecords = await ethers.getContractFactory("HealthcareRecords");
const contract = await HealthcareRecords.attach("YOUR_CONTRACT_ADDRESS");

// Get signers
const [owner, patient, provider] = await ethers.getSigners();

// Register a provider
await contract.connect(owner).registerProvider(provider.address);

// Register a patient
await contract.connect(patient).registerPatient("John Doe", 946684800, "encrypted_contact");

// Grant access
await contract.connect(patient).grantAccess(provider.address);

// Add a medical record
await contract.connect(provider).addMedicalRecord(
    patient.address,
    "Blood Test",
    "Annual checkup - all normal",
    "QmSampleIPFSHash123"
);

// View patient records
const records = await contract.connect(patient).getPatientRecords(patient.address);
console.log("Patient records:", records);
```

## Verification Steps

### 1. Contract Deployment Verification
After deployment, verify:
- Contract address is generated
- Owner is set correctly
- Initial record counter is 0

### 2. Functionality Testing
Test the following scenarios:
- Patient registration
- Provider registration
- Access management (grant/revoke)
- Medical record addition
- Record retrieval
- Access control enforcement

### 3. Gas Usage Analysis
Monitor gas usage for each function:
```bash
npx hardhat test --gas-reporter
```

## Common Issues and Solutions

### Issue 1: Insufficient Funds
**Error**: "insufficient funds for intrinsic transaction cost"
**Solution**: Ensure your wallet has enough Sepolia ETH

### Issue 2: Network Connection
**Error**: "network connection error"
**Solution**: Check your Infura project ID and network configuration

### Issue 3: Private Key Issues
**Error**: "invalid private key"
**Solution**: Ensure your private key is correctly formatted (starts with 0x)

## Security Considerations

1. **Never commit private keys to version control**
2. **Use environment variables for sensitive data**
3. **Test thoroughly on testnet before mainnet**
4. **Implement proper access controls**
5. **Consider gas optimization for production**

## Next Steps

1. **Frontend Development**: Create a web interface for easier interaction
2. **IPFS Integration**: Implement actual file storage on IPFS
3. **Advanced Features**: Add more medical record types and permissions
4. **Mobile App**: Develop mobile application for patients and providers
5. **Compliance**: Ensure HIPAA compliance for real-world deployment
