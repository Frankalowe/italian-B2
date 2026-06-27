const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Load local .env variables manually in development
const rootEnvPath = path.join(process.cwd(), '.env');
if (fs.existsSync(rootEnvPath)) {
  const content = fs.readFileSync(rootEnvPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  });
}

app.use(cors());
app.use(express.json());

// Resolve syllabus path pointing to server folder
const SYLLABUS_PATH = path.join(process.cwd(), 'server', 'syllabus.json');
const LESSONS_DIR = path.join(process.cwd(), 'server', 'lessons');

// Load Syllabus Data
app.get('/api/syllabus', (req, res) => {
  try {
    const data = fs.readFileSync(SYLLABUS_PATH, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Failed to read syllabus:', error);
    res.status(500).json({ error: 'Failed to read syllabus data.' });
  }
});

// Helper function to query Gemini API (via HTTP)
async function queryGemini(messages, jsonMode = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    throw new Error('Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  let systemText = '';
  const contents = [];

  messages.forEach(msg => {
    if (msg.role === 'system') {
      systemText += msg.content + '\n';
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
  });

  const payload = {
    contents: contents
  };

  if (systemText) {
    payload.systemInstruction = {
      parts: [{ text: systemText.trim() }]
    };
  }

  const generationConfig = {
    temperature: 0.3
  };

  if (jsonMode) {
    generationConfig.responseMimeType = "application/json";
  }

  payload.generationConfig = generationConfig;

  console.log(`[AI ROUTER] Routing request to Gemini API (jsonMode: ${jsonMode})`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
    return data.candidates[0].content.parts[0].text;
  }
  throw new Error('Gemini API returned an empty or invalid response.');
}

// Unified Router that query Gemini API directly (no local Ollama backup)
async function queryAI(messages, jsonMode = false) {
  return await queryGemini(messages, jsonMode);
}

// 1. Chat/Speaking Lounge Endpoint
app.post('/api/ollama/chat', async (req, res) => {
  const { messages } = req.body;
  
  const systemPrompt = {
    role: 'system',
    content: `You are an encouraging and professional Italian language tutor. The user is a beginner learning Italian up to B2 level. 
Respond primarily in Italian (matching the user's level, simple A1/A2 words for beginners, progressing to B1/B2 as appropriate).
Always provide a brief English translation or key vocabulary breakdown in brackets [] at the bottom of your message.
Keep your responses short, conversational, and ask a question at the end to prompt the student to practice speaking or writing.
If the student makes a grammatical error in their previous message, gently correct them at the start of your message before replying.`
  };

  const fullMessages = [systemPrompt, ...messages];

  try {
    const reply = await queryAI(fullMessages);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate chat reply.' });
  }
});

// 2. Writing Assessment Endpoint
app.post('/api/ollama/evaluate', async (req, res) => {
  const { text, prompt, level } = req.body;

  const systemMessage = {
    role: 'system',
    content: `You are an Italian CEFR language examiner. Analyze the user's Italian text response to the given prompt.
The student is targetting level ${level}.
Provide feedback strictly in JSON format. The JSON must match this schema:
{
  "cefrLevelReached": "A1",
  "overallFeedback": "Your encouraging summary in English",
  "corrections": [
    {
      "original": "original bad snippet",
      "corrected": "corrected snippet",
      "explanation": "Why this correction is needed in English"
    }
  ],
  "improvedVersion": "A polished, natural version of their entire input matching the target level"
}`
  };

  const userMessage = {
    role: 'user',
    content: `Writing Prompt: "${prompt}"\nStudent Input: "${text}"\nTarget Level: "${level}"`
  };

  try {
    const feedbackText = await queryAI([systemMessage, userMessage], true);
    res.json(JSON.parse(feedbackText));
  } catch (error) {
    console.error('Evaluation failed:', error);
    res.status(500).json({ error: 'Failed to generate writing evaluation.' });
  }
});

// 3. Readers Corner (Generate Reading Passages)
app.post('/api/ollama/generate-reading', async (req, res) => {
  const { level, topic } = req.body;

  const systemMessage = {
    role: 'system',
    content: `You are an Italian educator. Generate a custom reading passage for a student at CEFR level ${level} about the topic "${topic}".
Provide the output strictly in JSON format matching this schema:
{
  "title": "Italian Title of the passage",
  "passage": "The Italian reading passage (approx 100-150 words for A1-A2, 200-300 words for B1-B2)",
  "translation": "The English translation of the passage",
  "vocabulary": [
    { "word": "Italian word", "meaning": "English meaning" }
  ],
  "questions": [
    {
      "question": "A comprehension question in Italian about the passage",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0
    }
  ]
}`
  };

  const userMessage = {
    role: 'user',
    content: `Generate a reading story and comprehension quiz for level ${level} on topic: "${topic}".`
  };

  try {
    const storyText = await queryAI([systemMessage, userMessage], true);
    res.json(JSON.parse(storyText));
  } catch (error) {
    console.error('Reading passage generation failed:', error);
    res.status(500).json({ error: 'Failed to generate reading story.' });
  }
});

// 4. Get Cached Lesson Segment
app.get('/api/lessons/:unitId/:tabId', (req, res) => {
  const { unitId, tabId } = req.params;
  const cachePath = path.join(LESSONS_DIR, `${unitId}_${tabId}.md`);
  if (fs.existsSync(cachePath)) {
    try {
      const content = fs.readFileSync(cachePath, 'utf8');
      return res.json({ content, found: true });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to read cached lesson.' });
    }
  }
  res.status(404).json({ found: false, error: 'Lesson segment not cached.' });
});

// 5. Generate Lesson Segment (with local database file caching)
app.post('/api/ollama/generate-lesson', async (req, res) => {
  const { title, grammar, vocabulary, level, unitId, tabId } = req.body;

  if (!unitId || !tabId) {
    return res.status(400).json({ error: 'Missing unitId or tabId for database lookup.' });
  }

  const cachePath = path.join(LESSONS_DIR, `${unitId}_${tabId}.md`);

  // Check cache first
  if (fs.existsSync(cachePath)) {
    try {
      const cachedContent = fs.readFileSync(cachePath, 'utf8');
      return res.json({ content: cachedContent, cached: true });
    } catch (err) {
      console.error('Failed to read cached lesson:', err);
    }
  }

  // Select custom instruction set based on requested tab/subtopic
  let tabInstruction = '';
  if (tabId === 'grammar') {
    tabInstruction = `GENERATE A HIGHLY DETAILED, TEXTBOOK-STYLE GRAMMAR GUIDE.
- This guide must be extremely comprehensive, leaving no details out. Aim for a thorough, academic chapter.
- Provide a step-by-step grammatical breakdown explaining all underlying structures, rules, and exceptions.
- You MUST construct complete, explicit conjugation tables for all regular and irregular verbs associated with this unit.
- If this is Unit 1 (Alphabet & Pronunciation): list spelling names for all 21 letters plus the 5 foreign letters (J, K, W, X, Y), provide a comprehensive matrix contrasting hard vs soft C/G sounds, explain how H changes sounds, detail double consonants articulation, and explain penultimate stress rules.
- If it includes pronouns: list all pronoun forms in a structured layout.
- Include at least 8 varied example sentences in Italian, accompanied by literal and idiomatic English translations.
- Focus ONLY on grammar; do not include generic text list fillers.`;
  } else if (tabId === 'vocabulary') {
    tabInstruction = `GENERATE A COMPREHENSIVE VOCABULARY AND EXPRESSIONS SHEET.
- Compile a massive list of at least 30 to 40 target words, phrases, and idiomatic expressions.
- Group the vocabulary into logical, thematic matrices (e.g. Greetings, Numbers 1-20, Academic terms, etc. depending on the unit focus).
- For each vocabulary item, provide a Markdown table containing:
  1. Italian Word / Phrase
  2. English Meaning
  3. Phonetic Pronunciation Guide (spelled out for English speakers)
  4. Contextual Example Sentence in Italian
  5. English Translation of the example sentence.
- Focus strictly on vocabulary enrichment.`;
  } else if (tabId === 'dialogue') {
    tabInstruction = `GENERATE A REALISTIC PRACTICE DIALOGUE AND CONVERSATIONAL SCENARIO.
- Write an extensive, engaging Italian dialogue (at least 16-20 turns of speech) representing natural native speed.
- The dialogue must heavily feature the grammar patterns and vocabulary keywords of this unit.
- Provide a complete, side-by-side or block-by-block English translation.
- Extract at least 4 key conversational structures, common idioms, or colloquial expressions from the script, explaining their cultural context and syntax rules in detail.`;
  } else if (tabId === 'exercises') {
    tabInstruction = `GENERATE AN INTENSIVE SELF-ASSESSMENT WORKSHEET.
- Create 5 highly detailed fill-in-the-blank practice sentences in Italian testing the grammar target.
- IMPORTANT: Use a clear blank line '_______' for a FULL missing word (e.g. 'Il mio nome _______ Maria [is]'). 
- CRITICAL: Do NOT do fill-in-the-letters exercises where random individual letters are replaced with underscores (e.g., do NOT write 'n_m_' or 's_n_'). Always test full word conjugations or vocabulary selections.
- Provide a brief translation tip or context hint in brackets for each sentence.
- Create 5 sentence-translation exercises (English to Italian).
- Create 3 situational writing prompts (e.g. 'You are at a cafe, write a message ordering...').
- Create a 5-question multiple choice grammar quiz.
- Put the complete, step-by-step correct answer keys and grammatical explanations at the very bottom in a bracketed [ANSWERS] section so the student can verify.`;
  }

  const systemMessage = {
    role: 'system',
    content: `You are an expert Italian language professor compiling an exhaustive, university-level, masterclass textbook chapter for an English speaker learning Italian from absolute zero to B2 level.
You are generating custom content for Level: ${level}, Unit: "${title}", Subtopic Section: "${tabId.toUpperCase()}".
${tabInstruction}
Deliver only the pure Markdown textbook content. Do NOT wrap it in backticks, markdown code blocks, or include any greeting/outro conversational remarks.`
  };

  const userMessage = {
    role: 'user',
    content: `Compile exhaustive, detailed subtopic study notes for segment "${tabId}" of unit: "${title}".`
  };

  try {
    const lessonContent = await queryAI([systemMessage, userMessage]);
    
    // Save to local file database (wrapped gracefully in case of read-only/serverless filesystems)
    try {
      if (!fs.existsSync(LESSONS_DIR)) {
        fs.mkdirSync(LESSONS_DIR, { recursive: true });
      }
      fs.writeFileSync(cachePath, lessonContent, 'utf8');
      console.log(`Saved new lesson segment ${unitId}_${tabId} to local database.`);
    } catch (writeErr) {
      console.warn('Could not write to local cache directory (running in read-only environment):', writeErr.message);
    }
    
    res.json({ content: lessonContent, cached: false });
  } catch (error) {
    console.error('Lesson generation failed:', error);
    res.status(500).json({ error: 'Failed to generate study guide segment.' });
  }
});

// 6. Update Saved Lesson Segment (Save custom edits to database)
app.post('/api/lessons/:unitId/:tabId/update', (req, res) => {
  const { unitId, tabId } = req.params;
  const { content } = req.body;
  const cachePath = path.join(LESSONS_DIR, `${unitId}_${tabId}.md`);

  try {
    fs.writeFileSync(cachePath, content, 'utf8');
    console.log(`Updated lesson segment ${unitId}_${tabId} in local database.`);
    res.json({ success: true, message: 'Lesson segment updated successfully.' });
  } catch (err) {
    console.error('Failed to update lesson:', err);
    res.status(500).json({ error: 'Failed to save lesson changes.' });
  }
});

// 7. Delete Saved Lesson Segment (Clear from database)
app.post('/api/lessons/:unitId/:tabId/delete', (req, res) => {
  const { unitId, tabId } = req.params;
  const cachePath = path.join(LESSONS_DIR, `${unitId}_${tabId}.md`);

  if (fs.existsSync(cachePath)) {
    try {
      fs.unlinkSync(cachePath);
      console.log(`Deleted lesson segment ${unitId}_${tabId} from local database.`);
      return res.json({ success: true, message: 'Lesson segment deleted successfully.' });
    } catch (err) {
      console.error('Failed to delete lesson:', err);
      return res.status(500).json({ error: 'Failed to delete lesson.' });
    }
  }
  res.status(404).json({ error: 'Lesson segment not found.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
