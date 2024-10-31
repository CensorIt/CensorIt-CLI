import { ethers } from "ethers";
import { Provider } from "ethers";
import * as dotenv from "dotenv";
import { estimateGas } from "viem/actions";
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const readlineSync = require('readline-sync');
dotenv.config();

// Check if the process.env object is empty
if (!Object.keys(process.env).length) {
    throw new Error("process.env object is empty");
}

// Setup env variables
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
/// TODO: Hack
let chainId = 31337;

// const avsDeploymentData = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../contracts/deployments/hello-world/${chainId}.json`), 'utf8'));
// // Load core deployment data
// const coreDeploymentData = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../contracts/deployments/core/${chainId}.json`), 'utf8'));


const delegationManagerAddress = "0xA44151489861Fe9e3055d95adC98FbD462B948e7"; // todo: reminder to fix the naming of this contract in the deployment file, change to delegationManager
const avsDirectoryAddress = "0x055733000064333CaDDbC92763c58BF0192fFeBf";
const CensorItServiceMangerAddress = "0x792a456E832863381e1e3cDFEb0FA8e3085B990E";
const ecdsaStakeRegistryAddress = "0x3075398a9b44B9004bB6346d49DE351A87973753";



// Load ABIs
const delegationManagerABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../abis/IDelegationManager.json'), 'utf8')).abi;
const ecdsaRegistryABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../abis/ECDSAStakeRegistry.json'), 'utf8')).abi;
const censorItServiceManagerABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../abis/CensorItServiceManager.json'), 'utf8')).abi;
const avsDirectoryABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../abis/IAVSDirectory.json'), 'utf8')).abi;

// Initialize contract objects from ABIs
const delegationManager = new ethers.Contract(delegationManagerAddress, delegationManagerABI, wallet);
const censorItServiceManager = new ethers.Contract(CensorItServiceMangerAddress, censorItServiceManagerABI, wallet);
const ecdsaRegistryContract = new ethers.Contract(ecdsaStakeRegistryAddress, ecdsaRegistryABI, wallet);
const avsDirectory = new ethers.Contract(avsDirectoryAddress, avsDirectoryABI, wallet);


const signAndRespondToTask = async (contentId: number, content: any) => {
    const violationtype = [
        "VULGAR",
        "FAKE",
        "HARMFUL",
        "COPYRIGHT"
    ]

    const contentType = [
        "AUDIO",
        "VIDEO",
        "TEXT",
        "IMAGE"
    ]
    const operatorAddress = await wallet.getAddress();
    const contentReport = await censorItServiceManager.getReport(contentId);
    
    console.log(chalk.green("Got the content report...\n"));
    console.log(chalk.green("ContentId: "), chalk.yellow(contentId));
    console.log(chalk.green("Content: "), chalk.yellow(contentReport.content));
    console.log(chalk.green("ContentType: "), chalk.yellow(contentType[contentReport.contentType]));
    console.log(chalk.green("ViolationType: "), chalk.yellow(violationtype[contentReport.voilationType]),"\n");
    
    const vote = Boolean(readlineSync.question(chalk.yellow("Enter the vote(true/false): ")));
    console.log("\n");
    // Create the message hash
    const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "bool", "address"],
        [contentId, vote, operatorAddress]
    );

    // Sign the message
    const messageBytes = ethers.getBytes(messageHash);
    const signature = await wallet.signMessage(messageBytes);

    // Send transaction with proper parameters
    try {

        const tx = await censorItServiceManager.respondToTask(
            contentId,
            vote,
            signature,
            {
                gasLimit: 300000
            }
        );
        await tx.wait();
        console.log(chalk.green(`Responded to task with content id : ${contentId}\n`));
        console.log(chalk.yellow("Monitoring for new tasks...\n"));

    } catch (e) {
        console.log(chalk.red("Error occured ", e));
    }
};


const registerOperator = async () => {

    // Registers as an Operator in EigenLayer.

    const tx1 = await delegationManager.registerAsOperator({
        __deprecated_earningsReceiver: await wallet.address,
        delegationApprover: "0x0000000000000000000000000000000000000000",
        stakerOptOutWindowBlocks: 0
    }, "");
    await tx1.wait();
    console.log(chalk.green("Operator registered to Core EigenLayer contracts\n"));

    const salt = ethers.hexlify(ethers.randomBytes(32));
    const expiry = Math.floor(Date.now() / 1000) + 3600; // Example expiry, 1 hour from now

    // Define the output structure
    let operatorSignatureWithSaltAndExpiry = {
        signature: "",
        salt: salt,
        expiry: expiry
    };

    // Calculate the digest hash, which is a unique value representing the operator, avs, unique value (salt) and expiration date.
    const operatorDigestHash = await avsDirectory.calculateOperatorAVSRegistrationDigestHash(
        wallet.address,
        await censorItServiceManager.getAddress(),
        salt,
        expiry
    );
    // console.log(operatorDigestHash);

    // Sign the digest hash with the operator's private key
    console.log(chalk.green("Signing digest hash with operator's private key...\n"));
    const operatorSigningKey = new ethers.SigningKey(process.env.PRIVATE_KEY!);
    const operatorSignedDigestHash = operatorSigningKey.sign(operatorDigestHash);

    // Encode the signature in the required format
    operatorSignatureWithSaltAndExpiry.signature = ethers.Signature.from(operatorSignedDigestHash).serialized;

    console.log(chalk.green("Registering Operator to AVS Registry contract\n"));


    // Register Operator to AVS
    // Per release here: https://github.com/Layr-Labs/eigenlayer-middleware/blob/v0.2.1-mainnet-rewards/src/unaudited/ECDSAStakeRegistry.sol#L49
    const tx2 = await ecdsaRegistryContract.registerOperatorWithSignature(
        operatorSignatureWithSaltAndExpiry,
        wallet.address
    );
    await tx2.wait();
    console.log(chalk.green("Operator registered on AVS successfully!!\n"));
};
// Helper function to verify if operator is registered
const checkOperatorStatus = async (operatorAddress: string) => {
    try {
        const isRegistered = await ecdsaRegistryContract.operatorRegistered(operatorAddress);
        console.log(chalk.green("Operator registration status:"), chalk.yellow(isRegistered, "\n"));
        return isRegistered;
    } catch (error) {
        console.error("Error checking operator status:", error);
        throw error;
    }
};
// Modify the monitoring function to check operator status
const monitorNewTasks = async () => {
    const operatorAddress = await wallet.getAddress();
    const isRegistered = await checkOperatorStatus(operatorAddress);

    if (!isRegistered) {
        throw new Error("Operator is not registered. Please register first.");
    }

    censorItServiceManager.on("newReportCreated", async (taskIndex: number, task: any) => {
        console.log(chalk.yellow(`New task detected with id :${taskIndex}`));
        await signAndRespondToTask(taskIndex, task);
    });

    console.log(chalk.yellow("Monitoring for new tasks...\n"));
};

export const operatorTasks = async () => {
    try {
        await registerOperator();
    } catch {

        await monitorNewTasks().catch((error) => {
            console.error("Error monitoring tasks:", error);
        });
    }
};

operatorTasks().catch((error) => {
    console.error("Error in main function:", error);
});