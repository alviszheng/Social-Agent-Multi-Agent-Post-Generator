import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to load config
  const loadConfig = (file: string) => {
    return yaml.load(fs.readFileSync(path.join(process.cwd(), file), "utf8"));
  };

  // API Route: Get Configs for UI
  app.get("/api/config", (req, res) => {
    try {
      const agents = loadConfig("agents.yaml");
      const tools = loadConfig("tools.yaml");
      const workflow = loadConfig("workflow.yaml");
      res.json({ agents, tools, workflow });
    } catch (e) {
      res.status(500).json({ error: "Failed to load configs" });
    }
  });

  // API Route: Get RFC content
  app.get("/api/rfc", (req, res) => {
    try {
      const content = fs.readFileSync(path.join(process.cwd(), "RFC.md"), "utf8");
      res.send(content);
    } catch (e) {
      res.status(500).json({ error: "Failed to load RFC" });
    }
  });

  // API Route: Run Agent Workflow
  app.post("/api/generate", async (req, res) => {
    const { topic, apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: "Missing API Key" });
    if (!topic) return res.status(400).json({ error: "Missing Topic" });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const agentsConfig: any = loadConfig("agents.yaml");
    const workflow: any = loadConfig("workflow.yaml");
    const outputs: Record<string, any> = { topic };
    const logs: any[] = [];

    try {
        for (const step of workflow.workflow.steps) {
        const agentCfg = agentsConfig.agents.find((a: any) => a.name === step.agent);
        if (!agentCfg) throw new Error(`Agent ${step.agent} not found`);

        const skillPath = path.join(process.cwd(), agentCfg.skill_path, "SKILL.md");
        const systemPrompt = fs.readFileSync(skillPath, "utf8");

        const model = genAI.getGenerativeModel({ 
          model: agentCfg.model || "gemini-1.5-flash", 
          generationConfig: {
            temperature: agentCfg.temperature || 0.7,
          }
        });

        // Prepare context from previous outputs
        let context = "";
        if (step.input.includes("{{topic}}")) context += `Topic: ${outputs.topic}\n`;
        if (step.input.includes("{{content_plan}}")) context += `Plan: ${JSON.stringify(outputs.content_plan)}\n`;
        if (step.input.includes("{{research_data}}")) context += `Research: ${JSON.stringify(outputs.research_data)}\n`;
        if (step.input.includes("{{draft_posts}}")) context += `Drafts: ${JSON.stringify(outputs.draft_posts)}\n`;
        if (step.input.includes("{{refined_posts}}")) context += `Refined: ${JSON.stringify(outputs.refined_posts)}\n`;

        logs.push({ 
          step: step.step, 
          agent: step.agent, 
          status: "started", 
          timestamp: new Date().toISOString() 
        });

        // Tool Simulation (simple for demo)
        const toolCalls: any[] = [];
        if (agentCfg.tools && agentCfg.tools.length > 0) {
            toolCalls.push({ tool: agentCfg.tools[0], query: topic });
        }

        const prompt = `Objective: ${agentCfg.objective}\n\nContext:\n${context}\n\nTask: ${step.description}`;
        
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: systemPrompt
        });

        const responseText = result.response.text();
        outputs[step.output_var] = responseText;

        logs.push({ 
          step: step.step, 
          agent: step.agent, 
          status: "completed", 
          output: responseText,
          toolCalls,
          timestamp: new Date().toISOString() 
        });
      }

      res.json({ success: true, outputs, logs });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // API Route: Get Evals
  app.get("/api/evals", (req, res) => {
    try {
      const skillsDir = path.join(process.cwd(), ".agents/skills");
      const agents = fs.readdirSync(skillsDir);
      const allEvals = agents.map(agent => {
        const evalPath = path.join(skillsDir, agent, "evals.yaml");
        if (fs.existsSync(evalPath)) {
          return { agent, evals: yaml.load(fs.readFileSync(evalPath, "utf8")) };
        }
        return null;
      }).filter(Boolean);
      res.json(allEvals);
    } catch (e) {
      res.status(500).json({ error: "Failed to load evals" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
