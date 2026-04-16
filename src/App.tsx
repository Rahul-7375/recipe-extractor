/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  History, 
  Loader2, 
  ChefHat, 
  Clock, 
  Users, 
  BarChart3, 
  Utensils, 
  ShoppingBasket, 
  ArrowRight,
  ExternalLink,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface Ingredient {
  quantity: string;
  unit: string;
  item: string;
}

interface NutritionEstimate {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

interface Recipe {
  id: number;
  url: string;
  title: string;
  cuisine: string;
  prep_time: string;
  cook_time: string;
  total_time: string;
  servings: number;
  difficulty: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition_estimate: NutritionEstimate;
  substitutions: string[];
  shopping_list: Record<string, string[]>;
  related_recipes: string[];
  created_at: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'extract' | 'history' | 'planner'>('extract');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [history, setHistory] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [plannerRecipes, setPlannerRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/recipes');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    if (!url.startsWith('http')) {
      setError('Invalid URL format. Please include http:// or https://');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/extract', { url });
      setCurrentRecipe(res.data);
      fetchHistory();
    } catch (err: any) {
      console.error('Extraction failed', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to extract recipe. Please check the URL and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const addToPlanner = (recipe: Recipe) => {
    if (!plannerRecipes.find(r => r.id === recipe.id)) {
      setPlannerRecipes([...plannerRecipes, recipe]);
    }
  };

  const removeFromPlanner = (id: number) => {
    setPlannerRecipes(plannerRecipes.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans border-[8px] border-ink">
      <div className="magazine-grid">
        {/* Header */}
        <header className="col-span-full px-10 py-5 border-b-2 border-ink flex justify-between items-baseline bg-paper">
          <div className="font-serif text-3xl font-black tracking-tighter uppercase">THE DIGITAL PANTRY</div>
          <div className="flex gap-8 font-bold text-[13px] uppercase tracking-wider">
            <button 
              onClick={() => setActiveTab('extract')}
              className={cn("pb-1 border-b-2 transition-all", activeTab === 'extract' ? "border-accent text-accent" : "border-transparent text-ink/60")}
            >
              Recipe Extractor
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={cn("pb-1 border-b-2 transition-all", activeTab === 'history' ? "border-accent text-accent" : "border-transparent text-ink/60")}
            >
              Saved Archive
            </button>
            <button 
              onClick={() => setActiveTab('planner')}
              className={cn("pb-1 border-b-2 transition-all", activeTab === 'planner' ? "border-accent text-accent" : "border-transparent text-ink/60")}
            >
              Meal Planner
            </button>
          </div>
        </header>

        {/* URL Bar */}
        <div className="col-span-full bg-[#eeebe3] px-10 py-4 flex flex-col gap-2 border-b border-soft-border">
          <form onSubmit={handleExtract} className="flex gap-4">
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste recipe URL here..."
              className="flex-1 border border-slate-300 px-4 py-2 bg-white font-serif italic outline-none focus:border-accent"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-ink text-white px-6 py-2 font-bold uppercase tracking-widest text-sm hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Processing...' : 'Extract Intelligence'}
            </button>
          </form>
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <X className="w-3 h-3" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Layout Area */}
        <div className="col-span-full grid grid-cols-[280px_1fr_240px] flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'extract' && (
              <motion.div
                key="extract"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full grid grid-cols-[280px_1fr_240px] h-full"
              >
                {currentRecipe ? (
                  <>
                    {/* Left Sidebar */}
                    <aside className="p-8 border-r border-soft-border flex flex-col gap-6 overflow-y-auto">
                      <section>
                        <h2 className="font-serif text-4xl font-bold leading-tight mb-4">{currentRecipe.title}</h2>
                        <span className="label-tiny">Cuisine</span>
                        <div className="stat-val">{currentRecipe.cuisine}</div>
                      </section>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-soft-border pb-2">
                          <span className="label-tiny">Prep Time</span>
                          <div className="stat-val uppercase">{currentRecipe.prep_time}</div>
                        </div>
                        <div className="border-b border-soft-border pb-2">
                          <span className="label-tiny">Cook Time</span>
                          <div className="stat-val uppercase">{currentRecipe.cook_time}</div>
                        </div>
                        <div className="border-b border-soft-border pb-2">
                          <span className="label-tiny">Difficulty</span>
                          <div className="stat-val uppercase">{currentRecipe.difficulty}</div>
                        </div>
                        <div className="border-b border-soft-border pb-2">
                          <span className="label-tiny">Servings</span>
                          <div className="stat-val uppercase">{currentRecipe.servings} Units</div>
                        </div>
                      </div>

                      <section className="bg-ink text-white p-5">
                        <span className="label-tiny text-white/60">Estimated Nutrition</span>
                        <div className="text-2xl font-serif mt-1">{currentRecipe.nutrition_estimate.calories} kcal</div>
                        <div className="flex justify-between text-[11px] font-bold mt-3 uppercase tracking-tighter">
                          <span>P: {currentRecipe.nutrition_estimate.protein}</span>
                          <span>C: {currentRecipe.nutrition_estimate.carbs}</span>
                          <span>F: {currentRecipe.nutrition_estimate.fat}</span>
                        </div>
                      </section>

                      <section>
                        <span className="label-tiny">Chef's Substitutions</span>
                        <div className="text-sm italic text-ink/70 leading-relaxed space-y-1">
                          {currentRecipe.substitutions.map((sub, i) => (
                            <div key={i}>• {sub}</div>
                          ))}
                        </div>
                      </section>

                      <button 
                        onClick={() => addToPlanner(currentRecipe)}
                        className="mt-auto bg-accent text-white py-3 font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity"
                      >
                        Add to Planner
                      </button>
                    </aside>

                    {/* Main Content */}
                    <main className="p-8 border-r border-soft-border overflow-y-auto">
                      <div className="mb-10">
                        <span className="label-tiny">Ingredients & Provisions</span>
                        <ul className="mt-4 space-y-2">
                          {currentRecipe.ingredients.map((ing, i) => (
                            <li key={i} className="border-b border-dashed border-slate-300 py-2 flex justify-between text-sm">
                              <span className="font-medium">{ing.item}</span>
                              <span className="font-serif italic">{ing.quantity} {ing.unit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="label-tiny">Method of Preparation</span>
                        <div className="mt-6 space-y-6">
                          {currentRecipe.instructions.map((step, i) => (
                            <div key={i} className="flex gap-4">
                              <div className="font-serif font-bold text-2xl text-accent leading-none">
                                {(i + 1).toString().padStart(2, '0')}
                              </div>
                              <p className="text-sm leading-relaxed text-ink/80">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </main>

                    {/* Right Sidebar */}
                    <aside className="p-8 bg-[#f9f7f2] overflow-y-auto">
                      <div className="mb-8">
                        <span className="label-tiny">Shopping List</span>
                        <div className="mt-4 space-y-6">
                          {Object.entries(currentRecipe.shopping_list).map(([category, items]) => (
                            <div key={category}>
                              <div className="font-bold text-[11px] uppercase tracking-widest mb-2 border-b border-soft-border pb-1">{category}</div>
                              <div className="space-y-2">
                                {(items as string[]).map((item, i) => (
                                  <div key={i} className="flex items-center gap-2 text-[13px]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                    {item}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="label-tiny">Pairings</span>
                        <div className="mt-2 space-y-1 font-bold text-sm text-ink leading-tight">
                          {currentRecipe.related_recipes.map((rel, i) => (
                            <div key={i}>{rel}</div>
                          ))}
                        </div>
                      </div>
                    </aside>
                  </>
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center text-center p-20">
                    <ChefHat className="w-16 h-16 text-soft-border mb-6" />
                    <h2 className="font-serif text-3xl text-ink/40 italic">Waiting for your next culinary discovery...</h2>
                    <p className="text-ink/30 mt-2 uppercase tracking-widest text-xs font-bold">Paste a URL above to begin extraction</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full p-10 overflow-y-auto"
              >
                <span className="label-tiny mb-6">Saved Recipe Archive</span>
                <div className="border border-ink">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-ink text-white text-[11px] uppercase tracking-widest font-bold">
                        <th className="px-6 py-3 border-r border-white/20">Recipe Title</th>
                        <th className="px-6 py-3 border-r border-white/20">Cuisine</th>
                        <th className="px-6 py-3 border-r border-white/20">Difficulty</th>
                        <th className="px-6 py-3 border-r border-white/20">Date Extracted</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-soft-border">
                      {history.map((recipe) => (
                        <tr key={recipe.id} className="hover:bg-[#f9f7f2] transition-colors text-sm">
                          <td className="px-6 py-4 border-r border-soft-border">
                            <div className="font-bold font-serif text-lg">{recipe.title}</div>
                            <div className="text-[10px] text-ink/40 truncate max-w-xs uppercase tracking-tighter">{recipe.url}</div>
                          </td>
                          <td className="px-6 py-4 border-r border-soft-border">
                            <span className="text-accent font-bold uppercase text-xs">{recipe.cuisine}</span>
                          </td>
                          <td className="px-6 py-4 border-r border-soft-border">
                            <span className="italic font-serif">{recipe.difficulty}</span>
                          </td>
                          <td className="px-6 py-4 border-r border-soft-border text-ink/50 font-mono text-xs">
                            {new Date(recipe.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => addToPlanner(recipe)}
                                className="bg-paper border border-ink text-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-ink hover:text-white transition-all"
                                title="Add to Planner"
                              >
                                {plannerRecipes.find(r => r.id === recipe.id) ? 'Added' : 'Add to Plan'}
                              </button>
                              <button 
                                onClick={() => setSelectedRecipe(recipe)}
                                className="bg-ink text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors"
                              >
                                View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'planner' && (
              <motion.div
                key="planner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full grid grid-cols-[320px_1fr] h-full"
              >
                <aside className="p-8 border-r border-soft-border bg-[#f9f7f2] overflow-y-auto">
                  <span className="label-tiny mb-6">Selected Provisions</span>
                  <div className="space-y-4">
                    {plannerRecipes.map(recipe => (
                      <div key={recipe.id} className="p-4 bg-white border border-soft-border flex justify-between items-center group">
                        <div className="font-serif font-bold text-sm leading-tight">{recipe.title}</div>
                        <button 
                          onClick={() => removeFromPlanner(recipe.id)}
                          className="text-ink/20 hover:text-accent transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {plannerRecipes.length === 0 && (
                      <div className="text-center py-10">
                        <Utensils className="w-10 h-10 text-soft-border mx-auto mb-4" />
                        <p className="text-xs italic text-ink/40">No recipes selected for planning.</p>
                      </div>
                    )}
                  </div>
                </aside>

                <main className="p-10 overflow-y-auto">
                  {plannerRecipes.length > 0 ? (
                    <div className="max-w-3xl">
                      <h2 className="font-serif text-5xl font-black mb-10 border-b-4 border-ink pb-4">Consolidated Shopping List</h2>
                      <div className="grid grid-cols-2 gap-12">
                        {Object.entries(mergeShoppingLists(plannerRecipes)).map(([category, items]) => (
                          <div key={category}>
                            <div className="label-tiny mb-4 border-b border-soft-border pb-1">{category}</div>
                            <ul className="space-y-3">
                              {items.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm border-b border-dashed border-slate-200 pb-2">
                                  <div className="w-2 h-2 bg-accent rotate-45" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <ShoppingBasket className="w-16 h-16 text-soft-border mb-6" />
                      <h3 className="font-serif text-3xl text-ink/30 italic">Your grocery list is currently empty.</h3>
                      <p className="text-xs uppercase tracking-widest font-bold text-ink/20 mt-2">Add recipes from your archive to generate a list</p>
                    </div>
                  )}
                </main>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="col-span-full px-10 py-3 border-t border-soft-border text-[10px] uppercase tracking-widest text-ink/40 flex justify-between bg-paper">
          <div>Recipe Intelligence Engine v1.0.4</div>
          <div>Issue No. 12 — Digital Gastronomy</div>
          <div>&copy; 2024 DeepKlarity Technologies</div>
        </footer>
      </div>

      {/* Detail Modal - Styled like a magazine spread */}
      <AnimatePresence>
        {selectedRecipe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-10 bg-ink/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-paper w-full max-w-6xl h-full overflow-hidden rounded-none border-[12px] border-ink relative flex flex-col"
            >
              <button 
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-6 right-6 p-2 bg-ink text-white hover:bg-accent transition-colors z-50"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-[320px_1fr_280px] h-full min-h-full">
                   {/* Left Sidebar */}
                   <aside className="p-10 border-r border-soft-border flex flex-col gap-8">
                      <section>
                        <h2 className="font-serif text-5xl font-black leading-none mb-6">{selectedRecipe.title}</h2>
                        <span className="label-tiny">Cuisine</span>
                        <div className="stat-val text-2xl">{selectedRecipe.cuisine}</div>
                      </section>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="border-b border-soft-border pb-3">
                          <span className="label-tiny">Prep Time</span>
                          <div className="stat-val uppercase">{selectedRecipe.prep_time}</div>
                        </div>
                        <div className="border-b border-soft-border pb-3">
                          <span className="label-tiny">Cook Time</span>
                          <div className="stat-val uppercase">{selectedRecipe.cook_time}</div>
                        </div>
                        <div className="border-b border-soft-border pb-3">
                          <span className="label-tiny">Difficulty</span>
                          <div className="stat-val uppercase">{selectedRecipe.difficulty}</div>
                        </div>
                        <div className="border-b border-soft-border pb-3">
                          <span className="label-tiny">Servings</span>
                          <div className="stat-val uppercase">{selectedRecipe.servings} Units</div>
                        </div>
                      </div>

                      <section className="bg-ink text-white p-8">
                        <span className="label-tiny text-white/60">Estimated Nutrition</span>
                        <div className="text-4xl font-serif mt-2">{selectedRecipe.nutrition_estimate.calories} kcal</div>
                        <div className="flex justify-between text-xs font-bold mt-6 uppercase tracking-widest">
                          <span>P: {selectedRecipe.nutrition_estimate.protein}</span>
                          <span>C: {selectedRecipe.nutrition_estimate.carbs}</span>
                          <span>F: {selectedRecipe.nutrition_estimate.fat}</span>
                        </div>
                      </section>

                      <section>
                        <span className="label-tiny">Chef's Substitutions</span>
                        <div className="text-sm italic text-ink/70 leading-relaxed space-y-2">
                          {selectedRecipe.substitutions.map((sub, i) => (
                            <div key={i}>• {sub}</div>
                          ))}
                        </div>
                      </section>
                    </aside>

                    {/* Main Content */}
                    <main className="p-12 border-r border-soft-border">
                      <div className="mb-12">
                        <span className="label-tiny mb-6">Ingredients & Provisions</span>
                        <ul className="space-y-3">
                          {selectedRecipe.ingredients.map((ing, i) => (
                            <li key={i} className="border-b border-dashed border-slate-300 py-3 flex justify-between text-base">
                              <span className="font-bold">{ing.item}</span>
                              <span className="font-serif italic text-accent">{ing.quantity} {ing.unit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="label-tiny mb-8">Method of Preparation</span>
                        <div className="space-y-8">
                          {selectedRecipe.instructions.map((step, i) => (
                            <div key={i} className="flex gap-6">
                              <div className="font-serif font-black text-4xl text-accent leading-none opacity-20">
                                {(i + 1).toString().padStart(2, '0')}
                              </div>
                              <p className="text-base leading-relaxed text-ink/90 font-medium">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </main>

                    {/* Right Sidebar */}
                    <aside className="p-10 bg-[#f9f7f2]">
                      <div className="mb-10">
                        <span className="label-tiny mb-6">Shopping List</span>
                        <div className="space-y-8">
                          {Object.entries(selectedRecipe.shopping_list).map(([category, items]) => (
                            <div key={category}>
                              <div className="font-black text-xs uppercase tracking-[3px] mb-4 border-b-2 border-ink pb-1">{category}</div>
                              <div className="space-y-3">
                                {(items as string[]).map((item, i) => (
                                  <div key={i} className="flex items-center gap-3 text-sm font-medium">
                                    <div className="w-2 h-2 bg-accent" />
                                    {item}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="label-tiny mb-4">Pairings</span>
                        <div className="space-y-2 font-black text-base text-ink leading-tight uppercase tracking-tighter">
                          {selectedRecipe.related_recipes.map((rel, i) => (
                            <div key={i} className="hover:text-accent cursor-default">{rel}</div>
                          ))}
                        </div>
                      </div>
                    </aside>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function mergeShoppingLists(recipes: Recipe[]) {
  const merged: Record<string, Record<string, string[]>> = {};
  
  recipes.forEach(recipe => {
    Object.entries(recipe.shopping_list).forEach(([category, items]) => {
      const cat = category.toUpperCase();
      if (!merged[cat]) merged[cat] = {};
      
      (items as string[]).forEach(item => {
        // Try to separate quantity and item name
        // Simple heuristic: look for first number
        const match = item.match(/^([\d\/\.\s\-]+(?:cup|cups|tbsp|tsp|oz|g|kg|lb|lbs|unit|units|slice|slices|tb|ts|ml|l|can|cans|clove|cloves)?)\s+(.*)$/i);
        
        if (match) {
          const qty = match[1].trim();
          const name = match[2].trim().toLowerCase();
          if (!merged[cat][name]) merged[cat][name] = [];
          merged[cat][name].push(qty);
        } else {
          const name = item.trim().toLowerCase();
          if (!merged[cat][name]) merged[cat][name] = [];
          merged[cat][name].push("");
        }
      });
    });
  });

  // Final formatting
  const result: Record<string, string[]> = {};
  Object.entries(merged).forEach(([cat, items]) => {
    result[cat] = Object.entries(items).map(([name, quantities]) => {
      const filteredQtys = quantities.filter(q => q !== "");
      const qtyStr = filteredQtys.length > 0 ? filteredQtys.join(" + ") : "";
      return `${qtyStr} ${name}`.trim();
    });
  });
  
  return result;
}
