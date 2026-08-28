
export type AgentRole = 'juridique' | 'emploi' | 'education' | 'sante' | 'logement' | 'voyage' | 'finance' | 'coach' | 'projet' | 'administration' | 'creation' | 'commerce';

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
    isHuman?: boolean;
    rating?: number;
    reviewsCount?: number;
    hourlyRate?: number;
    country?: string;
    languages?: string[];
    skills?: string[];
    availabilityStatus?: 'available' | 'in_call' | 'appointment_only';
    activeDossiersCount?: number;
    completedDossiersCount?: number;
    verified?: boolean;
    experienceYears?: number;
    bio?: string;
    category?: string;
}

export type PlatformRole = 'user' | 'admin' | 'expert' | 'mentor' | 'moderator' | 'organization' | 'super_admin';
export type UserRole = PlatformRole;

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    title?: string;
    bio?: string;
    location?: string;
    country?: string;
    city?: string;
    phone?: string;
    website?: string;
    role: UserRole;
    accountStatus?: 'active' | 'pending' | 'suspended';
    citizenshipId: string;
    level: number;
    xp: number;
    nextLevelXp: number;
    credits: number;
    avatarUrl: string;
    preferredLanguage: string;
    twoFactorEnabled: boolean;
    isVerified?: boolean;
    followersCount?: number;
    followingCount?: number;
    joinedDate?: string;
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
    // Extensions Marché Mondial
    sellerId?: string;
    sellerName?: string;
    sellerCountry?: string;
    sellerFlag?: string;
    sellerVerified?: boolean;
    dimensionType?: 'B2C' | 'B2B' | 'C2C';
    relationType?: 'producer_wholesaler' | 'manufacturer_distributor' | 'exporter_importer' | 'supplier_business' | 'service_client' | 'investor_partner';
    minOrderQuantity?: number;
    unit?: string;
    stockAvailable?: number;
    originCountry?: string;
    originFlag?: string;
    leadTimeDays?: number;
    shippingAvailable?: boolean;
    shippingEstimateCost?: number;
    estimatedCustomsTax?: number;
    insuranceEstimate?: number;
    specifications?: Record<string, string>;
    certifications?: string[];
    isService?: boolean;
    serviceDetails?: {
        pricingModel: 'fixed' | 'quote' | 'hourly';
        portfolioUrls?: string[];
        turnaroundTime?: string;
        languagesSupported?: string[];
    };
    linkedReelId?: string;
    linkedLiveId?: string;
}

export interface ShopAIConfig {
    agentName: string;
    personality: string;
    welcomeMessage: string;
    salesStrategy: string;
}

export type AcademicLevel = 'Fondamentaux' | 'Primaire' | 'College' | 'Lycee' | 'Secondaire' | 'FormationPro' | 'Licence' | 'Master' | 'Doctorat' | 'Pro' | 'All';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎓 CAMPUS MONDIAL INTELLIGENT & SYSTÈMES ÉDUCATIFS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type MasteryStage = 'non_aborde' | 'decouverte' | 'en_apprentissage' | 'compris' | 'pratique' | 'maitrise' | 'consolide';
export type LearningStylePreference = 'oral_audio' | 'lecture_texte' | 'exemples_concrets' | 'video_visuel' | 'demonstration' | 'exercices_pratiques' | 'quiz_repetition' | 'conversation_coach';
export type PedagogyPace = 'adapte_progressif' | 'standard' | 'intensif_concours';

export interface EducationalCurriculumFramework {
    id: string;
    countryCode: string;
    countryName: string;
    countryFlag: string;
    systemName: string;
    officialAuthority: string;
    lastCurriculumReviewYear: number;
    verificationSourceUrl?: string;
    cycles: EducationalCycle[];
}

export interface EducationalCycle {
    id: string;
    cycleName: string;
    levels: EducationalLevelInfo[];
}

export interface EducationalLevelInfo {
    id: string;
    code: string;
    name: string;
    academicLevel: AcademicLevel;
    ageOrTargetAudience?: string;
    isLiteracyFoundation?: boolean;
    streams?: string[];
    officialExams?: string[];
    subjects: CurriculumSubject[];
}

export interface CurriculumSubject {
    id: string;
    code: string;
    name: string;
    coefficient?: number;
    hoursPerWeek?: number;
    description: string;
    officialObjectives: string[];
    chapters: CurriculumChapter[];
}

export interface CurriculumChapter {
    id: string;
    title: string;
    description: string;
    orderIndex: number;
    competencies: CurriculumCompetency[];
    estimatedHours: number;
}

export interface CurriculumCompetency {
    id: string;
    code: string;
    title: string;
    description: string;
    prerequisites?: string[];
    cognitiveDomain: 'memorisation' | 'comprehension' | 'raisonnement' | 'application_pratique' | 'resolution_probleme' | 'argumentation';
    keyConcepts: string[];
}

export interface StudentMasteryItem {
    competencyId: string;
    competencyTitle: string;
    subjectId: string;
    subjectName: string;
    stage: MasteryStage;
    confidenceScore: number;
    lastPracticedAt: string;
    lastEvaluationScore?: number;
    nextRevisionRecommendedAt?: string;
    mistakePatterns: string[];
    isFragile: boolean;
}

export interface DailyStudyPlan {
    todayObjectives: string[];
    recommendedLessonTitle: string;
    recommendedSubject: string;
    recommendedDurationMin: number;
    weeklyTargetCompetencies: string[];
    monthlyMilestoneExam: string;
    nextMockExamDate?: string;
}

export interface StudentPedagogicalProfile {
    id: string;
    userId: string;
    selectedCountryCode: string;
    selectedCountryName: string;
    selectedCountryFlag: string;
    selectedSystemId: string;
    selectedLevelCode: string;
    selectedLevelName: string;
    targetExamOrGoal: string;
    learningStyle: LearningStylePreference;
    pace: PedagogyPace;
    preferredLanguage: string;
    isLiteracyPathway: boolean;
    hybridAddons: string[];
    diagnosticCompleted: boolean;
    diagnosticScoreOverall?: number;
    strengths: string[];
    priorityGaps: string[];
    activeWorkingPlan: DailyStudyPlan;
    masteryRegistry: StudentMasteryItem[];
    pedagogicalInsightsForCoach: string[];
    totalMasteredCompetencies: number;
    totalTrackedCompetencies: number;
}

export interface MockExamSection {
    id: string;
    title: string;
    points: number;
    questions: QuizQuestion[];
}

export interface MockExamBlueprint {
    id: string;
    examName: string;
    countryCode: string;
    subjectName: string;
    levelName: string;
    durationMinutes: number;
    totalPoints: number;
    passingScore: number;
    instructions: string[];
    sections: MockExamSection[];
}

export interface MockExamReport {
    id: string;
    examBlueprintId: string;
    examTitle: string;
    takenAt: string;
    durationSpentSeconds: number;
    score: number;
    passed: boolean;
    competencyAnalysis: {
        mastered: string[];
        partial: string[];
        toReinforce: string[];
    };
    examinerDialloFeedback: string;
    prescribedRevisionActions: string[];
}

export interface AcademicEquivalenceComparison {
    originCountry: string;
    originSystem: string;
    originLevel: string;
    targetCountry: string;
    targetSystem: string;
    targetLevel: string;
    directEquivalenceTitle: string;
    confidenceLevel: 'forte_reconnaissance_academique' | 'equivalence_partielle_avec_passerelle' | 'evaluation_dossier_requise';
    commonFoundations: string[];
    divergentTopicsOrAdditions: string[];
    recommendedBridgePath: string[];
    officialSourceNote: string;
}

export interface Course {
    id: string;
    title: string;
    institution?: string;
    level: AcademicLevel;
    countryCode?: string;
    countryName?: string;
    systemId?: string;
    curriculumCode?: string;
    subjectCode?: string;
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
    competenciesCovered?: string[];
}

export interface Lesson {
    id: string;
    title: string;
    duration: string;
    content?: string;
    practiceExercise?: string;
    resourcesList?: string[];
    competencyId?: string;
    isLocked: boolean;
    completed: boolean;
    alternateExplanations?: {
        simpleAnalogy?: string;
        practicalLocalExample?: string;
        visualConceptSchema?: string;
        stepByStepBreakdown?: string;
        audioScriptOral?: string;
    };
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

export type LiveType = 
    | 'public' 
    | 'private' 
    | 'members' 
    | 'group' 
    | 'expert' 
    | 'education' 
    | 'campus' 
    | 'pro' 
    | 'enterprise' 
    | 'tribe' 
    | 'event' 
    | 'conference' 
    | 'qa' 
    | 'coaching' 
    | 'demo' 
    | 'workshop' 
    | 'project_pitch'
    | 'work_meeting'
    | 'masterclass'
    | 'interview'
    | 'commerce'
    | 'council'
    | 'course';

export type LiveQualityMode = 'auto' | 'hd' | 'sd' | 'eco_audio';

export interface LiveStageParticipant {
    id: string;
    name: string;
    avatar: string;
    role: 'host' | 'cohost' | 'guest' | 'expert_ai' | 'expert_human' | 'speaker' | 'secretary_ai' | 'moderator_ai' | 'director_ai';
    isMuted: boolean;
    isVideoOn: boolean;
    isAi?: boolean;
    isVerified?: boolean;
    specialty?: string;
    agentId?: string;
    isScreenSharing?: boolean;
    isHandRaised?: boolean;
    joinedAt?: Date;
}

export interface LiveCommerceProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    country: string;
    countryFlag: string;
    availability: 'in_stock' | 'preorder' | 'limited';
    sellerName: string;
    sellerAvatar: string;
    imageUrl: string;
    category: string;
    hasTradeAssistance?: boolean;
}

export interface LiveAgendaItem {
    id: string;
    title: string;
    durationMinutes: number;
    presenter?: string;
    completed: boolean;
}

export interface LiveDecision {
    id: string;
    text: string;
    agreedBy: string[];
    timestamp: string;
    category?: string;
}

export interface LivePersonalNote {
    id: string;
    text: string;
    timestamp: string;
    category: 'reminder' | 'task' | 'project' | 'learning' | 'general';
    targetModule?: string;
    reminderDate?: string;
}

export interface LiveSourceCard {
    id: string;
    statement: string;
    organization: string;
    documentName: string;
    date: string;
    referenceUrl?: string;
    verifiedStatus: 'confirmed' | 'uncertain' | 'contradictory' | 'insufficient';
    analysis: string;
}

export interface LiveAttendanceRecord {
    participantId: string;
    name: string;
    joinedAt: string;
    durationMinutes: number;
    exercisesDone: number;
    quizScore?: number;
    competenceValidated?: boolean;
}

export interface LiveMeetingMinutes {
    title: string;
    date: string;
    attendees: string[];
    agenda: string[];
    decisions: string[];
    actionItems: LiveActionItem[];
    summary: string;
    nextMeetingDate?: string;
}

export interface LiveImpactMetrics {
    participantsCount: number;
    projectsInitiated: number;
    skillsLearned: number;
    appointmentsBooked: number;
    resourcesSaved: number;
    questionsResolved: number;
}

export interface LiveQuestion {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    text: string;
    timestamp: string;
    upvotes: number;
    userUpvoted?: boolean;
    status: 'open' | 'answering' | 'answered';
    category?: string;
    aiGroupKey?: string;
}

export interface LiveDoc {
    id: string;
    name: string;
    url: string;
    type: 'pdf' | 'doc' | 'image' | 'slide' | 'sheet';
    size?: string;
    uploadedBy: string;
    pageCount?: number;
}

export interface LiveWhiteboardStroke {
    id: string;
    tool: 'pen' | 'rect' | 'circle' | 'text' | 'note' | 'arrow';
    color: string;
    width: number;
    points?: { x: number; y: number }[];
    text?: string;
    x?: number;
    y?: number;
    widthBox?: number;
    heightBox?: number;
}

export interface LiveActionItem {
    id: string;
    title: string;
    category: 'projet' | 'juridique' | 'finance' | 'formation' | 'action';
    assignedTo?: string;
    deadline?: string;
    completed: boolean;
    notes?: string;
}

export interface LiveReplayData {
    id: string;
    liveId: string;
    title: string;
    duration: number;
    hostName: string;
    hostAvatar: string;
    videoUrl?: string;
    category?: string;
    chapters: { title: string; timeSec: number; summary: string }[];
    transcript: { speaker: string; text: string; timeSec: number; isAi?: boolean }[];
    summary: string;
    keyTakeaways: string[];
    questions: LiveQuestion[];
    actionItems: LiveActionItem[];
    resources: LiveDoc[];
    campusReady?: boolean;
}

export interface LiveStream {
    id: string;
    title: string;
    description?: string;
    type?: LiveType;
    hostName: string;
    hostAvatar: string;
    viewers: number;
    isMixed: boolean;
    aiAssistantId?: string;
    panelists?: string[];
    speakers?: LiveStageParticipant[];
    coHosts?: string[];
    moderators?: string[];
    startedAt: Date;
    scheduledFor?: string;
    timezone?: string;
    isScheduled?: boolean;
    duration: number;
    isPaid: boolean;
    pricing?: LivePricing;
    donationGoal?: DonationGoal;
    tags?: string[];
    language?: string;
    targetLanguage?: string;
    coverImage?: string;
    isPrivate?: boolean;
    allowedMemberIds?: string[];
    tribeId?: string;
    tribeName?: string;
    expertId?: string;
    isRecordingEnabled?: boolean;
    isTranslationEnabled?: boolean;
    isQuestionsEnabled?: boolean;
    isScreenShareEnabled?: boolean;
    isVisionEnabled?: boolean;
    isDataSaver?: boolean;
    qualityMode?: LiveQualityMode;
    agenda?: LiveAgendaItem[];
    decisions?: LiveDecision[];
    products?: LiveCommerceProduct[];
    sourceCards?: LiveSourceCard[];
    meetingMinutes?: LiveMeetingMinutes;
    dossierId?: string;
    dossierTitle?: string;
    isWaitingRoomEnabled?: boolean;
    courseModuleId?: string;
    interviewGuestName?: string;
    interviewGuestBio?: string;
    confTracks?: string[];
    sensitiveDataAlert?: boolean;
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
    authorId?: string;
    avatar: string;
    isLive: boolean;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    caption?: string;
    timestamp?: string;
    viewersCount?: number;
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
    authorId?: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    timestamp: string;
    likes?: number;
    isLiked?: boolean;
    replies?: Comment[];
}

export type PostVisibility = 'public' | 'network' | 'private';
export type PostReactionType = 'like' | 'love' | 'celebrate' | 'insightful' | 'support' | 'fire';

export interface PostDocument {
    name: string;
    url: string;
    size: string;
    type: 'pdf' | 'doc' | 'sheet' | 'zip' | 'other';
    pageCount?: number;
}

export interface Post {
    id: string;
    agentId?: string;
    authorId?: string;
    authorName?: string;
    authorAvatar?: string;
    authorTitle?: string;
    content: string;
    timestamp: string;
    likes: number;
    comments: number;
    commentsList?: Comment[];
    imageUrl?: string;
    videoUrl?: string;
    document?: PostDocument;
    type?: string;
    category?: string;
    tags?: string[];
    pinned?: boolean;
    visibility?: PostVisibility;
    shares?: number;
    saved?: boolean;
    reactions?: Partial<Record<PostReactionType, number>>;
    userReaction?: PostReactionType;
    aiEnhanced?: boolean;
    originalLanguage?: string;
    translations?: Record<string, string>;
}

export interface MemberProfile {
    id: string;
    name: string;
    avatarUrl: string;
    title: string;
    bio: string;
    location: string;
    country?: string;
    joinedDate: string;
    isVerified?: boolean;
    isOnline?: boolean;
    isFollowing?: boolean;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    storiesCount: number;
    reelsCount: number;
    livesCount: number;
    skills?: string[];
    privacySettings: {
        profileVisibility: 'public' | 'network' | 'private';
        allowMessagesFrom: 'all' | 'network' | 'none';
        showOnlineStatus: boolean;
        allowTagging: boolean;
        showActivityFeed: boolean;
    };
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

// --- MOOC CHAT TYPES ---
export interface ChatAttachment {
    name: string;
    url: string;
    size: string;
    type: 'pdf' | 'doc' | 'image' | 'video' | 'audio' | 'zip';
}

export interface ChatMessage {
    id: string;
    /** Identifiant idempotent généré côté client, distinct de l'UUID serveur. */
    clientId?: string;
    conversationId?: string;
    senderId: string;
    senderName?: string;
    senderAvatar?: string;
    senderRole?: string;
    text?: string;
    mediaUrl?: string;
    mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document';
    fileName?: string;
    fileSize?: string;
    audioDuration?: number; // seconds
    timestamp: Date | string;
    isRead: boolean;
    status?: 'pending' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    reactions?: Record<string, string[]>; // { '👍': ['user-1', 'user-2'] }
    replyTo?: {
        id: string;
        text?: string;
        senderName?: string;
        mediaType?: string;
    };
    attachments?: ChatAttachment[];
    isEdited?: boolean;
    isPinned?: boolean;
    isDeleted?: boolean;
    isAiGenerated?: boolean;
    isEncrypted?: boolean;
}

export interface ChatConversation {
    id: string;
    participantId: string;
    participantName: string;
    participantAvatar: string;
    participantTitle?: string;
    participantRole?: string;
    participantEmail?: string;
    participantPhone?: string;
    participantCountry?: string;
    isGroup?: boolean;
    groupMembersCount?: number;
    groupMembers?: {
        id: string;
        name: string;
        avatar: string;
        role?: string;
        isOnline?: boolean;
    }[];
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    isOnline: boolean;
    lastSeen?: string;
    isAgent?: boolean;
    isBlocked?: boolean;
    isMuted?: boolean;
    isPinned?: boolean;
    isEncrypted?: boolean;
    encryptionFingerprint?: string;
    typingUsers?: string[];
    messages: ChatMessage[];
}

export interface ActiveCallSession {
    callId: string;
    conversationId: string;
    type: 'audio' | 'video';
    initiatorId: string;
    initiatorName: string;
    initiatorAvatar: string;
    receiverId: string;
    receiverName: string;
    receiverAvatar: string;
    status: 'ringing' | 'connected' | 'ended' | 'rejected' | 'busy';
    startedAt?: Date;
    durationSeconds: number;
}

export type ReelCategory = 
    | 'all'
    | 'learning'
    | 'expert'
    | 'opportunity'
    | 'tribe'
    | 'career'
    | 'health'
    | 'legal'
    | 'project'
    | 'commerce'
    | 'language';

export interface ReelQuiz {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    campusCourseId?: string;
}

export interface ReelActionGateway {
    type: 'expert' | 'campus' | 'tribe' | 'career_coach' | 'project' | 'commerce' | 'live_event' | 'legal_source';
    label: string;
    targetId?: string;
    targetTitle?: string;
    targetUrl?: string;
    agentId?: string;
    courseId?: string;
    tribeId?: string;
    projectId?: string;
    productId?: string;
    liveId?: string;
    legalArticle?: {
        country: string;
        codeOrLaw: string;
        articleNumber: string;
        sourceUrl?: string;
    };
    opportunityData?: {
        type: 'job' | 'grant' | 'internship' | 'scholarship';
        deadline: string;
        organization: string;
    };
}

export interface ReelDraft {
    id: string;
    videoUrl: string;
    caption: string;
    hashtags: string[];
    viralScore: number;
    aiSuggestions: string[];
    category?: ReelCategory;
    actionGateway?: ReelActionGateway;
    quiz?: ReelQuiz;
    isSyntheticAi?: boolean;
    language?: string;
}

export interface ReelImpactMetrics {
    learnersStarted: number;
    parcoursTriggered: number;
    collaborationsCreated: number;
    opportunitiesViewed: number;
    campusEnrollments: number;
    actionPassageRate?: number; // Taux de passage à l'action (%)
    utilityScore: number; // 0-100%
}

export type ReelIntentType = 
    | 'learn'              // « Je veux apprendre »
    | 'apply'              // « Je veux candidater »
    | 'project'            // « Transformer mon idée en projet »
    | 'commerce_inquire'   // « Je suis intéressé (Acheter / Importer) »
    | 'help_me_do_same'    // « Aide-moi à faire pareil »
    | 'collaborate';       // « Demander une collaboration »

export interface ReelChallenge {
    id: string;
    title: string;
    tagline: string;
    category: string;
    durationDays: number;
    participantsCount: number;
    rewardXp: number;
    steps: { day: number; title: string; objective: string; completed?: boolean }[];
    badge: string;
}

export interface TenMinutesSessionState {
    isActive: boolean;
    mode: 'learn' | 'discover' | 'objective' | 'entertain';
    secondsRemaining: number;
    reelsWatchedCount: number;
    quizzesCompletedCount: number;
    actionsTriggeredCount: number;
    xpEarned: number;
}

export interface ReelCommentSummary {
    mainThemes: string[];
    frequentQuestions: string[];
    unansweredQuestions: string[];
}

export interface Reel {
    id: string;
    videoUrl: string;
    thumbnailUrl?: string;
    likes: number;
    comments: number;
    shares: number;
    saves?: number;
    author: string;
    authorAvatar?: string;
    authorId?: string;
    authorRole?: string;
    isVerifiedExpert?: boolean;
    isSyntheticAi?: boolean;
    expertAgentId?: string;
    description: string;
    musicTrack: string;
    tags?: string[];
    isLiked?: boolean;
    isSaved?: boolean;
    category?: ReelCategory;
    language?: string;
    subtitles?: { time: number; text: string }[];
    translatedDescription?: string;
    translatedSubtitles?: { time: number; text: string }[];
    whyRecommended?: string; // Transparence IA "Pourquoi je vois ça ?"
    actionGateway?: ReelActionGateway;
    quiz?: ReelQuiz;
    impactMetrics?: ReelImpactMetrics;
    commentSummary?: ReelCommentSummary;
    transcriptionText?: string;
    duration?: number;
    tribeName?: string;
    tribeId?: string;
    viewsCount?: number;
}

export interface Review { id: string; author: string; rating: number; comment: string; }
export interface EvaluationResult { score: number; feedback: string; }
export type EvaluationStatus = 'pending' | 'passed' | 'failed';
export type StudioTab = 'image' | 'video' | 'vision' | 'avatar' | 'collaboration';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤝 STUDIO CO-CRÉATION & COLLABORATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type CoCreationType = 'article' | 'project' | 'course' | 'pitch' | 'manifesto' | 'guide';
export type CoCreationStatus = 'draft' | 'co_writing' | 'peer_review' | 'ready' | 'published';

export interface CoAuthorMember {
    id: string;
    name: string;
    avatarUrl: string;
    role: 'lead' | 'co_author' | 'reviewer' | 'contributor';
    isOnline?: boolean;
    lastActiveAt?: string;
    colorCode?: string;
}

export interface CoCreationComment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    sectionId?: string;
    sectionTitle?: string;
    text: string;
    timestamp: string;
    resolved: boolean;
}

export interface CoCreationVersion {
    id: string;
    versionNumber: number;
    authorName: string;
    timestamp: string;
    changeNote: string;
    contentSnapshot: string;
}

export interface CoCreationProject {
    id: string;
    title: string;
    subtitle?: string;
    description: string;
    type: CoCreationType;
    category: string;
    status: CoCreationStatus;
    leadAuthor: CoAuthorMember;
    coAuthors: CoAuthorMember[];
    content: string;
    coverImageUrl?: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    viewsCount: number;
    likesCount: number;
    sharesCount: number;
    versions: CoCreationVersion[];
    comments: CoCreationComment[];
    visibility: 'public' | 'circle_only' | 'private_team';
    targetPublishModule?: 'social_feed' | 'campus' | 'market' | 'dossier';
    isAiAssisted?: boolean;
    aiSuggestionsCount?: number;
}

export interface DiscussionCirclePost {
    id: string;
    circleId: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    authorTitle?: string;
    content: string;
    timestamp: string;
    likes: number;
    userLiked?: boolean;
    sharedStudioAsset?: {
        title: string;
        type: 'image' | 'video' | 'script' | 'prompt' | 'article';
        urlOrContent: string;
    };
    repliesCount?: number;
}

export interface DiscussionCircle {
    id: string;
    name: string;
    tagline: string;
    description: string;
    category: string;
    avatarUrl: string;
    bannerUrl?: string;
    membersCount: number;
    isJoined: boolean;
    isOfficial?: boolean;
    activeTopic: string;
    createdAt: string;
    lastActivityAt: string;
    tags: string[];
    posts: DiscussionCirclePost[];
    activePoll?: {
        id: string;
        question: string;
        options: { id: string; text: string; votes: number }[];
        totalVotes: number;
        userVotedOptionId?: string;
    };
}

export interface SharedStudioResource {
    id: string;
    title: string;
    description: string;
    type: 'template' | 'prompt_library' | 'script' | 'media_asset' | 'project_framework';
    category: string;
    authorName: string;
    authorAvatar: string;
    authorRole?: string;
    content: string;
    previewUrl?: string;
    downloadsCount: number;
    likesCount: number;
    isLiked?: boolean;
    tags: string[];
    createdAt: string;
    accessLevel: 'free_public' | 'verified_only' | 'members_only';
}

export interface CommunityCollaborationIdea {
    id: string;
    title: string;
    description: string;
    category: string;
    authorName: string;
    authorAvatar: string;
    authorId?: string;
    targetImpact: string;
    neededSkills: string[];
    votesCount: number;
    userVoted?: boolean;
    volunteersCount: number;
    userVolunteered?: boolean;
    status: 'ideation' | 'approved' | 'in_progress' | 'launched';
    createdAt: string;
    linkedProjectId?: string;
}
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

// ═══════════════════════════════════════════════════════════════════════════
// 👁️ MULTIMODAL PERCEPTION & COMPUTER VISION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type VisionFeatureMode = 'all' | 'objects' | 'motion' | 'ocr' | 'scene' | 'people';

export interface BoundingBox {
    ymin: number; // 0 to 1000 or 0 to 1
    xmin: number;
    ymax: number;
    xmax: number;
}

export interface DetectedObject {
    id: string;
    label: string;
    labelFr: string;
    confidence: number;
    category: string;
    box: BoundingBox;
    color?: string;
}

export interface MotionDetectionResult {
    hasMotion: boolean;
    motionLevel: number; // 0 to 100
    activeZones: BoundingBox[];
    motionVector?: { x: number; y: number };
    timestamp: number;
}

export interface OcrBlock {
    id: string;
    text: string;
    box: BoundingBox;
    language?: string;
    type?: 'document' | 'heading' | 'text' | 'form_field' | 'sign';
    confidence?: number;
}

export interface SceneUnderstanding {
    summary: string;
    environmentType: 'intérieur' | 'extérieur' | 'bureau' | 'véhicule' | 'espace public' | 'document' | 'inconnu';
    lighting: 'lumineux' | 'sombre' | 'naturel' | 'artificiel' | 'optimal';
    spatialContext: string[];
    suggestedActions: string[];
    riskScore?: number;
}

export interface RecognizedPerson {
    id: string;
    name: string;
    role?: string;
    isAuthorized: boolean;
    confidence: number;
    box: BoundingBox;
    notes?: string;
}

export interface EnrolledPerson {
    id: string;
    name: string;
    role: string;
    photoUrl?: string;
    isAuthorized: boolean;
    enrolledAt: string;
    notes?: string;
}

export interface MultimodalVisionAnalysis {
    timestamp: number;
    objects: DetectedObject[];
    motion: MotionDetectionResult;
    ocrBlocks: OcrBlock[];
    scene: SceneUnderstanding;
    recognizedPersons: RecognizedPerson[];
    executiveSummary: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧠 SMART DOSSIERS, PARCOURS & ACTIVE MEMORY TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type DossierCategory = 'projet' | 'education' | 'carriere' | 'administration' | 'sante' | 'logement' | 'finance' | 'mobilite';

// États du Parcours Vivant selon la charte LE MONDE À VOUS
export type DossierStatus = 
    | 'a_definir' 
    | 'en_preparation' 
    | 'en_cours' 
    | 'bloque' 
    | 'action_requise' 
    | 'en_attente_tiers' 
    | 'a_valider' 
    | 'objectif_atteint' 
    | 'suivi_continuite'
    | 'diagnostic'
    | 'evaluation'
    | 'complete'
    | 'archive';

export interface DossierStep {
    id: string;
    stepNumber: number;
    title: string;
    description: string;
    assignedAgentId: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'alternative_plan_b';
    deliverableTitle?: string;
    deliverableUrl?: string;
    progress: number; // 0 to 100
    estimatedDuration?: string;
    validationNotes?: string;
    gatewayModule?: string;
    gatewayActionLabel?: string;
    gatewayTab?: string;
    isKeyMilestone?: boolean;
}

export interface DossierTask {
    id: string;
    title: string;
    deadline?: string;
    completed: boolean;
    assignedAgentId?: string;
    priority: 'low' | 'medium' | 'high';
    isAutoGenerated?: boolean;
    linkedStepId?: string;
}

export interface DossierDocument {
    id: string;
    title: string;
    type: 'pdf' | 'doc' | 'sheet' | 'image' | 'report' | 'contract';
    version: number;
    url?: string;
    content?: string;
    updatedAt: string;
    agentId?: string;
    isSigned?: boolean;
    fileSize?: string;
    isVerified?: boolean;
}

export interface DossierDeliverable {
    id: string;
    title: string;
    description: string;
    category: string;
    status: 'draft' | 'review' | 'final';
    documentUrl?: string;
    createdAt: string;
    authorAgentName: string;
    gradeOrScore?: number;
    certificateHash?: string;
}

export interface DossierAppointment {
    id: string;
    title: string;
    date: string;
    time: string;
    agentId: string;
    type: 'audio' | 'video' | 'chat' | 'expert_humain';
    notes?: string;
    status: 'scheduled' | 'completed' | 'cancelled';
}

export interface PlanBAlternative {
    id: string;
    title: string;
    triggerCondition: string;
    description: string;
    impactOnTimeline: string;
    suggestedAgentId: string;
    revisedStepsSummary: string;
    isActivated?: boolean;
}

export interface DossierParcours {
    id: string;
    title: string;
    category: DossierCategory;
    goal: string;
    status: DossierStatus;
    progress: number; // 0 to 100
    startDate: string;
    targetDate: string;
    leadAgentId: string;
    collaboratingAgentIds: string[];
    associatedModules?: string[];
    currentStepIndex: number;
    steps: DossierStep[];
    tasks: DossierTask[];
    documents: DossierDocument[];
    deliverables: DossierDeliverable[];
    appointments: DossierAppointment[];
    nextAction: string;
    decisions: string[];
    difficulties: string[];
    skillsGained: string[];
    aiRecommendations: string[];
    lastActiveDate: string;
    costEstimate?: string;
    expectedOutcome?: string;
    pointA?: {
        initialStatus: string;
        currentLocation?: string;
        startingSkills?: string[];
        uploadedDocsSummary?: string;
        constraints?: string[];
    };
    pointB?: {
        targetGoal: string;
        targetLocation?: string;
        certificationExpected?: string;
        targetTimeline?: string;
        successCriteria?: string[];
    };
    scopeMode?: 'individual' | 'family' | 'organization';
    familyMembers?: { name: string; role: string; specificNeeds?: string }[];
    planBAlternatives?: PlanBAlternative[];
    continuityPlan?: {
        nextPhaseTitle: string;
        recommendations: string[];
        followUpAgentId?: string;
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// 💾 5 COUCHES DE MÉMOIRE ACTIVE TRANSVERSALE
// ═══════════════════════════════════════════════════════════════════════════

export type MemoryLayer = 
    | 'personal'       // Profil, préférences, identité citoyenne
    | 'parcours'       // Objectifs, statuts, étapes, blocages, décisions
    | 'learning'       // Compétences, notes d'examens, certifications
    | 'documentary'    // Livrables, contrats, pièces d'identité
    | 'conversational';// Historique des sessions d'experts et du Conseil

export type ActiveMemoryCategory = 
    | 'objective' 
    | 'decision' 
    | 'step' 
    | 'difficulty' 
    | 'document' 
    | 'task' 
    | 'appointment' 
    | 'skill' 
    | 'preference'
    | 'context';

export interface ActiveMemoryItem {
    id: string;
    layer?: MemoryLayer;
    category: ActiveMemoryCategory;
    key: string;
    value: string;
    agentId?: string;
    dossierId?: string;
    timestamp: string;
    verified: boolean;
    confidence: number; // 0 to 1
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧠 ORCHESTRATION DIALLO OS (RÉPONSES & SITUATIONS)
// ═══════════════════════════════════════════════════════════════════════════

export interface DialloOrchestrationResult {
    intent: string;
    goal: string;
    summaryStatus: {
        whereWeAre: string;       // "Voilà où nous en sommes"
        whatIsDone: string;       // "Voilà ce qui a été réalisé"
        whatIsBlocking: string;   // "Voilà ce qui bloque"
        nextAction: string;       // "Voilà la prochaine action"
    };
    suggestedParcoursId?: string;
    createdParcours?: DossierParcours;
    leadAgentId: string;
    collaboratingAgentIds: string[];
    targetModules: string[];
    immediateActionLabel: string;
    targetTab: string;
    targetContext?: any;
    confidence: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎓 ÉCOLE NUMÉRIQUE & ÉVALUATION PÉDAGOGIQUE
// ═══════════════════════════════════════════════════════════════════════════

export interface PedagogicalCurriculum {
    id: string;
    level: string; // 'Initiation / Alphabétisation' | 'Primaire' | 'Secondaire' | 'Lycée' | 'Supérieur' | 'Professionnel' | 'Langues'
    pace: '30min' | '1h' | '2h' | 'intensif';
    language: string;
    currentSubject: string;
    currentChapter: string;
    yearlyMilestone: string;
    monthlyGoal: string;
    weeklySchedule: { day: string; topic: string; duration: string; completed: boolean }[];
    dailyLesson: {
        title: string;
        objective: string;
        theorySummary: string;
        exercisesCount: number;
        completed: boolean;
    };
}

export interface PedagogicalAssessment {
    id: string;
    date: string;
    subject: string;
    level: string;
    score: number; // 0 to 100
    status: 'acquis' | 'en_cours' | 'a_renforcer';
    acquiredSkills: string[];
    skillsToStrengthen: string[];
    mistakesAnalysis: string[];
    recommendedRemediation: string;
    agentSignature: string;
}

export interface CompetencyRecord {
    id: string;
    name: string;
    category: 'Savoir' | 'Savoir-faire' | 'Méthodologie' | 'Communication' | 'Numérique';
    level: number; // 1 to 5
    maxLevel: number;
    status: 'learning' | 'mastered' | 'certified';
    certifiedDate?: string;
    evidence?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🌍 MARCHÉ MONDIAL — TYPES & DATA MODELS
// ═══════════════════════════════════════════════════════════════════════════

export type MarketIntent = 
    | 'buy'
    | 'sell'
    | 'find_product'
    | 'find_supplier'
    | 'find_buyer'
    | 'find_partner'
    | 'import'
    | 'export'
    | 'offer_service'
    | 'find_service'
    | 'explain_to_diallo';

export type TradeDimension = 'B2B' | 'B2C' | 'C2C';

export interface BuyRequestRFQ {
    id: string;
    title: string;
    category: string;
    dimension: TradeDimension;
    description: string;
    quantityRequested: number;
    unit: string;
    targetPricePerUnit?: number;
    currency: string;
    targetDestinationCountry: string;
    targetDestinationCity?: string;
    deadlineDate: string;
    buyerId: string;
    buyerName: string;
    buyerCountry: string;
    buyerFlag: string;
    buyerVerified: boolean;
    specifications: string[];
    certificationsRequired: string[];
    createdAt: string;
    status: 'open' | 'quotes_received' | 'in_negotiation' | 'fulfilled' | 'closed';
    quotesCount: number;
    quotes?: TradeQuote[];
}

export interface TradeQuote {
    id: string;
    rfqId: string;
    supplierId: string;
    supplierName: string;
    supplierCountry: string;
    supplierFlag: string;
    supplierVerified: boolean;
    pricePerUnit: number;
    totalPrice: number;
    currency: string;
    unit: string;
    minOrderQty: number;
    leadTimeDays: number;
    incotermProposed: 'EXW' | 'FOB' | 'CIF' | 'DDP' | 'CFR';
    shippingEstimate: number;
    customsEstimate?: number;
    insuranceEstimate?: number;
    notes: string;
    status: 'pending' | 'accepted' | 'countered' | 'rejected' | 'expired';
    submittedAt: string;
    counterOffer?: {
        pricePerUnit: number;
        buyerNote: string;
        date: string;
    };
    commercialDocsAvailable: string[];
}

export interface FreightForwarderProfile {
    id: string;
    companyName: string;
    logoUrl: string;
    headquartersCountry: string;
    flag: string;
    servedRoutes: string[]; // e.g. ["Chine -> Guinée", "France -> Sénégal"]
    freightTypes: ('sea_fcl' | 'sea_lcl' | 'air_freight' | 'road_haulage' | 'express_courier')[];
    languages: string[];
    isVerified: boolean;
    rating: number;
    reviewsCount: number;
    transitTimeEstimateDays: string;
    pricingGuideline: string;
    customsClearanceService: boolean;
    bondedWarehousing: boolean;
    contactEmail: string;
    contactPhone: string;
}

export interface TradeCompanyProfile {
    id: string;
    name: string;
    logoUrl: string;
    bannerUrl?: string;
    legalType: 'individual' | 'company' | 'cooperative' | 'manufacturer';
    country: string;
    countryFlag: string;
    city: string;
    sector: string;
    website?: string;
    description: string;
    servedMarkets: string[];
    languages: string[];
    verificationStatus: 'verified' | 'pending' | 'unverified';
    verificationDocsUploaded: boolean;
    registrationNumber?: string;
    rating: number;
    reviewsCount: number;
    transactionsCompleted: number;
    productsCount: number;
    servicesCount: number;
    contactPerson: string;
    contactEmail: string;
    reputationScore: number; // 0-100
}

export interface ImportExportRoadmapStep {
    stepNumber: number;
    phase: string;
    title: string;
    description: string;
    responsibleAgent: string;
    status: 'completed' | 'in_progress' | 'pending';
    deliverables: string[];
    estimatedDuration: string;
    regulationsChecked?: string[];
    riskPoints?: string[];
}

export interface ImportExportProject {
    id: string;
    type: 'import' | 'export';
    title: string;
    productCategory: string;
    originCountry: string;
    destinationCountry: string;
    quantity: number;
    unit: string;
    budgetTotalEstimated: number;
    currency: string;
    currentStepIndex: number;
    steps: ImportExportRoadmapStep[];
    landedCostBreakdown: {
        productCost: number;
        transportCost: number;
        insuranceCost: number;
        customsDutyCost: number;
        vatLocalTaxCost: number;
        localHandlingCost: number;
        totalEstimated: number;
        currency: string;
        isKnownOrEstimated: {
            product: 'known' | 'estimated';
            transport: 'known' | 'estimated';
            insurance: 'known' | 'estimated';
            customs: 'known' | 'estimated';
            localDelivery: 'known' | 'estimated';
        };
    };
    businessTripPlanned?: {
        destinationCity: string;
        targetDates: string;
        visaStatus: string;
        suppliersToMeet: string[];
        hotelBooked: boolean;
        translatorNeeded: boolean;
        checklist: { item: string; done: boolean }[];
    };
}

export interface TradeDealNegotiation {
    id: string;
    dealTitle: string;
    buyerId: string;
    buyerName: string;
    sellerId: string;
    sellerName: string;
    productId: string;
    productTitle: string;
    productImageUrl: string;
    initialPrice: number;
    currentOfferPrice: number;
    targetPrice: number;
    quantity: number;
    currency: string;
    status: 'draft' | 'offer_sent' | 'counter_received' | 'accepted' | 'refused' | 'formalized_contract';
    history: {
        party: 'buyer' | 'seller';
        amount: number;
        notes: string;
        date: string;
    }[];
    agreedIncoterm?: string;
    paymentMilestones?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 🌍 MARCHÉ MONDIAL — MODULE 2 (TRANSACTION INTERNATIONALE DE BOUT EN BOUT)
// ═══════════════════════════════════════════════════════════════════════════

export type TradeTransactionStatus = 
    | 'nouvelle_opportunite'
    | 'contact_etabli'
    | 'informations_en_cours'
    | 'negociation'
    | 'devis_recu'
    | 'accord_de_principe'
    | 'verifications'
    | 'commande'
    | 'paiement_en_attente'
    | 'paiement_confirme'
    | 'preparation'
    | 'expedie'
    | 'en_transit'
    | 'douane'
    | 'livraison'
    | 'reception_confirmee'
    | 'transaction_terminee'
    | 'suivi_commercial'
    // Status spéciaux
    | 'annulee'
    | 'suspendue'
    | 'litige'
    | 'remboursement'
    | 'echec';

export interface CommercialChecklistItem {
    id: string;
    stepNumber: number;
    title: string;
    description: string;
    isDone: boolean;
    isCurrent: boolean;
    category: 'sourcing' | 'verification' | 'negociation' | 'contrat' | 'paiement' | 'logistique' | 'douane' | 'reception';
    responsibleParty: 'buyer' | 'seller' | 'forwarder' | 'diallo_ai' | 'customs';
    criticalDocNeeded?: string;
    riskNote?: string;
}

export interface StructuredOffer {
    id: string;
    versionNumber: number;
    emitter: 'seller' | 'buyer';
    emitterName: string;
    productId: string;
    productTitle: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    currency: string;
    availability: string;
    leadTimeDays: number;
    incoterm: string;
    incotermLocation: string;
    transportMode: 'sea_fcl' | 'sea_lcl' | 'air_freight' | 'road' | 'express';
    validityDeadline: string;
    specialConditions: string[];
    attachedDocuments: { name: string; type: string; url?: string; isVerified?: boolean }[];
    notes: string;
    createdAt: string;
    status: 'pending' | 'accepted' | 'countered' | 'rejected' | 'expired';
}

export interface SampleRequest {
    id: string;
    dossierId: string;
    productTitle: string;
    quantityRequested: number;
    unit: string;
    sampleFee: number;
    shippingFee: number;
    currency: string;
    shippingAddress: string;
    trackingNumber?: string;
    status: 'requested' | 'cost_agreed' | 'paid' | 'shipped' | 'delivered' | 'evaluated';
    buyerEvaluation?: {
        rating: number; // 1-5
        decision: 'accepted' | 'rejected' | 'changes_required';
        comments: string;
        photos: string[];
    };
    requestedAt: string;
}

export interface LiveInspectionSession {
    id: string;
    dossierId: string;
    productTitle: string;
    scheduledAt: string;
    durationMinutes: number;
    sellerName: string;
    buyerName: string;
    status: 'scheduled' | 'live_in_progress' | 'completed';
    videoStreamUrl?: string;
    inspectionItems: {
        label: string;
        checked: boolean;
        notes?: string;
        photoSnapshotUrl?: string;
    }[];
    aiGeneratedRecap?: string;
    thirdPartyInspector?: {
        name: string;
        company: string;
        accreditationNumber: string;
        officialReportUploaded: boolean;
    };
}

export interface CommercialVaultDoc {
    id: string;
    title: string;
    docType: 'rccm' | 'nif_tax' | 'export_license' | 'iso_cert' | 'bivac' | 'bill_of_lading' | 'packing_list' | 'proforma' | 'purchase_order' | 'contract' | 'insurance_policy';
    fileName: string;
    fileSize: string;
    uploadedAt: string;
    uploadedBy: string;
    isConfidential: boolean; // Private by default
    verificationStatus: 'verified' | 'pending' | 'rejected';
    verificationDetails?: string;
}

export interface PaymentMilestoneItem {
    id: string;
    label: string; // e.g. "30% Acompte à la commande"
    percentage: number;
    amount: number;
    currency: string;
    triggerCondition: 'order_signing' | 'sample_approval' | 'bl_copy_issued' | 'customs_clearance' | 'final_delivery';
    status: 'pending' | 'escrow_held' | 'released_to_seller' | 'refunded';
    paymentMethod?: 'wire_transfer' | 'credit_card' | 'mobile_money' | 'escrow_partner';
    proofReceiptFile?: string;
    proofReceiptStatus?: 'none' | 'uploaded' | 'verified_by_partner';
    paidAt?: string;
}

export interface ShipmentTrackingEvent {
    id: string;
    timestamp: string;
    locationName: string;
    countryCode: string;
    coordinates?: { lat: number; lng: number };
    statusText: string;
    detail: string;
    carrierName: string;
    carrierTrackingCode: string;
}

export interface CommercialDossier {
    id: string;
    codeRef: string; // e.g. "DOS-2026-GN-CN-042"
    title: string;
    tradeType: 'import' | 'export' | 'wholesale_local' | 'b2b_service';
    dimension: 'B2B' | 'B2C' | 'C2C';
    
    // Parties
    buyerId: string;
    buyerName: string;
    buyerCountry: string;
    buyerFlag: string;
    buyerVerificationTier: 'profile_created' | 'identity_verified' | 'company_verified' | 'trade_docs_verified' | 'history_star';
    
    sellerId: string;
    sellerName: string;
    sellerCountry: string;
    sellerFlag: string;
    sellerVerificationTier: 'profile_created' | 'identity_verified' | 'company_verified' | 'trade_docs_verified' | 'history_star';

    // Product & Deal scope
    productId: string;
    productTitle: string;
    productImageUrl: string;
    productCategory: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalAmount: number;
    currency: string;
    buyerCurrency: string;
    exchangeRateUsed: number;
    originCountry: string;
    originCity: string;
    destinationCountry: string;
    destinationCity: string;
    
    // Workflow State
    status: TradeTransactionStatus;
    statusLabel: string;
    currentStepIndex: number;
    totalStepsCount: number;
    checklist: CommercialChecklistItem[];

    // Commercial Terms
    agreedIncoterm: string;
    leadTimeDays: number;
    offersHistory: StructuredOffer[];
    activeOffer?: StructuredOffer;

    // Landed Cost & Margin
    landedCostBreakdown: {
        productCost: { amount: number; state: 'confirmed' | 'estimated' | 'unknown' };
        packagingCost: { amount: number; state: 'confirmed' | 'estimated' | 'unknown' };
        transportFreightCost: { amount: number; state: 'confirmed' | 'estimated' | 'unknown' };
        insuranceCost: { amount: number; state: 'confirmed' | 'estimated' | 'unknown' };
        forwarderFee: { amount: number; state: 'confirmed' | 'estimated' | 'unknown' };
        customsDutyCost: { amount: number; state: 'confirmed' | 'estimated' | 'unknown' };
        localTaxesCost: { amount: number; state: 'confirmed' | 'estimated' | 'unknown' };
        warehousingCost: { amount: number; state: 'confirmed' | 'estimated' | 'unknown' };
        localDeliveryCost: { amount: number; state: 'confirmed' | 'estimated' | 'unknown' };
        miscFees: { amount: number; state: 'confirmed' | 'estimated' | 'unknown' };
        totalLandedCost: number;
        currency: string;
    };
    marginSimulation?: {
        resalePricePerUnit: number;
        resaleCurrency: string;
        projectedGrossRevenue: number;
        grossMarginAmount: number;
        grossMarginPercentage: number;
        breakEvenUnits: number;
    };

    // Payments & Milestones
    paymentTermsDescription: string;
    paymentMilestones: PaymentMilestoneItem[];
    escrowPartnerName?: string;
    
    // Logistics & Tracking
    logisticsProviderId?: string;
    logisticsProviderName?: string;
    transportMode: 'sea_fcl' | 'sea_lcl' | 'air_freight' | 'road' | 'express';
    trackingNumber?: string;
    trackingEvents: ShipmentTrackingEvent[];
    departureDate?: string;
    estimatedDeliveryDate?: string;

    // Sample & Inspection
    sampleRequest?: SampleRequest;
    liveInspection?: LiveInspectionSession;

    // Documents & Digital Vault
    vaultDocuments: CommercialVaultDoc[];
    
    // Contracts & Signatures
    contractText?: string;
    isSignedByBuyer: boolean;
    buyerSignatureData?: {
        signerName: string;
        timestamp: string;
        integrityHash: string;
    };
    isSignedBySeller: boolean;
    sellerSignatureData?: {
        signerName: string;
        timestamp: string;
        integrityHash: string;
    };

    // Reception & Anomaly
    receptionReport?: {
        receivedAt: string;
        quantityReceived: number;
        conditionStatus: 'conforme_parfait' | 'reserve_mineure' | 'non_conforme_majeur';
        remarks: string;
        photos: string[];
    };
    disputeData?: {
        id: string;
        openedBy: 'buyer' | 'seller';
        openedAt: string;
        reason: 'quantity' | 'damage' | 'wrong_product' | 'delay' | 'document_missing' | 'payment_issue' | 'other';
        status: 'open' | 'under_mediation' | 'refund_agreed' | 'resolved' | 'closed';
        claimAmount: number;
        evidenceDocs: string[];
        mediationNotes: string[];
    };

    // Review & Follow-up
    evaluation?: {
        buyerScore: number;
        buyerReviewText: string;
        sellerScore: number;
        sellerReviewText: string;
        evaluatedAt: string;
    };

    // Assistance Experts
    assignedExpertIds: string[]; // e.g. ['1' (Projet), '2' (Juridique), '10' (Admin), 'fwd-syli' (Logistique)]
    internalNotes: string[];
    createdAt: string;
    updatedAt: string;
}

export interface SupplierScorecard {
    supplierId: string;
    supplierName: string;
    country: string;
    flag: string;
    totalOrdersCount: number;
    totalVolumeAmount: number;
    currency: string;
    averageLeadTimeDays: number;
    conformityRatePercentage: number;
    incidentsCount: number;
    priceStabilityScore: number; // 0-100
    relationshipStartDate: string;
    favoriteProducts: string[];
    proactiveRestockAlert?: {
        productTitle: string;
        suggestedRestockDate: string;
        reason: string;
    };
}

export interface ClientRelationshipCard {
    clientId: string;
    clientName: string;
    country: string;
    flag: string;
    totalPurchasesAmount: number;
    ordersCount: number;
    lastOrderDate: string;
    buyingFrequencyMonths: number;
    preferredPaymentMethod: string;
    proactiveSalesReminder?: {
        dueDate: string;
        suggestedPitch: string;
        recommendedLot: string;
    };
}

export interface VirtualTradeFairBooth {
    id: string;
    fairName: string; // e.g. "Salon Mondial de l'Agro-Export & Machines 2026"
    companyName: string;
    logoUrl: string;
    bannerUrl: string;
    country: string;
    countryFlag: string;
    city?: string;
    pavilionSector: string;
    corridor?: string; // e.g. "Guinée ↔ Chine", "Afrique ↔ Europe"
    isLiveNow: boolean;
    boothRepresentativeName: string;
    representativeRole?: string;
    description?: string;
    teamMembers?: { name: string; role: string; photoUrl?: string }[];
    featuredProducts: Product[];
    servicesOffered?: string[];
    catalogueDownloadUrl: string;
    videoShowcaseUrl?: string;
    reelsUrls?: string[];
    instantChatAvailable: boolean;
    verifiedCertifications?: { code: string; label: string; issuer: string; isVerified: boolean }[];
    contactPhone?: string;
    contactEmail?: string;
    spokenLanguages?: string[];
    deliveryRegionsServed?: string[];
    minOrderQuantityGuideline?: string;
    isPlatformVerified?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🌐 MARCHÉ MONDIAL — MODULE 3 (INFRASTRUCTURE INTELLIGENTE DE CONNEXION ÉCONOMIQUE)
// ═══════════════════════════════════════════════════════════════════════════

export interface TradeSector {
    id: string;
    name: string;
    icon: string;
    description: string;
    standsCount: number;
    corridorsActive: string[];
}

export interface TradeCorridor {
    id: string;
    name: string; // e.g. "Guinée ↔ Chine", "Afrique ↔ Europe", "Afrique ↔ Turquie"
    flags: string;
    description: string;
    topCommodities: string[];
    activeExhibitors: number;
    annualVolumeEstimate: string;
}

export interface FairEvent {
    id: string;
    title: string;
    subtitle: string;
    bannerUrl: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    sectors: string[];
    targetCorridors: string[];
    exhibitorsCount: number;
    isOngoing: boolean;
    isVirtualOnly: boolean;
    conferences: {
        id: string;
        time: string;
        title: string;
        speaker: string;
        speakerTitle: string;
        isLive: boolean;
        zoomMeetLink?: string;
    }[];
    liveDemosCount: number;
}

export interface B2BMeetingRequest {
    id: string;
    boothId: string;
    companyName: string;
    requesterId: string;
    requesterName: string;
    requesterEmail: string;
    requesterCountry: string;
    requesterFlag: string;
    subject: string;
    proposedSlotDate: string;
    proposedSlotTime: string;
    language: string;
    participantsCount: number;
    isLiveMokMeeting: boolean;
    status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
    liveRecap?: {
        transcriptSummary: string;
        keyDecisions: string[];
        nextActionPoints: string[];
        commercialFollowupDossierCreated?: boolean;
    };
    createdAt: string;
}

export interface BusinessMatch {
    id: string;
    seekerName: string;
    seekerCountry: string;
    seekerFlag: string;
    seekerNeed: string; // "Recherche distributeur de produits de santé"
    offererName: string;
    offererCountry: string;
    offererFlag: string;
    offererProposition: string; // "Nous distribuons du matériel médical certifié"
    sector: string;
    corridor: string;
    matchingScore: number; // 0-100%
    scoreBreakdown: {
        label: string;
        isMatch: boolean;
        explanation: string;
    }[];
    matchType: 'client_supplier' | 'distributor' | 'tech_partner' | 'investor';
    status: 'suggested' | 'connected' | 'meeting_scheduled' | 'dismissed';
    dateSuggested: string;
}

export interface SourcingShortlistItem {
    id: string;
    supplierName: string;
    country: string;
    countryFlag: string;
    city: string;
    productTitle: string;
    productionCapacity: string;
    minOrderQuantity: number;
    unit: string;
    availablePriceEstimate: number;
    currency: string;
    leadTimeDays: number;
    certifications: string[];
    contactEmail: string;
    sourceType: 'plateforme_certifiee' | 'partenaire_verifie' | 'source_externe_web';
    webSourceUrl?: string;
    webSourceDate?: string;
    confidenceLevel: 'tres_eleve' | 'eleve' | 'moyen_externe';
    risksAndUnknowns: string[];
    isContacted?: boolean;
}

export interface SourcingMission {
    id: string;
    title: string;
    requesterId: string;
    requesterName: string;
    targetSector: string;
    targetProduct: string;
    specifications: string[];
    quantityTarget: number;
    unit: string;
    budgetMax: number;
    currency: string;
    acceptedCountries: string[];
    requiredCertifications: string[];
    leadTimeMaxDays: number;
    destinationPortCity: string;
    selectionCriteria: string[];
    status: 'brief_active' | 'shortlist_ready' | 'rfq_sent' | 'contract_pending';
    shortlist: SourcingShortlistItem[];
    createdAt: string;
}

export interface TenderSubmission {
    id: string;
    tenderId: string;
    bidderId: string;
    bidderName: string;
    bidderCountry: string;
    bidderFlag: string;
    submittedPrice: number;
    currency: string;
    leadTimeDays: number;
    technicalScore?: number;
    priceScore?: number;
    leadTimeScore?: number;
    experienceScore?: number;
    complianceScore?: number;
    totalScore?: number;
    complianceStatus: 'conforme' | 'reserves_mineures' | 'non_conforme';
    missingDocsAlerts: string[];
    uploadedDocs: { name: string; size: string; isVerified: boolean }[];
    proposalSummary: string;
    status: 'submitted' | 'under_review' | 'shortlisted' | 'awarded' | 'rejected';
    submittedAt: string;
}

export interface SmartTender {
    id: string;
    codeRef: string; // e.g. "AO-2026-SANTE-GN-01"
    title: string;
    issuerType: 'enterprise' | 'ngo' | 'institution' | 'project';
    issuerName: string;
    issuerLogo?: string;
    issuerCountry: string;
    issuerFlag: string;
    sector: string;
    visibility: 'public' | 'limited' | 'invitation_only';
    specificationsSummary: string;
    detailedRequirements: string[];
    criteriaWeights: {
        technical: number; // e.g. 40
        price: number;     // e.g. 30
        leadTime: number;  // e.g. 10
        experience: number;// e.g. 10
        compliance: number;// e.g. 10
    };
    deadlineDate: string;
    estimatedBudgetPublic?: number;
    currency: string;
    mandatoryCertifications: string[];
    documentsRequired: { name: string; description: string; mandatory: boolean }[];
    questionsAnswers: { question: string; answer: string; date: string }[];
    submissions: TenderSubmission[];
    status: 'open' | 'evaluating' | 'awarded' | 'closed';
    createdAt: string;
}

export type PartnershipPipelineStage = 
    | 'identifie'
    | 'a_analyser'
    | 'pertinent'
    | 'contact_prepare'
    | 'contacte'
    | 'reponse_recue'
    | 'rendez_vous'
    | 'negociation'
    | 'accord'
    | 'actif'
    | 'suivi';

export interface PartnershipItem {
    id: string;
    partnerName: string;
    partnerCountry: string;
    partnerFlag: string;
    partnerType: 
        | 'commercial' 
        | 'technique' 
        | 'financier' 
        | 'distribution' 
        | 'representation' 
        | 'fabrication' 
        | 'recherche' 
        | 'investissement' 
        | 'ong' 
        | 'institutionnel';
    objective: string;
    resourcesSought: string;
    contributionOffered: string;
    stage: PartnershipPipelineStage;
    linkedProjectId?: string;
    linkedProjectName?: string;
    contactPerson: string;
    contactEmail: string;
    confidenceScore: number; // 0-100
    lastInteractionDate: string;
    nextActionDate: string;
    nextActionNote: string;
}

export interface InvestorFundingProfile {
    id: string;
    entityName: string;
    type: 'business_angel' | 'fund' | 'bank' | 'foundation' | 'donor_program' | 'call_for_projects';
    country: string;
    flag: string;
    ticketRange: string; // e.g. "50k€ - 500k€"
    focusSectors: string[];
    targetRegions: string[];
    requirements: string[];
    contactEmail: string;
    isAccredited: boolean;
}

export interface InvestorPitchDossier {
    id: string;
    projectTitle: string;
    promoterName: string;
    sector: string;
    executiveSummary: string;
    fundingNeeded: number;
    currency: string;
    allocationBreakdown: { label: string; amount: number; percentage: number }[];
    projectedRevenue3Y: number;
    keyMilestones: string[];
    pitchDeckUrl?: string;
    livePitchScheduledAt?: string;
    livePitchMinutesSummary?: string;
    status: 'draft' | 'ready' | 'pitching' | 'term_sheet_received';
}

export interface MissionDaySchedule {
    dayNumber: number;
    date: string;
    city: string;
    meetings: {
        id: string;
        time: string;
        companyName: string;
        contactPerson: string;
        locationAddress: string;
        objective: string;
        briefingDone: boolean;
        keyQuestionsToAsk: string[];
        targetPricesToNegotiate: string;
        status: 'confirmed' | 'pending' | 'completed';
        meetingRecap?: string;
        attachedDocName?: string;
    }[];
}

export interface CommercialMissionTrip {
    id: string;
    missionTitle: string;
    isVirtual: boolean;
    targetCountries: string[];
    targetCities: string[];
    departureDate: string;
    returnDate: string;
    productsFocus: string[];
    teamMembers: string[];
    budgetTotalEstimated: number;
    currency: string;
    budgetBreakdown: {
        flights: number;
        hotel: number;
        transport: number;
        meals: number;
        interpreter: number;
        samples: number;
        misc: number;
    };
    preDepartureChecklist: {
        id: string;
        item: string;
        done: boolean;
        category: 'visa' | 'voyage' | 'hotel' | 'traduction' | 'briefing' | 'commercial';
    }[];
    dailyItinerary: MissionDaySchedule[];
    scannedCards: {
        id: string;
        name: string;
        company: string;
        role: string;
        phone: string;
        email: string;
        city: string;
        scannedAt: string;
    }[];
    scannedProducts: {
        id: string;
        productRef: string;
        supplierName: string;
        photoUrl: string;
        quotedPrice: number;
        currency: string;
        moq: number;
        notes: string;
    }[];
    dailyLogs: {
        date: string;
        summary: string;
        spentAmount: number;
        keyDecisions: string[];
        nextActions: string[];
    }[];
    finalReport?: {
        executiveSummary: string;
        companiesMetCount: number;
        viableOpportunities: string[];
        risksIdentified: string[];
        totalSpent: number;
        recommendedNextSteps: string[];
        generatedAt: string;
    };
    status: 'planning' | 'pre_departure' | 'on_site' | 'completed';
}

export interface CommercialWatchdogAlert {
    id: string;
    title: string;
    type: 'tender_new' | 'price_fluctuation' | 'regulatory_change' | 'competitor_move' | 'partner_opportunity';
    sector: string;
    country: string;
    summary: string;
    relevanceScore: number;
    date: string;
    source: string;
    recommendedAction: string;
}

export interface RelationshipNetworkNode {
    id: string;
    name: string;
    type: 'client' | 'prospect' | 'supplier' | 'partner' | 'distributor';
    country: string;
    flag: string;
    sector: string;
    relationshipStrength: number; // 0-100
    lastInteractionDate: string;
    totalDealsVolume: number;
    currency: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🌍 MARCHÉ MONDIAL — ÉTAPE 4/7 : PROSPECTION, SALONS, DATA ROOM & CLUBS
// ═══════════════════════════════════════════════════════════════════════════

export type ProspectionProspectStatus = 
    | 'identifie'
    | 'a_contacter'
    | 'contacte'
    | 'reponse_recue'
    | 'interesse'
    | 'rendez_vous'
    | 'offre_envoyee'
    | 'negociation'
    | 'gagne'
    | 'perdu'
    | 'relance_future';

export interface ProspectionProspect {
    id: string;
    companyName: string;
    activity: string;
    country: string;
    countryFlag: string;
    city: string;
    contactName: string;
    contactRole: string;
    email: string;
    phone: string;
    source: string;
    channel: 'email' | 'mok_chat' | 'contact_form' | 'partner_channel';
    status: ProspectionProspectStatus;
    relevanceScore: number; // 0-100
    scoreReasons: string[];
    customMessageDraft: string;
    customMessageValidated: boolean;
    notes: string;
    history: { date: string; action: string; note: string }[];
    lastInteractionDate?: string;
    nextFollowUpDate?: string;
}

export interface ProspectionCampaign {
    id: string;
    title: string;
    targetSector: string;
    targetCountry: string;
    targetCountryFlag: string;
    targetCity: string;
    targetProfile: string;
    objective: string;
    totalProspects: number;
    contactedCount: number;
    responsesCount: number;
    meetingsCount: number;
    dealsWonCount: number;
    prospects: ProspectionProspect[];
    createdAt: string;
    status: 'draft' | 'active' | 'paused' | 'completed';
}

export interface LocalCommercialRepresentative {
    id: string;
    name: string;
    avatarUrl: string;
    company: string;
    country: string;
    countryFlag: string;
    regionsCovered: string[];
    sectors: string[];
    languages: string[];
    yearsExperience: number;
    isVerified: boolean;
    badge: string;
    bio: string;
    availableServices: string[];
    rating: number;
    reviewsCount: number;
    dailyRateEstimate?: number;
    currency: string;
    contactEmail: string;
    contactPhone: string;
}

export interface DataRoomFile {
    id: string;
    title: string;
    category: 'presentation' | 'business_plan' | 'budget_projections' | 'contrats' | 'legal_statuts' | 'audit';
    fileName: string;
    fileSize: string;
    isConfidential: boolean;
    allowedRoles: ('owner' | 'partner' | 'investor' | 'expert')[];
    accessLogs: { userName: string; role: string; accessedAt: string; action: 'view' | 'download' }[];
    uploadDate: string;
}

export interface PhysicalTradeFair {
    id: string;
    name: string;
    acronym: string;
    country: string;
    countryFlag: string;
    city: string;
    venue: string;
    dates: string;
    sector: string;
    organizer: string;
    officialWebsiteUrl: string;
    registrationDeadline: string;
    expectedExhibitors: string;
    expectedVisitors: string;
    studioPreparationItems: {
        id: string;
        label: string;
        type: 'rollup' | 'catalogue' | 'video' | 'visiting_card' | 'mok_network_post';
        isGenerated: boolean;
    }[];
    isRegistered: boolean;
}

export interface BusinessClubCommunity {
    id: string;
    name: string;
    bannerUrl: string;
    corridorOrSector: string;
    membersCount: number;
    description: string;
    upcomingEventsCount: number;
    activeDiscussionsCount: number;
    isJoined: boolean;
    tags: string[];
}

export interface ExportOpportunityAnalysis {
    id: string;
    userProduct: string;
    originCountry: string;
    targetMarkets: {
        country: string;
        flag: string;
        demandIndex: number;
        tariffRate: string;
        marketSizeEstimate: string;
        regulatoryRequirements: string[];
        recommendedStrategy: string;
        isSourceFactOrEstimation: 'source_verifiee' | 'estimation_statistique';
    }[];
}

// ══════════════════════════════════════════════════════════════════════════
// MOK TRUST — ÉTAPE 5/7 TYPES (CONFIANCE, KYC/KYB, ANTI-FRAUDE, LITIGES)
// ══════════════════════════════════════════════════════════════════════════

export type MokTrustLevel = 0 | 1 | 2 | 3 | 4;

export type MokTrustBadgeType = 
  | 'identity_verified' 
  | 'company_verified' 
  | 'business_address_verified' 
  | 'payout_account_verified' 
  | 'license_verified' 
  | 'expert_verified';

export interface MokTrustBadge {
  type: MokTrustBadgeType;
  label: string;
  description: string;
  isObtained: boolean;
  verifiedAt?: string;
  issuerOrProvider?: string;
}

export type KycDocumentStatus = 'soumis' | 'en_verification' | 'valide' | 'rejete' | 'expire' | 'renouvellement_requis';

export interface KycDocument {
  id: string;
  title: string;
  documentType: 'passport' | 'id_card' | 'rccm_kbis' | 'tax_certificate' | 'commercial_license' | 'bank_attestation' | 'power_of_attorney';
  documentNumber: string;
  issuedCountry: string;
  issuedAt: string;
  expiresAt: string;
  status: KycDocumentStatus;
  rejectionReason?: string;
  fileSize: string;
  confidentialityLevel: 'strictly_confidential' | 'restricted';
  sha256Hash: string;
}

export interface CompanyKybProfile {
  id: string;
  legalName: string;
  tradeName: string;
  country: string;
  countryFlag: string;
  registrationNumber: string; // RCCM, SIREN/SIRET, etc.
  taxIdentificationNumber: string; // NIF / TVA Intracommunautaire
  headquartersAddress: string;
  verifiedAddress: boolean;
  legalRepresentative: {
    fullName: string;
    role: string;
    isAuthorizedSignatory: boolean;
    mandateDocumentVerified: boolean;
    identityVerified: boolean;
  };
  payoutAccount: {
    bankName: string;
    ibanOrAccountMasked: string;
    accountHolder: string;
    isVerifiedByPaymentProvider: boolean;
    providerName: string;
  };
  kybVerificationLevel: MokTrustLevel;
  lastReverificationDate: string;
  nextScheduledAudit: string;
}

export interface SecuritySession {
  id: string;
  deviceName: string;
  browser: string;
  ipAddress: string;
  location: string;
  isCurrentDevice: boolean;
  isKnownDevice: boolean;
  lastActive: string;
  mfaMethod: 'sms_otp' | 'authenticator_app' | 'security_key' | 'none';
}

export type InternalRiskScoreLevel = 'faible' | 'modere' | 'eleve' | 'revue_necessaire';

export interface InternalRiskSignal {
  id: string;
  title: string;
  type: 'velocity' | 'unusual_amount' | 'new_country_ip' | 'payout_change' | 'dispute_surge' | 'duplicate_network';
  scoreLevel: InternalRiskScoreLevel;
  description: string;
  detectedAt: string;
  requiresHumanReview: boolean;
  status: 'active' | 'investigating' | 'cleared' | 'action_taken';
}

export interface ProductCompliancePolicy {
  id: string;
  categoryName: string;
  status: 'autorise' | 'limite' | 'soumis_verification' | 'interdit';
  description: string;
  mandatoryDocuments: string[];
  restrictedCountries: string[];
  penaltyDetails: string;
}

export interface CounterfeitReport {
  id: string;
  targetListingId: string;
  targetProductTitle: string;
  targetSellerName: string;
  reportedBy: string;
  rightHolderOrganization: string;
  intellectualPropertyType: 'trademark' | 'patent' | 'copyright' | 'industrial_design';
  evidenceDescription: string;
  supportingUrls: string[];
  reportedAt: string;
  status: 'soumis' | 'en_examen_juridique' | 'reponse_vendeur_recue' | 'retire_par_moderation' | 'rejete_infonde';
  sellerResponseText?: string;
  legalResolutionNotes?: string;
}

export interface MultidimensionalReputation {
  overallScore: number; // 0 - 100
  totalOrdersCompleted: number;
  incidentFreeRatePercent: number;
  yearsOfTenure: number;
  dimensionScores: {
    conformity: number; // /5
    timeliness: number; // /5
    communication: number; // /5
    perceivedQuality: number; // /5
    disputeResolutionSpeed: number; // /5
  };
  publicReliabilityVerdict: 'Excellente' | 'Très Élevée' | 'Bonne' | 'Nouveau Vendeur en Évaluation' | 'Sous Surveillance';
}

export interface VerifiedTransactionReview {
  id: string;
  transactionId: string;
  orderNumber: string;
  productTitle: string;
  reviewerName: string;
  reviewerAvatar: string;
  reviewerCountry: string;
  isVerifiedPurchase: boolean;
  rating: number; // 1-5
  ratingsPerDimension: {
    conformity: number;
    timeliness: number;
    communication: number;
    quality: number;
  };
  reviewText: string;
  createdAt: string;
  sellerReply?: {
    author: string;
    text: string;
    repliedAt: string;
  };
  isFlaggedSuspicious: boolean;
}

export type DisputeType = 
  | 'non_recu' 
  | 'retard' 
  | 'produit_different' 
  | 'quantite' 
  | 'dommage' 
  | 'paiement' 
  | 'remboursement' 
  | 'service_non_fourni' 
  | 'autre';

export type DisputeStage = 
  | 'resolution_directe' 
  | 'mediation_diallo_os' 
  | 'mediateur_humain' 
  | 'escalade_paiement' 
  | 'clos_accorde' 
  | 'clos_rejete';

export interface DisputeTimelineEvent {
  id: string;
  date: string;
  author: string;
  role: 'buyer' | 'seller' | 'diallo_ai' | 'human_mediator' | 'payment_provider';
  action: string;
  details?: string;
}

export interface TradeDisputeCase {
  id: string;
  orderNumber: string;
  transactionId: string;
  productTitle: string;
  productImageUrl: string;
  amount: number;
  currency: string;
  disputeType: DisputeType;
  stage: DisputeStage;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  sellerEmail: string;
  openedAt: string;
  claimantDemand: 'remplacement' | 'remboursement_total' | 'remboursement_partiel' | 'nouvelle_livraison' | 'accord_amiable';
  proposedSettlementAmount?: number;
  description: string;
  evidenceDocs: {
    name: string;
    type: 'photo' | 'bl_signed' | 'inspection_report' | 'chat_log' | 'contract';
    url: string;
    uploadedBy: string;
  }[];
  timeline: DisputeTimelineEvent[];
  dialloMediationSummary?: {
    factsSummary: string;
    agreedPoints: string[];
    disputedPoints: string[];
    suggestedCompromises: string[];
    disclaimer: string;
  };
  finalDecisionNotes?: string;
  canAppeal: boolean;
}

export interface SecurityAuditLog {
  id: string;
  action: string;
  category: 'auth' | 'kyc_kyb' | 'payout' | 'listing_moderation' | 'dispute_resolution' | 'account_security';
  actorName: string;
  actorRole: 'user' | 'admin' | 'compliance_officer' | 'system_sentinel';
  timestamp: string;
  ipAddress: string;
  status: 'reussi' | 'alerte' | 'bloque' | 'en_revue';
  details: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉTAPE 6/7 : BUSINESS OS MONDIAL — STOCKS, COMMANDES, CRM, FOURNISSEURS, RENTABILITÉ
// ══════════════════════════════════════════════════════════════════════════════

export type StockMovementType = 
  | 'entree' 
  | 'vente' 
  | 'reservation' 
  | 'transfert' 
  | 'retour' 
  | 'perte' 
  | 'dommage' 
  | 'correction_inventaire' 
  | 'reception_fournisseur';

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productSku: string;
  productTitle: string;
  type: StockMovementType;
  quantity: number; // positive or negative
  originLocation: string;
  destinationLocation: string;
  referenceDoc: string; // e.g. "CMD-2026-904", "BL-1029", "INV-ANNUEL"
  performedBy: string;
  notes?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  type: 'principal' | 'magasin' | 'depot' | 'partenaire' | 'international' | 'point_retrait';
  country: string;
  city: string;
  address: string;
  managerName: string;
  totalCapacityUnits: number;
  currentOccupiedUnits: number;
  status: 'actif' | 'maintenance' | 'complet';
}

export interface StockTierPricing {
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
  currency: string;
  label?: string;
}

export interface StockItem {
  id: string;
  productId: string;
  sku: string;
  title: string;
  category: string;
  imageUrl: string;
  variant?: {
    model?: string;
    size?: string;
    color?: string;
    packaging?: string;
    grade?: string;
  };
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number; // physical - reserved
  inTransitQuantity: number;
  damagedOrBlockedQuantity: number;
  alertThreshold: number;
  unitCost: number; // buying/production cost
  sellingPrice: number; // base selling price
  currency: string;
  tierPricing?: StockTierPricing[];
  warehouseQuantities: {
    warehouseId: string;
    warehouseName: string;
    country: string;
    quantity: number;
  }[];
  forecastDaysUntilStockout: number;
  reorderQuantitySuggested: number;
  preferredSupplierId?: string;
  preferredSupplierName?: string;
  supplierLeadTimeDays: number;
  lastRestockedAt: string;
  qrCode: string;
}

export interface SupplierItem {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  category: string;
  suppliedProducts: {
    productId: string;
    productTitle: string;
    sku: string;
    unitCost: number;
    currency: string;
    minOrderQty: number;
    observedLeadTimeDays: number;
  }[];
  ratings: {
    priceCompetitiveness: number; // /5
    leadTimeRespect: number; // /5
    qualityConformity: number; // /5
    communication: number; // /5
    disputeRate: number; // %
  };
  totalOrdersCount: number;
  totalSpent: number;
  currency: string;
  paymentTerms: string; // e.g. "30% acompte, 70% BL"
  kybStatus: 'certifie' | 'en_cours' | 'standard';
  notes: string;
}

export interface SupplierOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  country: string;
  items: {
    sku: string;
    title: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
  totalAmount: number;
  currency: string;
  status: 'brouillon' | 'envoyee' | 'confirmee' | 'en_production' | 'en_transit' | 'reception_partielle' | 'receptionnee' | 'annulee';
  paymentStatus: 'en_attente' | 'acompte_verse' | 'paye_integral' | 'sequestre_actif';
  orderedAt: string;
  expectedDeliveryDate: string;
  actualReceivedDate?: string;
  targetWarehouseId: string;
  targetWarehouseName: string;
  trackingNumber?: string;
  incoterm: string;
}

export type BusinessOrderStage = 
  | 'nouvelle' 
  | 'validee' 
  | 'payee' 
  | 'preparation' 
  | 'expediee' 
  | 'livree' 
  | 'terminee' 
  | 'litige' 
  | 'retour';

export interface BusinessOrder {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerCompany?: string;
  buyerCountry: string;
  buyerEmail: string;
  buyerPhone?: string;
  items: {
    sku: string;
    title: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    warehouseId: string;
    warehouseName: string;
    locationCode: string; // e.g. "ALL-B-14"
    isPicked?: boolean;
    isPacked?: boolean;
  }[];
  totalAmount: number;
  currency: string;
  stage: BusinessOrderStage;
  paymentStatus: 'sequestre_bloque' | 'debloque' | 'rembourse' | 'en_attente';
  paymentMethod: string;
  incoterm: 'EXW' | 'FOB' | 'CIF' | 'DDP';
  shippingMethod: 'fret_maritime' | 'fret_aerien' | 'coursier_express' | 'routier';
  trackingNumber?: string;
  carrierName?: string;
  createdAt: string;
  deadlinePreparation?: string;
  shippedAt?: string;
  deliveredAt?: string;
  documents: {
    type: 'facture' | 'bl' | 'certificat_origine' | 'douane';
    name: string;
    url: string;
  }[];
  notes?: string;
}

export type ReturnItemStatus = 
  | 'en_inspection' 
  | 'remis_en_stock_vendable' 
  | 'endommage' 
  | 'en_reparation' 
  | 'rebut_perte';

export interface ReturnRequest {
  id: string;
  returnNumber: string;
  orderNumber: string;
  buyerName: string;
  productTitle: string;
  sku: string;
  quantity: number;
  reason: string;
  status: 'demande_recue' | 'acceptee' | 'refusee' | 'colis_recu' | 'inspecte' | 'cloture';
  stockDestinationStatus: ReturnItemStatus;
  inspectionNotes?: string;
  refundAmount?: number;
  currency: string;
  requestedAt: string;
  processedAt?: string;
}

export type CrmPipelineStage = 
  | 'prospect' 
  | 'contact_initial' 
  | 'qualifie' 
  | 'rendez_vous' 
  | 'offre_devis' 
  | 'negociation' 
  | 'client_actif' 
  | 'fidelisation_partenaire' 
  | 'perdu';

export interface CrmLeadClient {
  id: string;
  name: string;
  companyName: string;
  roleTitle: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  segment: 'prospect' | 'nouveau_client' | 'client_fidele' | 'grossiste' | 'detaillant' | 'distributeur_international';
  pipelineStage: CrmPipelineStage;
  dealValuePotential: number;
  currency: string;
  assignedTo: string;
  lastContactDate: string;
  nextFollowUpDate?: string;
  followUpReason?: string;
  totalOrdersCount: number;
  totalSpent: number;
  satisfactionScore: number; // /5
  notes: string;
  tags: string[];
  quotesHistory: {
    quoteNumber: string;
    amount: number;
    date: string;
    status: 'en_attente' | 'accepte' | 'expire' | 'refuse';
    expiryDate: string;
  }[];
  recentOrders: {
    orderNumber: string;
    amount: number;
    date: string;
  }[];
}

export interface CrmFollowUp {
  id: string;
  targetClientId: string;
  targetClientName: string;
  companyName: string;
  type: 'devis_expiration' | 'paiement_attente' | 'relance_prospect' | 'reachat_fidelisation' | 'rendez_vous_preparation';
  priority: 'haute' | 'moyenne' | 'standard';
  dueDate: string;
  generatedAiMessage: string;
  status: 'a_faire' | 'envoye' | 'ignore';
}

export interface CustomerSupportTicket {
  id: string;
  ticketNumber: string;
  clientName: string;
  clientEmail: string;
  relatedOrderNumber?: string;
  category: 'commande' | 'livraison' | 'paiement' | 'retour' | 'produit' | 'information' | 'litige';
  priority: 'urgente' | 'haute' | 'normale';
  subject: string;
  message: string;
  aiSuggestedReply: string;
  aiDetectedSentiment: 'neutre' | 'frustre' | 'satisfait' | 'urgent';
  status: 'ouvert' | 'en_cours' | 'resolu';
  createdAt: string;
  assignedAgent: string;
}

export interface ProductProfitability {
  productId: string;
  sku: string;
  title: string;
  unitsSold: number;
  revenueTotal: number;
  costOfGoodsTotal: number;
  shippingAndCustomsTotal: number;
  platformAndPaymentFeesTotal: number;
  returnsAndDamagesTotal: number;
  netMarginTotal: number;
  netMarginPercent: number;
  currency: string;
  viewsCount: number;
  leadsCount: number;
  conversionRate: number; // %
  reelLinkedId?: string;
}

export interface CountrySalesAnalytics {
  country: string;
  countryCode: string;
  flagEmoji: string;
  revenue: number;
  ordersCount: number;
  activeClientsCount: number;
  topProductTitle: string;
  growthRatePercent: number;
  currency: string;
}

export interface BusinessGoal {
  id: string;
  title: string;
  targetMetric: 'chiffre_affaires' | 'nouveaux_clients' | 'volume_tonnage' | 'pays_export';
  targetValue: number;
  currentValue: number;
  unit: string;
  deadlineDate: string;
  aiActionPlan: string[];
  status: 'en_bonne_voie' | 'attention' | 'en_retard' | 'atteint';
}

export interface BusinessTeamMember {
  id: string;
  name: string;
  email: string;
  role: 'proprietaire' | 'administrateur' | 'commercial' | 'gestion_stock' | 'logistique' | 'finance' | 'service_client' | 'lecture_seule';
  avatarUrl: string;
  lastActive: string;
  assignedHubs: string[];
}

export interface BusinessAuditEntry {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  module: 'stock' | 'commandes' | 'crm' | 'fournisseurs' | 'tarifs' | 'finance';
  oldValue?: string;
  newValue?: string;
  details: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 SYSTÈME D'ACCOMPLISSEMENT PROFESSIONNEL & ENTREPRENEURIAL (CARRIÈRE V2)
// ═══════════════════════════════════════════════════════════════════════════

export type CareerGoalCategory = 
  | 'first_job' 
  | 'executive_promotion' 
  | 'expatriation' 
  | 'career_switch' 
  | 'acquire_clients' 
  | 'launch_business' 
  | 'find_co_founder' 
  | 'find_investors' 
  | 'raise_funds' 
  | 'international_sales' 
  | 'win_tender' 
  | 'increase_revenue' 
  | 'custom';

export interface CareerPointA {
  id: string;
  currentTitle: string;
  educationLevel: string;
  diplomas: string[];
  hardSkills: { name: string; level: number; category: string; verified?: boolean }[];
  softSkills: string[];
  languages: { language: string; level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Natif'; certified?: boolean }[];
  experiences: { role: string; company: string; duration: string; highlights: string[]; verified?: boolean }[];
  currentSituation: 'employed' | 'job_seeker' | 'student' | 'entrepreneur' | 'freelancer' | 'transition';
  location: string;
  mobility: 'local' | 'national' | 'international' | 'remote_only' | 'hybrid';
  constraints: string[];
  weeklyAvailabilityHours: number;
  budgetOrResources: string;
  ambitions: string[];
  forces: string[];
  faiblesses: string[];
  trainingNeeds: string[];
  cvUrl?: string;
  portfolioUrls?: string[];
  networkEstimatedContacts?: number;
}

export interface CareerPointB {
  id: string;
  title: string;
  category: CareerGoalCategory;
  rawUserInput?: string;
  targetDeadlineMonths: number;
  targetSalaryOrRevenue?: string;
  targetLocation?: string;
  targetCompanyOrIndustry?: string;
  successCriteria: string[];
  urgencyLevel: 'normal' | 'high' | 'critical';
}

export interface CareerGapAnalysis {
  competencyGaps: { 
    skill: string; 
    currentLevel: number; 
    requiredLevel: number; 
    suggestedCampusCourseId?: string; 
    courseTitle?: string;
    estimatedHoursToLearn: number;
  }[];
  experienceGaps: string[];
  networkGaps: string[];
  languageGaps: { 
    language: string; 
    current: string; 
    target: string; 
    suggestedPracticeModule?: string;
  }[];
  certificationGaps: string[];
  overallReadinessScore: number; // 0 - 100%
  keySuccessLever: string;
}

export interface CareerGPSMilestone {
  id: string;
  phaseNumber: number;
  title: string;
  description: string;
  estimatedDuration: string;
  status: 'completed' | 'in_progress' | 'pending' | 'blocked';
  interconnectedModule: 'campus' | 'network' | 'shop' | 'studio' | 'languages' | 'finance' | 'legal' | 'experts' | 'career';
  gatewayAction: string;
  actionRouteId?: string;
  deliverable: string;
  isResultCheckpoint: boolean;
  actualOutcomeRecorded?: string;
  planBAlternative?: {
    triggerReason: string;
    fallbackRoute: string;
    adaptedActions: string[];
  };
}

export interface CareerActionItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  estimatedMinutes: number;
  completed: boolean;
  moduleLink: string;
  smartReminderText: string;
  category: 'candidature' | 'formation' | 'reseautage' | 'studio_doc' | 'simulation' | 'demarche_legale' | 'prospection';
}

export interface CareerSmartReminder {
  id: string;
  type: 'follow_up' | 'submission_due' | 'interview_prep' | 'new_opportunity' | 'training_due' | 'network_ping';
  title: string;
  message: string;
  timestamp: string;
  actionLabel: string;
  actionType: 'open_simulator' | 'open_relance' | 'open_opportunity' | 'open_campus' | 'open_studio' | 'open_experts';
  relatedEntityName?: string;
  relatedOpportunityId?: string;
  isRead: boolean;
}

export interface ProfessionalDigitalTwin {
  id: string;
  userId: string;
  lastUpdated: string;
  reputationScore: number; // 0-100
  profileStrengthScore: number; // 0-100
  verifiedCredentialsCount: number;
  masteredSkills: { name: string; level: number; endorsedCount: number; verifiedDate?: string }[];
  learningInProgress: { title: string; source: string; progressPercent: number; estimatedCompletion: string }[];
  completedProjects: { title: string; role: string; outcome: string; proofUrl?: string; year: string }[];
  concreteOutcomes: { 
    id: string;
    metric: string; 
    description: string; 
    date: string; 
    category: 'job' | 'revenue' | 'client' | 'funding' | 'exam' | 'contract' | 'partner';
    verified: boolean;
  }[];
  careerPreferences: { 
    remotePreference: string; 
    salaryExpectation: string; 
    preferredCultures: string[]; 
    nonNegotiables: string[];
  };
  networkGraphNodesCount: number;
  acceptedOpportunitiesCount: number;
  declinedOpportunitiesCount: number;
}

export interface CareerCouncilExpert {
  agentId: string;
  agentName: string;
  role: string;
  avatarUrl: string;
  specialty: string;
  verdict: string;
  recommendation: string;
  status: 'reviewing' | 'approved' | 'action_required';
  prescribedTool: string;
  gatewayTab?: string;
}

export interface CareerMissionPlan {
  id: string;
  userGoal: CareerPointB;
  pointA: CareerPointA;
  gaps: CareerGapAnalysis;
  progressPercent: number;
  milestones: CareerGPSMilestone[];
  activeActions: CareerActionItem[];
  smartReminders: CareerSmartReminder[];
  councilRecommendations: CareerCouncilExpert[];
  lastRerouteReason?: string;
  certifiedResultsCount: number;
}

export interface Coach3DSimulationSession {
  id: string;
  type: 'interview' | 'pitch' | 'sales_nego' | 'salary_nego' | 'public_speaking';
  roleplayPersona: string;
  contextTitle: string;
  difficulty: 'debutant' | 'intermediaire' | 'expert';
  turnCount: number;
  performanceScore: number; // note /10
  strengths: string[];
  improvements: string[];
  idealPhrasingSuggested: string;
  date: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧭 CARRIÈRE ÉTAPE 2/7 : RADAR INTELLIGENT D'OPPORTUNITÉS & AGENT DE CONQUÊTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type OpportunityUniverse = 'emploi' | 'clients' | 'fonds' | 'achats';

export type OpportunityTemporalReadiness = 'ready_now' | 'to_prepare' | 'future_goal';

export type OpportunityLocationScope = 'local' | 'national' | 'regional' | 'international' | 'remote';

export type OpportunitySourceType = 
  | 'internal_lmav'
  | 'reseau_mok'
  | 'marche_mondial'
  | 'tribus_communaute'
  | 'public_official'
  | 'international_org'
  | 'partner_ecosystem';

export type OpportunityVaultStatus = 
  | 'decouverte' 
  | 'a_etudier' 
  | 'interessante' 
  | 'a_preparer' 
  | 'prete' 
  | 'action_engagee' 
  | 'en_attente' 
  | 'reussie' 
  | 'refusee' 
  | 'expiree' 
  | 'abandonnee';

export interface OpportunityGapPlan {
  missingSkills: {
    skill: string;
    campusCourseId?: string;
    courseTitle: string;
    estimatedHours: number;
  }[];
  daysUntilDeadline: number;
  preparationFeasibility: 'immediate' | 'faisable_avant_deadline' | 'moyen_terme';
  strategicAdvice: string;
}

export interface RadarOpportunityItem {
  id: string;
  title: string;
  entity: string;
  entityLogoUrl?: string;
  universe: OpportunityUniverse;
  opportunityType: string; // 'CDI', 'Freelance', 'Appel d'offres', 'Subvention', 'Investisseur Seed', 'Distributeur', etc.
  location: string;
  locationScope: OpportunityLocationScope;
  country: string;
  countryFlag: string;
  description: string;
  publicationDate: string;
  deadlineDate?: string;
  daysRemaining?: number;
  isUrgent?: boolean;
  compensationOrBudget?: string;
  sourceType: OpportunitySourceType;
  sourceName: string;
  sourceUrl?: string;
  
  // Match & Explicabilité
  matchScore: number; // 0-100
  compatibilityTier: 'Élevée' | 'Forte' | 'Moyenne' | 'Exploratoire';
  readiness: OpportunityTemporalReadiness;
  whyForMe: string; // Explication en français clair du pourquoi pour ce profil
  matchedStrengths: string[];
  missingCompetencies: string[];
  gapPlan?: OpportunityGapPlan;
  
  // Confiance & Anti-Fraude
  trustScore: number; // 0-100
  isVerifiedEntity: boolean;
  riskLevel: 'safe' | 'low_risk' | 'moderate' | 'suspicious';
  riskAlerts?: string[];
  
  // Statut dans le Coffre
  vaultStatus: OpportunityVaultStatus;
  userNotes?: string;
  isFavorite?: boolean;
  savedAt?: string;
  isExplorationCard?: boolean; // Pour sortir de la bulle de filtres
  contactPerson?: {
    name: string;
    role: string;
    avatarUrl?: string;
    channel: 'mok_message' | 'email' | 'form';
  };
}

export interface RadarHiddenSignal {
  id: string;
  authorName: string;
  authorRole: string;
  companyName: string;
  avatarUrl: string;
  sourcePostExcerpt: string;
  sourcePlatform: 'reseau_mok' | 'marche_mondial' | 'communaute_tribu';
  detectedDate: string;
  signalHypothesis: string; // Déduction intelligente (ex: ouverture d'agences => besoins recrutement & logistique)
  suggestedOpportunities: {
    title: string;
    universe: OpportunityUniverse;
    angleApproach: string;
  }[];
  confidenceIndex: number; // 0-100
  status: 'new' | 'explored' | 'dismissed';
}

export interface ContinuousSearchMission {
  id: string;
  title: string;
  naturalQuery: string;
  universe: OpportunityUniverse;
  targetLocation?: string;
  minSalaryOrBudget?: string;
  status: 'active' | 'paused' | 'archived';
  foundCount: number;
  newMatchesCount: number;
  lastScannedAt: string;
  frequency: 'continuous' | 'daily' | 'weekly';
  matchingThreshold: number; // ex: 80%
  alertChannels: {
    inApp: boolean;
    priorityDigest: boolean;
  };
}

export interface OpportunityFeedbackRecord {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  action: 'declined';
  declineReason:
    | 'salary_too_low'
    | 'location_unsuitable'
    | 'domain_mismatch'
    | 'level_mismatch'
    | 'bad_timing'
    | 'company_reputation'
    | 'other';
  feedbackNotes?: string;
  timestamp: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚔️ CARRIÈRE ÉTAPE 3/7 : MODE CONQUÊTE & SALLE DE PRÉPARATION ULTIME
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface MasterResumeExperience {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string; // ou 'Présent'
  isCurrent: boolean;
  description: string;
  keyAchievements: string[];
  skillsUsed: string[];
  metricsDelivered?: string[]; // ex: "+45% de CA", "30 personnes managées"
  category: 'emploi' | 'freelance' | 'entrepreneuriat' | 'projet_academique' | 'benevolat';
  verifiedByLMav?: boolean;
}

export interface MasterResumeEducation {
  id: string;
  degree: string;
  institution: string;
  location: string;
  graduationYear: string;
  honors?: string;
  fieldOfStudy: string;
  keyCourses?: string[];
  credentialUrl?: string;
}

export interface MasterResumeSkill {
  name: string;
  category: 'technique' | 'metier' | 'soft_skills' | 'outils_logiciels' | 'langues' | 'gestion_projet';
  level: number; // 1-5
  verified: boolean;
  verifiedSource?: string; // Campus, Certificat, Peer review
}

export interface MasterResumeProfile {
  id: string;
  userId: string;
  fullName: string;
  headlineTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedinOrWeb?: string;
  summaryBio: string;
  experiences: MasterResumeExperience[];
  education: MasterResumeEducation[];
  skills: MasterResumeSkill[];
  languages: { language: string; proficiency: string; certifiedLevel?: string }[];
  certifications: { title: string; issuer: string; year: string; certificateId?: string }[];
  portfolioProjects: { title: string; description: string; role: string; url?: string; tags: string[] }[];
  lastUpdated: string;
}

export interface ContextualResumeData {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  tailoredHeadline: string;
  tailoredSummary: string;
  highlightedExperienceIds: string[];
  rephrasedAchievements: Record<string, string[]>; // expId -> bullet points adaptés
  prioritizedSkills: string[];
  matchedKeywords: string[];
  languageVersion: string;
  layoutTemplate: 'moderne_executif' | 'technique_precis' | 'impact_commercial' | 'academique_fonds';
  generatedAt: string;
}

export type ConquestApproachType = 
  | 'lettre_motivation' 
  | 'email_candidature' 
  | 'message_reseau_mok' 
  | 'message_linkedin' 
  | 'pitch_court' 
  | 'proposition_commerciale' 
  | 'devis_preparatoire' 
  | 'dossier_bailleur' 
  | 'relance_douce' 
  | 'relance_ferme';

export interface ConquestApproachDocument {
  id: string;
  type: ConquestApproachType;
  title: string;
  recipientName?: string;
  recipientRole?: string;
  subject?: string;
  bodyContent: string;
  tone: 'professionnel_direct' | 'courtois_diplomatique' | 'impact_chiffre' | 'audacieux_innovant' | 'chaleureux_mok';
  language: string;
  callToAction: string;
  lastEditedAt: string;
}

export interface ConquestGapAnalysis5D {
  alreadyPossessed: { item: string; detail: string; proofExperience?: string }[];
  betterPresent: { item: string; currentFormulation: string; recommendedHighlight: string }[];
  realGaps: { item: string; impactLevel: 'bloquant' | 'secondaire' | 'compensable'; suggestedCampusCourse?: string }[];
  quickWins: { item: string; action: string; estimatedTimeMinutes: number }[];
  strategicRisks: { risk: string; mitigationAdvice: string; severity: 'low' | 'medium' | 'high' }[];
}

export interface ConquestPreparationScore {
  overallPreparationScore: number; // 0-100%
  compatibilityMatchScore: number; // 0-100% (from Radar)
  statusVerdict: 'pret' | 'presque_pret' | 'preparation_importante_requise';
  verdictExplanation: string;
  breakdown: {
    documentsReadiness: number; // 0-100%
    pitchAndArgumentsReadiness: number; // 0-100%
    simulationTrainingReadiness: number; // 0-100%
    administrativePiecesReadiness: number; // 0-100%
  };
  keyMissingPrerequisites: string[];
}

export interface ConquestChecklistItem {
  id: string;
  category: 'document' | 'oral' | 'simulation' | 'verification' | 'action';
  label: string;
  description: string;
  isCompleted: boolean;
  isRequiredForSubmission: boolean;
  linkedActionType?: 'edit_cv' | 'edit_letter' | 'practice_coach' | 'view_flash' | 'teleprompter' | 'check_pieces';
}

export interface ConquestVideoScriptData {
  id: string;
  title: string;
  targetDurationSeconds: number; // ex: 60s, 90s, 120s
  introHook: string;
  corePitchPoints: string[];
  closingCallToAction: string;
  fullScriptText: string;
  teleprompterSpeedWPM: number; // ex: 130 words per minute
  suggestedPostureTips: string[];
  subtitlesGenerated?: { timestamp: string; text: string }[];
}

export interface ConquestFivePitches {
  pitch15s: string; // 15 secondes : Flash Qui suis-je
  pitch30s: string; // 30 secondes : Que puis-je apporter
  pitch60s: string; // 60 secondes : Présentation professionnelle complète
  pitchProject: string; // Pitch pour Investisseurs / Bailleurs / Partenaires
  pitchClient: string; // Pitch de vente de service / contrat B2B
}

export interface QuickMeetingFlashCard {
  opportunityTitle: string;
  entityName: string;
  interlocutorName: string;
  interlocutorRole: string;
  meetingObjective: string;
  threeMustNotForget: string[];
  flashPitchToDeliver: string;
  probableQuestionsAndBestAnswers: { question: string; punchline: string }[];
  negotiationBorders: { target: string; walkAwayMin: string; leveragePoints: string[] };
  usefulDocsAttached: string[];
}

export interface QualityControlVerification {
  isTargetRecipientVerified: boolean;
  isOpportunityMatchingVerified: boolean;
  areAllRequiredDocsAttached: boolean;
  isLanguageAndSpellingClean: boolean;
  isPersonalDataProtected: boolean;
  isFormatCompliant: boolean;
  isHumanValidated: boolean;
  validatedAt?: string;
  validationNotes?: string;
}

export interface ConquestResponseAnalysis {
  id: string;
  opportunityId: string;
  receivedDate: string;
  senderName: string;
  responseType: 'entretien_propose' | 'demande_pieces' | 'contre_offre' | 'refus_poli' | 'refus_explicite' | 'en_attente_decision' | 'offre_retenue';
  rawResponseContent: string;
  aiDecodedMeaning: string;
  recommendedNextSteps: string[];
  suggestedDraftReply?: string;
  learningPointsFromOutcome?: {
    strengthConfirmed: string;
    gapToAddressForFuture: string;
    suggestedCampusLesson?: string;
  };
}

export interface ConquestWarRoomDossier {
  id: string;
  opportunityId: string;
  opportunity: RadarOpportunityItem;
  createdAt: string;
  lastActiveAt: string;
  
  // Analyses
  gapAnalysis5D: ConquestGapAnalysis5D;
  preparationScore: ConquestPreparationScore;
  
  // Documents
  contextualResume: ContextualResumeData;
  approachDocuments: ConquestApproachDocument[];
  portfolioSelectionIds: string[];
  
  // Orals & Vidéo
  pitches: ConquestFivePitches;
  videoScript: ConquestVideoScriptData;
  simulationHistory: Coach3DSimulationSession[];
  
  // Pilotage & Checklist
  checklist: ConquestChecklistItem[];
  qualityControl: QualityControlVerification;
  quickMeetingFlashCard: QuickMeetingFlashCard;
  
  // Actions & Retours
  actionStatus: 'en_preparation' | 'pret_pour_validation' | 'action_transmise' | 'reponse_recue' | 'cloture_succes' | 'cloture_refus';
  transmittedAt?: string;
  followUpDueDate?: string;
  responsesReceived: ConquestResponseAnalysis[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧭 CARRIÈRE ÉTAPE 4/7 : AGENT DE CONTINUITÉ, SUIVI AUTONOME & DOSSIER VIVANT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type CareerDossierStatusFilter = 
  | 'all'
  | 'a_faire_aujourdhui' 
  | 'en_attente' 
  | 'a_relancer' 
  | 'rendez_vous' 
  | 'reponse_recue' 
  | 'urgent' 
  | 'bloque' 
  | 'reussi' 
  | 'plan_b';

export type CareerTimelineEventType = 
  | 'opportunite_detectee' 
  | 'dossier_prepare' 
  | 'candidature_validee' 
  | 'message_envoye' 
  | 'accuse_reception' 
  | 'demande_complement' 
  | 'reponse_recue' 
  | 'relance_envoyee' 
  | 'rendez_vous_fixe' 
  | 'rendez_vous_effectue' 
  | 'offre_recue' 
  | 'negociation' 
  | 'contrat_signe' 
  | 'refus_enregistre' 
  | 'plan_b_active'
  | 'note_privee';

export interface CareerTimelineEvent {
  id: string;
  date: string;
  formattedTime?: string;
  type: CareerTimelineEventType;
  title: string;
  description: string;
  author: 'user' | 'interlocutor' | 'system_diallo' | 'expert_conseil';
  authorName?: string;
  attachments?: { name: string; type: string; size?: string; url?: string }[];
  outcomeImpact?: string;
  recordedAudioNoteUrl?: string;
}

export type CareerNextBestActionType = 
  | 'attendre' 
  | 'relancer' 
  | 'preparer_document' 
  | 'entrainer_oral' 
  | 'confirmer_rdv' 
  | 'debriefer_rdv' 
  | 'action_plan_b' 
  | 'consulter_expert'
  | 'finaliser_devis'
  | 'envoyer_pieces';

export interface CareerNextBestAction {
  actionType: CareerNextBestActionType;
  headline: string;
  detailedReason: string;
  recommendedDeadline: string;
  suggestedDraftContent?: string;
  suggestedExpert?: {
    expertName: string;
    expertRole: string;
    avatarUrl: string;
    moduleLink: string;
    contactReason: string;
  };
  urgencyLevel: 'normale' | 'prioritaire' | 'critique';
}

export interface CareerFollowUpStrategy {
  totalFollowUpsSent: number;
  maxRecommendedFollowUps: number;
  daysSinceLastExchange: number;
  recommendedDelayDays: number;
  antiSpamVerdict: 'pret_a_relancer' | 'attendre_delai_courtois' | 'ne_pas_harceler_cloturer';
  antiSpamExplanation: string;
  suggestedAngle: string;
  draftTemplate: {
    subject: string;
    body: string;
    valuePropositionAdded: string;
  };
}

export interface CareerPostMeetingDebrief {
  id: string;
  date: string;
  sentiment: 'tres_positif' | 'positif_avec_conditions' | 'mitige' | 'defavorable';
  summary: string;
  keyDecisionsAgreed: string[];
  nextCommitmentsUser: string[];
  nextCommitmentsInterlocutor: string[];
  nextActionLabel: string;
  nextActionDueDate: string;
  audioTranscript?: string;
  notes: string;
}

export interface CareerScheduledMeeting {
  id: string;
  dossierId: string;
  title: string;
  entityName: string;
  interlocutor: {
    name: string;
    role: string;
    avatar?: string;
  };
  date: string;
  time: string;
  meetingType: 'entretien_embauche' | 'appel_decouverte_client' | 'pitch_investisseur' | 'nego_fournisseur' | 'point_technique';
  locationOrLink: string;
  isCompleted: boolean;
  flashPrepCard: {
    objective: string;
    contextSummary: string;
    threeKeyArguments: string[];
    probableQuestions: { question: string; punchline: string }[];
    questionsToAsk: string[];
    targetOutcome: string;
    keyDocsToHaveReady: string[];
  };
  postMeetingDebrief?: CareerPostMeetingDebrief;
}

export interface CareerLiveDossier {
  id: string;
  opportunityId: string;
  title: string;
  entityName: string;
  entityLogoUrl?: string;
  universe: OpportunityUniverse;
  opportunityType: string;
  status: 'a_faire_aujourdhui' | 'en_attente' | 'a_relancer' | 'rendez_vous' | 'reponse_recue' | 'urgent' | 'reussi' | 'bloque' | 'abandonne_plan_b';
  workflowStage: string;
  daysSinceLastContact: number;
  isStalled: boolean; // >21 jours sans évolution
  lastContactDate: string;
  nextActionDueDate: string;
  isUrgentDeadline: boolean; // <48h
  contactPerson: {
    name: string;
    role: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
  };
  targetOutcome: string;
  matchScore: number;
  timeline: CareerTimelineEvent[];
  documentsAttached: { id: string; name: string; type: string; url?: string; date: string }[];
  nextBestAction: CareerNextBestAction;
  followUpStrategy: CareerFollowUpStrategy;
  upcomingMeeting?: CareerScheduledMeeting;
  notes: string[];
  conquestWarRoomId?: string;
  isPrivate: boolean;
  opportunityRef?: RadarOpportunityItem;
}

export interface CareerDailyWeeklyBriefing {
  todayDate: string;
  dailyTopPriorities: {
    id: string;
    time?: string;
    title: string;
    entity: string;
    category: 'rendez_vous' | 'document' | 'relance' | 'echeance' | 'debrief';
    dossierId: string;
    actionLabel: string;
    urgency: 'critique' | 'haute' | 'normale';
    whyImportant: string;
  }[];
  tomorrowBriefing: {
    date: string;
    meetingsCount: number;
    urgentDeadlines: number;
    keyActions: string[];
    flashPrepDossierIds: string[];
  };
  weeklyBriefing: {
    weekRange: string;
    mainStrategicGoal: string;
    keyMilestones: string[];
    followUpsDueCount: number;
    meetingsPlannedCount: number;
    stalledDossiersToResolveCount: number;
  };
  careerPulse: {
    goalHeadline: string;
    progressPercent: number;
    activeDossiersCount: number;
    awaitingRepliesCount: number;
    followUpsDueCount: number;
    meetingsThisWeekCount: number;
    urgentTodayCount: number;
    certifiedResultsCount: number;
    nextBestActionGlobal: {
      title: string;
      subtitle: string;
      dossierId: string;
      actionType: CareerNextBestActionType;
    };
  };
}

export interface CareerPlanBRecommendation {
  failedDossierId: string;
  entityName: string;
  opportunityTitle: string;
  keyLearningsExtracted: string[];
  reusableCapitalAssets: {
    assetName: string;
    type: 'cv' | 'pitch' | 'dossier' | 'proposition';
    description: string;
  }[];
  alternativeRadarOpportunities: RadarOpportunityItem[];
}

// ==========================================
// 🤝 CARRIÈRE 5/7 : CAPITAL RELATIONNEL, RÉSEAU & PROSPECTION
// ==========================================

export type RelationalContactCategory = 
  | 'mentors' 
  | 'clients' 
  | 'prospects' 
  | 'partenaires' 
  | 'investisseurs' 
  | 'experts' 
  | 'anciens_collegues' 
  | 'fournisseurs' 
  | 'organisations' 
  | 'membres_moc' 
  | 'facilitateurs';

export type RelationshipPipelineStage = 
  | 'identifiee' 
  | 'a_etudier' 
  | 'introduction' 
  | 'contact_initial' 
  | 'echange_en_cours' 
  | 'rendez_vous' 
  | 'opportunite_ouverte' 
  | 'negociation' 
  | 'resultat_signe' 
  | 'relation_a_entretenir';

export interface RelationalNode {
  id: string;
  name: string;
  role: string;
  organization: string;
  category: RelationalContactCategory;
  stage: RelationshipPipelineStage;
  avatarUrl: string;
  location: string;
  relevanceScore: number; // 0-100
  whyWeShouldTalk: string; // Explication "Pourquoi nous devrions nous parler"
  bidirectionalValue: {
    whatTheyCanBring: string[];
    whatYouCanBring: string[];
    commonInterests: string[];
  };
  facilitatorContactId?: string;
  facilitatorName?: string;
  email?: string;
  phone?: string;
  lastInteractionDate?: string;
  nextActionDueDate?: string;
  nextBestAction?: string;
  notes?: string[];
  documentsExchanged?: { id: string; name: string; date: string; type: string }[];
  agreedCommitments?: { id: string; text: string; byWhom: 'user' | 'contact'; deadline?: string; completed: boolean }[];
  mocSynergies?: {
    tribesSuggested?: { id: string; name: string; membersCount: number; reason: string }[];
    relevantLives?: { id: string; title: string; host: string; date: string; topic: string }[];
    reelsPortfolioIdea?: string;
  };
  isDirect: boolean; // Directement dans le carnet ou opportunité de mise en relation
  antiSpamScore: number; // 0-100
  canSendFollowUpToday: boolean;
}

export interface IdealCustomerProfile {
  targetSector: string;
  targetCompanySize: string;
  targetLocation: string;
  budgetRange: string;
  corePainPoints: string[];
  triggerCommercialSignals: string[];
  valueProposition: string; // "Pourquoi quelqu'un devrait travailler avec moi"
  successStoriesProofs: string[];
}

export interface CommercialBusinessSignal {
  id: string;
  companyName: string;
  companyLogoUrl?: string;
  signalType: 'croissance' | 'recrutement_massif' | 'nouvelle_implantation' | 'lancement_produit' | 'appel_offres' | 'recherche_prestataire' | 'levee_fonds';
  headline: string;
  detectedDate: string;
  source: string;
  confidenceScore: number;
  potentialOpportunity: string;
  suggestedApproachAngle: string;
  matchedContact?: {
    name: string;
    role: string;
    avatarUrl: string;
  };
}

export interface OpportunityCollaborativeTeam {
  id: string;
  title: string;
  targetOpportunityTitle: string;
  targetOpportunityBudget: string;
  status: 'constitution' | 'proposition_validee' | 'en_mission' | 'reussi';
  requiredRoles: {
    id: string;
    roleTitle: string;
    skillsNeeded: string[];
    assignedMember?: {
      id: string;
      name: string;
      avatarUrl: string;
      expertise: string;
      reputationScore: number;
      hasConsented: boolean;
    };
  }[];
  sharedTasks: { id: string; title: string; assigneeName?: string; isDone: boolean; deadline: string }[];
  sharedDocuments: { id: string; name: string; uploadedBy: string; date: string }[];
}

export interface MentorshipConnection {
  id: string;
  mode: 'seeking_mentor' | 'becoming_mentor';
  mentorOrMentee: {
    id: string;
    name: string;
    title: string;
    avatarUrl: string;
    domain: string;
    yearsExperience: number;
    reputationByCompetency: { competency: string; score: number; proofCount: number }[];
  };
  status: 'recommande' | 'demande_envoyee' | 'actif' | 'termine';
  objectives: string[];
  nextSessionDate?: string;
  voluntaryConsentBothSides: boolean;
}

export interface RelationalEcosystemSummary {
  activeGoalHeadline: string;
  totalContacts: number;
  highImpactContactsCount: number;
  activeDealsCount: number;
  pendingIntroductionsCount: number;
  followUpsDueTodayCount: number;
  idealCustomerProfile: IdealCustomerProfile;
  partnerSearches: { id: string; roleNeeded: string; sector: string; status: string; matchesCount: number }[];
  fundingPipeline: { id: string; funderName: string; stage: string; targetAmount: string; nextStep: string }[];
  collaborativeTeams: OpportunityCollaborativeTeam[];
  mentorships: MentorshipConnection[];
}

// ==========================================
// CARRIÈRE 6/7 : INTELLIGENCE STRATÉGIQUE & TRAJECTOIRES PRÉDICTIVES
// ==========================================

export type SkillProofLevel = 
  | 'declaree' 
  | 'en_apprentissage' 
  | 'evaluee' 
  | 'demontree' 
  | 'utilisee_professionnellement' 
  | 'confirmee_par_realisation';

export type CareerPaceMode = 'acceleration' | 'equilibre';

export interface StrategicCareerCompass {
  whereIAm: {
    currentRole: string;
    keyAssets: string[];
    currentSeniority: string;
    readinessScore: number; // 0-100
  };
  whereIWantToGo: {
    targetPointB: string;
    horizonMonths: number;
    strategicWhy: string;
    isConfirmed: boolean;
  };
  whereMarketEvolves: {
    growthTrend: string;
    hotSkillsInDemand: string[];
    emergingShifts: string[];
    weakSignalsCount: number;
  };
  whatIShouldDoNow: {
    topPriorityAction: string;
    primaryLever: string;
    recommendedPace: CareerPaceMode;
    nextMilestoneDeadline: string;
  };
}

export interface CareerGraphNode {
  id: string;
  roleTitle: string;
  tierLevel: number; // 1 to 5
  category: 'direct_promotion' | 'specialisation' | 'management' | 'entrepreneuriat' | 'international' | 'reconversion' | 'independant' | 'etudes';
  avgTimeHorizonYears: string;
  avgCompensationBracket: string;
  keySkillsRequired: string[];
  isUnlocked: boolean;
  matchScore: number; // 0-100
  description: string;
  connections: string[]; // Node IDs
}

export interface SkillGraphItem {
  id: string;
  name: string;
  category: 'technique' | 'strategie_business' | 'leadership' | 'langues' | 'relationnel' | 'digital_ia';
  status: 'maitrisee' | 'fragile' | 'absente' | 'emergente' | 'prioritaire';
  proofLevel: SkillProofLevel;
  requiredForPointB: boolean;
  frequencyInTargetOffersPercentage: number; // ex: 68%
  roiPotential: string; // ex: "+35% opportunités ciblées"
  recommendedCampusCurriculumId?: string;
  recommendedCampusSubjectTitle?: string;
  estimatedTimeToAcquireWeeks: number;
  isTransferable: boolean;
  transfersToSectors?: string[];
  proofDetails?: {
    proofType: string;
    verifiedDate?: string;
    contextDescription: string;
    evaluatorOrCertificate?: string;
  };
}

export interface TransferableSkillMapping {
  skillName: string;
  acquiredInContext: string;
  transfersToRoles: {
    roleTitle: string;
    sector: string;
    matchRelevanceScore: number;
    whyItApplies: string;
  }[];
}

export interface CareerTrajectorySimulation {
  id: string;
  code: 'A' | 'B' | 'C' | 'D' | 'E' | 'CUSTOM';
  title: string;
  type: 'statut_quo_optimise' | 'specialisation_pointue' | 'management_leadership' | 'entrepreneuriat' | 'international_expatriation' | 'reconversion_totale';
  summary: string;
  targetHorizonMonths: number;
  fitScore: number; // 0-100
  keyStages: { stageOrder: number; title: string; duration: string; milestone: string }[];
  skillsToAcquire: string[];
  keyOpportunities: string[];
  constraintsAndRisks: string[];
  estimatedFinancialInvestment: string;
  potentialROI: string;
  feasibilityRating: 'Accessible' | 'Modérée' | 'Exigeante' | 'Très Ambitieuse';
}

export interface WhatIfScenario {
  id: string;
  promptQuestion: string; // e.g. "Et si j'apprenais l'anglais bilingue ?"
  category: 'langue' | 'diplome' | 'pays' | 'entrepreneuriat' | 'specialisation' | 'statut';
  impactOnPointB: string;
  newTrajectoryUnlocked: string;
  timeframeImpact: string;
  marketOpeningsBonusPercent: number;
  financialImpactEstimate: string;
  riskAssessment: string;
  suggestedFirstStep: string;
}

export interface MarketWeakSignal {
  id: string;
  title: string;
  sector: string;
  signalType: 'competence_emergente' | 'automatisation' | 'nouveau_modele_economique' | 'penurie_talents' | 'evolution_reglementaire';
  trendVelocity: 'rapide' | 'progressive' | 'mature';
  description: string;
  impactOnUserGoal: string;
  recommendedCountermeasure: string;
  sourceConfidence: string;
  detectedDate: string;
}

export interface EvolutionPlan90Days {
  startDate: string;
  activePace: CareerPaceMode;
  targetInterimGoal: string;
  month1_30d: {
    theme: string;
    priorityActions: { id: string; title: string; isDone: boolean; deadline: string; impact: string }[];
    focusSkills: string[];
  };
  month2_60d: {
    theme: string;
    priorityActions: { id: string; title: string; isDone: boolean; deadline: string; impact: string }[];
    focusSkills: string[];
  };
  month3_90d: {
    theme: string;
    targetMilestoneResult: string;
    priorityActions: { id: string; title: string; isDone: boolean; deadline: string; impact: string }[];
    successCriteria: string[];
  };
}

export interface YearlyMilestonePlan {
  yearTarget: string;
  quarter1: { title: string; mainFocus: string; expectedDeliverable: string; isCurrent: boolean };
  quarter2: { title: string; mainFocus: string; expectedDeliverable: string; isCurrent: boolean };
  quarter3: { title: string; mainFocus: string; expectedDeliverable: string; isCurrent: boolean };
  quarter4: { title: string; mainFocus: string; expectedDeliverable: string; isCurrent: boolean };
}

export interface CareerCheckpoint {
  id: number;
  name: string; // 1: Fondations, 2: Compétences, 3: Visibilité, 4: Opportunités, 5: Résultat
  description: string;
  status: 'valide' | 'en_cours' | 'a_venir';
  completionPercentage: number;
  keyValidationCriteria: string[];
  dateAchieved?: string;
}

export interface CareerPlateauDiagnosis {
  isPlateauDetected: boolean;
  stagnationDurationWeeks: number;
  identifiedBlockers: {
    cause: 'manque_opportunites' | 'competence_bloquante' | 'positionnement_trop_etroit' | 'manque_visibilite' | 'strategie_inactive';
    explanation: string;
    severity: 'haute' | 'moyenne' | 'faible';
  }[];
  unlockingAlternatives: {
    id: string;
    title: string;
    approachType: 'autre_secteur' | 'nouvelle_competence' | 'nouveau_positionnement' | 'synergie_reseau' | 'nouveau_marche';
    actionDescription: string;
    expectedImpact: string;
  }[];
  topLeverHeadline: string;
  topLeverReason: string;
}

export interface PersonalDecisionCriterion {
  id: string;
  name: string; // Rémunération, Stabilité, Apprentissage, Mobilité, Famille, Autonomie, Impact, Prestige, Équilibre, Entrepreneuriat
  weight: number; // 1 to 10
  iconName: string;
}

export interface OpportunityComparisonItem {
  id: string;
  title: string;
  organization: string;
  type: string;
  scoresByCriterion: Record<string, number>; // criterionId -> 1 to 10
  pros: string[];
  cons: string[];
  calculatedScore: number;
  aiCommentary: string;
}

export interface MultiExpertCareerCouncil {
  decisionTopic: string;
  consultedExperts: {
    expertId: string;
    name: string;
    domain: 'Carrière' | 'Finance' | 'Langues' | 'Juridique' | 'Logement_Expat' | 'Campus';
    avatarUrl: string;
    analysis: string;
    verdict: 'Favorable' | 'Vigilance' | 'Réserves' | 'Conditionné';
    keyRecommendations: string[];
  }[];
  orchestratedSynthesis: {
    mainConclusion: string;
    riskLevel: 'Faible' | 'Modéré' | 'Élevé';
    actionableRoadmap: string[];
  };
}

export interface CareerAIBilan {
  generatedAt: string;
  userName: string;
  currentObjective: string;
  whatYouAccomplished: string[];
  whatYouMasterNow: string[];
  whatHasChangedInContext: string[];
  currentCoreStrengths: string[];
  currentOpenOpportunities: string[];
  criticalGapsToClose: string[];
  recommendedNextTrajectory: string;
  advisorNextPeriodRecommendation: string;
  factsVsRecommendationsDisclaimers: string;
}

export interface CareerEvolutionTimelineStep {
  id: string;
  status: 'completed' | 'current' | 'upcoming';
  timeframe: string;
  category: string;
  title: string;
  description: string;
  keyMilestones: string[];
  achievementBadge?: string;
}

// ==========================================
// 🌟 CARRIÈRE 7/7 — CONSOLIDATION & CYCLE D'ACCOMPLISSEMENT VIVANT
// ==========================================

export type CareerAccomplishmentStatus = 'in_progress' | 'accomplished' | 'pivoting' | 'paused';

export interface CareerJournalEntry {
  id: string;
  timestamp: string;
  type: 'decision' | 'formation' | 'competence' | 'opportunite' | 'candidature' | 'rencontre' | 'resultat' | 'echec_utile' | 'pivot_strategie' | 'realisation';
  title: string;
  description: string;
  lessonsLearned?: string;
  impactScore?: number; // 1 to 10
  relatedEntity?: string;
  tags?: string[];
}

export interface CareerAccomplishmentCelebration {
  goalId: string;
  initialGoalTitle: string;
  achievedResultTitle: string;
  achievedDate: string;
  totalDurationWeeks: number;
  milestonesPassedCount: number;
  skillsAcquired: string[];
  difficultiesOvercome: string[];
  relationshipsCreatedCount: number;
  keyDeliverables: string[];
  twinGainsSummary: string;
  nextSuggestedAmbitions: {
    id: string;
    type: '90_first_days' | 'promotion' | 'entrepreneurship' | 'international' | 'mentorship_transmission';
    title: string;
    description: string;
    recommendedPace: string;
  }[];
}

export interface CareerAgentPermissionConfig {
  autoAnalyzeOpportunities: boolean; // Always allowed
  askBeforePrepareDossier: boolean; // Demander avant
  validateBeforeSendCommunication: boolean; // Validation obligatoire
  neverSharePrivateDataWithoutConsent: boolean; // Toujours actif
  isAgentPaused: boolean;
  autonomousMode: 'standard' | 'copilot' | 'auto_pilot';
  lastPausedAt?: string;
}

export interface CareerAgentActivityLogItem {
  id: string;
  timestamp: string;
  category: 'analyse' | 'filtrage' | 'mise_a_jour_dossier' | 'rappel' | 'recommandation' | 'alerte_urgence';
  title: string;
  description: string;
  outcomeBadge: string;
  isAutomatic: boolean;
}

export interface CareerDailyCommandData {
  greeting: string;
  dateStr: string;
  nextBestAction: {
    id: string;
    title: string;
    whyNow: string;
    urgencyLevel: 'high' | 'medium' | 'normal';
    actionType: 'interview_prep' | 'send_relance' | 'review_opportunity' | 'campus_lesson' | 'network_contact';
    targetTab: string;
  };
  todayInterviewsCount: number;
  urgentOpportunitiesCount: number;
  receivedResponsesCount: number;
  pendingActionsCount: number;
  quickChecklist: { id: string; text: string; done: boolean; time?: string }[];
}

export interface CareerWeeklyBriefingData {
  weekRange: string;
  accomplishments: string[];
  newOpportunitiesDetected: number;
  dossiersAdvanced: number;
  responsesReceived: number;
  skillsReinforced: string[];
  stuckDossiersAlerts: string[];
  topPriorityForNextWeek: string;
}

export interface CareerMonthlyBilanData {
  monthName: string;
  initialPointAMonthAgo: string;
  currentProgressState: string;
  progressPercentage: number;
  blockersResolved: string[];
  newSkillsMastered: string[];
  opportunitiesCreatedOrWon: string[];
  nextMonthKeyMilestone: string;
}

export interface CareerProfessionalImpactData {
  peopleHelpedCount: number;
  projectsCompletedCount: number;
  teamsAccompaniedCount: number;
  knowledgeTransmittedCount: number;
  reputationCertificationsCount: number;
  mentorshipLiveSessionsCount: number;
  tribesActiveContribution: string[];
}

export interface CareerEmergencySituation {
  isActive: boolean;
  emergencyType: 'interview_soon' | 'dossier_urgent' | 'contract_offer' | 'client_meeting';
  headline: string;
  targetEntity: string;
  minutesRemaining?: number;
  emergencySteps: { id: string; instruction: string; completed: boolean }[];
  keyTalkingPoints: string[];
  pitfallsToAvoid: string[];
}

export interface CareerSurpriseOpportunityItem {
  id: string;
  title: string;
  entity: string;
  location: string;
  compensation: string;
  matchScore: number;
  whyProposed: string;
  transferableSkillsMobilized: string[];
  strategicAdvantage: string;
}

export interface CareerCoherenceAuditResult {
  isCoherent: boolean;
  coherenceScore: number; // 0 to 100
  initialGoalReminder: string;
  recentActionsAlignment: 'parfait' | 'dispersion_legere' | 'divergence_marquee';
  diagnosisDetail: string;
  suggestedAction: 'continuer' | 'recentrer_actions' | 'ajuster_point_b';
}

export interface CareerReturnContext {
  isReturningUser: boolean;
  lastActiveDate: string;
  daysSinceLastVisit: number;
  lastActiveGoalTitle: string;
  lastRecordedAction: string;
  activeDossiersStillRelevant: number;
  obsoleteElementsCount: number;
  freshOpportunitiesCount: number;
  recommendedResumeStep: string;
}

export interface CareerMasterDossier {
  dossierId: string;
  userId: string;
  currentStatus: CareerAccomplishmentStatus;
  goalId: string;
  goalTitle: string;
  targetArchetypeId?: string;
  pointASummary: string;
  pointBSummary: string;
  overallProgressPercentage: number;
  activePace: 'accelere' | 'equilibre';
  permissions: CareerAgentPermissionConfig;
  activityLogs: CareerAgentActivityLogItem[];
  journalEntries: CareerJournalEntry[];
  dailyCommand: CareerDailyCommandData;
  weeklyBriefing: CareerWeeklyBriefingData;
  monthlyBilan: CareerMonthlyBilanData;
  impactData: CareerProfessionalImpactData;
  emergencySituation?: CareerEmergencySituation;
  surpriseOpportunities: CareerSurpriseOpportunityItem[];
  coherenceAudit: CareerCoherenceAuditResult;
  returnContext: CareerReturnContext;
  lastCelebration?: CareerAccomplishmentCelebration;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  status: 'active' | 'pending' | 'suspended';
  country: string;
  city?: string;
  title?: string;
  bio?: string;
  phone?: string;
  citizenshipId?: string;
  credits: number;
  joinedAt: string;
  lastLogin: string;
  permissions: string[];
  kycVerified: boolean;
  avatarUrl: string;
  assignedExpertId?: string;
  notes?: string;
  origin?: 'supabase_cloud' | 'local_session' | 'admin_created';
  level?: number;
  xp?: number;
  isOnline?: boolean;
  lastSeenOnline?: string;
  dossiersCount?: number;
  history?: { id: string; timestamp: string; action: string; actor: string; details?: string }[];
}

export type SupportedAIProviderType = 
  | 'gemini' 
  | 'openai' 
  | 'claude' 
  | 'deepseek' 
  | 'kimi' 
  | 'qwen' 
  | 'mistral' 
  | 'grok' 
  | 'openrouter' 
  | 'replicate' 
  | 'huggingface' 
  | 'ollama' 
  | 'custom';

export type AIProviderTier = 'primary' | 'secondary' | 'tertiary' | 'fallback' | 'quarantined';
export type AIProviderStatus = 'unknown' | 'online' | 'degraded' | 'offline' | 'quarantined' | 'testing';

export interface AIProviderConfig {
  id: string;
  name: string;
  provider: SupportedAIProviderType;
  isEnabled: boolean;
  isDefault: boolean;
  priority: number; // 1 = top priority, 2, 3, etc.
  tier: AIProviderTier;
  /**
   * Les secrets fournisseur ne font jamais partie du contrat navigateur.
   * Conservé optionnel uniquement pour compatibilité de lecture d'anciens
   * objets; AdminConfigService les supprime systématiquement.
   */
  apiKey?: never;
  defaultModel: string;
  availableModels: string[];
  temperature: number;
  maxTokens: number;
  endpointUrl?: never;
  latencyMs?: number;
  status: AIProviderStatus;
  qualityScore: number; // 0 to 100
  minQualityThreshold: number; // Minimum acceptable score (e.g. 70)
  maxLatencyThresholdMs: number; // Maximum acceptable latency before failover
  costPer1kInputTokens: number; // in USD
  costPer1kOutputTokens: number; // in USD
  consecutiveErrors: number;
  totalCalls: number;
  successCalls: number;
  lastHealthCheck?: string;
  lastErrorMessage?: string;
  headers?: never;
  isCustom?: boolean;
}

export interface AIFailoverEvent {
  id: string;
  timestamp: string;
  requestedProviderId: string;
  requestedProviderName: string;
  fallbackProviderId: string;
  fallbackProviderName: string;
  modelUsed: string;
  reason: 'timeout' | 'rate_limit_429' | 'error_5xx' | 'auth_failed' | 'quality_below_threshold' | 'latency_exceeded' | 'manual_switch' | 'offline_key_missing';
  details: string;
  latencyMs: number;
  success: boolean;
  promptSnippet?: string;
}

export interface AIRoutingPolicyConfig {
  strategy: 'auto_resilient_quality' | 'strict_priority' | 'lowest_latency' | 'lowest_cost';
  globalMinQualityScore: number; // Default: 70
  globalMaxLatencyMs: number; // Default: 2500
  maxConsecutiveErrorsBeforeQuarantine: number; // Default: 3
  autoFailbackIntervalSec: number; // Recheck primary every X seconds
  autoQuarantineEnabled: boolean;
  enableBudgetThresholdRouting: boolean;
  maxCostPerCallCapUSD: number;
  fallbackChainOrder: string[]; // List of provider IDs
}

export interface AIExecutionResult<T = any> {
  text: string;
  data?: T;
  providerUsed: AIProviderConfig;
  modelUsed: string;
  latencyMs: number;
  wasFailover: boolean;
  failoverAttemptsCount?: number;
  failoverReason?: string;
  tokensEstimated?: number;
  costEstimatedUSD?: number;
}

export interface PlatformModuleConfig {
  id: string;
  code: string;
  label: string;
  category: string;
  isEnabled: boolean;
  inMaintenance: boolean;
  accessLevel: 'all' | 'verified' | 'vip' | 'admin';
  description: string;
  icon: string;
  activeSessionsCount: number;
  assignedLeadExpertId?: string;
}

export interface TemplateVariableDef {
  key: string;
  label: string;
  defaultValue: string;
  description: string;
  type?: 'text' | 'date' | 'number' | 'paragraph';
}

export interface OfficialDocumentTemplate {
  id: string;
  title: string;
  category: 'letter' | 'contract' | 'certificate' | 'mandate' | 'invoice' | 'notice' | 'procedure';
  description: string;
  headerTitle: string;
  headerSubtitle: string;
  watermarkText: string;
  bodyTemplate: string;
  variables: TemplateVariableDef[];
  defaultSignerId: string;
  defaultStampId: string;
  isOfficial: boolean;
  qrCodeVerification: boolean;
  footerLegalText: string;
  updatedAt: string;
  author: string;
}

export interface OfficialSignature {
  id: string;
  signerName: string;
  signerTitle: string;
  expertId?: string;
  signatureType: 'vector' | 'drawn' | 'uploaded' | 'crypto';
  signatureSvgOrDataUrl: string;
  hashSha256: string;
  issuedAt: string;
  isActive: boolean;
}

export interface OfficialStamp {
  id: string;
  title: string;
  institution: string;
  motto: string;
  shape: 'circular' | 'oval' | 'rectangular';
  color: string;
  sealIcon: string;
  securityLevel: 'diplomatic' | 'juridique' | 'academique' | 'financier' | 'consulaire';
  securityHash: string;
  isActive: boolean;
}

export interface WorkflowStepConfig {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  assignedRole: string;
  actionType: 'draft' | 'review' | 'human_validation' | 'ai_synthesis' | 'sign_and_stamp' | 'archive';
  requiresSignature: boolean;
  requiresStamp: boolean;
  timeLimitDays: number;
}

export interface WorkflowPipelineConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  triggerEvent: string;
  isAutomatic: boolean;
  isActive: boolean;
  steps: WorkflowStepConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'security';
  category: 'auth' | 'ai' | 'document' | 'payment' | 'admin' | 'sync' | 'workflow';
  message: string;
  actor: string;
  ipAddress: string;
  metadata?: Record<string, any>;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  priority: 'info' | 'warning' | 'urgent' | 'maintenance';
  targetAudience: 'all' | 'citizens' | 'partners' | 'admins';
  sentAt: string;
  expiresAt?: string;
  readCount: number;
  active: boolean;
}

export interface AdminSystemConfig {
  systemName: string;
  organizationName: string;
  maintenanceMode: boolean;
  registrationOpen: boolean;
  localFirstSync: boolean;
  highSecurityMode: boolean;
  cloudBackupIntervalHours: number;
  primaryNode: string;
  fallbackNode: string;
  lastBackupDate: string;
  totalStorageUsedBytes: number;
  officialSealText: string;
}

export interface ContentModerationItem {
  id: string;
  type: 'post' | 'comment' | 'listing' | 'live_stream';
  title: string;
  contentSnippet: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  createdAt: string;
  status: 'approved' | 'flagged' | 'hidden' | 'deleted';
  reportsCount: number;
  flagsReason: string[];
  moduleOrigin: string; // 'Réseau MOC', 'Marché B2B', 'Live Session', 'Campus'
  mediaUrl?: string;
}

export interface UserReportItem {
  id: string;
  targetType: 'user' | 'post' | 'comment' | 'product' | 'live';
  targetId: string;
  targetTitle: string;
  reportedUserId: string;
  reportedUserName: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reason: 'spam' | 'harassment' | 'fraud' | 'copyright' | 'inappropriate' | 'counterfeit';
  details: string;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  createdAt: string;
  resolutionNotes?: string;
}

export interface MokTrustAuditItem {
  id: string;
  sellerId: string;
  sellerName: string;
  companyName: string;
  businessType: string;
  requestedBadge: 'verified_producer' | 'certified_exporter' | 'trusted_escrow' | 'kyc_gold';
  documentProofUrl?: string;
  trustScore: number;
  status: 'pending' | 'approved' | 'rejected' | 'under_audit';
  auditNotes?: string;
  submissionDate: string;
  kycDocType?: string;
}

export interface PlatformDetailedModuleSettings {
  live: {
    maxBitrateKbps: number;
    aiModerationSensitivity: 'low' | 'medium' | 'strict';
    allowPublicStreamCreation: boolean;
    maxConcurrentLives: number;
    autoRecordingEnabled: boolean;
  };
  commerce: {
    commissionRatePercent: number;
    escrowHoldingPeriodDays: number;
    minRfqAmount: number;
    supportedCurrencies: string[];
    autoCustomsCalculator: boolean;
    verifiedSellersOnlyForB2B: boolean;
  };
  mokTrust: {
    minTrustScoreToPublish: number;
    mandatoryKycForEscrow: boolean;
    disputeResolutionTimeoutHours: number;
    escrowFeePercent: number;
    smartContractAuditLog: boolean;
  };
  studio: {
    maxDailyGenerationsPerUser: number;
    defaultVisionModel: string;
    defaultImageSize: string;
    watermarkEnabled: boolean;
    allowVeoVideoGeneration: boolean;
  };
  campus: {
    examPassingScore: number;
    autoGenerateDiplomaPdf: boolean;
    xpMultiplier: number;
    peerReviewEnabled: boolean;
  };
  aiCore: {
    activeDefaultProvider: 'gemini' | 'openai' | 'claude' | 'deepseek' | 'mistral';
    geminiModel: string;
    thinkingBudgetTokens: number;
    streamResponses: boolean;
    safetyThreshold: 'strict' | 'standard' | 'relaxed';
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛡️ SYSTÈME MAÎTRE DE GESTION DES VERSIONS, SAUVEGARDES & RESTAURATION INTELLIGENTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ReleaseVersionStatus = 'current' | 'stable' | 'archived' | 'deprecated';

export interface PlatformReleaseVersion {
  version: string;
  releaseDate: string;
  title: string;
  changelog: string[];
  status: ReleaseVersionStatus;
  author: string;
  checksum: string;
  schemaVersion: string;
  modulesCount: number;
  aiProvidersCount: number;
  templatesCount: number;
  migrationNotes: string[];
  isRollbackTarget: boolean;
  highlights: string[];
  databaseCompatibility: {
    schemaCompatible: boolean;
    migrationsRequired: boolean;
    dataLossRisk: 'none' | 'low' | 'moderate' | 'high';
  };
}

export type SnapshotType = 'auto_pre_restore' | 'scheduled' | 'manual' | 'system_milestone';

export interface BackupSnapshotRecord {
  id: string;
  name: string;
  type: SnapshotType;
  createdAt: string;
  versionTag: string;
  sizeBytes: number;
  checksum: string;
  canRollback: boolean;
  autoCreatedBeforeRestoreOfVersion?: string;
  notes?: string;
  recordsCount: {
    users: number;
    aiProviders: number;
    modules: number;
    templates: number;
    signatures: number;
    stamps: number;
    workflows: number;
    logs: number;
    moderation: number;
    audits: number;
    settingsIncluded: boolean;
  };
  payload?: any;
}

export interface BackupScheduleConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom_cron';
  timeOfDay: string; // e.g. '03:00'
  dayOfWeek?: number; // 0=Sunday, 1=Monday...
  customCronExpression?: string;
  keepMaxSnapshots: number; // e.g. 10
  autoSyncToCloud: boolean; // Supabase Cloud storage / IndexedDB
  lastRunAt?: string;
  nextRunAt?: string;
  notifyAdminOnSuccess: boolean;
  autoPruneOldSnapshots: boolean;
}

export interface RestoreOperationResult {
  success: boolean;
  restoredVersion: string;
  snapshotId: string;
  timestamp: string;
  preRestoreSnapshotId: string;
  summary: string;
  preservedItems: {
    usersCount: number;
    logsCount: number;
    totalCreditsPreserved: number;
    profilesPreserved: boolean;
  };
  warnings: string[];
}

export interface VersionComparisonResult {
  versionA: string;
  versionB: string;
  diffSummary: string;
  addedFeatures: string[];
  removedFeatures: string[];
  changedConfigs: Array<{
    key: string;
    oldValue: string;
    newValue: string;
    impact: string;
  }>;
  schemaChanges: string[];
}








