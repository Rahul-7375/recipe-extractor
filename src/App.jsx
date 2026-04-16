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
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState('extract');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [plannerRecipes, setPlannerRecipes] = useState([]);

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

  const handleExtract = async (e) => {
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
    } catch (err) {
      console.error('Extraction failed', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to extract recipe. Please check the URL and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const addToPlanner = (recipe) => {
    if (!plannerRecipes.find(r => r.id === recipe.id)) {
      setPlannerRecipes([...plannerRecipes, recipe]);
    }
  };

  const removeFromPlanner = (id) => {
    setPlannerRecipes(plannerRecipes.filter(r => r.id !== id));
  };

  return (
    <div className="flex h-screen bg-obsidian text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-72 border-r border-white/5 flex flex-col p-6 bg-surface/30 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-emerald rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <ChefHat className="text-obsidian" size={24} />
          </div>
          <div>
            <h1 className="font-serif text-xl font-black tracking-tight leading-none">GASTRO</h1>
            <p className="text-[10px] font-bold tracking-[3px] text-emerald uppercase opacity-70">Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('extract')}
            className={cn("nav-item w-full", activeTab === 'extract' && "active")}
          >
            <Search size={20} />
            <span>Extractor</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn("nav-item w-full", activeTab === 'history' && "active")}
          >
            <History size={20} />
            <span>Saved Recipes</span>
          </button>
          <button 
            onClick={() => setActiveTab('planner')}
            className={cn("nav-item w-full", activeTab === 'planner' && "active")}
          >
            <Calendar size={20} />
            <span>Meal Planner</span>
          </button>
        </nav>

        <div className="mt-auto p-4 glass-card bg-emerald/5 border-emerald/10">
          <p className="text-xs text-slate-400 leading-relaxed">
            Unlocking culinary intelligence with <span className="text-emerald">Gemini AI</span>.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Subtle Background Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald/5 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full -z-10" />

        {/* Top Search Bar */}
        <header className="px-10 py-6 border-b border-white/5 flex items-center justify-between bg-obsidian/50 backdrop-blur-md z-10">
          <form onSubmit={handleExtract} className="flex-1 max-w-2xl relative">
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste recipe URL to extract intelligence..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-12 py-3 outline-none focus:border-emerald/50 focus:bg-white/[0.05] transition-all text-sm font-medium pr-32"
              required
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald text-obsidian px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-light transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {loading ? 'Processing...' : 'Extract'}
            </button>
          </form>

          {error && (
            <div className="absolute top-full left-10 mt-2 text-red-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
              <X size={12} />
              {error}
            </div>
          )}
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-10">
          <AnimatePresence mode="wait">
            {activeTab === 'extract' && (
              <motion.div
                key="extract"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                {currentRecipe ? (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="space-y-8">
                      {/* Hero Image / Title Area */}
                      <section className="relative h-64 rounded-3xl overflow-hidden glass-card p-10 flex flex-col justify-end">
                        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent z-0" />
                        <div className="relative z-10">
                          <span className="label-modern">{currentRecipe.cuisine}</span>
                          <h2 className="font-serif text-5xl font-black mb-4 leading-tight">{currentRecipe.title}</h2>
                          <div className="flex gap-6">
                            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                              <Clock size={16} className="text-emerald" />
                              <span>{currentRecipe.total_time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                              <Users size={16} className="text-emerald" />
                              <span>{currentRecipe.servings} Servings</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                              <BarChart3 size={16} className="text-emerald" />
                              <span className="capitalize">{currentRecipe.difficulty}</span>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="recipe-stat">
                          <span className="label-modern !mb-0 text-[9px]">Calories</span>
                          <div className="text-xl font-serif font-black">{currentRecipe.nutrition_estimate.calories}</div>
                        </div>
                        <div className="recipe-stat">
                          <span className="label-modern !mb-0 text-[9px]">Protein</span>
                          <div className="text-xl font-serif font-black">{currentRecipe.nutrition_estimate.protein}</div>
                        </div>
                        <div className="recipe-stat">
                          <span className="label-modern !mb-0 text-[9px]">Carbs</span>
                          <div className="text-xl font-serif font-black">{currentRecipe.nutrition_estimate.carbs}</div>
                        </div>
                        <div className="recipe-stat">
                          <span className="label-modern !mb-0 text-[9px]">Fat</span>
                          <div className="text-xl font-serif font-black">{currentRecipe.nutrition_estimate.fat}</div>
                        </div>
                      </div>

                      {/* Instructions */}
                      <section className="glass-card p-8">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="font-serif text-2xl font-bold">Preparation Steps</h3>
                          <div className="px-3 py-1 bg-emerald/10 border border-emerald/20 text-emerald text-[10px] font-bold uppercase tracking-widest rounded-full">
                            {currentRecipe.instructions.length} Steps
                          </div>
                        </div>
                        <div className="space-y-6">
                          {currentRecipe.instructions.map((step, i) => (
                            <div key={i} className="flex gap-6 group">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center font-serif font-bold text-emerald text-sm transition-all group-hover:bg-emerald group-hover:text-obsidian group-hover:scale-110">
                                {i + 1}
                              </div>
                              <p className="text-slate-300 text-sm leading-relaxed pt-1">{step}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    {/* Sidebar components */}
                    <div className="space-y-8">
                      <section className="glass-card p-6">
                        <h3 className="font-serif text-xl font-bold mb-6">Ingredients</h3>
                        <div className="space-y-3">
                          {currentRecipe.ingredients.map((ing, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-all border border-transparent hover:border-white/5 cursor-pointer">
                              <div className="w-5 h-5 rounded border border-emerald/30 bg-emerald/5 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-200">{ing.item}</p>
                                <p className="text-[11px] text-slate-500 font-medium italic">{ing.quantity} {ing.unit}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={() => addToPlanner(currentRecipe)}
                          className="w-full mt-8 bg-emerald text-obsidian py-3 rounded-xl font-bold uppercase tracking-[2px] text-xs hover:opacity-90 active:scale-95 transition-all shadow-[0_10px_20px_rgba(16,185,129,0.2)]"
                        >
                          Send to Planner
                        </button>
                      </section>

                      <section className="glass-card p-6 border-gold/10 bg-gold/5">
                        <h3 className="font-serif text-xl font-bold text-gold mb-4 flex items-center gap-2">
                          <Utensils size={18} />
                          Chef's Notes
                        </h3>
                        <div className="space-y-3">
                          {currentRecipe.substitutions.map((sub, i) => (
                            <div key={i} className="text-xs text-amber/80 italic leading-relaxed flex gap-2">
                             <span className="text-gold">•</span> {sub}
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                    <div className="w-24 h-24 bg-emerald/5 rounded-full flex items-center justify-center mb-8 animate-pulse">
                      <ChefHat className="text-emerald/20" size={48} />
                    </div>
                    <h2 className="font-serif text-3xl font-bold text-white mb-4 italic opacity-80">Your Culinary Journey Starts Here</h2>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8">
                      Paste a recipe blog URL in the search bar above to extract structured cooking intelligence instantly.
                    </p>
                    <div className="grid grid-cols-2 gap-4 w-full opacity-40">
                      <div className="glass-card p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Structured Data</div>
                      <div className="glass-card p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Nutrition Analysis</div>
                      <div className="glass-card p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Meal Planning</div>
                      <div className="glass-card p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Smart Shopping</div>
                    </div>
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
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-4xl font-black">Recipe Archive</h2>
                  <p className="text-slate-500 text-sm font-medium">{history.length} Saved Discoveries</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((recipe) => (
                    <div 
                      key={recipe.id}
                      onClick={() => setSelectedRecipe(recipe)}
                      className="glass-card p-6 group cursor-pointer hover:bg-white/[0.05] hover:border-emerald/30 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-2 py-0.5 bg-emerald/10 border border-emerald/20 text-emerald text-[9px] font-bold uppercase tracking-widest rounded">
                          {recipe.cuisine}
                        </span>
                        <ExternalLink size={14} className="text-slate-600 group-hover:text-emerald transition-colors" />
                      </div>
                      <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-emerald transition-colors leading-tight line-clamp-2 h-12">
                        {recipe.title}
                      </h3>
                      <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-emerald/60" /> {recipe.total_time}</span>
                        <span className="flex items-center gap-1.5"><BarChart3 size={12} className="text-emerald/60" /> {recipe.difficulty}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {history.length === 0 && (
                  <div className="py-20 text-center glass-card border-dashed">
                    <History size={48} className="mx-auto text-slate-700 mb-6" />
                    <p className="text-slate-500 font-serif italic text-xl">No saved recipes yet.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'planner' && (
              <motion.div
                key="planner"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10"
              >
                <div className="space-y-6">
                  <h2 className="font-serif text-4xl font-black mb-8">Meal Hub</h2>
                  <div className="space-y-4">
                    {plannerRecipes.map(recipe => (
                      <div key={recipe.id} className="glass-card p-5 flex justify-between items-center group relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald" />
                        <div>
                          <p className="text-[10px] font-bold text-emerald uppercase tracking-widest mb-1">{recipe.cuisine}</p>
                          <h4 className="font-bold text-sm leading-tight text-slate-200">{recipe.title}</h4>
                        </div>
                        <button 
                          onClick={() => removeFromPlanner(recipe.id)}
                          className="bg-red-500/10 text-red-400 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {plannerRecipes.length === 0 && (
                      <div className="glass-card p-10 text-center border-dashed">
                        <Utensils size={32} className="mx-auto text-slate-700 mb-4" />
                        <p className="text-xs text-slate-500 italic">Select recipes from the archive to build your plan.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass-card p-10 bg-surface/40">
                  {plannerRecipes.length > 0 ? (
                    <div className="max-w-3xl">
                      <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-6">
                        <h2 className="font-serif text-4xl font-black text-emerald">Consolidated List</h2>
                        <button className="glass-button px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                          <ShoppingBasket size={16} />
                          Copy to Phone
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        {Object.entries(mergeShoppingLists(plannerRecipes)).map(([category, items]) => (
                          <div key={category} className="group">
                            <h4 className="label-modern mb-4 flex items-center justify-between">
                              {category}
                              <span className="text-[9px] opacity-40">{items.length} Items</span>
                            </h4>
                            <ul className="space-y-3">
                              {items.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm text-slate-300 border-b border-white/[0.03] pb-2 hover:text-emerald transition-colors cursor-pointer group/item">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover/item:bg-emerald transition-colors" />
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
                      <ShoppingBasket className="w-16 h-16 text-slate-800 mb-6" />
                      <h3 className="font-serif text-3xl font-bold text-slate-400 italic mb-2">Groceries are empty</h3>
                      <p className="text-[10px] uppercase tracking-[3px] font-bold text-slate-600">Inventory intelligence pending</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modern Detail Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-obsidian/95 backdrop-blur-2xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-surface w-full max-w-5xl h-full max-h-[90vh] overflow-hidden rounded-[40px] border border-white/10 relative shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
              <button 
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-8 right-8 p-3 bg-white/5 text-white hover:bg-red-500 transition-all rounded-2xl z-50 group active:scale-95"
              >
                <X size={24} className="group-hover:rotate-90 transition-transform" />
              </button>
              
              <div className="h-full overflow-y-auto custom-scrollbar">
                <div className="flex flex-col lg:flex-row h-full">
                   {/* Left Visual Area */}
                   <aside className="lg:w-[400px] p-10 bg-white/[0.02] flex flex-col border-r border-white/10 h-full">
                      <div className="mb-8">
                        <span className="label-modern">{selectedRecipe.cuisine}</span>
                        <h2 className="font-serif text-5xl font-black leading-tight mb-6">{selectedRecipe.title}</h2>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="recipe-stat h-24">
                          <span className="label-modern !mb-0 text-[9px]">Prep</span>
                          <div className="text-xl font-serif font-black">{selectedRecipe.prep_time}</div>
                        </div>
                        <div className="recipe-stat h-24">
                          <span className="label-modern !mb-0 text-[9px]">Cook</span>
                          <div className="text-xl font-serif font-black">{selectedRecipe.cook_time}</div>
                        </div>
                      </div>

                      <div className="bg-emerald p-8 rounded-3xl text-obsidian shadow-[0_20px_40px_rgba(16,185,129,0.3)] mb-8">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Nutrition</span>
                        <div className="text-5xl font-serif font-black mt-2 leading-none">{selectedRecipe.nutrition_estimate.calories}</div>
                        <p className="text-[11px] font-bold uppercase tracking-widest mb-6 opacity-60">Total kcal / serving</p>
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest pt-6 border-t border-obsidian/10">
                          <span>P: {selectedRecipe.nutrition_estimate.protein}</span>
                          <span>C: {selectedRecipe.nutrition_estimate.carbs}</span>
                          <span>F: {selectedRecipe.nutrition_estimate.fat}</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <h3 className="label-modern mb-4">Cooking Tips</h3>
                        <div className="space-y-3">
                          {selectedRecipe.substitutions.slice(0, 3).map((sub, i) => (
                            <div key={i} className="text-xs italic text-slate-400 leading-relaxed border-l border-emerald/50 pl-4 py-1">
                              {sub}
                            </div>
                          ))}
                        </div>
                      </div>
                    </aside>

                    {/* Right Content Area */}
                    <main className="flex-1 p-12 bg-surface">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section>
                          <h3 className="font-serif text-3xl font-bold mb-8 flex items-center gap-3">
                             <span className="w-1.5 h-8 bg-emerald rounded-full" />
                             Ingredients
                          </h3>
                          <ul className="space-y-4">
                            {selectedRecipe.ingredients.map((ing, i) => (
                              <li key={i} className="flex justify-between items-center group">
                                <span className="text-sm font-bold text-slate-100 group-hover:text-emerald transition-colors">{ing.item}</span>
                                <span className="text-xs font-serif italic text-emerald-light bg-emerald/10 px-3 py-1 rounded-full">{ing.quantity} {ing.unit}</span>
                              </li>
                            ))}
                          </ul>
                        </section>

                        <section>
                          <h3 className="font-serif text-3xl font-bold mb-8 flex items-center gap-3">
                             <span className="w-1.5 h-8 bg-emerald rounded-full" />
                             Method
                          </h3>
                          <div className="space-y-8">
                            {selectedRecipe.instructions.map((step, i) => (
                              <div key={i} className="flex gap-6 group">
                                <span className="font-serif font-black text-4xl text-emerald/10 group-hover:text-emerald transition-colors duration-500 leading-none">
                                  {(i + 1).toString().padStart(2, '0')}
                                </span>
                                <p className="text-sm leading-relaxed text-slate-300 font-medium pt-1">{step}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>

                      <div className="mt-16 pt-10 border-t border-white/5 flex gap-4">
                        <button 
                          onClick={() => {
                            addToPlanner(selectedRecipe);
                            setSelectedRecipe(null);
                          }}
                          className="flex-1 bg-emerald text-obsidian py-4 rounded-2xl font-black uppercase tracking-[3px] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                        >
                          Add to Meal Plan
                        </button>
                        <a 
                          href={selectedRecipe.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-6 bg-white/5 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/5"
                        >
                          <ExternalLink size={20} />
                        </a>
                      </div>
                    </main>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


function mergeShoppingLists(recipes) {
  const merged = {};
  
  recipes.forEach(recipe => {
    // The AI now returns shopping_list as an array of objects
    const list = Array.isArray(recipe.shopping_list) ? recipe.shopping_list : [];
    
    list.forEach(entry => {
      const category = entry.category || 'Other';
      const items = entry.items || [];
      const cat = category.toUpperCase();
      if (!merged[cat]) merged[cat] = {};
      
      items.forEach(item => {
        // Try to separate quantity and item name
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
  const result = {};
  Object.entries(merged).forEach(([cat, items]) => {
    result[cat] = Object.entries(items).map(([name, quantities]) => {
      const filteredQtys = quantities.filter(q => q !== "");
      const qtyStr = filteredQtys.length > 0 ? filteredQtys.join(" + ") : "";
      return `${qtyStr} ${name}`.trim();
    });
  });
  
  return result;
}
