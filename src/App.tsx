import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  User, 
  Image as ImageIcon, 
  Library, 
  Download, 
  Trash2, 
  RefreshCw, 
  Edit3, 
  ChevronRight,
  Upload,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { Character, Scene, AppTab } from './types';
import { generateCharacter, generateScene, editScene } from './services/ai';
import { cn } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('characters');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  
  // Character Creation State
  const [charName, setCharName] = useState('');
  const [charPrompt, setCharPrompt] = useState('');
  const [isGeneratingChar, setIsGeneratingChar] = useState(false);
  const [previewCharUrl, setPreviewCharUrl] = useState<string | null>(null);

  // Scene Creation State
  const [scenePrompt, setScenePrompt] = useState('');
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('16:9');
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [previewSceneUrl, setPreviewSceneUrl] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');

  // Load data
  useEffect(() => {
    const savedChars = localStorage.getItem('ai_chars');
    const savedScenes = localStorage.getItem('ai_scenes');
    if (savedChars) setCharacters(JSON.parse(savedChars));
    if (savedScenes) setScenes(JSON.parse(savedScenes));
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('ai_chars', JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    localStorage.setItem('ai_scenes', JSON.stringify(scenes));
  }, [scenes]);

  const handleCreateCharacter = async () => {
    if (!charPrompt) return;
    setIsGeneratingChar(true);
    try {
      const url = await generateCharacter(charPrompt);
      setPreviewCharUrl(url);
    } catch (error) {
      console.error(error);
      alert("Failed to generate character");
    } finally {
      setIsGeneratingChar(false);
    }
  };

  const saveCharacter = () => {
    if (!previewCharUrl) return;
    const newChar: Character = {
      id: crypto.randomUUID(),
      name: charName || 'Untitled Character',
      imageUrl: previewCharUrl,
      prompt: charPrompt,
      createdAt: Date.now(),
    };
    setCharacters([newChar, ...characters]);
    setPreviewCharUrl(null);
    setCharName('');
    setCharPrompt('');
    setActiveTab('library');
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewCharUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    multiple: false 
  } as any);

  const handleCreateScene = async () => {
    if (!scenePrompt || selectedCharIds.length === 0) return;
    setIsGeneratingScene(true);
    try {
      const selectedChars = characters.filter(c => selectedCharIds.includes(c.id));
      const url = await generateScene(scenePrompt, selectedChars, aspectRatio);
      setPreviewSceneUrl(url);
    } catch (error) {
      console.error(error);
      alert("Failed to generate scene");
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const handleEditScene = async () => {
    if (!previewSceneUrl || !editPrompt) return;
    setIsGeneratingScene(true);
    try {
      const url = await editScene(previewSceneUrl, editPrompt);
      setPreviewSceneUrl(url);
      setEditPrompt('');
      setEditMode(false);
    } catch (error) {
      console.error(error);
      alert("Failed to edit scene");
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const saveScene = () => {
    if (!previewSceneUrl) return;
    const newScene: Scene = {
      id: crypto.randomUUID(),
      imageUrl: previewSceneUrl,
      prompt: scenePrompt,
      characterIds: selectedCharIds,
      aspectRatio,
      createdAt: Date.now(),
    };
    setScenes([newScene, ...scenes]);
    setPreviewSceneUrl(null);
    setScenePrompt('');
    setSelectedCharIds([]);
    setActiveTab('library');
  };

  const deleteCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
    setSelectedCharIds(selectedCharIds.filter(cid => cid !== id));
  };

  const deleteScene = (id: string) => {
    setScenes(scenes.filter(s => s.id !== id));
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-50">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 bg-white border-r-2 border-brutal-black p-6 flex flex-col gap-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-neon-green brutal-border flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="font-display text-xl tracking-tighter uppercase">AI Studio</h1>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('characters')}
            className={cn(
              "flex items-center gap-3 p-3 font-bold transition-all",
              activeTab === 'characters' ? "bg-neon-green brutal-border" : "hover:bg-zinc-100"
            )}
          >
            <User className="w-5 h-5" />
            <span>Create Character</span>
          </button>
          <button 
            onClick={() => setActiveTab('scenes')}
            className={cn(
              "flex items-center gap-3 p-3 font-bold transition-all",
              activeTab === 'scenes' ? "bg-neon-green brutal-border" : "hover:bg-zinc-100"
            )}
          >
            <ImageIcon className="w-5 h-5" />
            <span>Create Scene</span>
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={cn(
              "flex items-center gap-3 p-3 font-bold transition-all",
              activeTab === 'library' ? "bg-neon-green brutal-border" : "hover:bg-zinc-100"
            )}
          >
            <Library className="w-5 h-5" />
            <span>Library</span>
          </button>
        </div>

        <div className="mt-auto pt-8 border-t border-zinc-200">
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Quick Stats</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white brutal-border">
              <div className="text-2xl font-display">{characters.length}</div>
              <div className="text-[10px] uppercase font-bold text-zinc-500">Chars</div>
            </div>
            <div className="p-3 bg-white brutal-border">
              <div className="text-2xl font-display">{scenes.length}</div>
              <div className="text-[10px] uppercase font-bold text-zinc-500">Scenes</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-h-screen">
        <AnimatePresence mode="wait">
          {activeTab === 'characters' && (
            <motion.div 
              key="char-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="space-y-2">
                <h2 className="text-5xl font-display uppercase tracking-tighter">Character Creator</h2>
                <p className="text-zinc-500 font-medium">Design your protagonist or upload an existing one.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Character Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Luna the Brave"
                      className="w-full brutal-input"
                      value={charName}
                      onChange={(e) => setCharName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">AI Prompt</label>
                    <textarea 
                      placeholder="Describe your character in detail..."
                      className="w-full brutal-input min-h-[150px] resize-none"
                      value={charPrompt}
                      onChange={(e) => setCharPrompt(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={handleCreateCharacter}
                      disabled={isGeneratingChar || !charPrompt}
                      className="flex-1 brutal-btn bg-neon-green flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isGeneratingChar ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      <span>{isGeneratingChar ? 'Generating...' : 'Generate AI'}</span>
                    </button>
                    
                    <div {...getRootProps()} className="cursor-pointer">
                      <input {...getInputProps()} />
                      <button className="brutal-btn flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        <span>Upload</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-full aspect-square bg-white brutal-border relative overflow-hidden flex items-center justify-center group">
                    {previewCharUrl ? (
                      <>
                        <img src={previewCharUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button onClick={saveCharacter} className="brutal-btn bg-neon-green">Save to Library</button>
                          <button onClick={() => setPreviewCharUrl(null)} className="brutal-btn bg-white">Discard</button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-8 space-y-4">
                        <User className="w-16 h-16 mx-auto text-zinc-200" />
                        <p className="text-zinc-400 font-mono text-sm uppercase">No character generated yet</p>
                      </div>
                    )}
                    {isGeneratingChar && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <RefreshCw className="w-12 h-12 animate-spin text-neon-green" />
                        <p className="font-display text-xl uppercase">Creating character...</p>
                      </div>
                    )}
                  </div>
                  {previewCharUrl && (
                    <p className="mt-4 text-xs font-mono text-zinc-500 uppercase">Click 'Save' to add to your library</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'scenes' && (
            <motion.div 
              key="scene-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto space-y-12"
            >
              <div className="space-y-2">
                <h2 className="text-5xl font-display uppercase tracking-tighter">Scene Creator</h2>
                <p className="text-zinc-500 font-medium">Place your characters into immersive worlds.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">1. Select Characters</label>
                    <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-2 brutal-border bg-white">
                      {characters.length > 0 ? (
                        characters.map(char => (
                          <button
                            key={char.id}
                            onClick={() => {
                              if (selectedCharIds.includes(char.id)) {
                                setSelectedCharIds(selectedCharIds.filter(id => id !== char.id));
                              } else {
                                setSelectedCharIds([...selectedCharIds, char.id]);
                              }
                            }}
                            className={cn(
                              "aspect-square brutal-border overflow-hidden relative group",
                              selectedCharIds.includes(char.id) ? "ring-4 ring-neon-green" : ""
                            )}
                          >
                            <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                            {selectedCharIds.includes(char.id) && (
                              <div className="absolute inset-0 bg-neon-green/20 flex items-center justify-center">
                                <Check className="w-6 h-6 text-brutal-black" />
                              </div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="col-span-3 py-8 text-center text-zinc-400 text-xs uppercase font-mono">
                          No characters found. Create some first!
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">2. Scene Prompt</label>
                    <textarea 
                      placeholder="Describe the environment and what the characters are doing..."
                      className="w-full brutal-input min-h-[120px] resize-none"
                      value={scenePrompt}
                      onChange={(e) => setScenePrompt(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">3. Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['1:1', '16:9', '9:16'] as const).map(ratio => (
                        <button
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          className={cn(
                            "brutal-btn text-xs",
                            aspectRatio === ratio ? "bg-neon-green" : "bg-white"
                          )}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleCreateScene}
                    disabled={isGeneratingScene || !scenePrompt || selectedCharIds.length === 0}
                    className="w-full brutal-btn bg-neon-green flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGeneratingScene ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    <span>{isGeneratingScene ? 'Generating Scene...' : 'Create Scene'}</span>
                  </button>
                </div>

                <div className="lg:col-span-8 flex flex-col items-center justify-center">
                  <div className={cn(
                    "w-full bg-white brutal-border relative overflow-hidden flex items-center justify-center group",
                    aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[600px]' : 'aspect-square'
                  )}>
                    {previewSceneUrl ? (
                      <>
                        <img src={previewSceneUrl} alt="Scene Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button onClick={saveScene} className="brutal-btn bg-neon-green">Save to Library</button>
                          <button onClick={() => setEditMode(true)} className="brutal-btn bg-white flex items-center gap-2">
                            <Edit3 className="w-4 h-4" /> Edit
                          </button>
                          <button onClick={() => setPreviewSceneUrl(null)} className="brutal-btn bg-white">Discard</button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-8 space-y-4">
                        <ImageIcon className="w-16 h-16 mx-auto text-zinc-200" />
                        <p className="text-zinc-400 font-mono text-sm uppercase">Select characters and describe a scene</p>
                      </div>
                    )}
                    {isGeneratingScene && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <RefreshCw className="w-12 h-12 animate-spin text-neon-green" />
                        <p className="font-display text-xl uppercase">Painting your scene...</p>
                      </div>
                    )}
                  </div>

                  {editMode && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 w-full p-6 bg-white brutal-border space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold uppercase text-sm">AI Edit Mode</h3>
                        <button onClick={() => setEditMode(false)}><X className="w-4 h-4" /></button>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="What would you like to change? (e.g. 'Make it sunset')"
                          className="flex-1 brutal-input"
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                        />
                        <button 
                          onClick={handleEditScene}
                          disabled={isGeneratingScene || !editPrompt}
                          className="brutal-btn bg-neon-green disabled:opacity-50"
                        >
                          Apply
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div 
              key="library-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="space-y-2">
                <h2 className="text-5xl font-display uppercase tracking-tighter">Project Library</h2>
                <p className="text-zinc-500 font-medium">Manage your characters and generated scenes.</p>
              </div>

              <div className="space-y-12">
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-display uppercase">Characters</h3>
                    <div className="h-px flex-1 bg-zinc-200"></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {characters.map(char => (
                      <div key={char.id} className="group space-y-2">
                        <div className="aspect-square brutal-border bg-white overflow-hidden relative">
                          <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button 
                              onClick={() => downloadImage(char.imageUrl, `${char.name}.png`)}
                              className="p-2 bg-white brutal-border hover:bg-neon-green"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteCharacter(char.id)}
                              className="p-2 bg-white brutal-border hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="font-bold text-sm truncate">{char.name}</p>
                      </div>
                    ))}
                    <button 
                      onClick={() => setActiveTab('characters')}
                      className="aspect-square brutal-border border-dashed border-zinc-300 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-neon-green hover:border-neon-green transition-colors"
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-[10px] font-bold uppercase">New Character</span>
                    </button>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-display uppercase">Scenes</h3>
                    <div className="h-px flex-1 bg-zinc-200"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {scenes.map(scene => (
                      <div key={scene.id} className="group space-y-3">
                        <div className={cn(
                          "brutal-border bg-white overflow-hidden relative",
                          scene.aspectRatio === '16:9' ? 'aspect-video' : scene.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'
                        )}>
                          <img src={scene.imageUrl} alt="Scene" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button 
                              onClick={() => downloadImage(scene.imageUrl, `scene-${scene.id}.png`)}
                              className="brutal-btn bg-white flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" /> Download
                            </button>
                            <button 
                              onClick={() => deleteScene(scene.id)}
                              className="brutal-btn bg-white hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-start">
                          <p className="text-xs text-zinc-500 font-mono line-clamp-2 flex-1 mr-4 italic">"{scene.prompt}"</p>
                          <div className="text-[10px] font-bold uppercase bg-zinc-100 px-2 py-1 brutal-border">{scene.aspectRatio}</div>
                        </div>
                      </div>
                    ))}
                    {scenes.length === 0 && (
                      <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-200 rounded-xl">
                        <ImageIcon className="w-12 h-12 mx-auto text-zinc-200 mb-4" />
                        <p className="text-zinc-400 font-mono uppercase">No scenes created yet</p>
                        <button 
                          onClick={() => setActiveTab('scenes')}
                          className="mt-4 brutal-btn bg-neon-green"
                        >
                          Create your first scene
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
