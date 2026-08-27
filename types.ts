
export type AgentRole = 'juridique' | 'emploi' | 'education' | 'sante' | 'logement' | 'voyage' | 'finance' | 'coach';

export interface Agent {
    id: string;
    name: string;
    title: string;
    role: AgentRole;
    specialty: string;
    description: string;
    avatarUrl: string;
    modelConfig: {
        model: string;
        thinking?: boolean;
    };
    metaProfile?: {
        voiceId: string;
        environment?: string;
        videos: {
            idle: string;
            speaking: string;
            listening: string;
            routine: string;
        };
    };
}

export type UserRole = 'user' | 'admin';

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    title?: string;
    role: UserRole;
    citizenshipId: string;
    level: number;
    xp: number;
    nextLevelXp: number;
    credits: number;
    avatarUrl: string;
    preferredLanguage: string;
    twoFactorEnabled: boolean;
    skills: { name: string; progress: number }[];
    badges: { id: string; name: string; icon: string; description: string }[];
    interests: string[];
    shop?: UserShop;
    medical?: {
        bloodType: string;
        allergies: string[];
        conditions: string[];
        medications: string[];
        emergencyContact: string;
    };
}

export interface UserShop {
    id: string;
    name: string;
    description: string;
    bannerUrl: string;
    revenue: number;
    sales: number;
    products: Product[];
    aiConfig: ShopAIConfig;
}

export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    category: 'Digital' | 'Service' | 'Physique';
    imageUrl: string;
    rating: number;
    reviews: number;
}

export interface ShopAIConfig {
    agentName: string;
    personality: string;
    welcomeMessage: string;
    salesStrategy: string;
}

export interface Course {
    id: string;
    title: string;
    institution?: string;
    level: AcademicLevel;
    duration: string;
    thumbnailUrl: string;
    description: string;
    lessons?: Lesson[];
    isEnrolled?: boolean;
    progress?: number;
    agentId?: string;
    students?: number;
    credits?: number;
    tags?: string[];
    objectives?: string[];
}

export type AcademicLevel = 'Primaire' | 'Secondaire' | 'Licence' | 'Master' | 'Doctorat' | 'Pro' | 'All';

export interface Lesson {
    id: string;
    title: string;
    duration: string;
    content?: string;
    isLocked: boolean;
    completed: boolean;
}

export interface Enrollment {
    id: string;
    userId: string;
    courseId: string;
    dateEnrolled: Date;
    completedLessons: string[];
    lastAccessed: Date;
    isCompleted: boolean;
    examSession?: ExamSession;
}

export interface ExamSession {
    id: string;
    courseId: string;
    startedAt: Date;
    questions: QuizQuestion[];
    answers: Record<string, number>;
    passed: boolean;
    isFinished: boolean;
    score?: number;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Certificate {
    id: string;
    courseId: string;
    courseTitle: string;
    studentName: string;
    issueDate: string;
    grade: number;
    serialNumber: string;
    institution?: string;
}

export interface Country {
    code: string;
    name: string;
    flag: string;
    emergencyNumbers?: {
        police: string;
        ambulance: string;
        fire: string;
    };
}

export interface JobOffer {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string;
    description: string;
    postedAt: string;
}

export interface HousingListing {
    id: string;
    title: string;
    type: string;
    price: number;
    currency: string;
    location: string;
    rooms: number;
    surface: number;
    imageUrl: string;
    tags: string[];
}

export interface LiveStream {
    id: string;
    title: string;
    hostName: string;
    hostAvatar: string;
    viewers: number;
    isMixed: boolean;
    aiAssistantId?: string;
    panelists?: string[];
    startedAt: Date;
    duration: number;
    isPaid: boolean;
    pricing?: LivePricing;
    donationGoal?: DonationGoal;
    tags?: string[];
}

export interface LivePricing {
    isEnabled: boolean;
    pricePerMinute: number;
    payer: 'host' | 'viewer';
}

export interface DonationGoal {
    targetAmount: number;
    currentAmount: number;
    title: string;
    tiers: any[];
}

export interface LiveGift {
    id: string;
    name: string;
    icon: string;
    cost: number;
    animation: string;
}

export interface Story {
    id: string;
    author: string;
    avatar: string;
    isLive: boolean;
    mediaUrl?: string;
}

export interface LegalProcedure {
    id: string;
    title: string;
    category: string;
    status: 'pending' | 'blocked' | 'completed';
    progress: number;
    nextStep: string;
    deadline: string;
}

export interface Currency {
    code: string;
    name: string;
    symbol: string;
    rateToEuro: number;
}

export interface WalletTransaction {
    id: string;
    type: 'transfer' | 'exchange' | 'payment' | 'deposit';
    amount: number;
    currency: string;
    date: string;
    description: string;
    recipient?: string;
    status: 'completed' | 'pending' | 'failed';
}

export interface Tribe {
    id: string;
    name: string;
    description: string;
    category: string;
    members: number;
    image: string;
    coverImage: string;
    isJoined: boolean;
    events?: any[];
    posts?: Post[];
}

export interface Comment {
    id: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    timestamp: string;
    likes?: number;
}

export interface Post {
    id: string;
    agentId?: string;
    authorName?: string;
    authorAvatar?: string;
    content: string;
    timestamp: string;
    likes: number;
    comments: number;
    commentsList?: Comment[];
    imageUrl?: string;
    type?: string;
    category?: string;
    pinned?: boolean;
}

export interface LeaderboardUser {
    id: string;
    name: string;
    avatar: string;
    xp: number;
    rank: number;
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    xp: number;
    completed: boolean;
    icon: any; // Can be string or React Node
}

export interface Language {
    code: string;
    name: string;
    flag: string;
}

export interface VocabularyCard {
    id: string;
    word: string;
    translation: string;
    context: string;
}

export interface LanguageLesson {
    id: string;
    title: string;
    level: string;
    scenario: string;
}

export interface StoredDocument {
    id: string;
    name: string;
    category: DocCategory;
    uploadDate: string;
    fileSize: string;
    isVerified: boolean;
    expiryDate?: string;
}

export type DocCategory = 'Identity' | 'Work' | 'Health' | 'Education' | 'Finance' | 'Legal' | 'Other' | 'All';

export interface SecurityLog {
    id: string;
    action: string;
    date: string;
    ip: string;
    device: string;
    status: 'success' | 'warning' | 'danger';
}

export interface DeviceSession {
    id: string;
    deviceName: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'alert';
    timestamp: Date;
    read: boolean;
}

export interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
    images?: string[];
}

// --- NEW CHAT TYPES ---
export interface ChatMessage {
    id: string;
    senderId: string;
    text?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio';
    timestamp: Date;
    isRead: boolean;
}

export interface ChatConversation {
    id: string;
    participantId: string;
    participantName: string;
    participantAvatar: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    isOnline: boolean;
    messages: ChatMessage[];
}

export interface ReelDraft {
    id: string;
    videoUrl: string;
    caption: string;
    hashtags: string[];
    viralScore: number;
    aiSuggestions: string[];
}

export interface Reel {
    id: string;
    videoUrl: string;
    likes: number;
    comments: number;
    shares: number;
    author: string;
    description: string;
    musicTrack: string;
}

export interface Review { id: string; author: string; rating: number; comment: string; }
export interface EvaluationResult { score: number; feedback: string; }
export type EvaluationStatus = 'pending' | 'passed' | 'failed';
export type StudioTab = 'image' | 'video' | 'vision' | 'avatar';
export interface GeneratedMedia { url: string; type: 'image' | 'video'; }
export interface MobilityProject { type: 'work' | 'study' | 'tourism' | 'health'; details: string; }
export interface SimulationResult { feasibilityScore: number; visaType: string; estimatedCost: string; processingTime: string; requirements: string[]; advice: string; agentContactId: string; }
export interface SymptomAnalysis { urgencyLevel: 'low' | 'medium' | 'high'; summary: string; advice: string; specialist: string; disclaimer: string; }
export interface ScamAnalysis { riskScore: number; verdict: 'Safe' | 'Suspicious' | 'Scam'; redFlags: string[]; advice: string; }
export type LiveLayoutMode = 'grid' | 'pip' | 'split';
export interface LiveDonor { id: string; name: string; amount: number; avatar: string; }
export interface LivePoll { id: string; question: string; options: {id: string, text: string, votes: number}[]; isActive: boolean; totalVotes: number; }
export interface LegalDocAnalysis { documentType: string; summary: string; explanation: string; actionRequired: boolean; deadline?: string; }
export interface CouncilStep { id: string; title: string; description: string; assignedAgentId: string; status: 'pending' | 'in_progress' | 'completed'; }
