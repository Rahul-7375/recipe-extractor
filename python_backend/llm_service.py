import os
import json
from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List

class Ingredient(BaseModel):
    quantity: str = Field(description="Quantity of the ingredient")
    unit: str = Field(description="Unit of measurement")
    item: str = Field(description="Name of the ingredient")

class NutritionEstimate(BaseModel):
    calories: int = Field(description="Approximate calories per serving")
    protein: str = Field(description="Protein content per serving")
    carbs: str = Field(description="Carbohydrate content per serving")
    fat: str = Field(description="Fat content per serving")

class RecipeData(BaseModel):
    title: str = Field(description="Recipe title")
    cuisine: str = Field(description="Cuisine type")
    prep_time: str = Field(description="Preparation time")
    cook_time: str = Field(description="Cooking time")
    total_time: str = Field(description="Total time")
    servings: int = Field(description="Number of servings")
    difficulty: str = Field(description="Difficulty level (easy, medium, hard)")
    ingredients: List[Ingredient] = Field(description="List of ingredients")
    instructions: List[str] = Field(description="Step-by-step instructions")
    nutrition_estimate: NutritionEstimate = Field(description="Nutritional estimate")
    substitutions: List[str] = Field(description="3 ingredient substitutions")
    shopping_list: Dict[str, List[str]] = Field(description="Shopping list grouped by category")
    related_recipes: List[str] = Field(description="3 related recipes that pair well")

class LLMService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        self.llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
        self.parser = PydanticOutputParser(pydantic_object=RecipeData)

    def extract_recipe(self, html_text: str, url: str) -> Dict[str, Any]:
        prompt_template = """
        You are an expert chef and nutritionist. Extract structured recipe data from the following scraped text from a recipe blog.
        URL: {url}
        
        Text Content:
        {text}
        
        {format_instructions}
        
        Ensure the output is a valid JSON object following the schema provided.
        
        CRITICAL: Assign a difficulty level (easy, medium, hard) by carefully evaluating:
        - Number of steps: Easy (<5), Medium (5-10), Hard (>10).
        - Ingredient complexity: Common pantry items vs. specialized/hard-to-find ingredients.
        - Specialized techniques: Basic boiling/frying vs. techniques like sous-vide, tempering chocolate, or complex pastry work.
        
        If information is missing, provide a reasonable estimate based on the context.
        For nutrition, provide approximate values per serving.
        For substitutions, provide 3 helpful alternatives.
        For shopping list, group ingredients into categories like 'Produce', 'Dairy', 'Pantry', 'Meat', etc.
        For related recipes, suggest 3 dishes that would complement this one.
        """
        
        prompt = PromptTemplate(
            template=prompt_template,
            input_variables=["text", "url"],
            partial_variables={"format_instructions": self.parser.get_format_instructions()}
        )
        
        # Truncate text if it's too long for the model (though Gemini 1.5 has a huge window)
        truncated_text = html_text[:30000]
        
        chain = prompt | self.llm | self.parser
        
        try:
            result = chain.invoke({{"text": truncated_text, "url": url}})
            return result.dict()
        except Exception as e:
            print(f"Error in LLM processing: {e}")
            return {{}}
