import { ethers } from "ethers";
import * as dotenv from "dotenv";
const fs = require('fs');
const path = require('path');
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

const CensorItServiceMangerAddress = "0xbA4aF80Feb652139be806C2c66C04D55017230F5";



// Load ABIs
const censorItServiceManagerABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../abis/CensorItServiceManager.json'), 'utf8')).abi;


// Initialize contract objects from ABIs
const censorItServiceManager = new ethers.Contract(CensorItServiceMangerAddress, censorItServiceManagerABI, wallet);


async function createNewTask() {
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

    const content =  readlineSync.question("Enter the content as URL or text ");
    // console.log("Choose the type of content");
    contentType.map((content,index)=>{
      console.log(index,content);
    })
    const contentTypeIndex =  readlineSync.question("Choose the type of content ");

    violationtype.map((violation,index)=>{
      console.log(index,violation);
    })
    const violationTypeIndex =  readlineSync.question("Choose the type of content ");
    console.log("creating new task....." );
    console.log("content: ",content);
    console.log("ViolationType: ",violationtype[violationTypeIndex]);
    console.log("ContentType:",contentType[contentTypeIndex]);
  try {
    // Send a transaction to the createNewTask function
    const tx = await censorItServiceManager.createNewTask(content,violationTypeIndex,contentTypeIndex);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`Transaction successful with hash: ${receipt.hash}`);
  } catch (error) {
    console.error('Error sending transaction: ', error);
  }
}

// Function to create a new task with a random name every 15 seconds
function startCreatingTasks() {
  setInterval(() => {
    // const randomName = generateRandomName();
    // console.log(`Creating new task with name: ${randomName}`);
    // createNewTask(randomName);
  }, 24000);
}

// Start the process
createNewTask();