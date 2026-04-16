# Recipe Extractor & Meal Planner

A full-stack application that extracts structured recipe data from blog URLs using Gemini AI and provides meal planning tools.

## Tech Stack

- **Frontend:** React, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend (Live Preview):** Node.js, Express, Cheerio (Scraping), Gemini SDK
- **Backend (Assignment Submission):** Python, FastAPI, BeautifulSoup, LangChain, SQLAlchemy
- **Database:** PostgreSQL (Assignment) / SQLite (Preview)
- **AI:** Google Gemini 1.5 Flash

## Project Structure

- `/src`: React frontend source code
- `/server.ts`: Node.js backend for the live preview
- `/python_backend`: Complete Python backend implementation as requested
- `/prompts`: LangChain prompt templates
- `/sample_data`: Example recipe URLs and JSON outputs

## Setup Instructions (Python Backend)

1. Navigate to `python_backend/`
2. Install dependencies:
   ```bash
   pip install fastapi uvicorn beautifulsoup4 langchain-google-genai sqlalchemy psycopg2-binary pydantic requests
   ```
3. Set your Gemini API Key:
   ```bash
   export GEMINI_API_KEY="your_api_key"
   ```
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## API Endpoints

- `POST /api/extract`: Accepts `{ "url": "..." }` and returns structured recipe JSON.
- `GET /api/recipes`: Returns a list of all saved recipes.
- `GET /api/recipes/{id}`: Returns detailed data for a specific recipe.

## Testing

You can test with these URLs:
- https://www.allrecipes.com/recipe/23891/grilled-cheese-sandwich/
- https://www.simplyrecipes.com/recipes/classic_guacamole/
- https://www.foodnetwork.com/recipes/alton-brown/the-chewy-recipe-1909072
