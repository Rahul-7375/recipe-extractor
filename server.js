import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Simple JSON Database for Preview
const DB_FILE = path.join(process.cwd(), 'recipes_db.json');
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

const getRecipesFromDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
const saveRecipesToDB = (recipes) => fs.writeFileSync(DB_FILE, JSON.stringify(recipes, null, 2));

// Gemini Setup
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY || '');

const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    cuisine: { type: Type.STRING },
    prep_time: { type: Type.STRING },
    cook_time: { type: Type.STRING },
    total_time: { type: Type.STRING },
    servings: { type: Type.NUMBER },
    difficulty: { type: Type.STRING },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          quantity: { type: Type.STRING },
          unit: { type: Type.STRING },
          item: { type: Type.STRING }
        },
        required: ["quantity", "unit", "item"]
      }
    },
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    nutrition_estimate: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER },
        protein: { type: Type.STRING },
        carbs: { type: Type.STRING },
        fat: { type: Type.STRING }
      },
      required: ["calories", "protein", "carbs", "fat"]
    },
    substitutions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    shopping_list: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["category", "items"]
      }
    },
    related_recipes: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ["title", "cuisine", "prep_time", "cook_time", "total_time", "servings", "difficulty", "ingredients", "instructions", "nutrition_estimate", "substitutions", "shopping_list", "related_recipes"]
};

// API Routes
app.post('/api/extract', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    // Check cache
    const db = getRecipesFromDB();
    const existing = db.find((r) => r.url === url);
    if (existing) return res.json(existing);

    // Scrape
    const response = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Cache-Control': 'no-cache',

        'Pragma': 'no-cache'
      }
    });
    const $ = cheerio.load(response.data);
    const text = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 30000);
    console.log(`Scraped ${text.length} characters from ${url}`);

    // LLM Extract
    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema
      }
    });

    const prompt = `Extract structured recipe data from this text: ${text}. URL: ${url}.
    
    CRITICAL: Assign a difficulty level (easy, medium, hard) by carefully evaluating:
    - Number of steps: Easy (<5), Medium (5-10), Hard (>10).
    - Ingredient complexity: Common pantry items vs. specialized/hard-to-find ingredients.
    - Specialized techniques: Basic boiling/frying vs. techniques like sous-vide, tempering chocolate, or complex pastry work.`;

    const result = await model.generateContent(prompt);
    const recipeData = JSON.parse(result.response.text());

    const newRecipe = {
      id: Date.now(),
      url,
      ...recipeData,
      created_at: new Date().toISOString()
    };

    db.push(newRecipe);
    saveRecipesToDB(db);

    res.json(newRecipe);
  } catch (error) {
    console.error('Extraction error:', error);
    
    let status = 500;
    let message = 'Failed to extract recipe';
    let details = error.message;
    
    // Check if it's an Axios error (Scraping)
    if (error.isAxiosError) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        status = 400;
        message = 'Network error: Could not reach the provided URL.';
      } else if (error.response) {
        status = error.response.status;
        message = `Scraping error: The website returned an error (${status}). Some sites (like AllRecipes) block automated access. Try one of the sites I suggested!`;
      }
    } 
    // Check if it's a Gemini/GoogleGenAI error
    else if (error.message && error.message.includes('API_KEY')) {
      status = 401;
      message = 'AI Configuration Error: Invalid Gemini API Key. Please check your .env file.';
    }
    else if (error.message && error.message.includes('JSON')) {
      status = 500;
      message = 'Data processing error: The AI could not format the recipe correctly.';
    }

    res.status(status).json({ error: message, details: details });
  }
});

app.get('/api/recipes', (req, res) => {
  res.json(getRecipesFromDB());
});

app.get('/api/recipes/:id', (req, res) => {
  const db = getRecipesFromDB();
  const recipe = db.find((r) => r.id === parseInt(req.params.id));
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
  res.json(recipe);
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
