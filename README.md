# CensorIt CLI

## Overview

[youtube](https://www.youtube.com/watch?v=JOLcf0E1xu0)  

CensorIt CLI is a command-line interface designed to streamline the reporting and verification of AVS contracts for CensorIt. This tool allows users to easily report content violations through IPFS URLs, enabling operators to verify and act on reported content efficiently.

## Features

- **Create New Task**: Report content violations by submitting the IPFS URL, content type, and violation type.
- **Register and Verify as Reporter**: Reporters can register and submit content for review.

## Installation

To install CensorIt CLI, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/CensorIt/CensorIt-CLI
```

2.Navigate to the project directory:
```bash
cd Censorit-CLI
```

3. Create a .env file from env.example and add your private key:
```bash
cp env.example .env
```

4. Install the dependencies:
```bash 
npm install
```

5. Run the CLI:
```bash 
npm run cli
```

## Usage

```mermaid
flowchart TB
    Start([Start CLI]) --> CLIOpen[CLI Interface Opens]
    CLIOpen --> MainMenu{Main Menu<br/>1. Create Task<br/>2. Register as Operator}

    %% Create Task Flow
    MainMenu -->|1| CreateTask[Create New Task]
    CreateTask --> InputURL[Enter Content URL]
    InputURL --> SelectType[Select Content Type<br/>using numbers]
    SelectType --> SelectViolation[Select Violation Type<br/>using numbers]
    SelectViolation --> ValidateInput{Validate<br/>Inputs}
    ValidateInput -->|Invalid| ShowError[Show Error]
    ShowError --> MainMenu
    ValidateInput -->|Valid| SubmitTask[Submit Task Transaction]
    SubmitTask --> EmitEvent[Emit NewTaskCreated Event]
    EmitEvent --> MainMenu

    %% Register Operator Flow
    MainMenu -->|2| CheckRegistration{Already<br/>Registered?}
    CheckRegistration -->|Yes| MonitorMode[Enter Monitor Mode]
    CheckRegistration -->|No| RegisterOperator[Register as Operator]
    RegisterOperator --> MonitorMode

    %% Monitor Mode Flow
    MonitorMode --> WaitEvent{Wait for<br/>NewTaskCreated<br/>Event}
    WaitEvent -->|Event Received| DisplayTask[Display Task Details:<br/>URL, Type, Violation]
    DisplayTask --> PromptVote{Vote True/False}
    PromptVote -->|Input Vote| SignVote[Sign Vote with<br/>Operator Key]
    SignVote --> SubmitVote[Submit Vote to AVS]
    SubmitVote --> AVSVerify{AVS Signature<br/>Verification}
    AVSVerify -->|Invalid| RejectVote[Reject Vote]
    RejectVote --> WaitEvent
    AVSVerify -->|Valid| RecordVote[Record Vote in AVS]
    RecordVote --> WaitEvent

    %% Styling
    classDef start fill:#22c55e,stroke:#16a34a,color:white
    classDef process fill:#3b82f6,stroke:#2563eb,color:white
    classDef decision fill:#8b5cf6,stroke:#7c3aed,color:white
    classDef error fill:#ef4444,stroke:#dc2626,color:white
    classDef event fill:#f59e0b,stroke:#d97706,color:white

    class Start start
    class MainMenu,CheckRegistration,ValidateInput,AVSVerify,PromptVote,WaitEvent decision
    class ShowError,RejectVote error
    class EmitEvent event
    class CLIOpen,CreateTask,InputURL,SelectType,SelectViolation,RegisterOperator,MonitorMode,DisplayTask,SignVote,SubmitVote,RecordVote process
```

### Creating a New Task
When you choose to create a new task, you will be prompted for the following:

#### Content URL:
The IPFS URL of the content.
Content Type: The type of content being reported.
#### Content Type:
The Content type you are entering through the ipfs url.

#### Violation Type: 
The type of violation associated with the content.
This information will be sent as a transaction to the AVS contract on the Holesky testnet.

### Registering as an Operator
Operators can register themselves and enter monitor mode. Upon registration, they will receive events for new tasks created. The operator will then verify the content by inputting a true or false response, which is also sent as a transaction to the AVS contract.