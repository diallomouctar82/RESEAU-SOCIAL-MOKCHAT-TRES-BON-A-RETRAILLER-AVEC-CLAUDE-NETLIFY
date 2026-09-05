-- EX-1 — Le socle qui manquait pour que les experts puissent réellement
-- monter sur la scène d'un direct.
--
-- CONSTAT (mesuré le 03/09/2026) : `live_speakers.agent_id` porte une clé
-- étrangère vers `agents(id)`, et `public.agents` contenait **0 ligne** alors
-- que l'application en propose 13 (`constants.ts::AGENTS`). Toute tentative
-- d'inscrire un expert dans un direct aurait donc échoué en violation de clé
-- étrangère — c'est pour cela qu'appuyer sur « inviter un expert » ne pouvait
-- rien donner, quel que soit l'état de l'interface.
--
-- Les 13 lignes ci-dessous sont extraites du fichier réel (script
-- `extract-agents.cjs`), pas retapées à la main : la base doit refléter
-- exactement ce que l'application propose, sinon la clé étrangère casse à la
-- première invitation d'un expert absent.

-- `specialty` existe déjà sur `live_speakers` et sur le type client, mais pas
-- sur `agents` : on l'ajoute pour que la base porte la fiche complète d'un
-- expert plutôt qu'un fragment.
alter table public.agents add column if not exists specialty text;

insert into public.agents (id, name, role, specialty, description, avatar_url, is_human, is_active)
values
  ('1', 'Diallo', 'coach', 'Polyglotte & Immersion', 'Apprentissage des langues, diagnostic de niveau A1-C2, traduction texte/voix/caméra et simulation d’entretiens oraux.', 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=200&fit=crop', false, true),
  ('2', 'Maître Diallo', 'juridique', 'Droit International & Affaires', 'Assistant de compréhension du droit, analyse de contrats, visa/titre de séjour, recours et citations d’articles officiels.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&fit=crop', false, true),
  ('3', 'Conseiller Diallo', 'emploi', 'Diagnostic Pro & Recrutement', 'Coaching de carrière complet, diagnostic des compétences, CV international ATS, portfolio, simulation d’entretiens et veille marché.', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&fit=crop', false, true),
  ('4', 'Professeur Diallo', 'education', 'Pédagogie & Évaluations', 'Parcours scolaire et universitaire, de l’alphabétisation au supérieur, diagnostic de niveau, devoirs, examens et remédiation continue.', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&fit=crop', false, true),
  ('5', 'Docteur Diallo', 'sante', 'Information Médicale & Prévention', 'Compréhension de bilans et ordonnances, préparation de consultations, éducation sanitaire et orientation d’évacuation médicale.', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&fit=crop', false, true),
  ('6', 'Monsieur Diallo', 'logement', 'Immobilier & Droits Locatifs', 'Recherche de logement, calcul de budget et aides APL, vérification des contrats de bail, démarches de garant et logement social.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&fit=crop', false, true),
  ('7', 'Guide Diallo', 'voyage', 'Mobilité & Formalités Mondiales', 'Visas internationaux, préparation de départ, formalités douanières, billets et installation dans le pays d’accueil.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&fit=crop', false, true),
  ('8', 'Directeur Diallo', 'projet', 'Ingénierie de Projet (10 Phases) & Financement', 'Accompagnement méthodique de l’idée initiale jusqu’au rapport final : note conceptuelle, budget, recherche de bailleurs, partenariats et pilotage.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop', false, true),
  ('9', 'Trésorier Diallo', 'finance', 'Budget, Trésorerie & Commerce', 'Alignement des capacités financières sur les objectifs, budget prévisionnel, seuil de rentabilité, gestion des devises et investissement.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&fit=crop', false, true),
  ('10', 'Officier Diallo', 'administration', 'Formalités Publiques & Démarches', 'Vérification exhaustive des dossiers administratifs, formulaires officiels, pièces manquantes, prise de rendez-vous et suivi des délais.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop', false, true),
  ('h1', 'Me Sarah Mansouri', 'juridique', 'Droit des Affaires & Mobilité Internationale', 'Avocate assermentée avec 14 ans d’expérience. Consultation approfondie, validation finale d’actes et représentation légale.', 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=200&fit=crop', true, true),
  ('h2', 'Dr. Karim Ouedraogo', 'sante', 'Régulation Médicale & Évacuations', 'Praticien hospitalier et consultant en organisation des soins. Évaluation de dossiers d’évacuation et coordination spécialisée.', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&fit=crop', true, true),
  ('h3', 'Fatou Ndiaye, CPA', 'finance', 'Audit Financier & Levée de Fonds', 'Commissaire aux comptes et consultante en structuration de haut de bilan. Certification de comptes et dossiers bancaires.', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&fit=crop', true, true)
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  specialty = excluded.specialty,
  description = excluded.description,
  avatar_url = excluded.avatar_url,
  is_human = excluded.is_human,
  is_active = excluded.is_active;

-- PIÈGE À FERMER : `live_speakers_session_user_key UNIQUE (session_id, user_id)`
-- ne protège PAS les experts. Une ligne d'expert a `user_id IS NULL`, et en
-- PostgreSQL deux NULL ne sont jamais égaux dans un index unique standard :
-- inviter deux fois le même expert créerait deux lignes, donc deux cartes.
-- L'index partiel ci-dessous ferme ce trou sans toucher à la contrainte des
-- humains. Il ne compte que les présences EN COURS (`left_at is null`) : un
-- expert retiré puis réinvité doit pouvoir revenir.
create unique index if not exists live_speakers_session_agent_active_idx
  on public.live_speakers (session_id, agent_id)
  where agent_id is not null and left_at is null;
