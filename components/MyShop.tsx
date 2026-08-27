
import React, { useState } from 'react';
import { UserShop, Product, ShopAIConfig, UserProfile } from '../types';
import { Store, ShoppingBag, Bot, Settings, Plus, Sparkles, BarChart, Save, Trash2, Send, Wand2, ImageIcon, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface MyShopProps {
  userProfile: UserProfile;
  onUpdateShop: (shop: UserShop) => void;
}

export const MyShop: React.FC<MyShopProps> = ({ userProfile, onUpdateShop }) => {
  const [shop, setShop] = useState<UserShop | undefined>(userProfile.shop);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'ai-agent'>('overview');
  
  // Creation Form State
  const [creationForm, setCreationForm] = useState({ name: '', description: '' });
  const [isGeneratingShopInfo, setIsGeneratingShopInfo] = useState(false);

  // Product Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ title: '', price: 0, category: 'Digital', description: '' });
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // AI Simulator State
  const [simMessage, setSimMessage] = useState('');
  const [simChat, setSimChat] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [isSimLoading, setIsSimLoading] = useState(false);

  // --- ACTIONS ---

  const generateShopInfo = async () => {
      setIsGeneratingShopInfo(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Génère un nom de boutique et une courte description (1 phrase) pour un entrepreneur numérique qui vend des services ou produits digitaux.
              Réponds en JSON uniquement : { "name": "...", "description": "..." }`
          });
          const text = response.text || '{}';
          const jsonStr = text.replace(/```json|```/g, '').trim();
          const result = JSON.parse(jsonStr);
          
          if(result.name) setCreationForm({ name: result.name, description: result.description || '' });
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingShopInfo(false);
      }
  };

  const handleCreateShop = () => {
    const newShop: UserShop = {
        id: Date.now().toString(),
        name: creationForm.name,
        description: creationForm.description,
        bannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&fit=crop',
        revenue: 0,
        sales: 0,
        products: [],
        aiConfig: {
            agentName: 'Vendeur IA',
            personality: 'Professionnel',
            welcomeMessage: `Bienvenue chez ${creationForm.name}, comment puis-je vous aider ?`,
            salesStrategy: 'Mettre en avant la qualité et le service client.'
        }
    };
    setShop(newShop);
    onUpdateShop(newShop);
  };

  const generateProductDescription = async () => {
    if (!newProduct.title) return;
    setIsGeneratingDesc(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Rédige une description produit vendeuse, courte et attractive pour : "${newProduct.title}". 
            Catégorie: ${newProduct.category}.
            Ton: Enthousiaste et professionnel. Max 50 mots.`
        });
        setNewProduct({...newProduct, description: response.text || ''});
    } catch (e) {
        console.error(e);
    } finally {
        setIsGeneratingDesc(false);
    }
  };

  const handleGenerateProductImage = async () => {
      if (!newProduct.title) return;
      setIsGeneratingImage(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: 'gemini-3-pro-image-preview',
              contents: { parts: [{ text: `A professional, high quality product photo of: ${newProduct.title}. ${newProduct.category} style. Minimalist background.` }] },
              config: {
                  imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
              }
          });

          let imageUrl = null;
          for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                  imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                  break;
              }
          }
          if (imageUrl) {
              setNewProduct({ ...newProduct, imageUrl });
          }
      } catch (e) {
          console.error("Image Gen Error", e);
      } finally {
          setIsGeneratingImage(false);
      }
  };

  const handleAddProduct = () => {
    if (shop && newProduct.title && newProduct.price) {
        const product: Product = {
            id: Date.now().toString(),
            title: newProduct.title,
            description: newProduct.description || '',
            price: Number(newProduct.price),
            currency: 'EUR',
            category: newProduct.category as any,
            imageUrl: newProduct.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&fit=crop',
            rating: 0,
            reviews: 0
        };
        const updatedShop = { ...shop, products: [...shop.products, product] };
        setShop(updatedShop);
        onUpdateShop(updatedShop);
        setNewProduct({ title: '', price: 0, category: 'Digital', description: '', imageUrl: '' });
    }
  };

  const handleUpdateAIConfig = (newConfig: Partial<ShopAIConfig>) => {
      if (shop) {
          const updatedShop = { ...shop, aiConfig: { ...shop.aiConfig, ...newConfig } };
          setShop(updatedShop);
          onUpdateShop(updatedShop);
      }
  };

  const handleSimulateChat = async () => {
      if (!simMessage.trim() || !shop) return;
      const userMsg = simMessage;
      setSimMessage('');
      setSimChat(prev => [...prev, { role: 'user', text: userMsg }]);
      setIsSimLoading(true);

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const systemPrompt = `Tu es ${shop.aiConfig.agentName}, vendeur pour "${shop.name}".
          Personnalité : ${shop.aiConfig.personality}. Stratégie : ${shop.aiConfig.salesStrategy}.
          Catalogue : ${shop.products.map(p => `${p.title} (${p.price}€)`).join(', ')}.
          Réponds pour vendre.`;

          const response = await ai.models.generateContent({
              model: 'gemini-3-pro-preview',
              contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nClient: " + userMsg }] }]
          });

          setSimChat(prev => [...prev, { role: 'model', text: response.text || "..." }]);
      } catch (e) { console.error(e); } finally { setIsSimLoading(false); }
  };

  if (!shop) {
      return (
          <div className="p-8 max-w-4xl mx-auto animate-fade-up">
              <div className="bg-white rounded-3xl p-10 shadow-lg text-center border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-[80px] opacity-10"></div>
                  <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10"><Store size={48} className="text-brand-600" /></div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4 relative z-10">Ouvrez votre Boutique IA</h1>
                  <p className="text-gray-500 max-w-lg mx-auto mb-8 relative z-10">Créez votre catalogue et laissez notre **Assistant IA Commercial** vendre vos produits 24h/24.</p>
                  
                  <div className="max-w-md mx-auto space-y-4 text-left relative z-10">
                      <div className="flex justify-end"><button onClick={generateShopInfo} disabled={isGeneratingShopInfo} className="text-xs flex items-center gap-1 text-brand-600 font-bold hover:text-brand-700 bg-brand-50 px-2 py-1 rounded-lg transition-colors"><Wand2 size={12} /> {isGeneratingShopInfo ? 'Création...' : 'Suggérer un concept'}</button></div>
                      <div><label className="block text-sm font-bold text-gray-700 mb-1">Nom de la boutique</label><input value={creationForm.name} onChange={e => setCreationForm({...creationForm, name: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-brand-500" placeholder="Ex: Diallo Tech Solutions" /></div>
                      <div><label className="block text-sm font-bold text-gray-700 mb-1">Description courte</label><textarea value={creationForm.description} onChange={e => setCreationForm({...creationForm, description: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-brand-500" placeholder="Ce que vous proposez..." /></div>
                      <button onClick={handleCreateShop} disabled={!creationForm.name} className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"><Store size={20} /> Lancer mon Business 🚀</button>
                  </div>
              </div>
          </div>
      );
  }

  return (
      <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-up">
          {/* Header */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center text-white"><Store size={32} /></div>
                  <div>
                      <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
                      <div className="flex items-center gap-2"><p className="text-sm text-gray-500">{shop.description}</p><span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full tracking-wider border border-green-200">En Ligne</span></div>
                  </div>
              </div>
              <div className="text-right hidden sm:block"><div className="text-xs text-gray-500 uppercase font-bold">Chiffre d'Affaires</div><div className="text-2xl font-bold text-green-600">{shop.revenue.toFixed(2)} Ⓒ</div><div className="text-xs text-gray-400">{shop.sales} ventes</div></div>
          </div>

          <div className="flex gap-4 border-b border-gray-200 pb-1 overflow-x-auto">
              {['overview', 'products', 'ai-agent'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap capitalize ${activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>{tab.replace('-', ' ')}</button>
              ))}
          </div>

          {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100"><div className="flex items-center gap-2 mb-2 text-gray-500"><BarChart size={20} /> <span className="text-sm font-bold">Vues</span></div><div className="text-3xl font-bold">1,240</div><div className="text-xs text-green-500 font-bold">+12% cette semaine</div></div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100"><div className="flex items-center gap-2 mb-2 text-gray-500"><ShoppingBag size={20} /> <span className="text-sm font-bold">Produits</span></div><div className="text-3xl font-bold">{shop.products.length}</div></div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100"><div className="flex items-center gap-2 mb-2 text-gray-500"><Bot size={20} /> <span className="text-sm font-bold">Conv. IA</span></div><div className="text-3xl font-bold">85%</div></div>
              </div>
          )}

          {activeTab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Add Product Form */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 h-fit">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Plus size={20} /> Nouveau Produit</h3>
                      <div className="space-y-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500">Nom</label>
                              <input value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm" placeholder="Ex: Ebook Formation" />
                          </div>
                          <div className="flex gap-2">
                              <div className="flex-1"><label className="text-xs font-bold text-gray-500">Prix (Ⓒ)</label><input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg p-2 text-sm" /></div>
                              <div className="flex-1">
                                  <label className="text-xs font-bold text-gray-500">Catégorie</label>
                                  <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as any})} className="w-full border border-gray-300 rounded-lg p-2 text-sm">
                                      <option value="Digital">Digital</option><option value="Service">Service</option><option value="Physique">Physique</option>
                                  </select>
                              </div>
                          </div>
                          
                          {/* Image Generation */}
                          <div>
                              <div className="flex justify-between items-center mb-1">
                                  <label className="text-xs font-bold text-gray-500">Visuel</label>
                                  <button onClick={handleGenerateProductImage} disabled={!newProduct.title || isGeneratingImage} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded flex items-center gap-1 hover:bg-purple-100"><ImageIcon size={10} /> {isGeneratingImage ? 'Génération...' : 'Créer Image IA'}</button>
                              </div>
                              <div className="w-full h-32 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden relative">
                                  {newProduct.imageUrl ? (
                                      <img src={newProduct.imageUrl} className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="text-center text-gray-400"><ImageIcon size={24} className="mx-auto" /><span className="text-xs">Aucune image</span></div>
                                  )}
                                  {isGeneratingImage && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>}
                              </div>
                          </div>

                          <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-bold text-gray-500">Description</label>
                                <button onClick={generateProductDescription} disabled={!newProduct.title || isGeneratingDesc} className="text-[10px] bg-brand-50 text-brand-600 px-2 py-1 rounded flex items-center gap-1 hover:bg-brand-100"><Sparkles size={10} /> {isGeneratingDesc ? 'Rédaction...' : 'Générer via IA'}</button>
                              </div>
                              <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm h-24" />
                          </div>
                          <button onClick={handleAddProduct} className="w-full bg-black text-white py-2 rounded-lg font-bold text-sm hover:bg-gray-800">Ajouter au catalogue</button>
                      </div>
                  </div>

                  {/* Product List */}
                  <div className="lg:col-span-2 space-y-4">
                      {shop.products.length === 0 ? <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border-dashed border-2 border-gray-200">Catalogue vide.</div> : 
                          shop.products.map(p => (
                              <div key={p.id} className="flex gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm items-center">
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0"><img src={p.imageUrl} className="w-full h-full object-cover rounded-lg" /></div>
                                  <div className="flex-1"><div className="font-bold text-gray-900">{p.title}</div><div className="text-xs text-gray-500 line-clamp-1">{p.description}</div><div className="text-brand-600 font-bold mt-1">{p.price} Ⓒ</div></div>
                                  <button className="text-red-400 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                              </div>
                          ))
                      }
                  </div>
              </div>
          )}

          {activeTab === 'ai-agent' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 overflow-y-auto">
                      <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-brand-600"><Settings size={20} /> Configuration du Vendeur</h3>
                      <div className="space-y-6">
                          <div><label className="block text-sm font-bold text-gray-700 mb-2">Nom de l'Agent</label><input value={shop.aiConfig.agentName} onChange={(e) => handleUpdateAIConfig({ agentName: e.target.value })} className="w-full border border-gray-300 rounded-xl p-3" /></div>
                          <div><label className="block text-sm font-bold text-gray-700 mb-2">Stratégie</label><textarea value={shop.aiConfig.salesStrategy} onChange={(e) => handleUpdateAIConfig({ salesStrategy: e.target.value })} className="w-full border border-gray-300 rounded-xl p-3 h-24 text-sm" /></div>
                      </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
                      <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center"><div className="font-bold text-gray-700 flex items-center gap-2"><Bot size={18} className="text-brand-600" /> Simulateur Client</div><span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Testez votre IA</span></div>
                      <div className="flex-1 p-4 overflow-y-auto space-y-4">
                          <div className="flex justify-start"><div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm shadow-sm">{shop.aiConfig.welcomeMessage}</div></div>
                          {simChat.map((msg, i) => (<div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`p-3 rounded-2xl max-w-[80%] text-sm shadow-sm ${msg.role === 'user' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none'}`}>{msg.text}</div></div>))}
                      </div>
                      <div className="p-4 bg-white border-t border-gray-200 flex gap-2">
                          <input value={simMessage} onChange={(e) => setSimMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSimulateChat()} className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Posez une question..." />
                          <button onClick={handleSimulateChat} disabled={isSimLoading || !simMessage} className="bg-brand-600 text-white p-2 rounded-xl hover:bg-brand-700 disabled:opacity-50"><Send size={20} /></button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};
