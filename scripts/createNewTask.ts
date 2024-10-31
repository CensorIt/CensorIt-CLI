import { ethers } from "ethers";
import * as dotenv from "dotenv";
const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync');
const chalk = require('chalk');
dotenv.config();

// Check if the process.env object is empty
if (!Object.keys(process.env).length) {
    throw new Error("process.env object is empty");
}

// Setup env variables
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL_2);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
/// TODO: Hack

const CensorItServiceMangerAddress = "0x792a456E832863381e1e3cDFEb0FA8e3085B990E";



// Load ABIs
const censorItServiceManagerABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../abis/CensorItServiceManager.json'), 'utf8')).abi;


// Initialize contract objects from ABIs
const censorItServiceManager = new ethers.Contract(CensorItServiceMangerAddress, censorItServiceManagerABI, wallet);


export async function createNewTask() {
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

    const content =  readlineSync.question(chalk.yellow("\nEnter the content as URL or text "));
    console.log("\n");
    contentType.map((content,index)=>{
      console.log(chalk.green(index,content));
    })
    const contentTypeIndex =  readlineSync.question(chalk.yellow("\nChoose the type of content "));
    console.log("\n");
    violationtype.map((violation,index)=>{
      console.log(chalk.green(index,violation));
    })
    const violationTypeIndex =  readlineSync.question(chalk.yellow("\nChoose the type of violation "));
    console.log("\n");
    console.log(chalk.green("creating new task.....\n" ));
    console.log(chalk.green("content: "),chalk.yellow(content));
    console.log(chalk.green("ViolationType: "),chalk.yellow(violationtype[violationTypeIndex]));
    console.log(chalk.green("ContentType:"),chalk.yellow(contentType[contentTypeIndex],"\n"));
  try {
    // Send a transaction to the createNewTask function
    const tx = await censorItServiceManager.createNewTask(content,violationTypeIndex,contentTypeIndex);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    console.log(chalk.green(`Transaction successful with hash: ${receipt.hash}\n`));
  } catch (error) {
    console.error(chalk.red('Error sending transaction: ', error));
  }
}


// Start the process
createNewTask();