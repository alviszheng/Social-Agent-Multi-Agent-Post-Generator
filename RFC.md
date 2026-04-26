# RFC: Multi-Agent Social Media Post Generator (MAS-PG)

## 1. Problem Statement
Content creators struggle to maintain consistency across multiple social platforms while ensuring each post is grounded in research, properly edited, and compliant with safety or brand guidelines. Managing this manually for every topic is time-consuming.

## 2. Proposed Architecture
We implement a **Multi-Agent Orchestration** system where specialized agents handle distinct stages of the content lifecycle.

### 2.1 Agent Flow Diagram (ASCII)
```
[User Input: Topic]
      |
      V
+-------------------+      (Tools: Search, Trend Analysis)
|  Planner Agent    | <---/
+---------+---------+
          | (Content Angles)
          V
+-------------------+      (Tools: Browse, Keyword Research)
|  Research Agent   | <---/
+---------+---------+
          | (Stats, Keywords, Insights)
          V
+-------------------+
| Content Generator |
+---------+---------+
          | (Platform-Specific Drafts: X, LI, IG)
          V
+-------------------+
|   Editor Agent    |
+---------+---------+
          | (Refined Copy)
          V
+-------------------+
| Compliance Agent  |
+---------+---------+
          | (Approved Content)
          V
[Final Output Interface]
```

## 3. Technology Stack
- **Framework**: React + Vite (Frontend), Express (Backend Orchestrator).
- **AI Models**: 
  - `gemini-3.1-pro-preview` (Logic heavy: Planning, Research)
  - `gemini-3-flash-preview` (Throughput heavy: Generation, Editing, QA)
- **Configuration**: YAML-based definitions for agents, tools, and workflows to ensure human readability and non-code configurability.
- **Observability**: OpenTelemetry (OTEL) for tracing agent events and evaluating performance.

## 4. Components
- **Skills**: Portable markdown files containing the "persona" and system instructions for each agent.
- **Tools**: Abstracted capabilities (simulated search, browser) that agents can invoke.
- **Evaluations**: Automated test cases to ensure agent outputs meet quality thresholds.

## 5. Usage Guide
1. **Enter Topic**: Provide a broad topic in the input field.
2. **Review Steps**: Watch the dashboard as each agent completes its task. 
3. **Verify Compliance**: Ensure the final check passes.
4. **Copy & Post**: Take the approved content to your social platforms.

---
*Created by Google AI Studio Build Agent*
