
import React, { useState, useRef, useEffect } from 'react';
import { PlayCircle, Clock, Users, Star, ArrowRight, BookOpen, CheckCircle, Lock, MessageSquare, ChevronLeft, Send, Mic, Square, Award, FileText, AlertCircle, Sparkles, Volume2, Loader2, PauseCircle, Trophy, Plus, GraduationCap, School, Book, PenTool, Check, Database, RefreshCw, Printer, BrainCircuit, Library, Dumbbell } from 'lucide-react';
import { Course, Review, EvaluationResult, EvaluationStatus, Lesson, AcademicLevel, UserProfile, ExamSession, QuizQuestion, Certificate } from '../types';
import { GoogleGenAI } from '@google/genai';
import { cloudService } from '../services/cloud';
import { useGlobal } from '../contexts/GlobalContext';

interface CampusProps {
    onExamPass?: (courseTitle: string, grade: number) => void;
}

type ViewState = 'catalog' | 'classroom' | 'revision' | 'exam-intro' | 'exam-session' | 'exam-result' | 'certificate-view' | 'my-diplomas';
type LessonTab = 'theory' | 'practice' | 'resources';

export const Campus: React.FC<CampusProps> = ({ onExamPass }) => {
  const { userProfile, updateUserXp, addNotification } = useGlobal();
  const [currentView, setCurrentView] = useState<ViewState>('catalog');
  const [courses, setCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<AcademicLevel | 'All'>('All');
  
  // Lesson State
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [lessonTab, setLessonTab] = useState<LessonTab>('theory');
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [lessonContent, setLessonContent] = useState<string>('');
  const [practiceContent, setPracticeContent] = useState<string>('');
  const [resourcesContent, setResourcesContent] = useState<string>('');

  // AI Coach/Revision State
  const [revisionNote, setRevisionNote] = useState<string | null>(null);
  const [isGeneratingRevision, setIsGeneratingRevision] = useState(false);
  const [revisionChat, setRevisionChat] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [revisionInput, setRevisionInput] = useState('');
  
  // Exam State
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isExamSubmitting, setIsExamSubmitting] = useState(false);
  
  // Certificate State
  const [earnedCertificate, setEarnedCertificate] = useState<Certificate | null>(null);

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
      loadData();
  }, [userProfile.id]);

  const loadData = async () => {
      setIsLoadingCourses(true);
      const allCourses = await cloudService.getAllCourses();
      const enrollments = await cloudService.getStudentEnrollments(userProfile.id);
      const myCerts = await cloudService.getCertificates(); // Assuming this method exists or filters by user
      
      // Filter certs for current user (mock filter if API returns all)
      const userCerts = myCerts.filter(c => c.studentName === userProfile.name);
      setCertificates(userCerts);

      const enrichedCourses = allCourses.map(c => {
          const enroll = enrollments.find(e => e.courseId === c.id);
          const totalLessons = c.lessons?.length || 1;
          const completed = enroll?.completedLessons.length || 0;
          return {
              ...c,
              isEnrolled: !!enroll,
              progress: (completed / totalLessons) * 100
          };
      });
      
      setCourses(enrichedCourses);
      setIsLoadingCourses(false);
  };

  // --- LESSON LOGIC & AI GENERATION ---

  const handleOpenLesson = async (lesson: Lesson) => {
      if (!selectedCourse) return;
      setActiveLesson(lesson);
      setLessonTab('theory');
      setPracticeContent('');
      setResourcesContent('');
      
      // Check if content exists (mock check, ideally stored in Lesson object)
      // For now we regenerate if empty to simulate "Detailed Lesson Flow" on demand
      if (lesson.content && lesson.content.length > 100) {
          setLessonContent(lesson.content);
      } else {
          await generateLessonContent(lesson, 'theory');
      }
      
      setCurrentView('classroom');
  };

  const generateLessonContent = async (lesson: Lesson, type: LessonTab) => {
      if (!selectedCourse) return;
      setIsGeneratingContent(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          let prompt = "";
          
          if (type === 'theory') {
              prompt = `
                Tu es Professeur à ${selectedCourse.institution}.
                Cours : "${selectedCourse.title}". Niveau : ${selectedCourse.level}.
                Leçon : "${lesson.title}".
                
                Rédige le cours théorique COMPLET (800+ mots).
                Structure : Introduction, Concepts Clés, Approfondissement, Exemples, Conclusion.
                Format : Markdown académique.
              `;
          } else if (type === 'practice') {
              prompt = `
                Pour le cours "${selectedCourse.title}" (Leçon: ${lesson.title}), génère un Exercice Pratique complet.
                - Cas d'étude concret ou problème à résoudre.
                - Instructions étape par étape.
                - Solution type (cachée ou à la fin).
                Format : Markdown.
              `;
          } else if (type === 'resources') {
              prompt = `
                Pour le cours "${selectedCourse.title}" (Leçon: ${lesson.title}), liste 5 ressources bibliographiques ou web de référence.
                Format : Liste Markdown avec brève description pour chaque ressource.
              `;
          }

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt
          });

          const content = response.text || "Contenu indisponible.";
          
          if (type === 'theory') {
              setLessonContent(content);
              // Persist logic would go here
          } else if (type === 'practice') {
              setPracticeContent(content);
          } else if (type === 'resources') {
              setResourcesContent(content);
          }

      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingContent(false);
      }
  };

  const handleTabChange = (tab: LessonTab) => {
      setLessonTab(tab);
      if (tab === 'practice' && !practiceContent && activeLesson) generateLessonContent(activeLesson, 'practice');
      if (tab === 'resources' && !resourcesContent && activeLesson) generateLessonContent(activeLesson, 'resources');
  };

  const handleCompleteLesson = async (lessonId: string) => {
      if (!selectedCourse) return;
      await cloudService.updateLessonProgress(userProfile.id, selectedCourse.id, lessonId);
      
      if (!completedLessonIds.includes(lessonId)) {
          setCompletedLessonIds([...completedLessonIds, lessonId]);
          updateUserXp(50);
      }
      
      // Auto advance
      const idx = selectedCourse.lessons?.findIndex(l => l.id === lessonId) || 0;
      if (selectedCourse.lessons && idx < selectedCourse.lessons.length - 1) {
          handleOpenLesson(selectedCourse.lessons[idx + 1]);
      }
  };

  // --- REVISION COACH ---
  
  const handleRevisionChat = async () => {
      if (!revisionInput.trim() || !selectedCourse) return;
      const userMsg = revisionInput;
      setRevisionInput('');
      setRevisionChat(prev => [...prev, {role: 'user', text: userMsg}]);
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `Tu es un coach de révision pour le cours "${selectedCourse.title}". 
          L'étudiant te dit : "${userMsg}".
          Réponds de manière pédagogique. Si l'étudiant demande un quiz, pose une question de cours.
          `;
          
          const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
          setRevisionChat(prev => [...prev, {role: 'model', text: response.text || "Je n'ai pas compris."}]);
      } catch (e) { console.error(e); }
  };

  const handleGenerateRevision = async () => {
      if (!selectedCourse) return;
      setIsGeneratingRevision(true);
      setCurrentView('revision');
      setRevisionChat([{role: 'model', text: "Bonjour ! Je suis votre coach personnel. Prêt à réviser ? Demandez-moi un résumé ou un quiz."}]);
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `Génère une fiche de révision dense pour : "${selectedCourse.title}". Concepts clés, Dates, Formules. Markdown.`;
          const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
          setRevisionNote(response.text || "");
      } catch (e) { console.error(e); } finally { setIsGeneratingRevision(false); }
  };

  // --- EXAM ENGINE ---

  const prepareExam = async () => {
      if (!selectedCourse) return;
      setIsExamSubmitting(true);
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `
            Génère un examen final SÉRIEUX et DIFFICILE pour le cours "${selectedCourse.title}" (${selectedCourse.level}).
            10 Questions à Choix Multiples (QCM).
            Réponds en JSON strict :
            [ { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..." } ]
          `;
          
          const response = await ai.models.generateContent({
              model: 'gemini-3-pro-preview',
              contents: prompt,
              config: { responseMimeType: 'application/json' }
          });
          
          const questions = JSON.parse(response.text || '[]') as QuizQuestion[];
          
          const newSession: ExamSession = {
              id: Date.now().toString(),
              courseId: selectedCourse.id,
              startedAt: new Date(),
              questions: questions.map((q, i) => ({ ...q, id: `q${i}`, difficulty: 'hard' })),
              answers: {},
              passed: false,
              isFinished: false
          };
          
          setExamSession(newSession);
          setTimeLeft(1200); // 20 minutes
          setCurrentView('exam-session');
          
          const timer = setInterval(() => {
              setTimeLeft(prev => {
                  if (prev <= 1) {
                      clearInterval(timer);
                      submitExam(newSession);
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
          
      } catch (e) {
          console.error(e);
          addNotification("Erreur", "Impossible de générer l'examen.", "alert");
      } finally {
          setIsExamSubmitting(false);
      }
  };

  const submitExam = async (currentSession: ExamSession) => {
      if (!selectedCourse) return;
      setIsExamSubmitting(true);
      
      let correctCount = 0;
      currentSession.questions.forEach((q, i) => {
          if (currentSession.answers[q.id] === q.correctIndex) correctCount++;
      });
      
      const score = (correctCount / currentSession.questions.length) * 20;
      const passed = score >= 10;
      
      const finishedSession = { ...currentSession, score, passed, isFinished: true };
      setExamSession(finishedSession);
      
      await cloudService.saveExamSession(userProfile.id, selectedCourse.id, finishedSession);
      
      if (passed) {
          const cert: Certificate = {
              id: `CERT-${Date.now()}`,
              courseId: selectedCourse.id,
              courseTitle: selectedCourse.title,
              studentName: userProfile.name,
              issueDate: new Date().toLocaleDateString(),
              grade: score,
              serialNumber: `LMAV-${selectedCourse.id.toUpperCase()}-${Math.floor(Math.random()*100000)}`,
              institution: selectedCourse.institution
          };
          await cloudService.issueCertificate(cert);
          setEarnedCertificate(cert);
          setCertificates(prev => [...prev, cert]);
          if (onExamPass) onExamPass(selectedCourse.title, score);
      }
      
      setIsExamSubmitting(false);
      setCurrentView('exam-result');
  };

  const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // --- VIEWS ---

  if (currentView === 'catalog') {
      return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-12 animate-fade-up pb-32">
          <div className="flex justify-between items-center">
              <h1 className="text-3xl font-black text-slate-900">Campus Académique</h1>
              <button 
                onClick={() => setCurrentView('my-diplomas')}
                className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
              >
                  <Award className="text-yellow-500" /> Mes Diplômes ({certificates.length})
              </button>
          </div>

          {/* Hero */}
          <div className="bg-slate-900 text-white rounded-[3rem] p-12 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[150px] opacity-20"></div>
              <div className="relative z-10 max-w-3xl">
                  <span className="bg-white/10 backdrop-blur border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 w-fit mb-6">
                      <School size={14} /> Institution Certifiée
                  </span>
                  <h2 className="text-6xl font-black mb-6 leading-tight">
                      L'Excellence <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">à Portée de Main.</span>
                  </h2>
                  <p className="text-xl text-slate-300 font-light max-w-2xl leading-relaxed">
                      Accédez à 40+ formations de niveau Ivy League & Grandes Écoles.
                      Obtenez des diplômes reconnus et propulsez votre carrière internationale.
                  </p>
              </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 overflow-x-auto pb-4">
              {['All', 'Primaire', 'Secondaire', 'Licence', 'Master', 'Doctorat', 'Pro'].map(lvl => (
                  <button 
                    key={lvl} 
                    onClick={() => setSelectedLevel(lvl as any)}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${selectedLevel === lvl ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                  >
                      {lvl === 'All' ? 'Tout le catalogue' : lvl}
                  </button>
              ))}
          </div>

          {/* Course Grid */}
          {isLoadingCourses ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={48} /></div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {(selectedLevel === 'All' ? courses : courses.filter(c => c.level === selectedLevel)).map(course => (
                      <div key={course.id} onClick={() => { setSelectedCourse(course); setCurrentView('classroom'); }} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full">
                          <div className="h-48 relative overflow-hidden bg-slate-900">
                              <img src={course.thumbnailUrl} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
                              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{course.level}</div>
                              <div className="absolute bottom-4 left-4 text-white font-bold text-xs flex items-center gap-1"><School size={12} /> {course.institution}</div>
                          </div>
                          <div className="p-6 flex-1 flex flex-col">
                              <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{course.title}</h3>
                              <p className="text-xs text-slate-500 line-clamp-2 mb-4">{course.description}</p>
                              <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                                  {course.isEnrolled ? (
                                      <div className="flex-1 mr-4">
                                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1"><span>Progression</span><span>{Math.round(course.progress || 0)}%</span></div>
                                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 w-full" style={{ width: `${course.progress}%` }}></div></div>
                                      </div>
                                  ) : (
                                      <span className="text-xs font-bold text-indigo-600">S'inscrire</span>
                                  )}
                                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors"><ArrowRight size={16} /></div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
        </div>
      );
  }

  // --- MY DIPLOMAS VIEW ---
  if (currentView === 'my-diplomas') {
      return (
          <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-up">
              <button onClick={() => setCurrentView('catalog')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-4"><ChevronLeft /> Retour au Campus</button>
              <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3"><Award className="text-yellow-500" /> Mes Certifications</h1>
              
              {certificates.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                      <GraduationCap size={64} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-500">Aucun diplôme obtenu pour le moment.</p>
                      <button onClick={() => setCurrentView('catalog')} className="mt-4 text-indigo-600 font-bold hover:underline">Commencer un cours</button>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {certificates.map(cert => (
                          <div key={cert.id} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg relative overflow-hidden group">
                              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                              <div className="flex justify-between items-start mb-6">
                                  <School size={32} className="text-slate-800" />
                                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle size={12} /> Validé</div>
                              </div>
                              <h3 className="font-serif text-2xl font-bold text-slate-900 mb-1">{cert.courseTitle}</h3>
                              <p className="text-sm text-slate-500 mb-6">{cert.institution}</p>
                              <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                                  <div>
                                      <div className="text-[10px] text-slate-400 uppercase font-bold">Délivré le</div>
                                      <div className="text-sm font-medium">{cert.issueDate}</div>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-[10px] text-slate-400 uppercase font-bold">Note Finale</div>
                                      <div className="text-xl font-black text-indigo-900">{cert.grade.toFixed(1)}/20</div>
                                  </div>
                              </div>
                              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEarnedCertificate(cert); setCurrentView('certificate-view'); }} className="bg-slate-900 text-white p-2 rounded-lg"><Printer size={16} /></button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  }

  // --- CLASSROOM / EXAM VIEWS ---
  return (
      <div className="flex flex-col h-full bg-slate-50 animate-fade-up">
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
              <div className="flex items-center gap-4">
                  <button onClick={() => setCurrentView('catalog')} className="p-2 hover:bg-gray-100 rounded-full text-slate-500"><ChevronLeft size={24} /></button>
                  <div>
                      <h1 className="text-lg font-bold text-slate-900 line-clamp-1">{selectedCourse?.title}</h1>
                      <div className="text-xs text-slate-500 flex items-center gap-2"><School size={12} /> {selectedCourse?.institution}</div>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => setCurrentView('classroom')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${currentView === 'classroom' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}><BookOpen size={16} /> Cours</button>
                  <button onClick={handleGenerateRevision} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${currentView === 'revision' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}><FileText size={16} /> Révision</button>
                  <button onClick={() => setCurrentView('exam-intro')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${currentView.includes('exam') ? 'bg-red-600 text-white' : 'hover:bg-slate-100 text-red-600'}`}><GraduationCap size={16} /> Examen</button>
              </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 relative">
                  
                  {currentView === 'classroom' && (
                      activeLesson ? (
                          <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-sm border border-slate-200 min-h-screen overflow-hidden">
                              {/* Lesson Tabs */}
                              <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
                                  <button onClick={() => handleTabChange('theory')} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${lessonTab === 'theory' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}><BookOpen size={16} /> Théorie</button>
                                  <button onClick={() => handleTabChange('practice')} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${lessonTab === 'practice' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500 hover:text-slate-700'}`}><Dumbbell size={16} /> Pratique</button>
                                  <button onClick={() => handleTabChange('resources')} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${lessonTab === 'resources' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}><Library size={16} /> Ressources</button>
                              </div>

                              <div className="p-12">
                                  {isGeneratingContent ? (
                                      <div className="text-center py-20 space-y-4">
                                          <RefreshCw className="animate-spin mx-auto text-indigo-600" size={48} />
                                          <h3 className="text-xl font-bold text-slate-800">Génération du contenu pédagogique...</h3>
                                          <p className="text-slate-500">Le professeur Diallo prépare votre matériel.</p>
                                      </div>
                                  ) : (
                                      <div className="prose prose-slate max-w-none prose-lg animate-fade-up">
                                          <h1 className="text-4xl font-black text-slate-900 mb-8">{activeLesson.title}</h1>
                                          <div className="whitespace-pre-wrap leading-relaxed font-serif text-slate-800">
                                              {lessonTab === 'theory' ? lessonContent : lessonTab === 'practice' ? practiceContent : resourcesContent}
                                          </div>
                                          
                                          {lessonTab === 'theory' && (
                                              <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
                                                  <button onClick={() => handleCompleteLesson(activeLesson.id)} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg flex items-center gap-2">
                                                      Terminer le module <ArrowRight size={20} />
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                  )}
                              </div>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-400">
                              <BookOpen size={64} className="mb-4 opacity-20" />
                              <p>Sélectionnez un module à gauche pour commencer.</p>
                          </div>
                      )
                  )}

                  {currentView === 'revision' && (
                      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                          <div className="lg:col-span-2 bg-yellow-50 p-12 rounded-[2rem] shadow-sm border border-yellow-100 relative overflow-y-auto">
                              <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={120} className="text-yellow-600" /></div>
                              <h2 className="text-3xl font-bold text-yellow-900 mb-8 flex items-center gap-3"><FileText /> Fiche de Synthèse</h2>
                              {isGeneratingRevision ? <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-yellow-600" size={48} /></div> : 
                               <div className="prose prose-yellow max-w-none whitespace-pre-wrap">{revisionNote}</div>}
                          </div>
                          
                          {/* Revision Coach Chat */}
                          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-lg flex flex-col overflow-hidden h-[600px]">
                              <div className="p-4 bg-indigo-600 text-white font-bold flex items-center gap-2">
                                  <BrainCircuit size={20} /> Coach IA
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                                  {revisionChat.map((msg, i) => (
                                      <div key={i} className={`p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white ml-8' : 'bg-white border mr-8'}`}>
                                          {msg.text}
                                      </div>
                                  ))}
                              </div>
                              <div className="p-4 border-t flex gap-2">
                                  <input 
                                    value={revisionInput}
                                    onChange={e => setRevisionInput(e.target.value)}
                                    placeholder="Posez une question..."
                                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                                    onKeyDown={e => e.key === 'Enter' && handleRevisionChat()}
                                  />
                                  <button onClick={handleRevisionChat} className="bg-indigo-600 text-white p-2 rounded-lg"><Send size={16} /></button>
                              </div>
                          </div>
                      </div>
                  )}

                  {currentView === 'exam-intro' && (
                      <div className="max-w-2xl mx-auto mt-20 text-center space-y-8 animate-fade-up">
                          <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 shadow-xl border-4 border-white">
                              <GraduationCap size={64} />
                          </div>
                          <h2 className="text-4xl font-black text-slate-900">Examen Final de Certification</h2>
                          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-left space-y-4">
                              <div className="flex items-center gap-4"><Clock className="text-slate-400" /> <span className="font-bold">Durée : 20 Minutes</span></div>
                              <div className="flex items-center gap-4"><FileText className="text-slate-400" /> <span className="font-bold">10 Questions Complexes</span></div>
                              <div className="flex items-center gap-4"><CheckCircle className="text-slate-400" /> <span className="font-bold">Note requise : 10/20</span></div>
                              <div className="flex items-center gap-4"><Award className="text-slate-400" /> <span className="font-bold">Certificat Officiel à la clé</span></div>
                          </div>
                          <button onClick={prepareExam} className="bg-red-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all hover:scale-105">
                              {isExamSubmitting ? 'Préparation de la salle...' : 'Démarrer l\'Épreuve'}
                          </button>
                      </div>
                  )}

                  {currentView === 'exam-session' && examSession && (
                      <div className="max-w-3xl mx-auto mt-10 relative">
                          {/* Proctoring Simulation */}
                          <div className="absolute -top-12 right-0 flex items-center gap-2 text-red-600 text-xs font-bold animate-pulse">
                              <div className="w-3 h-3 bg-red-600 rounded-full"></div> Surveillance Active
                          </div>

                          <div className="flex justify-between items-center mb-8 sticky top-0 bg-slate-50 py-4 z-20">
                              <div className="text-xl font-bold text-slate-700">Question {currentQuestionIndex + 1} / {examSession.questions.length}</div>
                              <div className={`text-xl font-mono font-bold px-4 py-2 rounded-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white border border-slate-200'}`}>
                                  {formatTime(timeLeft)}
                              </div>
                          </div>
                          
                          <div className="bg-white p-10 rounded-3xl shadow-lg border border-slate-200">
                              <h3 className="text-2xl font-bold text-slate-900 mb-8 leading-relaxed">
                                  {examSession.questions[currentQuestionIndex].question}
                              </h3>
                              <div className="space-y-4">
                                  {examSession.questions[currentQuestionIndex].options.map((opt, idx) => (
                                      <button 
                                        key={idx}
                                        onClick={() => setExamSession({...examSession, answers: {...examSession.answers, [examSession.questions[currentQuestionIndex].id]: idx}})}
                                        className={`w-full text-left p-6 rounded-xl border-2 transition-all font-medium text-lg ${examSession.answers[examSession.questions[currentQuestionIndex].id] === idx ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}
                                      >
                                          <span className="font-bold mr-4 opacity-50">{String.fromCharCode(65 + idx)}.</span> {opt}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div className="flex justify-between mt-8">
                              <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(prev => prev - 1)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-white disabled:opacity-50">Précédent</button>
                              {currentQuestionIndex < examSession.questions.length - 1 ? (
                                  <button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800">Suivant</button>
                              ) : (
                                  <button onClick={() => submitExam(examSession)} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg">{isExamSubmitting ? 'Correction...' : 'Terminer l\'Examen'}</button>
                              )}
                          </div>
                      </div>
                  )}

                  {currentView === 'exam-result' && examSession && (
                      <div className="max-w-2xl mx-auto mt-20 text-center animate-fade-up">
                          <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ${examSession.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {examSession.passed ? <Trophy size={64} /> : <AlertCircle size={64} />}
                          </div>
                          <h2 className="text-4xl font-black text-slate-900 mb-2">{examSession.passed ? 'Félicitations !' : 'Échec'}</h2>
                          <div className="text-6xl font-black mb-8 text-slate-800">{examSession.score?.toFixed(1)} <span className="text-2xl text-slate-400">/ 20</span></div>
                          
                          {examSession.passed && earnedCertificate ? (
                              <div className="bg-white border-8 border-double border-slate-200 p-12 rounded-lg shadow-2xl relative overflow-hidden text-center mb-8 transform hover:scale-105 transition-transform cursor-pointer" onClick={() => setCurrentView('certificate-view')}>
                                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                                  <School size={48} className="mx-auto mb-4 text-slate-800" />
                                  <h3 className="font-serif text-3xl font-bold text-slate-900 mb-2 uppercase tracking-widest">Certificat de Réussite</h3>
                                  <p className="text-slate-500 italic mb-6">Décerné à {earnedCertificate.studentName}</p>
                                  <div className="text-xl font-bold text-indigo-900 mb-2">{earnedCertificate.courseTitle}</div>
                                  <div className="text-sm text-slate-400 font-mono">{earnedCertificate.serialNumber}</div>
                              </div>
                          ) : (
                              <button onClick={prepareExam} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800">Retenter l'examen</button>
                          )}
                      </div>
                  )}
                  
                  {currentView === 'certificate-view' && earnedCertificate && (
                      <div className="flex flex-col items-center justify-center h-full">
                          <div className="bg-[#fffbf0] p-16 rounded shadow-2xl border-[20px] border-slate-900 text-center max-w-4xl w-full relative">
                              <div className="absolute top-4 left-4 w-24 h-24 border-l-4 border-t-4 border-yellow-600"></div>
                              <div className="absolute bottom-4 right-4 w-24 h-24 border-r-4 border-b-4 border-yellow-600"></div>
                              
                              <h1 className="font-serif text-5xl font-black text-slate-900 mb-4 uppercase tracking-widest">Diplôme</h1>
                              <p className="text-xl text-slate-600 italic mb-8">Ce document certifie que</p>
                              <h2 className="text-4xl font-bold text-indigo-900 mb-8 font-serif decoration-4 underline decoration-yellow-400/50">{earnedCertificate.studentName}</h2>
                              <p className="text-xl text-slate-600 mb-4">a validé avec succès le parcours académique</p>
                              <h3 className="text-3xl font-bold text-slate-800 mb-12">{earnedCertificate.courseTitle}</h3>
                              
                              <div className="flex justify-between items-end mt-16 px-12">
                                  <div className="text-center">
                                      <div className="h-px w-48 bg-slate-900 mb-2"></div>
                                      <p className="font-bold text-slate-900">Directeur Pédagogique</p>
                                  </div>
                                  <div className="w-32 h-32 bg-yellow-500/20 rounded-full flex items-center justify-center border-4 border-yellow-600 text-yellow-800 font-bold stamp rotate-12">
                                      OFFICIEL
                                  </div>
                                  <div className="text-center">
                                      <div className="font-mono text-sm text-slate-500 mb-2">{new Date().toLocaleDateString()}</div>
                                      <div className="h-px w-48 bg-slate-900 mb-2"></div>
                                      <p className="font-bold text-slate-900">Date de Délivrance</p>
                                  </div>
                              </div>
                          </div>
                          <button onClick={() => window.print()} className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg no-print">
                              <Printer size={20} /> Imprimer / PDF
                          </button>
                      </div>
                  )}

              </div>

              {/* Sidebar */}
              {currentView === 'classroom' && (
                  <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full z-20">
                      <div className="p-4 border-b border-gray-200 font-bold text-slate-700">Programme</div>
                      <div className="flex-1 overflow-y-auto p-2">
                          {selectedCourse?.lessons?.map((lesson, i) => (
                              <button 
                                key={lesson.id} 
                                disabled={lesson.isLocked}
                                onClick={() => handleOpenLesson(lesson)}
                                className={`w-full text-left p-3 rounded-lg mb-1 flex items-center gap-3 transition-colors ${activeLesson?.id === lesson.id ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : lesson.isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 text-slate-700'}`}
                              >
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${completedLessonIds.includes(lesson.id) ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                      {completedLessonIds.includes(lesson.id) ? <Check size={12} /> : i+1}
                                  </div>
                                  <div className="flex-1">
                                      <div className="text-sm font-bold line-clamp-1">{lesson.title}</div>
                                      <div className="text-[10px] text-slate-400">{lesson.duration}</div>
                                  </div>
                                  {lesson.isLocked && <Lock size={12} />}
                              </button>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      </div>
  );
};
