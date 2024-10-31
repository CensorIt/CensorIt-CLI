#!/usr/bin/env node

const readline = require('readline');
const { spawn } = require('child_process');
const figlet = require('figlet');
const chalk = require('chalk');

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to display ASCII art
function displayAsciiArt(): Promise<void> {
    return new Promise((resolve) => {
        figlet('CensorIt', (err:any, data:any) => {
            if (err) {
                console.error('Something went wrong with the ASCII art');
                return;
            }
            console.log(chalk.blue(data));
            resolve();
        });
    });
}

// Function to display menu and get user choice
function displayMenu(): Promise<string> {
    console.log('\n' + chalk.yellow('Please select an option:'));
    console.log(chalk.green('1. Create new task'));
    console.log(chalk.green('2. Register as operator'));
    
    return new Promise((resolve) => {
        rl.question(chalk.yellow('\nEnter your choice (1 or 2): '), (choice:string) => {
            resolve(choice.trim());
        });
    });
}

// Function to execute scripts using npx ts-node with proper stdio inheritance
function executeScript(scriptPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Use spawn instead of exec to better handle stdio
        const npx = spawn('npx', ['ts-node', scriptPath], {
            stdio: 'inherit', // This is key - inherit parent process stdio
            shell: true
        });

        npx.on('error', (error:any) => {
            console.error(chalk.red(`Failed to start script: ${error.message}`));
            reject(error);
        });

        npx.on('exit', (code:number) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Script exited with code ${code}`));
            }
        });
    });
}

// Main function to run the CLI
async function main(): Promise<void> {
    try {
        // Display ASCII art
        await displayAsciiArt();
        
        // Get user choice
        const choice = await displayMenu();
        
        // Close readline interface before spawning new process
        rl.close();
        
        // Execute appropriate script based on choice
        switch (choice) {
            case '1':
                await executeScript('scripts/createNewTask.ts');
                break;
            case '2':
                await executeScript('scripts/index.ts');
                break;
            default:
                console.log(chalk.red('Invalid choice. Please select 1 or 2.'));
        }
    } catch (error) {
        console.error(chalk.red('An error occurred:', error));
        process.exit(1);
    }
}

// Run the CLI
main().catch(error => {
    console.error(chalk.red('Fatal error:', error));
    process.exit(1);
});