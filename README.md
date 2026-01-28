# TinyFish - Logistics Intelligence Sentry
Live Demo: [https://inventory-agent-three.vercel.app/](https://inventory-agent-three.vercel.app/)

A comprehensive logistics intelligence platform that helps supply chain teams track port congestion, carrier advisories, and operational risks across multiple sources simultaneously. Uses the **Discovery → Scouting → Synthesis** pipeline pattern with parallel Mino browser agents to provide real-time, source-backed operational signals.


## Demo
<video src="./20260128-0324-37.5637592.mp4" controls width="100%"></video>

## How Mino API is Used
The Mino API powers the core execution layer. The orchestrator deploys **multiple Mino Agents** to navigate the live DOM of target logistics sites, bypassing static API limitations. These agents extract "Deep Metrics" (wait times, vessel counts, specific alerts) and return structured operational signals.

## Intelligence Lifecycle
The following sequence diagram illustrates the end-to-end flow of a risk assessment, from discovery to synthesis.

```mermaid
sequenceDiagram
    participant User
    participant API as Orchestrator (API)
    participant KB as Knowledge Base
    participant Mino as Mino Agents
    participant Web as Live Logistics Web
    participant Logic as Risk Engine

    User->>API: POST /risk-assessment (Context)
    API->>KB: Resolve Target URLs
    Note right of API: Discovery mode triggered if no matches
    
    API->>Mino: Spawn Parallel Swarm (URL + Mission)
    
    par Agent Orchestration
        Mino->>Web: Navigate & Analyze DOM
        Web-->>Mino: HTML Content
        Mino->>Mino: Extract Metrics & Quotes
    end
    
    Mino-->>API: Return Structured Signals (JSON)
    API->>Logic: Synthesize Findings
    Logic->>Logic: Apply Decision Matrix
    Logic-->>API: Consolidated Risk Profile
    API-->>User: Assessment Dashboard Update
```

## Risk Decision Logic
The system normalizes unstructured signals into a coherent risk level based on the following state logic.

```mermaid
stateDiagram-v2
    [*] --> Scanning
    
    Scanning --> Normal: No Negative Signals Found
    Scanning --> SignalsDetected: Metrics/Quotes Extracted
    
    SignalsDetected --> LowRisk: Minor Congestion (wait < 2 days)
    SignalsDetected --> MediumRisk: Moderate Congestion (wait 2-4 days)
    SignalsDetected --> HighRisk: Strike / Force Majeure / Severe Wait (> 4 days)
    
    LowRisk --> Monitoring: "Continue monitoring"
    MediumRisk --> AlertSubscriber: "Anticipate berthing delay"
    HighRisk --> CrisisAction: "Divert cargo immediately"
    
    Normal --> [*]
    Monitoring --> [*]
    AlertSubscriber --> [*]
    CrisisAction --> [*]
```

## Code Snippet
```javascript
// Example: Requesting a Risk Assessment in the Logistics Sentry
const response = await fetch("/api/logistics/risk-assessment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    origin_port: "Port of Los Angeles",
    carrier: "Maersk",
    mode: "Sea Freight"
  }),
});

const data = await response.json();
// Returns a structured Risk Profile with confidence scores and root causes
```

## How to Run
### Prerequisites
- Node.js 18+
- Mino API key (get from [mino.ai](https://mino.ai))

### Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/manasmathur/Logistics-Sentry
   cd Logistics-Sentry
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   Create a `.env.local` file with:
   ```bash
   MINO_API_KEY=xxx
   ```
4. **Run development server**:
   ```bash
   npm run dev
   ```

## Architecture Diagram
```mermaid
graph TD
    UI[USER INTERFACE<br/>Next.js 14 + Framer Motion]
    API[Risk Orchestrator<br/>api/logistics/risk-assessment]
    
    Mino[MINO BROWSER AGENTS<br/>Execution Layer]
    Web[LIVE PUBLIC WEB<br/>Ports / Carriers / Alerts]
    Logic[RISK ENGINE<br/>Synthesis & Decisioning]
    
    UI -->|Route Context| API
    API -->|1. Discovery| API
    API -->|2. Parallel Swarm| Mino
    Mino -->|3. Scrape & Reason| Web
    Web -->|Unstructured Data| Mino
    Mino -->|Structured Signals| Logic
    Logic -->|JSON Risk Profile| API
    API -->|4. Assessment| UI
```
