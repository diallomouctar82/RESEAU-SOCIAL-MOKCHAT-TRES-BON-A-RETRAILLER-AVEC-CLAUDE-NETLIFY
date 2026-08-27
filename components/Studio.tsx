
import React, { useState, useRef } from 'react';
import { AIProxyClient } from '../services/aiProxy';
import { Video, Image as ImageIcon, Eye, Sparkles, AlertCircle, Download, MonitorPlay, X, Upload, User, Play, Users, Share2 } from 'lucide-react';
import { StudioTab, GeneratedMedia } from '../types';
import { Avatar3D } from './Avatar3D';
import { StudioCollaboration } from './StudioCollaboration';

export const Studio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudioTab>('image');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Shared asset for collaboration
  const [sharedAssetForCollab, setSharedAssetForCollab] = useState<{
    type: 'image' | 'video' | 'script' | 'prompt' | 'vision';
    contentOrUrl: string;
    title?: string;
  } | null>(null);
  
  // Image Configs
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('1:1');

  // Vision Configs
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const visionInputRef = useRef<HTMLInputElement>(null);

  // Avatar Configs
  const [selectedAvatarId, setSelectedAvatarId] = useState('1');
  const [avatarState, setAvatarState] = useState<'idle' | 'speaking'>('idle');

  const handleGenerate = async () => {
    if (!prompt && activeTab !== 'vision' && activeTab !== 'avatar') return;
    if (activeTab === 'vision' && !visionImage && !prompt) return;

    setIsGenerating(true);
    setResult(null);
    setError(null);

    try {
      const ai = new AIProxyClient();

      if (activeTab === 'image') {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                    imageSize: imageSize
                }
            }
        });
        
        let imageUrl = null;
        for (const part of response.candidates[0].content.parts) {
            if (part.fileData?.fileUri) {
                imageUrl = part.fileData.fileUri;
                break;
            }
        }
        if (imageUrl) setResult(imageUrl);
        else throw new Error("Aucune image générée.");

      } else if (activeTab === 'video') {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
              numberOfVideos: 1,
              resolution: '720p',
              aspectRatio: aspectRatio === '1:1' ? '16:9' : aspectRatio as '16:9' | '9:16', // Veo doesn't support 1:1
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        if (operation.response?.generatedVideos?.[0]?.video?.uri) {
            setResult(operation.response.generatedVideos[0].video.uri);
        } else {
            throw new Error("Aucune vidéo générée.");
        }

      } else if (activeTab === 'vision') {
         // Video Understanding / Image Analysis
         const parts: any[] = [];
         if (visionImage) {
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: visionImage.split(',')[1] } });
         }
         parts.push({ text: prompt || "Décris cette image en détail." });

         const response = await ai.models.generateContent({
             model: 'gemini-3-pro-preview',
             contents: { parts },
         });
         setResult(response.text || "Pas de réponse.");
         
      } else if (activeTab === 'avatar') {
          // Simulation of Avatar Video Generation
          await new Promise(resolve => setTimeout(resolve, 2000));
          setAvatarState('speaking');
          setTimeout(() => setAvatarState('idle'), 5000);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVisionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
         const reader = new FileReader();
         reader.onloadend = () => setVisionImage(reader.result as string);
         reader.readAsDataURL(file);
     }
  };

  const handleShareResultToCollaboration = () => {
    if (!result && activeTab !== 'avatar') return;
    setSharedAssetForCollab({
      type: activeTab === 'image' ? 'image' : activeTab === 'video' ? 'video' : activeTab === 'avatar' ? 'script' : 'vision',
      contentOrUrl: result || prompt,
      title: prompt ? `Création Studio : ${prompt.slice(0, 40)}...` : 'Actif Généré Studio'
    });
    setActiveTab('collaboration');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-brand-600 rounded-2xl text-white shadow-lg shadow-brand-200">
            <Sparkles size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Studio Créatif & Collaboratif</h1>
            <p className="text-gray-500">Créez des médias multimodaux, co-rédigez des articles et coopérez en équipe.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-8 w-fit overflow-x-auto max-w-full">
          <button 
            onClick={() => { setActiveTab('image'); setResult(null); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'image' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <ImageIcon size={18} /> Imaginer
          </button>
          <button 
            onClick={() => { setActiveTab('video'); setResult(null); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'video' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Video size={18} /> Visualiser
          </button>
          <button 
            onClick={() => { setActiveTab('avatar'); setResult(null); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'avatar' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <User size={18} /> Avatar 3D
          </button>
          <button 
            onClick={() => { setActiveTab('vision'); setResult(null); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'vision' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Eye size={18} /> Analyser
          </button>
          <button 
            onClick={() => { setActiveTab('collaboration'); setResult(null); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'collaboration' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-700 hover:text-blue-900 bg-blue-50/70'}`}
          >
            <Users size={18} /> Co-Création & Collaboration
          </button>
        </div>

        {/* Tab 5 : Suite de Co-Création & Outils Collaboratifs */}
        {activeTab === 'collaboration' ? (
          <StudioCollaboration 
            initialStudioAsset={sharedAssetForCollab} 
            onClearInitialAsset={() => setSharedAssetForCollab(null)} 
          />
        ) : (
          /* Config Area for Generative AI Tools */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="space-y-6">
                
                {/* Vision Upload */}
                {activeTab === 'vision' && (
                   <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-brand-400 transition-colors relative bg-gray-50">
                      {visionImage ? (
                          <div className="relative inline-block">
                             <img src={visionImage} className="max-h-48 rounded-lg shadow-sm" alt="Vision input" />
                             <button onClick={() => setVisionImage(null)} className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow-md hover:bg-red-50">
                                <X size={16} />
                             </button>
                          </div>
                      ) : (
                          <div onClick={() => visionInputRef.current?.click()} className="cursor-pointer space-y-2">
                             <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto text-gray-500">
                               <Upload size={24} />
                             </div>
                             <p className="text-sm font-medium text-gray-600">Cliquez pour uploader une image</p>
                             <p className="text-xs text-gray-400">JPG, PNG supportés</p>
                          </div>
                      )}
                      <input type="file" ref={visionInputRef} onChange={handleVisionUpload} className="hidden" accept="image/*" />
                   </div>
                )}

                {/* Prompt Input */}
                {activeTab !== 'avatar' ? (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {activeTab === 'vision' ? 'Votre question (optionnel)' : 'Votre vision (Prompt)'}
                      </label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={
                          activeTab === 'image' ? "Un astronaute chevauchant un cheval à Paris..." :
                          activeTab === 'video' ? "Une vue cinématique d'un drone survolant Dakar..." :
                          "Que vois-tu sur cette image ?"
                        }
                        className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-[120px]"
                      />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Choisir l'Influenceur</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['1', '2', '7'].map(id => (
                                    <button 
                                      key={id}
                                      onClick={() => setSelectedAvatarId(id)}
                                      className={`p-2 rounded-xl border-2 transition-all ${selectedAvatarId === id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-200'}`}
                                    >
                                        <Avatar3D avatarId={id} state="idle" className="w-full h-24 rounded-lg pointer-events-none" showHud={false} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Script à prononcer</label>
                            <textarea
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              placeholder="Bonjour à tous, bienvenue dans ce nouveau tutoriel..."
                              className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-[120px]"
                            />
                        </div>
                    </div>
                )}

                {/* Configs (Image/Video Only) */}
                {(activeTab === 'image' || activeTab === 'video') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Format</label>
                      <select 
                        value={aspectRatio} 
                        onChange={(e) => setAspectRatio(e.target.value as any)}
                        className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                      >
                        <option value="1:1">Carré (1:1) {activeTab === 'video' ? '(Non supporté par Veo)' : ''}</option>
                        <option value="16:9">Paysage (16:9)</option>
                        <option value="9:16">Portrait (9:16)</option>
                      </select>
                    </div>
                    {activeTab === 'image' && (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Résolution</label>
                        <select 
                          value={imageSize} 
                          onChange={(e) => setImageSize(e.target.value as any)}
                          className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                        >
                          <option value="1K">Standard (1K)</option>
                          <option value="2K">Haute (2K)</option>
                          <option value="4K">Ultra (4K)</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!prompt && !visionImage)}
                  className={`
                    w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                    ${isGenerating || (!prompt && !visionImage)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-brand-600 text-white shadow-lg hover:bg-brand-700 hover:scale-[1.01]'}
                  `}
                >
                  {isGenerating ? <Sparkles className="animate-spin" /> : activeTab === 'avatar' ? <Play /> : <Sparkles />}
                  {activeTab === 'vision' ? 'Analyser' : activeTab === 'avatar' ? 'Générer Vidéo' : 'Générer'}
                </button>
             </div>

             {/* Result Area */}
             <div className="bg-gray-900 rounded-2xl flex items-center justify-center min-h-[400px] overflow-hidden relative border border-gray-800 flex-col">
                 {isGenerating ? (
                    <div className="text-center space-y-4">
                       <div className="relative w-20 h-20 mx-auto">
                          <div className="absolute inset-0 border-4 border-brand-500/30 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                       </div>
                       <p className="text-gray-400 text-sm animate-pulse">Création en cours par Gemini...</p>
                    </div>
                 ) : activeTab === 'avatar' ? (
                     <div className="w-full h-full relative flex-1 min-h-[350px]">
                          <Avatar3D 
                              avatarId={selectedAvatarId}
                              state={avatarState}
                              className="w-full h-full"
                          />
                          {avatarState === 'idle' && prompt && (
                              <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                                  <p className="text-white/50 text-xs">Prévisualisation (Simulée)</p>
                              </div>
                          )}
                     </div>
                 ) : result ? (
                    <div className="w-full h-full flex flex-col justify-between">
                      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                        {activeTab === 'video' ? (
                           <div className="w-full h-full">
                              <video src={result} controls autoPlay loop className="w-full h-full object-contain" />
                           </div>
                        ) : activeTab === 'image' ? (
                           <div className="relative group w-full h-full flex items-center justify-center">
                              <img src={result} alt="Génération Studio" className="max-w-full max-h-full object-contain" />
                              <a href={result} download="generated.png" className="absolute bottom-4 right-4 bg-white/10 backdrop-blur hover:bg-white/20 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Download size={20} />
                              </a>
                           </div>
                        ) : (
                           <div className="p-6 text-white w-full h-full overflow-y-auto">
                              <h3 className="text-brand-400 font-bold mb-4 flex items-center gap-2"><Eye size={20} /> Analyse Vision</h3>
                              <p className="whitespace-pre-wrap leading-relaxed text-gray-300">{result}</p>
                           </div>
                        )}
                      </div>

                      {/* Action Bar : Partage direct vers le Hub Collaboratif */}
                      <div className="p-4 bg-gray-950/80 border-t border-gray-800 flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-400 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-blue-400" /> Résultat prêt
                        </span>
                        <button
                          onClick={handleShareResultToCollaboration}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
                        >
                          <Share2 size={14} /> Partager dans le Hub Collaboratif
                        </button>
                      </div>
                    </div>
                 ) : (
                    <div className="text-center text-gray-600">
                       <MonitorPlay size={48} className="mx-auto mb-4 opacity-20" />
                       <p className="text-sm">Le résultat apparaîtra ici.</p>
                    </div>
                 )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
