// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title HealthcareRecords
 * @dev Simple healthcare records management system on blockchain
 * @author Your Name
 */
contract HealthcareRecords {
    
    // Events for logging important actions
    event PatientRegistered(address indexed patient, string name);
    event RecordAdded(address indexed patient, uint256 indexed recordId, string recordType);
    event AccessGranted(address indexed patient, address indexed provider);
    event AccessRevoked(address indexed patient, address indexed provider);
    event RecordAccessed(address indexed patient, address indexed provider, uint256 indexed recordId);
    
    // Struct to represent a medical record
    struct MedicalRecord {
        uint256 id;
        string recordType;      // e.g., "Blood Test", "X-Ray", "Prescription"
        string description;     // Medical details
        string ipfsHash;        // IPFS hash for storing detailed medical files
        uint256 timestamp;      // When the record was created
        address addedBy;        // Healthcare provider who added the record
    }
    
    // Struct to represent a patient
    struct Patient {
        string name;
        uint256 dateOfBirth;    // Unix timestamp
        string contactInfo;     // Encrypted contact information
        bool isRegistered;
        uint256[] recordIds;    // Array of record IDs belonging to this patient
    }
    
    // Mappings
    mapping(address => Patient) public patients;
    mapping(uint256 => MedicalRecord) public medicalRecords;
    mapping(address => mapping(address => bool)) public accessPermissions; // patient => provider => hasAccess
    mapping(address => bool) public registeredProviders;
    
    // State variables
    address public owner;
    uint256 public recordCounter;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyRegisteredPatient() {
        require(patients[msg.sender].isRegistered, "Patient not registered");
        _;
    }
    
    modifier onlyAuthorizedProvider(address _patient) {
        require(
            registeredProviders[msg.sender] && 
            accessPermissions[_patient][msg.sender], 
            "Not authorized to access patient records"
        );
        _;
    }
    
    /**
     * @dev Constructor - sets the contract owner
     */
    constructor() {
        owner = msg.sender;
        recordCounter = 0;
    }
    
    /**
     * @dev Register a new patient
     * @param _name Patient's name
     * @param _dateOfBirth Patient's date of birth (Unix timestamp)
     * @param _contactInfo Encrypted contact information
     */
    function registerPatient(
        string memory _name,
        uint256 _dateOfBirth,
        string memory _contactInfo
    ) public {
        require(!patients[msg.sender].isRegistered, "Patient already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        patients[msg.sender] = Patient({
            name: _name,
            dateOfBirth: _dateOfBirth,
            contactInfo: _contactInfo,
            isRegistered: true,
            recordIds: new uint256[](0)
        });
        
        emit PatientRegistered(msg.sender, _name);
    }
    
    /**
     * @dev Register a healthcare provider (only owner can do this)
     * @param _provider Address of the healthcare provider
     */
    function registerProvider(address _provider) public onlyOwner {
        require(_provider != address(0), "Invalid provider address");
        registeredProviders[_provider] = true;
    }
    
    /**
     * @dev Add a medical record (only registered providers can do this)
     * @param _patient Patient's address
     * @param _recordType Type of medical record
     * @param _description Medical description
     * @param _ipfsHash IPFS hash for detailed files
     */
    function addMedicalRecord(
        address _patient,
        string memory _recordType,
        string memory _description,
        string memory _ipfsHash
    ) public {
        require(registeredProviders[msg.sender], "Only registered providers can add records");
        require(patients[_patient].isRegistered, "Patient not registered");
        require(accessPermissions[_patient][msg.sender], "No permission to add records for this patient");
        require(bytes(_recordType).length > 0, "Record type cannot be empty");
        
        recordCounter++;
        
        medicalRecords[recordCounter] = MedicalRecord({
            id: recordCounter,
            recordType: _recordType,
            description: _description,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            addedBy: msg.sender
        });
        
        patients[_patient].recordIds.push(recordCounter);
        
        emit RecordAdded(_patient, recordCounter, _recordType);
    }
    
    /**
     * @dev Grant access to a healthcare provider
     * @param _provider Address of the healthcare provider
     */
    function grantAccess(address _provider) public onlyRegisteredPatient {
        require(registeredProviders[_provider], "Provider not registered");
        require(!accessPermissions[msg.sender][_provider], "Access already granted");
        
        accessPermissions[msg.sender][_provider] = true;
        emit AccessGranted(msg.sender, _provider);
    }
    
    /**
     * @dev Revoke access from a healthcare provider
     * @param _provider Address of the healthcare provider
     */
    function revokeAccess(address _provider) public onlyRegisteredPatient {
        require(accessPermissions[msg.sender][_provider], "Access not granted");
        
        accessPermissions[msg.sender][_provider] = false;
        emit AccessRevoked(msg.sender, _provider);
    }
    
    /**
     * @dev Get patient's medical records (only patient or authorized provider)
     * @param _patient Patient's address
     * @return Array of record IDs
     */
    function getPatientRecords(address _patient) public view returns (uint256[] memory) {
        require(
            msg.sender == _patient || 
            (registeredProviders[msg.sender] && accessPermissions[_patient][msg.sender]),
            "Not authorized to view records"
        );
        
        return patients[_patient].recordIds;
    }
    
    /**
     * @dev Get details of a specific medical record
     * @param _recordId ID of the medical record
     * @param _patient Patient's address (for authorization check)
     * @return id Record ID
     * @return recordType Type of medical record
     * @return description Medical description
     * @return ipfsHash IPFS hash for detailed files
     * @return timestamp When the record was created
     * @return addedBy Address of the provider who added the record
     */
    function getMedicalRecord(uint256 _recordId, address _patient) public view returns (
        uint256 id,
        string memory recordType,
        string memory description,
        string memory ipfsHash,
        uint256 timestamp,
        address addedBy
    ) {
        require(
            msg.sender == _patient || 
            (registeredProviders[msg.sender] && accessPermissions[_patient][msg.sender]),
            "Not authorized to view this record"
        );
        require(medicalRecords[_recordId].id != 0, "Record does not exist");
        
        MedicalRecord memory record = medicalRecords[_recordId];
        return (
            record.id,
            record.recordType,
            record.description,
            record.ipfsHash,
            record.timestamp,
            record.addedBy
        );
    }
    
    /**
     * @dev Access a medical record and log the access (for audit trail)
     * @param _recordId ID of the medical record
     * @param _patient Patient's address (for authorization check)
     */
    function accessMedicalRecord(uint256 _recordId, address _patient) public {
        require(
            msg.sender == _patient || 
            (registeredProviders[msg.sender] && accessPermissions[_patient][msg.sender]),
            "Not authorized to access this record"
        );
        require(medicalRecords[_recordId].id != 0, "Record does not exist");
        
        // Log the access for audit trail
        emit RecordAccessed(_patient, msg.sender, _recordId);
    }
    
    /**
     * @dev Check if a provider has access to a patient's records
     * @param _patient Patient's address
     * @param _provider Provider's address
     * @return Boolean indicating access status
     */
    function hasAccess(address _patient, address _provider) public view returns (bool) {
        return accessPermissions[_patient][_provider];
    }
    
    /**
     * @dev Get patient information (only the patient themselves)
     * @return Patient struct
     */
    function getMyInfo() public view onlyRegisteredPatient returns (Patient memory) {
        return patients[msg.sender];
    }
    
    /**
     * @dev Check if an address is a registered provider
     * @param _provider Provider's address
     * @return Boolean indicating registration status
     */
    function isRegisteredProvider(address _provider) public view returns (bool) {
        return registeredProviders[_provider];
    }
    
    /**
     * @dev Get total number of records in the system
     * @return Total record count
     */
    function getTotalRecords() public view returns (uint256) {
        return recordCounter;
    }
}
