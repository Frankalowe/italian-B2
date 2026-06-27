const fs = require('fs');
const path = require('path');

const syllabusPath = path.join(__dirname, 'syllabus.json');
const lessonsDir = path.join(__dirname, 'lessons');

if (!fs.existsSync(lessonsDir)) {
  fs.mkdirSync(lessonsDir, { recursive: true });
}

// Load environment variables manually to avoid adding extra dependencies
const envPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');
function loadEnv(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
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
}
loadEnv(rootEnvPath);
loadEnv(envPath);

// Helper to query Gemini API
async function queryGemini(messages) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    throw new Error('Gemini API key is not configured. Please add GEMINI_API_KEY to your environment/environment variables.');
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

  payload.generationConfig = {
    temperature: 0.3
  };

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

// Unified Router
async function queryAI(messages) {
  console.log('      [API ROUTE] Querying Gemini...');
  return await queryGemini(messages);
}

// Generate prompt details based on segment
function getTabInstruction(tabId, title, grammar, vocabulary) {
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
  return tabInstruction;
}

async function precompile() {
  if (!fs.existsSync(syllabusPath)) {
    console.error('Syllabus file not found! Please make sure server/syllabus.json exists.');
    process.exit(1);
  }

  const syllabus = JSON.parse(fs.readFileSync(syllabusPath, 'utf8'));
  const levels = Object.keys(syllabus);
  
  console.log(`==================================================`);
  console.log(`🇮🇹 Starting Italian Syllabus Precompiler (Llama 3.1)`);
  console.log(`Targeting levels: ${levels.join(', ')}`);
  console.log(`==================================================\n`);

  const tabs = ['grammar', 'vocabulary', 'dialogue', 'exercises'];
  let processed = 0;
  let skipped = 0;
  let compiled = 0;

  for (const level of levels) {
    const units = syllabus[level].units;
    console.log(`--- Processing Level ${level} (${units.length} Units) ---`);
    
    for (const unit of units) {
      console.log(`  Unit: "${unit.title}"`);
      
      for (const tabId of tabs) {
        const cachePath = path.join(lessonsDir, `${unit.id}_${tabId}.md`);
        processed++;

        if (fs.existsSync(cachePath)) {
          console.log(`    [SKIPPED] Segment "${tabId}" is already cached.`);
          skipped++;
          continue;
        }

        console.log(`    [COMPILING] Generating segment "${tabId}"...`);
        
        const tabInstruction = getTabInstruction(tabId, unit.title, unit.grammar, unit.vocabulary);
        
        const systemMessage = {
          role: 'system',
          content: `You are an expert Italian language professor compiling an exhaustive, university-level, masterclass textbook chapter for an English speaker learning Italian from absolute zero to B2 level.
The target level is CEFR ${level}.
Focus on Unit: "${unit.title}"
Grammar Concept: "${unit.grammar}"
Vocabulary Concept: "${unit.vocabulary}"

${tabInstruction}

Ensure you write in clean Markdown using headers, lists, and tables where appropriate. Make the guide as extensive, thorough, and detailed as possible.`
        };

        const userMessage = {
          role: 'user',
          content: `Compile subtopic study notes for segment "${tabId}" of unit: "${unit.title}".`
        };

        try {
          const content = await queryAI([systemMessage, userMessage]);
          fs.writeFileSync(cachePath, content, 'utf8');
          console.log(`    [SUCCESS] Saved to disk.`);
          compiled++;
          
          // Throttled delay to respect Gemini Free Tier rate limits (15 Requests Per Minute)
          console.log(`    [RATE LIMIT] Sleeping for 4.5 seconds to prevent Rate Limit (RPM) triggers...`);
          await new Promise((resolve) => setTimeout(resolve, 4500));
        } catch (err) {
          console.error(`    [ERROR] Failed to compile "${tabId}" segment: ${err.message}`);
          console.log(`    Retrying in 10 seconds (respecting rate limits)...`);
          await new Promise((resolve) => setTimeout(resolve, 10000));
          // Retry once
          try {
            const content = await queryAI([systemMessage, userMessage]);
            fs.writeFileSync(cachePath, content, 'utf8');
            console.log(`    [SUCCESS] Saved to disk (retry).`);
            compiled++;
            await new Promise((resolve) => setTimeout(resolve, 4500));
          } catch (retryErr) {
            console.error(`    [FATAL] Retry failed: ${retryErr.message}`);
          }
        }
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`Precompilation Completed!`);
  console.log(`Total segments processed: ${processed}`);
  console.log(`Total cached (skipped): ${skipped}`);
  console.log(`Total newly compiled: ${compiled}`);
  console.log(`==================================================`);
}

precompile();
