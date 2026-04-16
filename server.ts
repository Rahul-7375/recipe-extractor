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
const saveRecipesToDB = (recipes: any[]) => fs.writeFileSync(DB_FILE, JSON.stringify(recipes, null, 2));

// Gemini Setup
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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
      type: Type.OBJECT,
      additionalProperties: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
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
    const existing = db.find((r: any) => r.url === url);
    if (existing) return res.json(existing);

    // Scrape
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(response.data);
    $('script, style').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 30000);

    // LLM Extract
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Extract structured recipe data from this text: ${text}. URL: ${url}.
      
      CRITICAL: Assign a difficulty level (easy, medium, hard) by carefully evaluating:
      - Number of steps: Easy (<5), Medium (5-10), Hard (>10).
      - Ingredient complexity: Common pantry items vs. specialized/hard-to-find ingredients.
      - Specialized techniques: Basic boiling/frying vs. techniques like sous-vide, tempering chocolate, or complex pastry work.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema
      }
    });

    const recipeData = JSON.parse(result.text);
    const newRecipe = {
      id: Date.now(),
      url,
      ...recipeData,
      created_at: new Date().toISOString()
    };

    db.push(newRecipe);
    saveRecipesToDB(db);

    res.json(newRecipe);
  } catch (error: any) {
    console.error('Extraction error:', error);
    
    let status = 500;
    let message = 'Failed to extract recipe';
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      status = 400;
      message = 'Network error: Could not reach the provided URL. Please check the address.';
    } else if (error.response) {
      status = error.response.status;
      message = `Scraping error: The website returned an error (${status}). Some sites block automated access.`;
    } else if (error.message && error.message.includes('JSON')) {
      message = 'AI Processing error: The extracted data was not in the correct format. This can happen with very complex pages.';
    }

    res.status(status).json({ error: message, details: error.message });
  }
});

app.get('/api/recipes', (req, res) => {
  res.json(getRecipesFromDB());
});

app.get('/api/recipes/:id', (req, res) => {
  const db = getRecipesFromDB();
  const recipe = db.find((r: any) => r.id === parseInt(req.params.id));
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
