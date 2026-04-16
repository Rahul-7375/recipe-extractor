from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os

from .scraper import scrape_recipe_url
from .llm_service import LLMService
from .database import get_db, init_db, Recipe
from .schemas import RecipeRequest, RecipeResponse

app = FastAPI(title="Recipe Extractor API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm_service = LLMService()

@app.on_event("startup")
def startup_event():
    init_db()

@app.post("/api/extract", response_model=RecipeResponse)
def extract_recipe(request: RecipeRequest, db: Session = Depends(get_db)):
    # Basic URL validation
    if not request.url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid URL format. Must start with http:// or https://")

    # Check if already in DB
    try:
        existing_recipe = db.query(Recipe).filter(Recipe.url == request.url).first()
        if existing_recipe:
            return existing_recipe
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database connection issue. Please try again later.")

    # Scrape
    try:
        html_text = scrape_recipe_url(request.url)
        if not html_text:
            raise HTTPException(status_code=400, detail="Could not scrape the provided URL. The site might be blocking access or the URL is invalid.")
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Scraping error: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during scraping: {str(e)}")

    # Extract with LLM
    try:
        recipe_data = llm_service.extract_recipe(html_text, request.url)
        if not recipe_data:
            raise HTTPException(status_code=500, detail="AI failed to extract structured data from the page content.")
    except Exception as e:
        print(f"LLM error: {e}")
        raise HTTPException(status_code=500, detail="AI processing failed. The page content might be too complex or unusual.")

    # Save to DB
    try:
        new_recipe = Recipe(
            url=request.url,
            **recipe_data
        )
        db.add(new_recipe)
        db.commit()
        db.refresh(new_recipe)
        return new_recipe
    except Exception as e:
        print(f"Database save error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save the extracted recipe to the database.")

@app.get("/api/recipes", response_model=List[RecipeResponse])
def get_recipes(db: Session = Depends(get_db)):
    return db.query(Recipe).order_by(Recipe.created_at.desc()).all()

@app.get("/api/recipes/{recipe_id}", response_model=RecipeResponse)
def get_recipe_detail(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
