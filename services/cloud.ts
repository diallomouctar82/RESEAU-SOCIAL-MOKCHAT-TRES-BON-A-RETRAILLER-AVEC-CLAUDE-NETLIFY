
// Le Monde à Vous - Cloud Infrastructure Layer
// Utilise IndexedDB pour simuler un stockage S3 + Base de données NoSQL

import { Course, Enrollment, Lesson, AcademicLevel, Certificate, ExamSession, Post } from '../types';
import { POSTS } from '../constants';

const DB_NAME = 'LMAV_Cloud_DB';
const DB_VERSION = 3; // Version increased for new schema
const STORES = {
    FILES: 'files',         
    DATA: 'data',           
    LOGS: 'logs',           
    COURSES: 'courses',     
    ENROLLMENTS: 'enrollments', 
    POSTS: 'posts',
    CERTIFICATES: 'certificates' // New Store
};

// --- COURSE SEEDER DATA ---
// 7 Courses per level * 6 Levels = 42 Courses total
const SEED_COURSES_DATA: { level: AcademicLevel; courses: Partial<Course>[] }[] = [
    {
        level: 'Primaire',
        courses: [
            { title: "Français : Lecture et Écriture", tags: ["Fondamental", "Langue"] },
            { title: "Mathématiques : Les Bases", tags: ["Logique", "Calcul"] },
            { title: "Sciences : Découverte du Monde", tags: ["Nature", "Physique"] },
            { title: "Histoire : Les Grandes Civilisations", tags: ["Culture", "Passé"] },
            { title: "Géographie : Notre Planète", tags: ["Monde", "Cartes"] },
            { title: "Éducation Civique et Morale", tags: ["Société", "Valeurs"] },
            { title: "Introduction à l'Anglais", tags: ["Langue", "International"] }
        ]
    },
    {
        level: 'Secondaire',
        courses: [
            { title: "Algèbre et Géométrie Avancée", tags: ["Maths", "Lycée"] },
            { title: "Littérature Française et Philosophie", tags: ["Lettres", "Pensée"] },
            { title: "Physique-Chimie : Matière et Énergie", tags: ["Sciences", "Labo"] },
            { title: "Sciences de la Vie et de la Terre (SVT)", tags: ["Biologie", "Géologie"] },
            { title: "Histoire-Géo : Le Monde Contemporain", tags: ["Politique", "Société"] },
            { title: "Anglais Renforcé (B2)", tags: ["Langue", "Communication"] },
            { title: "Initiation au Code (Python)", tags: ["Tech", "Programmation"] }
        ]
    },
    {
        level: 'Licence',
        courses: [
            { title: "Droit Civil et Constitutionnel", institution: "Sorbonne Droit", tags: ["Juridique", "L1"] },
            { title: "Introduction au Marketing Digital", institution: "HEC Paris", tags: ["Business", "Vente"] },
            { title: "Psychologie Clinique et Cognitive", institution: "Université Paris Cité", tags: ["Santé", "Social"] },
            { title: "Gestion d'Entreprise et Comptabilité", institution: "ESSEC", tags: ["Finance", "Management"] },
            { title: "Informatique Fondamentale (Java/C++)", institution: "Polytechnique", tags: ["Tech", "Dev"] },
            { title: "Biologie Cellulaire et Moléculaire", institution: "Institut Pasteur", tags: ["Science", "Recherche"] },
            { title: "Économie et Finance de Marché", institution: "Dauphine", tags: ["Bourse", "Éco"] }
        ]
    },
    {
        level: 'Master',
        courses: [
            { title: "MBA : Stratégie Internationale", institution: "INSEAD", tags: ["Elite", "Business"] },
            { title: "Intelligence Artificielle et Data Science", institution: "MIT & Stanford", tags: ["Tech", "IA"] },
            { title: "Droit des Affaires Internationales", institution: "Harvard Law", tags: ["Juridique", "Monde"] },
            { title: "Cybersécurité et Défense Numérique", institution: "ANSSI Cert.", tags: ["Secu", "Tech"] },
            { title: "Supply Chain Management Global", institution: "Kedge", tags: ["Logistique", "Commerce"] },
            { title: "Architecture et Urbanisme Durable", institution: "Beaux-Arts", tags: ["Design", "Ville"] },
            { title: "Santé Publique et Épidémiologie", institution: "OMS Academy", tags: ["Santé", "Politique"] }
        ]
    },
    {
        level: 'Doctorat',
        courses: [
            { title: "Méthodologie de Recherche Avancée", institution: "CNRS", tags: ["Recherche", "Thèse"] },
            { title: "Astrophysique et Cosmologie", institution: "NASA Edu", tags: ["Espace", "Physique"] },
            { title: "Philosophie des Sciences et Éthique", institution: "Collège de France", tags: ["Philo", "Éthique"] },
            { title: "Neurosciences Cognitives", institution: "Institut du Cerveau", tags: ["Cerveau", "Bio"] },
            { title: "Climatologie et Transition Énergétique", institution: "GIEC Data", tags: ["Climat", "Futur"] },
            { title: "Macroéconomie Globale et Politique", institution: "London School of Eco", tags: ["Finance", "Politique"] },
            { title: "Anthropologie Sociale et Culturelle", institution: "EHESS", tags: ["Société", "Homme"] }
        ]
    },
    {
        level: 'Pro',
        courses: [
            { title: "Fullstack Developer Bootcamp (React/Node)", institution: "OpenClassrooms", tags: ["Tech", "Emploi"] },
            { title: "UX/UI Design Masterclass", institution: "Ironhack", tags: ["Design", "Web"] },
            { title: "Leadership et Management d'Équipe", institution: "Dale Carnegie", tags: ["SoftSkills", "RH"] },
            { title: "Techniques de Vente et Négociation", institution: "HubSpot Academy", tags: ["Vente", "Business"] },
            { title: "Agriculture Moderne et Durable", institution: "AgroParisTech", tags: ["Terre", "Futur"] },
            { title: "Entrepreneuriat : De l'Idée au Scale", institution: "Y Combinator", tags: ["Startup", "Business"] },
            { title: "Gestion de Projet (PMP/Agile)", institution: "PMI Institute", tags: ["Orga", "Méthode"] }
        ]
    }
];

class CloudService {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject("Erreur critique : Impossible d'ouvrir le Cloud Local.");

            request.onsuccess = async (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                console.log("🟢 Cloud Infrastructure : Connecté (Persistent Mode).");
                await this.seedInitialData(); // Ensure data exists
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORES.FILES)) db.createObjectStore(STORES.FILES, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(STORES.DATA)) db.createObjectStore(STORES.DATA, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(STORES.LOGS)) db.createObjectStore(STORES.LOGS, { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains(STORES.COURSES)) db.createObjectStore(STORES.COURSES, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(STORES.ENROLLMENTS)) {
                    const store = db.createObjectStore(STORES.ENROLLMENTS, { keyPath: 'id' });
                    store.createIndex('userId', 'userId', { unique: false });
                    store.createIndex('courseId', 'courseId', { unique: false });
                }
                if (!db.objectStoreNames.contains(STORES.POSTS)) db.createObjectStore(STORES.POSTS, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(STORES.CERTIFICATES)) {
                    const store = db.createObjectStore(STORES.CERTIFICATES, { keyPath: 'id' });
                    store.createIndex('userId', 'studentName', { unique: false });
                }
                console.log("🟠 Cloud Infrastructure : Mise à jour du schéma (V3 Complete LMS).");
            };
        });
    }

    // --- SEEDING (Professional Content Initialization) ---
    private async seedInitialData() {
        // Seed Courses
        const courses = await this.getAllCourses();
        if (courses.length === 0) {
            console.log("🌱 Seeding: Construction du Campus 'Grand Complet' (42 cours)...");
            const transaction = this.db!.transaction([STORES.COURSES], 'readwrite');
            const store = transaction.objectStore(STORES.COURSES);
            
            SEED_COURSES_DATA.forEach((category) => {
                category.courses.forEach((c, index) => {
                    const courseId = `c_${category.level.toLowerCase()}_${index}`;
                    const fullCourse: Course = {
                        id: courseId,
                        title: c.title!,
                        agentId: '4', // Professeur Diallo par défaut
                        level: category.level,
                        duration: category.level === 'Pro' || category.level === 'Master' ? '6 Mois' : '1 An',
                        students: Math.floor(Math.random() * 50000) + 1000,
                        thumbnailUrl: `https://source.unsplash.com/800x600/?${c.tags?.[0] || 'education'},study`, // Dynamic image
                        progress: 0,
                        credits: category.level === 'Pro' ? 50 : 20,
                        tags: c.tags || [],
                        institution: (c as any).institution || "Institut Le Monde à Vous",
                        description: `Cours complet de niveau ${category.level} certifié par ${((c as any).institution || "LMAV")}. Comprends leçons, exercices et examen final.`,
                        objectives: ["Maîtriser les fondamentaux", "Appliquer les connaissances", "Réussir l'examen de certification"],
                        lessons: Array.from({ length: 10 }, (_, i) => ({
                            id: `${courseId}_l${i+1}`,
                            title: `Module ${i+1} : Fondamentaux Avancés`,
                            duration: '45:00',
                            completed: false,
                            isLocked: i > 0,
                            // Content will be generated by AI on demand to save space/time
                        }))
                    };
                    store.add(fullCourse);
                });
            });
        }

        // Seed Posts (if empty)
        const posts = await this.getAllPosts();
        if (posts.length === 0) {
            console.log("🌱 Seeding: Initialisation du Réseau Social...");
            const transaction = this.db!.transaction([STORES.POSTS], 'readwrite');
            const store = transaction.objectStore(STORES.POSTS);
            POSTS.forEach(post => {
                store.add(post);
            });
        }
    }

    // --- SOCIAL NETWORK METHODS (Persistent) ---

    async getAllPosts(): Promise<Post[]> {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            const transaction = this.db!.transaction([STORES.POSTS], 'readonly');
            const store = transaction.objectStore(STORES.POSTS);
            const request = store.getAll();
            request.onsuccess = () => {
                // Sort by timestamp (simple assumption: newer first if id is timestamp based or just sort)
                // For now returning as is, sorting can be done in component
                resolve(request.result || []);
            };
        });
    }

    async savePost(post: Post): Promise<void> {
        if (!this.db) await this.init();
        const transaction = this.db!.transaction([STORES.POSTS], 'readwrite');
        const store = transaction.objectStore(STORES.POSTS);
        store.put(post);
    }

    /**
     * LOOP F4 (persistance des publications) : remplace intégralement le
     * cache local par la vérité serveur après un fetch RÉUSSI. Purge du même
     * geste les posts fantômes pré-correctif (ids non-UUID `post-<ts>` qui
     * n'ont jamais existé côté serveur) et les copies de posts supprimés —
     * le repli hors-ligne montre ainsi la même liste que le serveur, fin de
     * l'alternance « apparaît/disparaît » au gré des aléas réseau.
     */
    async replaceAllPosts(posts: Post[]): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.POSTS], 'readwrite');
            const store = transaction.objectStore(STORES.POSTS);
            store.clear();
            posts.forEach((p) => store.put(p));
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // --- LMS METHODS (Persistent) ---

    async getAllCourses(): Promise<Course[]> {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            const transaction = this.db!.transaction([STORES.COURSES], 'readonly');
            const store = transaction.objectStore(STORES.COURSES);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    async getCourse(courseId: string): Promise<Course | null> {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            const transaction = this.db!.transaction([STORES.COURSES], 'readonly');
            const store = transaction.objectStore(STORES.COURSES);
            const request = store.get(courseId);
            request.onsuccess = () => resolve(request.result || null);
        });
    }

    async updateCourseContent(course: Course): Promise<void> {
        if (!this.db) await this.init();
        const transaction = this.db!.transaction([STORES.COURSES], 'readwrite');
        const store = transaction.objectStore(STORES.COURSES);
        store.put(course);
    }

    async getStudentEnrollments(userId: string): Promise<Enrollment[]> {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            const transaction = this.db!.transaction([STORES.ENROLLMENTS], 'readonly');
            const store = transaction.objectStore(STORES.ENROLLMENTS);
            const index = store.index('userId');
            const request = index.getAll(userId);
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    async enrollInCourse(userId: string, courseId: string): Promise<void> {
        if (!this.db) await this.init();
        const enrollment: Enrollment = {
            id: `${userId}_${courseId}`,
            userId,
            courseId,
            dateEnrolled: new Date(),
            completedLessons: [],
            lastAccessed: new Date(),
            isCompleted: false
        };
        const transaction = this.db!.transaction([STORES.ENROLLMENTS], 'readwrite');
        transaction.objectStore(STORES.ENROLLMENTS).put(enrollment);
    }

    async updateLessonProgress(userId: string, courseId: string, lessonId: string): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.ENROLLMENTS], 'readwrite');
            const store = transaction.objectStore(STORES.ENROLLMENTS);
            const req = store.get(`${userId}_${courseId}`);
            
            req.onsuccess = () => {
                const enrollment = req.result as Enrollment;
                if (enrollment) {
                    if (!enrollment.completedLessons.includes(lessonId)) {
                        enrollment.completedLessons.push(lessonId);
                        enrollment.lastAccessed = new Date();
                        store.put(enrollment);
                    }
                    resolve();
                } else {
                    this.enrollInCourse(userId, courseId).then(() => {
                        this.updateLessonProgress(userId, courseId, lessonId).then(resolve);
                    });
                }
            };
            req.onerror = reject;
        });
    }

    // --- EXAM & CERTIFICATE METHODS ---

    async saveExamSession(userId: string, courseId: string, session: ExamSession): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.ENROLLMENTS], 'readwrite');
            const store = transaction.objectStore(STORES.ENROLLMENTS);
            const req = store.get(`${userId}_${courseId}`);
            
            req.onsuccess = () => {
                const enrollment = req.result as Enrollment;
                if (enrollment) {
                    enrollment.examSession = session;
                    if (session.passed) enrollment.isCompleted = true;
                    store.put(enrollment);
                    resolve();
                } else {
                    reject("Inscription introuvable.");
                }
            };
        });
    }

    async issueCertificate(cert: Certificate): Promise<void> {
        if (!this.db) await this.init();
        const transaction = this.db!.transaction([STORES.CERTIFICATES, STORES.ENROLLMENTS], 'readwrite');
        const certStore = transaction.objectStore(STORES.CERTIFICATES);
        const enrollStore = transaction.objectStore(STORES.ENROLLMENTS);
        
        certStore.add(cert);
    }

    async getCertificates(): Promise<Certificate[]> {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            const transaction = this.db!.transaction([STORES.CERTIFICATES], 'readonly');
            const store = transaction.objectStore(STORES.CERTIFICATES);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    // --- INFRASTRUCTURE (Unchanged) ---
    async uploadFile(file: File, category: string): Promise<string> { 
        // Mock upload logic returning file name as ID for demo
        return `file-${Date.now()}`;
    }
    async getFile(fileId: string): Promise<any> { /* ... */ }
    async getAllFiles(): Promise<any[]> { return []; }
    async saveData(collection: string, data: any) { 
        if (!this.db) await this.init();
        const transaction = this.db!.transaction([STORES.DATA], 'readwrite');
        const store = transaction.objectStore(STORES.DATA);
        store.put({ id: collection, ...data });
    }
    async getData(collection: string): Promise<any> { 
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            const transaction = this.db!.transaction([STORES.DATA], 'readonly');
            const store = transaction.objectStore(STORES.DATA);
            const request = store.get(collection);
            request.onsuccess = () => resolve(request.result || null);
        });
    }
    
    async getStorageUsage(): Promise<{ used: number, quota: number, percent: number }> {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            const used = estimate.usage || 0;
            const quota = estimate.quota || 1024 * 1024 * 1024;
            return { used, quota, percent: (used / quota) * 100 };
        }
        return { used: 0, quota: 0, percent: 0 };
    }

    formatBytes(bytes: number, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

export const cloudService = new CloudService();
