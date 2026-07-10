import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily to avoid crashing if API key is missing
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Routes
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { type, payload } = req.body;
    const ai = getAiClient();

    let prompt = "";
    let responseSchema: any = undefined;

    if (type === "ad-copy") {
      const { channel, audience, offer, tone } = payload;
      prompt = `You are an expert digital marketing copywriter. Create 3 high-converting ad copies for ${channel} targeting ${audience} with the offer/deal: "${offer}". Use a ${tone} tone of voice.
      For each ad copy option, provide:
      1. A catchy headline or main hook
      2. High-converting body copy with scroll-stopping opening lines
      3. A clear Call to Action (CTA)
      4. Relevant hashtags and emoji suggestions where appropriate.
      Format the response as a structured JSON.`;
      
      responseSchema = {
        type: "OBJECT",
        properties: {
          ads: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                headline: { type: "STRING" },
                bodyCopy: { type: "STRING" },
                cta: { type: "STRING" },
                hashtags: { type: "ARRAY", items: { type: "STRING" } },
                rating: { type: "STRING", description: "Internal expert review or reasoning for this variation" }
              },
              required: ["headline", "bodyCopy", "cta", "hashtags"]
            }
          }
        },
        required: ["ads"]
      };
    } else if (type === "seo-meta") {
      const { productName, description, keywords } = payload;
      prompt = `You are a professional SEO Specialist. Optimize the following product/service:
      Product/Service Name: ${productName}
      Description: ${description}
      Target Keywords: ${keywords}
      
      Generate:
      1. An optimized Meta Title (maximum 60 characters, containing primary keyword, benefit-driven)
      2. An optimized Meta Description (maximum 160 characters, with a clear CTA, benefit, and keywords)
      3. A structured, comprehensive SEO Blog Post Outline (including H1, H2 sections, H3 details, and targeted keywords for each section) to rank for this product.
      Format the response as a structured JSON.`;

      responseSchema = {
        type: "OBJECT",
        properties: {
          metaTitle: { type: "STRING" },
          metaDescription: { type: "STRING" },
          blogOutline: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              introduction: { type: "STRING" },
              sections: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    heading: { type: "STRING" },
                    subpoints: { type: "ARRAY", items: { type: "STRING" } },
                    targetKeyword: { type: "STRING" }
                  },
                  required: ["heading", "subpoints"]
                }
              },
              conclusion: { type: "STRING" }
            },
            required: ["title", "sections"]
          }
        },
        required: ["metaTitle", "metaDescription", "blogOutline"]
      };
    } else if (type === "persona") {
      const { productName, industry, audienceDescription } = payload;
      prompt = `You are a Digital Marketing Strategist. Create a detailed Ideal Customer Profile (ICP) / Buyer Persona for the following:
      Product Name: ${productName}
      Industry: ${industry}
      General Audience: ${audienceDescription}
      
      Generate a rich, detailed persona with:
      1. Demographic profile (Name, Age, Occupation, Income Range, Location)
      2. Psychographic profile (Interests, Core Values, Motivations)
      3. Pain Points & Challenges (What is keeping them up at night related to this industry?)
      4. Goals & Aspirations (What do they want to achieve?)
      5. Preferred Marketing Channels (e.g., Instagram, SEO/Google, Email, LinkedIn) and why
      6. Marketing Message Angle (How to pitch to this persona)
      Format the response as structured JSON.`;

      responseSchema = {
        type: "OBJECT",
        properties: {
          personaName: { type: "STRING" },
          demographics: {
            type: "OBJECT",
            properties: {
              age: { type: "STRING" },
              occupation: { type: "STRING" },
              income: { type: "STRING" },
              location: { type: "STRING" },
              familyStatus: { type: "STRING" }
            },
            required: ["age", "occupation", "income", "location"]
          },
          psychographics: { type: "ARRAY", items: { type: "STRING" } },
          painPoints: { type: "ARRAY", items: { type: "STRING" } },
          goals: { type: "ARRAY", items: { type: "STRING" } },
          preferredChannels: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                channel: { type: "STRING" },
                reason: { type: "STRING" }
              },
              required: ["channel", "reason"]
            }
          },
          marketingAngle: { type: "STRING" }
        },
        required: ["personaName", "demographics", "psychographics", "painPoints", "goals", "preferredChannels", "marketingAngle"]
      };
    } else if (type === "assignment-review") {
      const { lessonTitle, assignmentResponse } = payload;
      prompt = `You are an expert Senior Digital Marketing Instructor and Mentor. Evaluate the following student assignment response for the lesson: "${lessonTitle}".
      
      Student Assignment Response:
      "${assignmentResponse}"
      
      Please evaluate the response and generate:
      1. An evaluation score (an integer out of 100, e.g., 80-100 for great work, 65-79 for acceptable work, under 65 if it is empty or off-topic)
      2. Comprehensive constructive feedback (what they did well, their analytical strength)
      3. Practical, detailed suggestions for improvement or next steps
      4. Approval status (boolean 'approved' - true if they made a reasonable, on-topic effort, false if it is extremely brief, off-topic, or completely empty)
      
      Format the response as a structured JSON.`;

      responseSchema = {
        type: "OBJECT",
        properties: {
          score: { type: "INTEGER" },
          approved: { type: "BOOLEAN" },
          feedback: { type: "STRING" },
          suggestions: { type: "STRING" }
        },
        required: ["score", "approved", "feedback", "suggestions"]
      };
    } else if (type === "capstone-review") {
      const { capstoneResponse } = payload;
      prompt = `You are an elite Digital Marketing Registrar and Industry Certifier. Evaluate the following comprehensive student Capstone Project campaign plan.
      
      Capstone Project Plan:
      "${capstoneResponse}"
      
      Provide a comprehensive, high-level professional evaluation:
      1. Certification score (an integer out of 100)
      2. Major strengths of their multi-channel strategy (acquisition, content, persona matching)
      3. Strategic suggestions to scale their campaign or fix leakage
      4. Certified status (boolean 'approved' - true if they made a substantial effort to plan a real campaign, false if empty or incomplete)
      
      Format the response as a structured JSON.`;

      responseSchema = {
        type: "OBJECT",
        properties: {
          score: { type: "INTEGER" },
          approved: { type: "BOOLEAN" },
          feedback: { type: "STRING" },
          suggestions: { type: "STRING" }
        },
        required: ["score", "approved", "feedback", "suggestions"]
      };
    } else if (type === "generate-quiz") {
      const { lessonTitle, lessonDescription, markdownContent } = payload;
      prompt = `You are an elite Digital Marketing Educator and Curriculum Designer.
      Generate 3 highly relevant, high-quality, practical multiple-choice quiz questions based on the following lesson details:
      Lesson Title: ${lessonTitle}
      Lesson Description: ${lessonDescription}
      Lesson Content (Context): ${markdownContent || "None provided"}

      For each question, provide:
      1. Clear, professional question text testing actual understanding of the lesson's concept.
      2. Exactly 4 logical multiple-choice options (do not include labels like A, B, C, D in the options themselves).
      3. The correctAnswer index (0, 1, 2, or 3) pointing to the correct choice in the options list.
      4. A brief, helpful explanation why that choice is correct and why other options are wrong or less optimal.

      Format the response as a structured JSON.`;

      responseSchema = {
        type: "OBJECT",
        properties: {
          questions: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                question: { type: "STRING" },
                options: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "Exactly 4 options"
                },
                correctAnswer: { type: "INTEGER", description: "Index (0, 1, 2, or 3) of the correct answer in the options array" },
                explanation: { type: "STRING" }
              },
              required: ["question", "options", "correctAnswer", "explanation"]
            }
          }
        },
        required: ["questions"]
      };
    } else {
      return res.status(400).json({ error: "Invalid type specified" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response content generated from Gemini API");
    }

    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Gemini Proxy Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate marketing assets" });
  }
});

// Export app for serverless platforms like Vercel
export default app;

// Serve frontend assets and start listening (bypass on Vercel as Vercel serves the frontend statically and routes /api to serverless functions)
if (!process.env.VERCEL) {
  async function startServer() {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }

  startServer();
}
