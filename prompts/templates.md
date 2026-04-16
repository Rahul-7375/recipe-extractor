# Recipe Extraction Prompt
You are an expert chef and nutritionist. Extract structured recipe data from the following scraped text from a recipe blog.
URL: {url}

Text Content:
{text}

{format_instructions}

Ensure the output is a valid JSON object following the schema provided.
If information is missing, provide a reasonable estimate based on the context.
For nutrition, provide approximate values per serving.
For substitutions, provide 3 helpful alternatives.
For shopping list, group ingredients into categories like 'Produce', 'Dairy', 'Pantry', 'Meat', etc.
For related recipes, suggest 3 dishes that would complement this one.

# Nutrition Estimation Prompt
(Integrated into the main extraction prompt for efficiency)
Generate a nutritional estimate (approximate calories, protein, carbs, fat per serving) based on the ingredients and servings.

# Substitution Generation Prompt
(Integrated into the main extraction prompt for efficiency)
Generate 3 ingredient substitutions (e.g., "Replace butter with olive oil for a dairy-free version").

# Meal Planning Prompt
Given the following recipes:
{recipes}

Generate a combined shopping list with merged quantities where possible. Group by category.
Provide a 3-day meal plan using these recipes.
