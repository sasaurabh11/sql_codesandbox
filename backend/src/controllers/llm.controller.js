import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

export const fixSQL = async (req, res) => {
  try {
    const { sql } = req.body;
    const prompt = `Fix and optimize this SQL. Return ONLY corrected SQL with no explanations:\n\n${sql}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    text = text.replace(/```sql/gi, "").replace(/```/g, "");

    text = text.trim();

    if (!text.endsWith(";")) text += ";";

    res.json({ ok: true, fixed: text });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const explainSQL = async (req, res) => {
  try {
    const { sql } = req.body;
    const prompt = `Explain step-by-step what this SQL query does:\n${sql}`;
    const result = await model.generateContent(prompt);
    res.json({ ok: true, explanation: result.response.text() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const completeSQL = async (req, res) => {
  try {
    const { prefix } = req.body;
    const prompt = `Suggest the next part of this SQL:\n${prefix}`;
    const result = await model.generateContent(prompt);
    res.json({ ok: true, suggestion: result.response.text() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
