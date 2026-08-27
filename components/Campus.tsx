// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎓 CAMPUS GLOBAL ACADEMIC HUB — LE MONDE À VOUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Système intelligent d'accomplissement académique et éducatif multi-pays,
// multi-programmes et ultra-personnalisé avec Professeur Diallo.

import React, { useState, useRef, useEffect } from 'react';
import { 
    PlayCircle, 
    Clock, 
    Users, 
    Star, 
    ArrowRight, 
    BookOpen, 
    CheckCircle, 
    Lock, 
    MessageSquare, 
    ChevronLeft, 
    Send, 
    Mic, 
    Square, 
    Award, 
    FileText, 
    AlertCircle, 
    Sparkles, 
    Volume2, 
    Loader2, 
    PauseCircle, 
    Trophy, 
    Plus, 
    GraduationCap, 
    School, 
    Book, 
    PenTool, 
    Check, 
    Database, 
    RefreshCw, 
    Printer, 
    BrainCircuit, 
    Library, 
    Dumbbell,
    Globe,
    Compass,
    Sliders,
    Target,
    Zap,
    Layers,
    ShieldCheck,
    CheckCircle2
} from 'lucide-react';
import { 
    Course, 
    Lesson, 
    AcademicLevel, 
    UserProfile, 
    ExamSession, 
    QuizQuestion, 
    Certificate,
    StudentPedagogicalProfile,
    MockExamBlueprint,
    MockExamReport
} from '../types';
import { GoogleGenAI } from '@google/genai';
import { cloudService } from '../services/cloud';
import { useGlobal } from '../contexts/GlobalContext';
import { campusPedagogicalEngine } from '../services/campusPedagogicalEngine';
import { OFFICIAL_CURRICULUMS, MOCK_EXAM_BLUEPRINTS, ACADEMIC_EQUIVALENCES } from '../services/curriculumRegistry';
import { CampusEducationMap } from './CampusEducationMap';
import { CampusMockExamView } from './CampusMockExamView';
import { CampusProfessorCoach } from './CampusProfessorCoach';

interface CampusProps {
    onExamPass?: (courseTitle: string, grade: number) => void;
}

type ViewState = 'catalog' | 'classroom' | 'revision' | 'exam-intro' | 'exam-session' | 'exam-result' | 'certificate-view' | 'my-diplomas' | 'mock-exam-room' | 'education-map';
type LessonTab = 'theory' | 'practice' | 'resources';

export const Campus: React.FC<CampusProps> = ({ onExamPass }) => {
  const { userProfile, updateUserXp, addNotification } = useGlobal();
  const [currentView, setCurrentView] = useState<ViewState>('catalog');
  const [courses, setCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<AcademicLevel | 'All'>('All');
  
  // Profil Pédagogique Étudiant Multi-Pays
  const [studentProfile, setStudentProfile] = useState<StudentPedagogicalProfile>(() => {
      return campusPedagogicalEngine.getDefaultStudentProfile(userProfile.id || 'user_1');
  });

  // Mode Examen Blanc
  const [activeMockBlueprint, setActiveMockBlueprint] = useState<MockExamBlueprint | null>(null);
  const [mockReports, setMockReports] = useState<MockExamReport[]>([]);

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
      const myCerts = await cloudService.getCertificates();
      
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

  // --- UPDATE CURRICULUM PROFILE ---
  const handleUpdateCurriculum = (updated: Partial<StudentPedagogicalProfile>) => {
      setStudentProfile(prev => ({
          ...prev,
          ...updated
      }));
      addNotification(
          "Programme Académique Mis à Jour",
          `Référentiel actif : ${updated.selectedCountryName || studentProfile.selectedCountryName} (${updated.selectedLevelName || studentProfile.selectedLevelName})`,
          "success"
      );
      setCurrentView('catalog');
  };

  // --- LESSON LOGIC & AI GENERATION ---
  const handleOpenLesson = async (lesson: Lesson) => {
      if (!selectedCourse) return;
      setActiveLesson(lesson);
      setLessonTab('theory');
      setPracticeContent('');
      setResourcesContent('');
      
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
                Tu es Professeur Diallo, Enseignant Émérite à ${selectedCourse.institution || "l'Académie Mondiale Le Monde à Vous"}.
                Programme Officiel : ${studentProfile.selectedCountryName} - ${studentProfile.selectedLevelName}.
                Cours : "${selectedCourse.title}". Niveau : ${selectedCourse.level}.
                Leçon : "${lesson.title}".
                Style d'apprentissage : ${studentProfile.learningStyle}.
                
                Rédige le cours théorique COMPLET (800+ mots).
                Inclus :
                1. Objectifs d'examen officiel (${studentProfile.targetExamOrGoal})
                2. Définitions et Concepts Clés
                3. Approfondissement rigoureux
                4. Exemples concrets & analogies pédagogiques adaptées
                5. Synthèse à retenir
                
                Format : Markdown élégant et aéré.
              `;
          } else if (type === 'practice') {
              prompt = `
                Pour le cours "${selectedCourse.title}" (${studentProfile.selectedCountryName} - ${studentProfile.selectedLevelName}), Leçon: ${lesson.title}.
                Génère 3 Exercices Pratiques d'application directe type Examen Officiel :
                - Énoncé avec données concrètes.
                - Démarche guidée pas à pas.
                - Solution détaillée avec barème indicatif.
                Format : Markdown.
              `;
          } else if (type === 'resources') {
              prompt = `
                Pour le cours "${selectedCourse.title}" (Leçon: ${lesson.title}), liste les annales officielles, textes de référence et ressources bibliographiques conformes au programme de ${studentProfile.selectedCountryName}.
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
          addNotification("Module Terminé", "+50 XP Académique", "success");
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
          const prompt = `Tu es Professeur Diallo, tuteur bienveillant pour le cours "${selectedCourse.title}" (${studentProfile.selectedCountryName} - ${studentProfile.selectedLevelName}). 
          L'étudiant te dit : "${userMsg}".
          Réponds de manière ultra-pédagogique, sans jargon superflu. Si l'étudiant a une incompréhension, propose-lui un mini-exercice ou une analogie concrète.
          `;
          
          const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
          setRevisionChat(prev => [...prev, {role: 'model', text: response.text || "Je n'ai pas compris."}]);
      } catch (e) { console.error(e); }
  };

  const handleGenerateRevision = async () => {
      if (!selectedCourse) return;
      setIsGeneratingRevision(true);
      setCurrentView('revision');
      setRevisionChat([{
          role: 'model', 
          text: `Bonjour ! Je suis le Professeur Diallo. Nous révisons ensemble le cours "${selectedCourse.title}" selon le référentiel de ${studentProfile.selectedCountryName}. Posez-moi vos questions ou demandez-moi un mini-quiz.`
      }]);
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `Génère une fiche de révision dense pour : "${selectedCourse.title}" (${studentProfile.selectedCountryName} - ${studentProfile.selectedLevelName}). Concepts clés, Propriétés, Pièges d'examen classiques. Markdown.`;
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
            Génère un examen final SÉRIEUX et CONFORME aux épreuves officielles pour le cours "${selectedCourse.title}" (${selectedCourse.level}, ${studentProfile.selectedCountryName}).
            10 Questions à Choix Multiples (QCM) de niveau examen officiel.
            Réponds en JSON strict :
            [ { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..." } ]
          `;
          
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
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
              institution: selectedCourse.institution || `Académie Mondiale (${studentProfile.selectedCountryName})`
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

  // --- VUE 1 : CATALOGUE PRINCIPAL ---
  if (currentView === 'catalog') {
      return (
        <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-up pb-32">
          {/* Top Bar Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
                      <GraduationCap size={16} /> Campus Mondial Intelligent & Multi-Programmes
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                      Campus Académique Universel
                  </h1>
              </div>

              <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setCurrentView('education-map')}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md"
                  >
                      <Globe size={16} className="text-emerald-400" />
                      <span>{studentProfile.selectedCountryFlag} {studentProfile.selectedCountryName} • {studentProfile.selectedLevelName}</span>
                      <Sliders size={14} className="text-slate-400" />
                  </button>

                  <button 
                    onClick={() => setCurrentView('my-diplomas')}
                    className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                      <Award className="text-amber-500" size={16} /> Diplômes ({certificates.length})
                  </button>
              </div>
          </div>

          {/* Bannière Intelligente : Diagnostic & Objectif Actuel */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  <div className="lg:col-span-2 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                              <ShieldCheck size={14} /> Référentiel Officiel : {studentProfile.selectedCountryName}
                          </span>
                          <span className="bg-white/10 text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
                              🎯 Objectif : {studentProfile.targetExamOrGoal}
                          </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                          Votre Parcours Sur-Mesure vers l'Excellence
                      </h2>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
                          Le Professeur Diallo calibre chaque notion selon votre niveau réel et votre style d'apprentissage ({studentProfile.learningStyle.replace('_', ' ')}).
                      </p>
                  </div>

                  {/* Widget Taux de Maîtrise */}
                  <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-300">Maîtrise du Programme</span>
                          <span className="text-emerald-400 font-mono text-sm">
                              {studentProfile.totalMasteredCompetencies} / {studentProfile.totalTrackedCompetencies} Compétences
                          </span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                          <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                              style={{ width: `${(studentProfile.totalMasteredCompetencies / (studentProfile.totalTrackedCompetencies || 1)) * 100}%` }}
                          />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Prochain Examen Blanc :</span>
                          <span className="font-bold text-white">{studentProfile.activeWorkingPlan.nextMockExamDate || "Dans 7 jours"}</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* Section 2 : Coach Professeur Diallo & Plan du Jour */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coach 3D Intégré */}
              <div className="lg:col-span-2">
                  <CampusProfessorCoach 
                      profile={studentProfile} 
                      currentSubjectName={studentProfile.activeWorkingPlan.recommendedSubject}
                      currentLessonTitle={studentProfile.activeWorkingPlan.recommendedLessonTitle}
                  />
              </div>

              {/* Panneau Objectifs & Examens Blancs Disponibles */}
              <div className="space-y-6">
                  {/* Objectifs du Jour */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                              <Target size={18} className="text-indigo-600" /> Plan d'Étude du Jour
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                              {studentProfile.activeWorkingPlan.recommendedDurationMin} min
                          </span>
                      </div>
                      <div className="space-y-2">
                          {studentProfile.activeWorkingPlan.todayObjectives.map((obj, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{obj}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Examens Blancs Officiels */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <Award size={18} className="text-amber-500" /> Examens Blancs Disponibles
                      </h3>
                      <div className="space-y-3">
                          {MOCK_EXAM_BLUEPRINTS.map(bp => (
                              <div key={bp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                                  <div className="font-bold text-xs text-slate-900">{bp.examName}</div>
                                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                                      <span>⏱️ {bp.durationMinutes} min</span>
                                      <span>📊 Note / 20</span>
                                  </div>
                                  <button
                                      onClick={() => {
                                          setActiveMockBlueprint(bp);
                                          setCurrentView('mock-exam-room');
                                      }}
                                      className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 mt-2"
                                  >
                                      Passer l'Examen Blanc <ArrowRight size={14} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>

          {/* Section 3 : Catalogue des Formations & Cours */}
          <div className="space-y-6 pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                      <h2 className="text-xl font-bold text-slate-900">Cours & Modules Académiques</h2>
                      <p className="text-xs text-slate-500">Programmes certifiants du fondamental au supérieur</p>
                  </div>

                  {/* Filtres de Niveaux */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                      {['All', 'Fondamentaux', 'Secondaire', 'Licence', 'Master', 'Doctorat', 'Pro'].map(lvl => (
                          <button 
                            key={lvl} 
                            onClick={() => setSelectedLevel(lvl as any)}
                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${selectedLevel === lvl ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                          >
                              {lvl === 'All' ? 'Tous les niveaux' : lvl}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Grille des Cours */}
              {isLoadingCourses ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {(selectedLevel === 'All' ? courses : courses.filter(c => c.level === selectedLevel)).map(course => (
                          <div key={course.id} onClick={() => { setSelectedCourse(course); setCurrentView('classroom'); }} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                              <div className="h-44 relative overflow-hidden bg-slate-900">
                                  <img src={course.thumbnailUrl} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" alt={course.title} />
                                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider">{course.level}</div>
                                  <div className="absolute bottom-3 left-3 text-white font-bold text-xs flex items-center gap-1.5"><School size={12} /> {course.institution}</div>
                              </div>
                              <div className="p-5 flex-1 flex flex-col">
                                  <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug group-hover:text-indigo-600 transition-colors">{course.title}</h3>
                                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{course.description}</p>
                                  <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
                                      {course.isEnrolled ? (
                                          <div className="flex-1 mr-4">
                                              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1"><span>Progression</span><span>{Math.round(course.progress || 0)}%</span></div>
                                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 rounded-full" style={{ width: `${course.progress}%` }}></div></div>
                                          </div>
                                      ) : (
                                          <span className="text-xs font-bold text-indigo-600">Rejoindre le cours</span>
                                      )}
                                      <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors"><ArrowRight size={14} /></div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
        </div>
      );
  }

  // --- VUE 2 : CARTE MONDIALE & CONFIGURATION RÉFÉRENTIEL ---
  if (currentView === 'education-map') {
      return (
          <div className="p-4 sm:p-8 max-w-6xl mx-auto animate-fade-up">
              <button 
                  onClick={() => setCurrentView('catalog')} 
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs mb-6"
              >
                  <ChevronLeft size={16} /> Retour au Campus
              </button>
              <CampusEducationMap 
                  currentProfile={studentProfile} 
                  onApplyCurriculum={handleUpdateCurriculum}
                  onClose={() => setCurrentView('catalog')}
              />
          </div>
      );
  }

  // --- VUE 3 : SALLE D'EXAMEN BLANC ---
  if (currentView === 'mock-exam-room' && activeMockBlueprint) {
      return (
          <div className="p-4 sm:p-8 max-w-5xl mx-auto animate-fade-up">
              <CampusMockExamView 
                  blueprint={activeMockBlueprint}
                  onFinishExam={(report) => {
                      setMockReports(prev => [report, ...prev]);
                      addNotification("Examen Blanc Corrigé", `Note obtenue : ${report.score}/20`, report.passed ? "success" : "info");
                  }}
                  onCancel={() => setCurrentView('catalog')}
              />
          </div>
      );
  }

  // --- VUE 4 : DIPLÔMES ET CERTIFICATIONS ---
  if (currentView === 'my-diplomas') {
      return (
          <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 animate-fade-up">
              <button onClick={() => setCurrentView('catalog')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs mb-4"><ChevronLeft size={16} /> Retour au Campus</button>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3"><Award className="text-amber-500" /> Mes Diplômes & Certifications</h1>
              
              {certificates.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                      <GraduationCap size={64} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-500 text-sm">Aucun diplôme obtenu pour le moment.</p>
                      <button onClick={() => setCurrentView('catalog')} className="mt-4 text-indigo-600 font-bold text-xs hover:underline">Commencer un cours</button>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {certificates.map(cert => (
                          <div key={cert.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md relative overflow-hidden group">
                              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500"></div>
                              <div className="flex justify-between items-start mb-6">
                                  <School size={28} className="text-slate-800" />
                                  <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle size={12} /> Validé</div>
                              </div>
                              <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mb-1">{cert.courseTitle}</h3>
                              <p className="text-xs text-slate-500 mb-6">{cert.institution}</p>
                              <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                                  <div>
                                      <div className="text-[10px] text-slate-400 uppercase font-bold">Délivré le</div>
                                      <div className="text-xs font-medium">{cert.issueDate}</div>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-[10px] text-slate-400 uppercase font-bold">Note Finale</div>
                                      <div className="text-xl font-black text-indigo-900">{cert.grade.toFixed(1)}/20</div>
                                  </div>
                              </div>
                              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEarnedCertificate(cert); setCurrentView('certificate-view'); }} className="bg-slate-900 text-white p-2 rounded-xl"><Printer size={16} /></button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  }

  // --- VUES DE SALLE DE CLASSE / EXAMEN COURANT ---
  return (
      <div className="flex flex-col h-full bg-slate-50 animate-fade-up">
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
              <div className="flex items-center gap-3">
                  <button onClick={() => setCurrentView('catalog')} className="p-2 hover:bg-gray-100 rounded-xl text-slate-500"><ChevronLeft size={20} /></button>
                  <div>
                      <h1 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">{selectedCourse?.title}</h1>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <School size={12} /> {selectedCourse?.institution} • <span className="text-emerald-700 font-bold">{studentProfile.selectedCountryName}</span>
                      </div>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => setCurrentView('classroom')} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${currentView === 'classroom' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}><BookOpen size={14} /> Cours</button>
                  <button onClick={handleGenerateRevision} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${currentView === 'revision' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}><FileText size={14} /> Révision</button>
                  <button onClick={() => setCurrentView('exam-intro')} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${currentView.includes('exam') ? 'bg-rose-600 text-white' : 'hover:bg-slate-100 text-rose-600'}`}><GraduationCap size={14} /> Examen</button>
              </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
                  
                  {currentView === 'classroom' && (
                      activeLesson ? (
                          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 min-h-screen overflow-hidden">
                              {/* Lesson Tabs */}
                              <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
                                  <button onClick={() => handleTabChange('theory')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${lessonTab === 'theory' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}><BookOpen size={14} /> Théorie</button>
                                  <button onClick={() => handleTabChange('practice')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${lessonTab === 'practice' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}><Dumbbell size={14} /> Pratique</button>
                                  <button onClick={() => handleTabChange('resources')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${lessonTab === 'resources' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}><Library size={14} /> Ressources</button>
                              </div>

                              <div className="p-6 sm:p-12">
                                  {isGeneratingContent ? (
                                      <div className="text-center py-20 space-y-4">
                                          <RefreshCw className="animate-spin mx-auto text-indigo-600" size={40} />
                                          <h3 className="text-lg font-bold text-slate-800">Le Professeur Diallo prépare votre matériel pédagogique...</h3>
                                          <p className="text-xs text-slate-500">Adaptation au programme de {studentProfile.selectedCountryName}</p>
                                      </div>
                                  ) : (
                                      <div className="prose prose-slate max-w-none prose-sm sm:prose-base animate-fade-up">
                                          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-6">{activeLesson.title}</h1>
                                          <div className="whitespace-pre-wrap leading-relaxed font-serif text-slate-800">
                                              {lessonTab === 'theory' ? lessonContent : lessonTab === 'practice' ? practiceContent : resourcesContent}
                                          </div>
                                          
                                          {lessonTab === 'theory' && (
                                              <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
                                                  <button onClick={() => handleCompleteLesson(activeLesson.id)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-md flex items-center gap-2 text-xs">
                                                      Terminer le module <ArrowRight size={16} />
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                  )}
                              </div>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-400">
                              <BookOpen size={56} className="mb-4 opacity-20" />
                              <p className="text-xs">Sélectionnez un module à droite pour commencer.</p>
                          </div>
                      )
                  )}

                  {currentView === 'revision' && (
                      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                          <div className="lg:col-span-2 bg-amber-50/60 p-8 rounded-3xl shadow-sm border border-amber-100 relative overflow-y-auto">
                              <h2 className="text-2xl font-bold text-amber-900 mb-6 flex items-center gap-2"><FileText size={20} /> Fiche de Synthèse</h2>
                              {isGeneratingRevision ? <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-amber-600" size={40} /></div> : 
                               <div className="prose prose-amber max-w-none text-xs sm:text-sm whitespace-pre-wrap">{revisionNote}</div>}
                          </div>
                          
                          {/* Revision Coach Chat */}
                          <div className="bg-white rounded-3xl border border-slate-200 shadow-md flex flex-col overflow-hidden h-[600px]">
                              <div className="p-4 bg-indigo-600 text-white font-bold text-xs flex items-center gap-2">
                                  <BrainCircuit size={18} /> Professeur Diallo • Coach
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                                  {revisionChat.map((msg, i) => (
                                      <div key={i} className={`p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white ml-6' : 'bg-white border border-slate-200 mr-6 text-slate-800'}`}>
                                          {msg.text}
                                      </div>
                                  ))}
                              </div>
                              <div className="p-3 border-t flex gap-2">
                                  <input 
                                    value={revisionInput}
                                    onChange={e => setRevisionInput(e.target.value)}
                                    placeholder="Posez votre question..."
                                    className="flex-1 border rounded-xl px-3 py-2 text-xs outline-none"
                                    onKeyDown={e => e.key === 'Enter' && handleRevisionChat()}
                                  />
                                  <button onClick={handleRevisionChat} className="bg-indigo-600 text-white p-2 rounded-xl"><Send size={14} /></button>
                              </div>
                          </div>
                      </div>
                  )}

                  {currentView === 'exam-intro' && (
                      <div className="max-w-2xl mx-auto mt-12 text-center space-y-6 animate-fade-up">
                          <div className="w-24 h-24 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto text-rose-600 shadow-md">
                              <GraduationCap size={48} />
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Examen Final de Certification</h2>
                          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-left space-y-3 text-xs">
                              <div className="flex items-center gap-3"><Clock className="text-slate-400" size={16} /> <span className="font-bold">Durée : 20 Minutes</span></div>
                              <div className="flex items-center gap-3"><FileText className="text-slate-400" size={16} /> <span className="font-bold">10 Questions de Synthèse ({studentProfile.selectedCountryName})</span></div>
                              <div className="flex items-center gap-3"><CheckCircle className="text-slate-400" size={16} /> <span className="font-bold">Note requise : 10/20</span></div>
                              <div className="flex items-center gap-3"><Award className="text-slate-400" size={16} /> <span className="font-bold">Certificat Numéroté & Vérifié</span></div>
                          </div>
                          <button onClick={prepareExam} className="bg-rose-600 text-white px-10 py-3.5 rounded-2xl font-bold text-sm hover:bg-rose-700 shadow-lg transition-all">
                              {isExamSubmitting ? 'Préparation de la salle...' : 'Démarrer l\'Épreuve'}
                          </button>
                      </div>
                  )}

                  {currentView === 'exam-session' && examSession && (
                      <div className="max-w-3xl mx-auto mt-6 relative">
                          <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-50 py-3 z-20">
                              <div className="text-sm font-bold text-slate-700">Question {currentQuestionIndex + 1} / {examSession.questions.length}</div>
                              <div className={`text-base font-mono font-bold px-3 py-1.5 rounded-xl ${timeLeft < 60 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-white border border-slate-200'}`}>
                                  {formatTime(timeLeft)}
                              </div>
                          </div>
                          
                          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-md border border-slate-200">
                              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 leading-relaxed">
                                  {examSession.questions[currentQuestionIndex].question}
                              </h3>
                              <div className="space-y-3">
                                  {examSession.questions[currentQuestionIndex].options.map((opt, idx) => (
                                      <button 
                                        key={idx}
                                        onClick={() => setExamSession({...examSession, answers: {...examSession.answers, [examSession.questions[currentQuestionIndex].id]: idx}})}
                                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-medium text-xs sm:text-sm ${examSession.answers[examSession.questions[currentQuestionIndex].id] === idx ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}
                                      >
                                          <span className="font-bold mr-3 opacity-60">{String.fromCharCode(65 + idx)}.</span> {opt}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div className="flex justify-between mt-6">
                              <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(prev => prev - 1)} className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-500 hover:bg-white disabled:opacity-40">Précédent</button>
                              {currentQuestionIndex < examSession.questions.length - 1 ? (
                                  <button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800">Suivant</button>
                              ) : (
                                  <button onClick={() => submitExam(examSession)} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-700 shadow-md">{isExamSubmitting ? 'Correction...' : 'Terminer l\'Examen'}</button>
                              )}
                          </div>
                      </div>
                  )}

                  {currentView === 'exam-result' && examSession && (
                      <div className="max-w-2xl mx-auto mt-12 text-center animate-fade-up space-y-6">
                          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-lg ${examSession.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              {examSession.passed ? <Trophy size={48} /> : <AlertCircle size={48} />}
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{examSession.passed ? 'Félicitations !' : 'Examen Non Validé'}</h2>
                          <div className="text-5xl font-black text-slate-800">{examSession.score?.toFixed(1)} <span className="text-xl text-slate-400">/ 20</span></div>
                          
                          {examSession.passed && earnedCertificate ? (
                              <div className="bg-white border-4 border-slate-900 p-8 rounded-2xl shadow-xl relative text-center mb-6 cursor-pointer" onClick={() => setCurrentView('certificate-view')}>
                                  <School size={36} className="mx-auto mb-3 text-slate-800" />
                                  <h3 className="font-serif text-xl font-bold text-slate-900 mb-1 uppercase tracking-wider">Certificat de Réussite</h3>
                                  <p className="text-xs text-slate-500 italic mb-4">Décerné à {earnedCertificate.studentName}</p>
                                  <div className="text-base font-bold text-indigo-900 mb-1">{earnedCertificate.courseTitle}</div>
                                  <div className="text-xs text-slate-400 font-mono">{earnedCertificate.serialNumber}</div>
                              </div>
                          ) : (
                              <button onClick={prepareExam} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold text-xs hover:bg-slate-800">Retenter l'examen</button>
                          )}
                      </div>
                  )}
                  
                  {currentView === 'certificate-view' && earnedCertificate && (
                      <div className="flex flex-col items-center justify-center h-full p-4">
                          <div className="bg-[#fffbf0] p-10 sm:p-14 rounded-3xl shadow-2xl border-[16px] border-slate-900 text-center max-w-3xl w-full relative">
                              <h1 className="font-serif text-3xl sm:text-4xl font-black text-slate-900 mb-2 uppercase tracking-widest">Diplôme Officiel</h1>
                              <p className="text-sm text-slate-600 italic mb-6">Ce document certifie que</p>
                              <h2 className="text-2xl sm:text-3xl font-bold text-indigo-900 mb-6 font-serif underline decoration-amber-400/50">{earnedCertificate.studentName}</h2>
                              <p className="text-sm text-slate-600 mb-2">a validé avec succès le cursus certifiant</p>
                              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-8">{earnedCertificate.courseTitle}</h3>
                              
                              <div className="flex justify-between items-end mt-10 px-6">
                                  <div className="text-center">
                                      <div className="h-px w-36 bg-slate-900 mb-2"></div>
                                      <p className="font-bold text-xs text-slate-900">Professeur Diallo</p>
                                  </div>
                                  <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center border-2 border-amber-600 text-amber-800 font-bold text-xs stamp rotate-12">
                                      OFFICIEL
                                  </div>
                                  <div className="text-center">
                                      <div className="font-mono text-xs text-slate-500 mb-1">{earnedCertificate.issueDate}</div>
                                      <div className="h-px w-36 bg-slate-900 mb-2"></div>
                                      <p className="font-bold text-xs text-slate-900">Délivrance</p>
                                  </div>
                              </div>
                          </div>
                          <button onClick={() => window.print()} className="mt-6 bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-slate-800 shadow-md">
                              <Printer size={16} /> Imprimer / Exporter PDF
                          </button>
                      </div>
                  )}

              </div>

              {/* Sidebar Modules */}
              {currentView === 'classroom' && (
                  <div className="w-72 bg-white border-l border-gray-200 flex flex-col h-full z-20">
                      <div className="p-4 border-b border-gray-200 font-bold text-xs text-slate-700 uppercase tracking-wider">Programme du Cursus</div>
                      <div className="flex-1 overflow-y-auto p-2">
                          {selectedCourse?.lessons?.map((lesson, i) => (
                              <button 
                                key={lesson.id} 
                                disabled={lesson.isLocked}
                                onClick={() => handleOpenLesson(lesson)}
                                className={`w-full text-left p-3 rounded-xl mb-1 flex items-center gap-3 transition-colors ${activeLesson?.id === lesson.id ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : lesson.isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50 text-slate-700'}`}
                              >
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${completedLessonIds.includes(lesson.id) ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                      {completedLessonIds.includes(lesson.id) ? <Check size={10} /> : i+1}
                                  </div>
                                  <div className="flex-1">
                                      <div className="text-xs font-bold line-clamp-1">{lesson.title}</div>
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
