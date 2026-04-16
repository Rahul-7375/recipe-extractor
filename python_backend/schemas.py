from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class RecipeRequest(BaseModel):
    url: str

class IngredientSchema(BaseModel):
    quantity: str
    unit: str
    item: str

class NutritionSchema(BaseModel):
    calories: int
    protein: str
    carbs: str
    fat: str

class RecipeResponse(BaseModel):
    id: int
    url: str
    title: str
    cuisine: str
    prep_time: str
    cook_time: str
    total_time: str
    servings: int
    difficulty: str
    ingredients: List[IngredientSchema]
    instructions: List[str]
    nutrition_estimate: NutritionSchema
    substitutions: List[str]
    shopping_list: Dict[str, List[str]]
    related_recipes: List[str]
    created_at: datetime

    class Config:
        from_attributes = True
