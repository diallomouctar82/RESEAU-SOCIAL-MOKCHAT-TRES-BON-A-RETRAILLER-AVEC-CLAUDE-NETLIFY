import React, { useState } from 'react';
import { generateVideo as generateVideoWithAi } from '../services/aiGateway';
import { Video, Sparkles, AlertCircle, Play, Download } from 'lucide-react';

export const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [error, setError] = useState<string | null>(null);

  const checkApiKey = async () => {
    // Basic check wrapper as per instructions
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if(!hasKey) {
            await window.aistudio.openSelectKey();
        }
        return true;
    }
    return true; // Fallback if not in the specific testing environment
  };

  const generateVideo = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setVideoUri(null);
    setError(null);

    try {
      await checkApiKey();

      const uri = await generateVideoWithAi(prompt, {
        params: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio,
        }
      });

      if (uri) {
        setVideoUri(uri);
      } else {
        throw new Error("No video generated");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur de génération vidéo");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Video className="text-purple-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Studio Souvenirs & Visualisation</h2>
            <p className="text-gray-500">Générez des vidéos de vos futures destinations ou projets.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Votre vision (Prompt)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Une vue cinématique d'un hôtel moderne à Dakar au coucher du soleil, style drone..."
              className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px]"
            />
          </div>

          <div className="flex gap-4">
             <div className="flex-1">
               <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
               <div className="flex gap-2">
                 <button 
                   onClick={() => setAspectRatio('16:9')}
                   className={`flex-1 py-2 px-4 rounded-lg border ${aspectRatio === '16:9' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200'}`}
                 >
                   Paysage (16:9)
                 </button>
                 <button 
                   onClick={() => setAspectRatio('9:16')}
                   className={`flex-1 py-2 px-4 rounded-lg border ${aspectRatio === '9:16' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200'}`}
                 >
                   Portrait (9:16)
                 </button>
               </div>
             </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <button
            onClick={generateVideo}
            disabled={isGenerating || !prompt}
            className={`
              w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
              ${isGenerating || !prompt 
                ? 'bg-gray-100 text-gray-400' 
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.01]'}
            `}
          >
            {isGenerating ? (
              <>
                <Sparkles className="animate-spin" /> Génération en cours (cela peut prendre du temps)...
              </>
            ) : (
              <>
                <Sparkles /> Générer la vidéo
              </>
            )}
          </button>
        </div>
      </div>

      {videoUri && (
        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
          <video 
            src={videoUri} 
            controls 
            className="w-full max-h-[600px] mx-auto"
            autoPlay 
            loop
          />
          <div className="p-4 bg-gray-900 flex justify-between items-center text-white">
            <span className="text-sm text-gray-400">Généré par Veo</span>
            <a href={videoUri} download="video.mp4" className="flex items-center gap-2 hover:text-purple-400">
              <Download size={18} /> Télécharger
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
