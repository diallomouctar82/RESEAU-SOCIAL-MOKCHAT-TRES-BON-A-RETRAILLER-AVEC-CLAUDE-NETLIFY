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
import { CERTIFYING_FORMATIONS_CATALOG, CertifyingFormation } from '../services/formationsRegistry';
import { getRealCourseForSubject, RealSubjectCourse } from '../services/realCurriculumCourses';
import { CampusEducationMap } from './CampusEducationMap';
import { CampusMockExamView } from './CampusMockExamView';
import { CampusProfessorCoach } from './CampusProfessorCoach';
import { CampusDiagnosticModal } from './CampusDiagnosticModal';
import { CampusEquivalenceComparator } from './CampusEquivalenceComparator';
import { CampusCourseEnrollmentModal } from './CampusCourseEnrollmentModal';
import { CampusClassroomView } from './CampusClassroomView';
import { CampusCertifyingExamView } from './CampusCertifyingExamView';
import { CampusDiplomaViewerModal } from './CampusDiplomaViewerModal';

interface CampusProps {
    onExamPass?: (courseTitle: string, grade: number) => void;
}

type ViewState = 'catalog' | 'classroom' | 'revision' | 'exam-intro' | 'exam-session' | 'exam-result' | 'certificate-view' | 'my-diplomas' | 'mock-exam-room' | 'education-map';
type MainTab = 'official' | 'catalog' | 'exams' | 'equivalences' | 'diplomas';
type LessonTab = 'theory' | 'practice' | 'resources';

export const Campus: React.FC<CampusProps> = ({ onExamPass }) => {
  const { userProfile, updateUserXp, addNotification } = useGlobal();
  const [currentView, setCurrentView] = useState<ViewState>('catalog');
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('official');
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
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

  // Nouveaux états de l'écosystème Formations & Inscription
  const [selectedFormationForEnrollment, setSelectedFormationForEnrollment] = useState<CertifyingFormation | null>(null);
  const [selectedDiplomaForViewing, setSelectedDiplomaForViewing] = useState<Certificate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterOnlyEnrolled, setFilterOnlyEnrolled] = useState(false);

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

      // Combiner le catalogue des formations certifiantes d'élite avec les cours de la base
      const mergedCourses = [...allCourses];
      CERTIFYING_FORMATIONS_CATALOG.forEach(cf => {
          if (!mergedCourses.some(c => c.id === cf.id)) {
              mergedCourses.unshift(cf);
          }
      });

      const enrichedCourses = mergedCourses.map(c => {
          const enroll = enrollments.find(e => e.courseId === c.id);
          const cLessons = c.lessons || (c as any).modulesList?.flatMap((m: any) => m.lessons || []) || [];
          const totalLessons = cLessons.length || 1;
          const completed = enroll?.completedLessons.length || 0;
          return {
              ...c,
              lessons: cLessons,
              isEnrolled: !!enroll,
              progress: (completed / totalLessons) * 100
          };
      });
      
      setCourses(enrichedCourses);
      setIsLoadingCourses(false);
  };

  // Processus d'inscription officielle
  const handleConfirmEnrollment = async (formation: CertifyingFormation, mode: 'certifying' | 'free_audit') => {
      await cloudService.enrollInCourse(userProfile.id, formation.id);
      updateUserXp(100);
      addNotification(
          "Inscription Validée",
          `Vous êtes inscrit à "${formation.title}" (${mode === 'certifying' ? 'Parcours Certifiant Officiel' : 'Auditeur Libre'}).`,
          "success"
      );
      await loadData();
      setSelectedFormationForEnrollment(null);
      setSelectedCourse(formation);
      if (formation.lessons && formation.lessons.length > 0) {
          setActiveLesson(formation.lessons[0]);
      }
      setCurrentView('classroom');
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

  // Récupération du programme actif
  const activeCurriculum = OFFICIAL_CURRICULUMS.find(c => c.countryCode === studentProfile.selectedCountryCode) || OFFICIAL_CURRICULUMS[0];
  const activeCycle = activeCurriculum?.cycles.find(c => c.id === studentProfile.selectedCycleId) || activeCurriculum?.cycles[0];
  const activeLevel = activeCycle?.levels.find(l => l.id === studentProfile.selectedLevelId) || activeCycle?.levels[0];

  // Lancement de l'étude d'un chapitre officiel
  const handleStartOfficialChapterStudy = (subject: any, chapter: any) => {
      const realCourse = getRealCourseForSubject(subject.id, chapter.id);

      const lessonsList: Lesson[] = (realCourse && realCourse.lessons.length > 0)
          ? realCourse.lessons
          : (chapter.competencies || []).map((comp: any, idx: number) => ({
              id: comp.id,
              title: comp.title,
              duration: `${comp.officialHoursEstimated || 2}h`,
              isLocked: false,
              content: `### ${comp.title}\n\nCe cours officiel de **${subject.name}** (${studentProfile.selectedLevelName}) est enseigné selon les standards académiques d'excellence du Professeur Diallo.\n\n#### Démarche d'Apprentissage :\n1. Maîtriser les définitions fondamentales et théorèmes clés.\n2. Étudier attentivement les exemples résolus et les démonstrations formelles.\n3. Effectuer l'exercice pratique guidé et valider votre compréhension via le mini-quiz.`
          }));

      const customCourse: Course = {
          id: `curr-${subject.id}-${chapter.id}`,
          title: `${subject.name} : ${chapter.title}`,
          description: chapter.description || `Programme officiel ${studentProfile.selectedCountryName} encadré par Professeur Diallo.`,
          institution: `Programme National Officiel • ${studentProfile.selectedCountryName}`,
          level: studentProfile.selectedLevelName as any,
          instructor: 'Professeur Diallo',
          thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
          lessons: lessonsList
      };

      setSelectedCourse(customCourse);
      if (customCourse.lessons && customCourse.lessons.length > 0) {
          setActiveLesson(customCourse.lessons[0]);
      }
      setCurrentView('classroom');
  };

  // --- VUE 1 : CATALOGUE PRINCIPAL & PROGRAMME OFFICIEL ---
  if (currentView === 'catalog') {
      return (
        <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-up pb-32">
          
          {/* Modal Diagnostic Initial */}
          {isDiagnosticOpen && (
              <CampusDiagnosticModal
                  profile={studentProfile}
                  onUpdateProfile={handleUpdateCurriculum}
                  onClose={() => setIsDiagnosticOpen(false)}
              />
          )}

          {/* Modal Inscription Officielle & Présentation Détaillée du Cursus */}
          {selectedFormationForEnrollment && (
              <CampusCourseEnrollmentModal
                  formation={selectedFormationForEnrollment}
                  userProfile={userProfile}
                  isEnrolled={courses.find(c => c.id === selectedFormationForEnrollment.id)?.isEnrolled || false}
                  onClose={() => setSelectedFormationForEnrollment(null)}
                  onConfirmEnrollment={handleConfirmEnrollment}
                  onOpenClassroom={(f) => {
                      setSelectedFormationForEnrollment(null);
                      setSelectedCourse(f);
                      if (f.lessons && f.lessons.length > 0) {
                          setActiveLesson(f.lessons[0]);
                      }
                      setCurrentView('classroom');
                  }}
              />
          )}

          {/* Modal Visualisation & Authentification de Diplôme */}
          {selectedDiplomaForViewing && (
              <CampusDiplomaViewerModal
                  certificate={selectedDiplomaForViewing}
                  userProfile={userProfile}
                  onClose={() => setSelectedDiplomaForViewing(null)}
              />
          )}

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
                    onClick={() => setIsDiagnosticOpen(true)}
                    className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-100 transition-colors shadow-sm"
                  >
                      <BrainCircuit size={16} className="text-emerald-600" /> Diagnostic Point A ➔ B
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
                              <ShieldCheck size={14} /> Référentiel Actif : {studentProfile.selectedCountryName} ({studentProfile.selectedLevelName})
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

                  {/* Widget Taux de Maîtrise Clignotant / Cliquable */}
                  <div 
                      onClick={() => setIsDiagnosticOpen(true)}
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500 p-5 rounded-2xl space-y-3 cursor-pointer transition-all group"
                  >
                      <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-300 group-hover:text-white flex items-center gap-1.5">
                              <Target size={14} className="text-emerald-400" /> Maîtrise du Programme
                          </span>
                          <span className="text-emerald-400 font-mono text-sm">
                              {studentProfile.totalMasteredCompetencies} / {studentProfile.totalTrackedCompetencies}
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
                      <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 pt-1">
                          <span>Ouvrir le Diagnostic Complet</span> <ArrowRight size={12} />
                      </div>
                  </div>
              </div>
          </div>

          {/* Onglets de Navigation Principale */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-4 overflow-x-auto">
              <button 
                  onClick={() => setActiveMainTab('official')}
                  className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${activeMainTab === 'official' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                  <BookOpen size={16} className={activeMainTab === 'official' ? 'text-emerald-400' : 'text-slate-500'} />
                  Programme Officiel & Matières ({studentProfile.selectedCountryName})
              </button>

              <button 
                  onClick={() => setActiveMainTab('catalog')}
                  className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${activeMainTab === 'catalog' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                  <School size={16} className={activeMainTab === 'catalog' ? 'text-indigo-400' : 'text-slate-500'} />
                  Formations & Cursus Certifiants
              </button>

              <button 
                  onClick={() => setActiveMainTab('exams')}
                  className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${activeMainTab === 'exams' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                  <Award size={16} className={activeMainTab === 'exams' ? 'text-amber-400' : 'text-slate-500'} />
                  Examens Blancs Officiels ({MOCK_EXAM_BLUEPRINTS.length})
              </button>

              <button 
                  onClick={() => setActiveMainTab('equivalences')}
                  className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${activeMainTab === 'equivalences' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                  <Globe size={16} className={activeMainTab === 'equivalences' ? 'text-cyan-400' : 'text-slate-500'} />
                  Passerelles & Équivalences Internationales
              </button>
          </div>

          {/* TAB CONTENT: 1. PROGRAMME OFFICIEL & MATIÈRES DU PAYS */}
          {activeMainTab === 'official' && (
              <div className="space-y-8 animate-fade-up">
                  
                  {/* Coach Professeur Diallo & Plan du Jour */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                          <CampusProfessorCoach 
                              profile={studentProfile} 
                              currentSubjectName={studentProfile.activeWorkingPlan.recommendedSubject}
                              currentLessonTitle={studentProfile.activeWorkingPlan.recommendedLessonTitle}
                          />
                      </div>

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

                          {/* Quick Switch Examen Blanc */}
                          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-6 rounded-3xl shadow-md space-y-3">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                  <Award size={16} /> Entraînement Chronométré
                              </div>
                              <h4 className="text-base font-black">Prêt pour un Examen Blanc ?</h4>
                              <p className="text-xs text-amber-100 leading-relaxed">
                                  Testez vos compétences dans les conditions officielles du diplôme avec notation instantanée.
                              </p>
                              <button 
                                  onClick={() => setActiveMainTab('exams')}
                                  className="w-full py-2.5 bg-white text-amber-900 font-black rounded-xl text-xs hover:bg-amber-50 transition-all flex items-center justify-center gap-2 shadow"
                              >
                                  Accéder aux Examens Blancs <ArrowRight size={14} />
                              </button>
                          </div>
                      </div>
                  </div>

                  {/* Liste des Matières Officielles du Niveau */}
                  <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between">
                          <div>
                              <h2 className="text-xl font-bold text-slate-900">
                                  Matières et Chapitres Officiels — {activeLevel?.name || studentProfile.selectedLevelName}
                              </h2>
                              <p className="text-xs text-slate-500">
                                  Référentiel National du Ministère • {studentProfile.selectedCountryName}
                              </p>
                          </div>
                          <button 
                              onClick={() => setCurrentView('education-map')}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
                          >
                              Changer de pays / niveau <Sliders size={14} />
                          </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {activeLevel?.subjects.map(subject => (
                              <div key={subject.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all p-6 space-y-4">
                                  <div className="flex items-start justify-between">
                                      <div>
                                          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                                              <span>{subject.officialCode}</span>
                                              {subject.coefficient && (
                                                  <span className="bg-indigo-50 px-2 py-0.5 rounded text-indigo-700 font-bold">
                                                      Coeff. {subject.coefficient}
                                                  </span>
                                              )}
                                              {subject.weeklyHours && (
                                                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                                      {subject.weeklyHours}h/sem
                                                  </span>
                                              )}
                                          </div>
                                          <h3 className="text-lg font-black text-slate-900">{subject.name}</h3>
                                      </div>
                                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                          <BookOpen size={20} />
                                      </div>
                                  </div>

                                  <div className="space-y-2 pt-2 border-t border-slate-100">
                                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                          Chapitres au Programme ({subject.chapters.length}) :
                                      </div>
                                      {subject.chapters.map(chapter => (
                                          <div key={chapter.id} className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                              <div>
                                                  <div className="text-xs font-bold text-slate-900">{chapter.title}</div>
                                                  <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{chapter.description}</div>
                                                  <div className="text-[10px] text-emerald-600 font-medium mt-1">
                                                      🎯 {chapter.competencies.length} compétences cibles
                                                  </div>
                                              </div>
                                              <button 
                                                  onClick={() => handleStartOfficialChapterStudy(subject, chapter)}
                                                  className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                                              >
                                                  <Sparkles size={14} className="text-amber-400" /> Étudier <ArrowRight size={12} />
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

              </div>
          )}

          {/* TAB CONTENT: 2. CATALOGUE DES FORMATIONS CERTIFIANTES */}
          {activeMainTab === 'catalog' && (
              <div className="space-y-6 animate-fade-up">
                  {/* Header & Description */}
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                              <Sparkles size={16} /> Écosystème d'Excellence Universitaire
                          </div>
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
                              Crédits ECTS & Diplômes Vérifiés
                          </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black">Catalogue des Formations & Diplômes Certifiants</h2>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                          Explorez nos filières d'élite (Fondamentaux, Secondaire, Licences, Masters, Doctorats, Spécialisations Pro). Chaque cursus est dirigé par le Professeur Diallo et nos facultés partenaires avec délivrance de diplômes numérotés et certifiés.
                      </p>

                      {/* Barre de Recherche & Filtres Rapides */}
                      <div className="pt-2 flex flex-col sm:flex-row gap-3">
                          <div className="relative flex-1">
                              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input
                                  type="text"
                                  placeholder="Rechercher une formation, un métier, un mot-clé (ex: Intelligence Artificielle, Droit, Médecine)..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                              />
                              {searchQuery && (
                                  <button
                                      onClick={() => setSearchQuery('')}
                                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                                  >
                                      ✕
                                  </button>
                              )}
                          </div>

                          <button
                              onClick={() => setFilterOnlyEnrolled(prev => !prev)}
                              className={`px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                                  filterOnlyEnrolled 
                                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' 
                                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                              }`}
                          >
                              <BookOpen size={14} /> Mes Inscriptions ({courses.filter(c => c.isEnrolled).length})
                          </button>
                      </div>
                  </div>

                  {/* Filtres de Domaines / Catégories */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {[
                          { id: 'All', label: 'Tous les domaines' },
                          { id: 'Tech & IA', label: '💻 Tech & IA' },
                          { id: 'Business & Commerce', label: '📊 Business & Finance' },
                          { id: 'Droit & Gouvernance', label: '⚖️ Droit & Gouvernance' },
                          { id: 'Santé & Sciences', label: '🧬 Santé & Médecine' },
                          { id: 'Fondamentaux & Langues', label: '📚 Fondamentaux' },
                          { id: 'Ingénierie & Métiers', label: '⚡ Ingénierie' },
                          { id: 'Doctorat & Recherche', label: '🎓 Recherche & Doctorat' }
                      ].map(cat => (
                          <button
                              key={cat.id}
                              onClick={() => setSelectedCategory(cat.id)}
                              className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap ${
                                  selectedCategory === cat.id
                                      ? 'bg-indigo-600 text-white shadow-md'
                                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                              }`}
                          >
                              {cat.label}
                          </button>
                      ))}
                  </div>

                  {/* Filtres de Niveaux Académiques */}
                  <div className="flex items-center justify-between gap-4">
                      <div className="flex gap-2 overflow-x-auto pb-1">
                          {['All', 'Fondamentaux', 'Secondaire', 'Licence', 'Master', 'Doctorat', 'Pro'].map(lvl => (
                              <button 
                                key={lvl} 
                                onClick={() => setSelectedLevel(lvl as any)}
                                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                                    selectedLevel === lvl 
                                        ? 'bg-slate-900 text-white shadow-sm' 
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                  {lvl === 'All' ? 'Tous les cycles' : lvl}
                              </button>
                          ))}
                      </div>

                      <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                          Affichage de {
                              courses
                                  .filter(c => selectedLevel === 'All' || c.level === selectedLevel)
                                  .filter(c => selectedCategory === 'All' || (c as any).category === selectedCategory)
                                  .filter(c => !filterOnlyEnrolled || c.isEnrolled)
                                  .filter(c => {
                                      if (!searchQuery.trim()) return true;
                                      const q = searchQuery.toLowerCase();
                                      return c.title.toLowerCase().includes(q) || 
                                             c.description.toLowerCase().includes(q) ||
                                             (c.institution && c.institution.toLowerCase().includes(q));
                                  }).length
                          } cursus
                      </span>
                  </div>

                  {/* Grille des Formations */}
                  {isLoadingCourses ? (
                      <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {courses
                              .filter(c => selectedLevel === 'All' || c.level === selectedLevel)
                              .filter(c => selectedCategory === 'All' || (c as any).category === selectedCategory)
                              .filter(c => !filterOnlyEnrolled || c.isEnrolled)
                              .filter(c => {
                                  if (!searchQuery.trim()) return true;
                                  const q = searchQuery.toLowerCase();
                                  return c.title.toLowerCase().includes(q) || 
                                         c.description.toLowerCase().includes(q) ||
                                         (c.institution && c.institution.toLowerCase().includes(q));
                              })
                              .map(course => {
                                  const certifyingFormation = CERTIFYING_FORMATIONS_CATALOG.find(f => f.id === course.id) || (course as any as CertifyingFormation);
                                  return (
                                      <div 
                                          key={course.id} 
                                          onClick={() => {
                                              setSelectedFormationForEnrollment(certifyingFormation);
                                          }} 
                                          className="group bg-white rounded-3xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                                      >
                                          <div className="h-44 relative overflow-hidden bg-slate-900">
                                              <img 
                                                  src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'} 
                                                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500" 
                                                  alt={course.title} 
                                              />
                                              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                                  {course.level}
                                              </div>
                                              {(course as any).creditsEcts && (
                                                  <div className="absolute top-3 right-3 bg-amber-500/90 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg">
                                                      {(course as any).creditsEcts} ECTS
                                                  </div>
                                              )}
                                              <div className="absolute bottom-3 left-3 right-3 text-white font-bold text-xs flex items-center justify-between bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-xl">
                                                  <span className="flex items-center gap-1.5 truncate"><School size={12} /> {course.institution}</span>
                                                  <span className="text-[10px] text-amber-300 shrink-0 font-mono">⭐ {(course as any).rating || '4.9'}</span>
                                              </div>
                                          </div>

                                          <div className="p-5 flex-1 flex flex-col">
                                              <div className="flex items-center justify-between gap-2 mb-2">
                                                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                      {(course as any).category || 'Académique'}
                                                  </span>
                                                  <span className="text-[11px] font-medium text-slate-400">
                                                      ⏱️ {course.duration || '40 heures'}
                                                  </span>
                                              </div>

                                              <h3 className="text-base font-black text-slate-900 mb-1 leading-snug group-hover:text-indigo-600 transition-colors">
                                                  {course.title}
                                              </h3>
                                              <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                                                  {course.description}
                                              </p>

                                              <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
                                                  {course.isEnrolled ? (
                                                      <div className="flex-1 mr-4">
                                                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                                              <span className="text-emerald-700 font-bold">Inscrit</span>
                                                              <span>{Math.round(course.progress || 0)}%</span>
                                                          </div>
                                                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${course.progress}%` }}></div>
                                                          </div>
                                                      </div>
                                                  ) : (
                                                      <span className="text-xs font-bold text-indigo-600 group-hover:underline">
                                                          Dossier & Inscription
                                                      </span>
                                                  )}
                                                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                      <ArrowRight size={14} />
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                      </div>
                  )}
              </div>
          )}

          {/* TAB CONTENT: 3. EXAMENS BLANCS OFFICIELS */}
          {activeMainTab === 'exams' && (
              <div className="space-y-6 animate-fade-up">
                  <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                          <Award size={16} /> Épreuves Certifiées & Minutées
                      </div>
                      <h2 className="text-2xl font-black">Banque d'Examens Blancs Officiels Multi-Pays</h2>
                      <p className="text-xs text-slate-300 max-w-2xl">
                          Entraînez-vous sur de vraies épreuves du Baccalauréat (Guinée, France, Sénégal, Côte d'Ivoire, USA, Fondamentaux) avec minuterie réelle et correction détaillée par Professeur Diallo.
                      </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {MOCK_EXAM_BLUEPRINTS.map(bp => (
                          <div key={bp.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                              <div>
                                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                                          {bp.countryCode === 'GN' ? '🇬🇳 Guinée' : bp.countryCode === 'FR' ? '🇫🇷 France' : bp.countryCode === 'SN' ? '🇸🇳 Sénégal' : bp.countryCode === 'CI' ? '🇨🇮 Côte d\'Ivoire' : '🌍 International'}
                                      </span>
                                      <span className="text-amber-600 font-bold">⏱️ {bp.durationMinutes} min</span>
                                  </div>
                                  <h3 className="text-base font-black text-slate-900 mb-1">{bp.examName}</h3>
                                  <p className="text-xs text-slate-500">{bp.subjectName} • {bp.levelName}</p>
                              </div>

                              <div className="pt-3 border-t border-slate-100 space-y-3">
                                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                                      <span>Barème : {bp.totalPoints} pts</span>
                                      <span>Note d'admission : {bp.passingScore}/{bp.totalPoints}</span>
                                  </div>
                                  <button
                                      onClick={() => {
                                          setActiveMockBlueprint(bp);
                                          setCurrentView('mock-exam-room');
                                      }}
                                      className="w-full py-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow"
                                  >
                                      Démarrer l'Épreuve Minutée <ArrowRight size={14} />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* TAB CONTENT: 4. PASSERELLES & ÉQUIVALENCES */}
          {activeMainTab === 'equivalences' && (
              <div className="animate-fade-up">
                  <CampusEquivalenceComparator />
              </div>
          )}

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
              {/* Modal Visualisation Diplôme */}
              {selectedDiplomaForViewing && (
                  <CampusDiplomaViewerModal
                      certificate={selectedDiplomaForViewing}
                      userProfile={userProfile}
                      onClose={() => setSelectedDiplomaForViewing(null)}
                  />
              )}

              <div className="flex items-center justify-between">
                  <button onClick={() => setCurrentView('catalog')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs">
                      <ChevronLeft size={16} /> Retour au Campus
                  </button>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      {certificates.length} diplôme(s) officiellement certifié(s)
                  </span>
              </div>

              <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                      <Award size={16} /> Registre Académique Officiel
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
                      Mes Diplômes & Certifications Reconnus
                  </h1>
                  <p className="text-xs text-slate-300 max-w-2xl">
                      Consultez, imprimez et vérifiez l'authenticité de tous vos parchemins et diplômes délivrés par le Professeur Diallo et nos académies partenaires.
                  </p>
              </div>
              
              {certificates.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
                      <GraduationCap size={64} className="mx-auto text-slate-200" />
                      <p className="text-slate-500 text-sm font-medium">Aucun diplôme obtenu pour le moment.</p>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                          Inscrivez-vous à un parcours certifiant, suivez les modules et réussissez l'examen final pour décrocher votre diplôme.
                      </p>
                      <button 
                          onClick={() => { setActiveMainTab('catalog'); setCurrentView('catalog'); }} 
                          className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                      >
                          Explorer les Formations Certifiantes
                      </button>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {certificates.map(cert => (
                          <div 
                              key={cert.id} 
                              onClick={() => setSelectedDiplomaForViewing(cert)}
                              className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
                          >
                              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-amber-500 to-indigo-600"></div>
                              <div className="flex justify-between items-start mb-4">
                                  <School size={28} className="text-slate-800" />
                                  <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                      <CheckCircle size={12} /> Diplôme Validé
                                  </div>
                              </div>
                              <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 mb-1 line-clamp-1">{cert.courseTitle}</h3>
                              <p className="text-xs text-slate-500 mb-4">{cert.institution}</p>
                              
                              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-4 text-[11px] font-mono text-slate-600 flex justify-between items-center">
                                  <span>Réf : {cert.serialNumber}</span>
                                  <span className="text-emerald-700 font-bold">100% Authentifié</span>
                              </div>

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

                              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                                  <span className="flex items-center gap-1.5"><Printer size={14} /> Voir le Diplôme Officiel & QR Code</span>
                                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  }

  // --- VUE 5 : SALLE D'EXAMEN CERTIFIANT OFFICIEL ---
  if (currentView === 'exam-session' && selectedCourse) {
      const certifyingFormation = CERTIFYING_FORMATIONS_CATALOG.find(f => f.id === selectedCourse.id) || (selectedCourse as any as CertifyingFormation);
      return (
          <div className="p-4 sm:p-8 max-w-5xl mx-auto animate-fade-up">
              <CampusCertifyingExamView
                  formation={certifyingFormation}
                  userProfile={userProfile}
                  onFinishExam={(cert) => {
                      setCertificates(prev => [cert, ...prev]);
                      setEarnedCertificate(cert);
                      if (onExamPass) {
                          onExamPass(cert.courseTitle, cert.grade);
                      }
                      addNotification(
                          "Diplôme Décerné !",
                          `Félicitations ! Vous avez validé ${cert.courseTitle} avec la note de ${cert.grade}/20.`,
                          "success"
                      );
                  }}
                  onViewCertificate={(cert) => {
                      setSelectedDiplomaForViewing(cert);
                  }}
                  onBackToClassroom={() => {
                      setCurrentView('classroom');
                  }}
              />
          </div>
      );
  }

  // --- VUE 6 : SALLE DE CLASSE MULTIMÉDIA & INTERACTIVE ---
  if (currentView === 'classroom' && selectedCourse) {
      const certifyingFormation = CERTIFYING_FORMATIONS_CATALOG.find(f => f.id === selectedCourse.id) || (selectedCourse as any as CertifyingFormation);
      return (
          <div className="min-h-full bg-slate-50 animate-fade-up">
              <CampusClassroomView
                  formation={certifyingFormation}
                  userProfile={userProfile}
                  onBackToCatalog={() => {
                      loadData();
                      setCurrentView('catalog');
                  }}
                  onStartExam={(formation) => {
                      setSelectedCourse(formation);
                      setCurrentView('exam-session');
                  }}
              />
          </div>
      );
  }

  // Fallback de sécurité
  return (
      <div className="p-8 text-center">
          <button onClick={() => setCurrentView('catalog')} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-bold">
              Retour au Catalogue
          </button>
      </div>
  );
};
