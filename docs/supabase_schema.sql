-- ==============================================================================
-- ⚠️ FICHIER OBSOLÈTE — NE PAS EXÉCUTER, NE PAS CITER COMME RÉFÉRENCE.
-- Ce brouillon ("v2.4 Souverain") précède la vraie migration Supabase de ce
-- dépôt et ne correspond à AUCUNE table réellement présente en base
-- aujourd'hui (ex. `profiles` ci-dessous invente `kyc_status`/`language`/
-- `metadata` qui n'existent pas, et omet `citizenship_id`/`next_level_xp`/
-- `two_factor_enabled`/`admin_notes` qui existent réellement ; la messagerie
-- ci-dessous utilise `chat_conversations`/`chat_messages`, deux noms de
-- table qui n'ont jamais existé — les vraies tables sont `conversations`/
-- `conversation_participants`/`messages`, voir LOOP 06/17). Découvert et
-- documenté comme tel au LOOP 07/17 (mission Architecte MOCnet, messagerie)
-- en corrigeant les fiches doc de la messagerie qui le citaient encore.
-- Source de vérité réelle et vérifiée : `docs/SUPABASE_ARCHITECTURE.md`.
-- Conservé ici uniquement comme trace historique du brouillon d'origine —
-- une réécriture complète des ~15 domaines qu'il couvre est un chantier de
-- documentation à part entière, hors périmètre d'une LOOP messagerie.
-- ==============================================================================

-- ==============================================================================
-- 🏛️ LE MONDE À VOUS — SCHÉMA SQL COMPLET POUR SUPABASE (POSTGRESQL + RLS)
-- Compatible : Supabase SQL Editor (1-Click Run)
-- Version : v2.4 Souverain
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE DES PROFILS UTILISATEURS (Liée à auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    title TEXT DEFAULT 'Citoyen Actif',
    bio TEXT DEFAULT 'Membre de la communauté Le Monde à Vous.',
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('super_admin', 'admin', 'expert', 'partner', 'citizen', 'guest')),
    country TEXT DEFAULT 'France',
    city TEXT DEFAULT 'Paris',
    language TEXT DEFAULT 'fr',
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop',
    citizenship_id TEXT,
    phone TEXT,
    website TEXT,
    credits INTEGER DEFAULT 500,
    xp INTEGER DEFAULT 1200,
    level INTEGER DEFAULT 3,
    kyc_status TEXT DEFAULT 'verified' CHECK (kyc_status IN ('unverified', 'pending', 'verified', 'rejected')),
    is_verified BOOLEAN DEFAULT TRUE,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    skills JSONB DEFAULT '[]'::jsonb,
    badges JSONB DEFAULT '[]'::jsonb,
    interests JSONB DEFAULT '[]'::jsonb,
    privacy_settings JSONB DEFAULT '{"profileVisibility":"public","allowMessagesFrom":"all","showOnlineStatus":true,"allowTagging":true,"showActivityFeed":true}'::jsonb,
    permissions JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE DES DOSSIERS ADMINISTRATIFS & CITOYENS
CREATE TABLE IF NOT EXISTS public.dossiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reference TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('prefecture', 'visa', 'business', 'academic', 'housing', 'legal', 'health', 'mobility')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'archived')),
    expert_assigned TEXT,
    progress INTEGER DEFAULT 0,
    documents JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE DES MODÈLES D'ACTES ET LETTRES OFFICIELLES
CREATE TABLE IF NOT EXISTS public.official_templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    institution TEXT NOT NULL,
    default_object TEXT NOT NULL,
    content_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    default_signature_id TEXT,
    default_stamp_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE DES JOURNAUX D'AUDIT SYSTÈME
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'security')),
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    actor TEXT NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address TEXT DEFAULT '127.0.0.1',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 6. TABLE DES NOTIFICATIONS DE DIFFUSION GÉNÉRALE
CREATE TABLE IF NOT EXISTS public.broadcast_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'info' CHECK (priority IN ('info', 'warning', 'urgent', 'maintenance')),
    target_audience TEXT NOT NULL DEFAULT 'all',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    read_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 7. TABLE DES COURS ET CERTIFICATIONS (CAMPUS 3.0)
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    level TEXT NOT NULL,
    institution TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_certified BOOLEAN DEFAULT FALSE,
    certified_at TIMESTAMPTZ,
    certificate_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 8. TABLE DU RÉSEAU MOK & POSTS COMMUNAUTAIRES
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_role TEXT,
    author_avatar TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    document JSONB,
    category TEXT DEFAULT 'Tech & Innovation',
    tags JSONB DEFAULT '[]'::jsonb,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'network', 'private')),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    reactions JSONB DEFAULT '{"like":0,"love":0,"celebrate":0,"insightful":0,"support":0,"fire":0}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLE DES COMMENTAIRES DE POSTS
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLE DES CONVERSATIONS & MESSAGES PRIVÉS
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_one_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant_two_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_time TIMESTAMPTZ DEFAULT NOW(),
    unread_count_one INTEGER DEFAULT 0,
    unread_count_two INTEGER DEFAULT 0,
    is_group BOOLEAN DEFAULT FALSE,
    group_name TEXT,
    group_members JSONB DEFAULT '[]'::jsonb,
    is_blocked BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    encryption_fingerprint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_avatar TEXT,
    sender_role TEXT DEFAULT 'citizen',
    text TEXT,
    media_type TEXT DEFAULT 'text' CHECK (media_type IN ('text', 'image', 'video', 'audio', 'document')),
    media_url TEXT,
    file_name TEXT,
    file_size TEXT,
    voice_url TEXT,
    voice_duration INTEGER,
    reactions JSONB DEFAULT '{}'::jsonb,
    reply_to JSONB,
    attachments JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read')),
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    initiator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('missed', 'rejected', 'completed', 'busy')),
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- POLITIQUES RLS
-- Profiles : Chacun lit et modifie son profil ; Admins ont un accès total
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Dossiers : Le propriétaire et les admins peuvent lire et modifier
CREATE POLICY "Users can view own dossiers" ON public.dossiers FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'expert')));
CREATE POLICY "Users can insert own dossiers" ON public.dossiers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dossiers" ON public.dossiers FOR UPDATE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'expert')));

-- Modèles & Cours : Lisibles par tous, modifiables par les Admins
CREATE POLICY "Templates readable by authenticated" ON public.official_templates FOR SELECT USING (true);
CREATE POLICY "Courses readable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Broadcasts readable by everyone" ON public.broadcast_notifications FOR SELECT USING (true);
CREATE POLICY "Posts readable by everyone" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Comments readable by everyone" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated can create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view own conversations" ON public.chat_conversations FOR SELECT USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);
CREATE POLICY "Users can insert own conversations" ON public.chat_conversations FOR INSERT WITH CHECK (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

CREATE POLICY "Users can view messages of their conversations" ON public.chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = conversation_id AND (participant_one_id = auth.uid() OR participant_two_id = auth.uid())));
CREATE POLICY "Users can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 12. TRIGGER AUTOMATIQUE : CRÉATION DE PROFIL LORS D'UN SIGNUP AUTH
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'citizen')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
