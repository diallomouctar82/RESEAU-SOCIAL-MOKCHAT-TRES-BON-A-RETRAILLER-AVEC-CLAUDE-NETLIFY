import { ServerCaptioner, InterpreterVoiceTrack } from '../calls/callInterpreter';
import { splitForInterpretation } from '../messaging/speechLanguage';
import { SPEECH_TAGS } from '../messaging/speechLanguage';
import { translationService } from '../translation/translationService';
import {
    MAX_BROWSER_PRODUCED_LANGUAGES,
    interpreterTrackNameForLanguage,
    languagesToProduce,
    listeningLanguageCode,
    type ProductionPlan,
} from './liveListeningLanguage';

/**
 * LIVE PLANÉTAIRE — le PRODUCTEUR : ma parole devient N voix, une par langue
 * réellement demandée dans le direct.
 *
 *     mon micro
 *       → 1 découpage          (PcmSegmenter, réutilisé des appels)
 *       → 1 transcription      (ServerCaptioner : texte + langue DÉTECTÉE)
 *       → N traductions texte  (translationService, avec son cache)
 *       → N voix de synthèse   (InterpreterVoiceTrack, une par langue)
 *       → N pistes `interpreter:<langue>` publiées dans la room
 *
 * Le « 1 » de la transcription est le cœur de l'économie : un intervenant
 * écouté en anglais, en espagnol et en arabe ne fait transcrire sa voix
 * qu'UNE fois. Et une langue produite sert TOUS ceux qui l'ont demandée —
 * mille auditeurs anglophones se partagent la même piste.
 *
 * Ce producteur tourne dans le navigateur de l'intervenant. C'est ce qui est
 * réalisable et démontrable aujourd'hui, et cela impose une limite honnête :
 * au-delà de quelques langues simultanées, un téléphone ne suit plus (voir
 * `MAX_BROWSER_PRODUCED_LANGUAGES`). Les langues au-delà du plafond ne sont
 * pas escamotées : elles remontent dans `plan.unserved` pour que l'écran
 * puisse le dire à ceux qui les ont choisies.
 *
 * Le jour où un agent serveur (GPU) prendra le relais, il publiera les MÊMES
 * noms de pistes : rien ne changera côté auditeur.
 */

/**
 * Étape mesurée de la chaîne — pour chiffrer la latence, jamais pour
 * transporter la parole des gens.
 *
 * `voiced` signifie **du son est réellement sorti**, pas « la phrase est
 * partie en file ». La distinction n'est pas cosmétique : mesurer la latence
 * sur une mise en file donnerait des chiffres flatteurs et faux, et une
 * synthèse en panne passerait pour un succès.
 *
 * `subtitled` est le repli explicite de §17 : la traduction TEXTE a réussi
 * mais la voix n'est pas sortie — l'auditeur lit au lieu d'entendre, et
 * l'audio d'origine continue. C'est un demi-succès, et il est nommé comme
 * tel.
 */
export interface LiveInterpreterStage {
    /** Identifiant de la phrase, commun à toutes ses étapes. */
    id: string;
    stage: 'transcribed' | 'translated' | 'voiced' | 'subtitled' | 'failed';
    /** Langue concernée (absente pour la transcription, qui est commune). */
    language?: string;
    /** Durée de CETTE étape, en millisecondes. */
    ms: number;
    /** Millisecondes écoulées depuis la fin de la parole captée. */
    sinceCaptureMs: number;
    /** Nombre de caractères — une mesure de volume, jamais le contenu. */
    chars?: number;
    reason?: string;
}

/**
 * LP-7 — une phrase du direct, telle qu'elle a été RÉELLEMENT dite.
 *
 * C'est la matière première de tout ce qui suit (« me mettre à jour »,
 * compte-rendu, questions intelligentes, extraits) : on la produit UNE fois,
 * au moment où la transcription tombe, et on la fait voyager telle quelle.
 * Rien n'est inventé ici — `language` est la langue DÉTECTÉE, jamais celle
 * qu'on supposait ; elle vaut `null` quand la reconnaissance ne l'a pas
 * rendue, plutôt que de reprendre la langue déclarée du profil.
 */
export interface LiveTranscriptLine {
    /** Identifiant de la phrase, commun à sa version d'origine et à ses traductions. */
    id: string;
    /** Les mots d'origine, tels que prononcés. */
    text: string;
    /** Langue DÉTECTÉE de `text`, `null` si la reconnaissance ne l'a pas donnée. */
    language: string | null;
    /** Traduction de `text`, présente uniquement sur la copie destinée à `targetLanguage`. */
    translated?: string;
    targetLanguage?: string;
}

export interface LiveInterpreterProducerOptions {
    /** Ma piste micro publiée (LiveKit) ; relue tant qu'elle n'existe pas encore. */
    getLocalAudioTrack: () => MediaStreamTrack | null;
    /** Ma langue déclarée — simple indication : la langue DÉTECTÉE prime toujours. */
    myLanguageHint?: string;
    /** Langues demandées dans la room hors moi, relues à chaque phrase (elles changent en direct). */
    getRequestedLanguages: () => Map<string, number>;
    publishTrack: (track: MediaStreamTrack, name: string) => Promise<void>;
    unpublishTrack: (name: string) => Promise<void>;
    /** Vrai quand une voix d'interprète sort de MON haut-parleur : ce que mon micro capte alors n'est pas ma voix. */
    isPaused?: () => boolean;
    onStage?: (stage: LiveInterpreterStage) => void;
    /**
     * LP-7 — la parole du direct, transcrite UNE fois, PUBLIÉE.
     *
     * Appelé deux fois par phrase captée, jamais davantage :
     *  - une fois avec les mots d'origine et leur langue DÉTECTÉE, pour ceux
     *    qui écoutent en « Original » ;
     *  - une fois par langue réellement produite, avec la traduction, dès
     *    qu'elle est connue — c'est-à-dire AVANT que la voix ne sorte.
     *
     * Cet ordre n'est pas un détail : il rend le repli §17 automatique. Quand
     * la synthèse échoue, le texte est DÉJÀ chez l'auditeur — il lit au lieu
     * d'entendre, la voix d'origine continue, et personne ne reste devant un
     * silence inexpliqué. Un chemin qui ne se déclenchait qu'À l'échec (ce
     * qu'était `publishCaption`) laissait au contraire les 87 % de phrases
     * réussies sans le moindre sous-titre.
     */
    publishTranscript?: (line: LiveTranscriptLine) => void;
    /** Le plan a changé (quelqu'un a choisi ou quitté une langue). */
    onPlanChanged?: (plan: ProductionPlan) => void;
    /** La chaîne ne peut pas démarrer du tout (micro absent, navigateur trop ancien). */
    onUnavailable?: (reason: string) => void;
    maxLanguages?: number;
}

/** Étiquette de synthèse pour une langue du catalogue (`fr` → `fr-FR`). */
function speechTag(language: string): string {
    return SPEECH_TAGS[language] ?? language;
}

export class LiveInterpreterProducer {
    static isSupported(): boolean {
        return ServerCaptioner.isSupported() && InterpreterVoiceTrack.isSupported();
    }

    private captioner: ServerCaptioner | null = null;
    /** Une voix — donc une piste publiée — par langue produite. */
    private voices = new Map<string, InterpreterVoiceTrack>();
    private plan: ProductionPlan = { produce: [], unserved: [], alreadySpoken: [] };
    /** Dernière langue DÉTECTÉE dans ma parole ; à défaut, celle que j'ai déclarée. */
    private spokenLanguage: string | undefined;
    private running = false;
    private phraseSeq = 0;
    /** Une phrase captée = un identifiant, partagé par son original et toutes ses traductions. */
    private captionSeq = 0;
    /**
     * File d'attente des alignements de pistes.
     *
     * Les rafraîchissements arrivent en RAFALE dans un direct : plusieurs
     * personnes rejoignent ou changent de langue dans la même seconde. Sans
     * cette file, deux alignements simultanés lisent tous les deux « la piste
     * manque » avant que l'un des deux ne l'ait enregistrée — la même langue
     * est alors publiée DEUX FOIS et un contexte audio reste orphelin
     * (mesuré : `interpreter:en` publiée deux fois sur un simple
     * démarrage + refresh). Sérialiser rend aussi la rafale gratuite : les
     * alignements en attente convergent tous vers le dernier plan connu.
     */
    private syncQueue: Promise<void> = Promise.resolve();
    /**
     * Phrases confiées à une voix et dont on attend encore le SORT réel.
     *
     * On garde le texte traduit et l'heure de capture le temps que la piste
     * dise si le son est sorti. Si la voix échoue, ce texte devient le
     * sous-titre de repli (§17) : l'auditeur lit plutôt que d'entendre un
     * silence. L'entrée est retirée dans tous les cas — succès, repli ou
     * abandon — pour qu'un direct long ne laisse rien s'accumuler.
     */
    private pending = new Map<string, { language: string; text: string; capturedAt: number }>();

    constructor(private readonly options: LiveInterpreterProducerOptions) {
        this.spokenLanguage = listeningLanguageCode(options.myLanguageHint);
    }

    get currentPlan(): ProductionPlan {
        return this.plan;
    }

    /** La langue que je parle réellement, telle que la transcription l'a détectée. */
    get detectedLanguage(): string | undefined {
        return this.spokenLanguage;
    }

    start(): boolean {
        if (this.running) return true;
        if (!LiveInterpreterProducer.isSupported()) {
            this.options.onUnavailable?.('Ce navigateur ne sait pas produire de voix traduite dans le direct.');
            return false;
        }
        this.running = true;
        // UNE seule transcription, quelle que soit la suite : c'est elle qui
        // rend la mutualisation économiquement possible.
        this.captioner = new ServerCaptioner({
            getTrack: this.options.getLocalAudioTrack,
            languageHint: this.options.myLanguageHint,
            // La langue la plus demandée voyage GRATUITEMENT avec la
            // transcription (la passerelle rend texte + traduction en une
            // réponse) ; les autres passent par le service de traduction.
            targetLanguage: () => this.plan.produce[0],
            isPaused: this.options.isPaused,
            onFinal: (caption) => this.onCaption(caption),
            onUnavailable: (reason) => {
                this.running = false;
                this.options.onUnavailable?.(reason);
            },
        });
        const ok = this.captioner.start();
        if (!ok) this.running = false;
        else void this.refresh();
        return ok;
    }

    /**
     * Recalcule le plan (quelqu'un vient de choisir une langue, d'en changer,
     * ou de quitter) et aligne les pistes publiées dessus. Idempotent : à
     * appeler librement à chaque changement de la salle.
     */
    async refresh(): Promise<void> {
        if (!this.running) return;
        const next = languagesToProduce({
            requested: this.options.getRequestedLanguages(),
            spokenLanguage: this.spokenLanguage,
            max: this.options.maxLanguages ?? MAX_BROWSER_PRODUCED_LANGUAGES,
        });
        const changed = next.produce.join(',') !== this.plan.produce.join(',')
            || next.unserved.join(',') !== this.plan.unserved.join(',')
            || next.alreadySpoken.join(',') !== this.plan.alreadySpoken.join(',');
        this.plan = next;
        if (changed) this.options.onPlanChanged?.(next);
        // Les alignements s'exécutent l'un APRÈS l'autre (voir `syncQueue`), et
        // chacun vise le plan le plus récent : une rafale de changements se
        // résout en un seul alignement utile, les suivants sont sans effet.
        this.syncQueue = this.syncQueue.then(() => this.syncVoices(this.plan.produce)).catch(() => { /* échec déjà signalé par étape */ });
        await this.syncQueue;
    }

    /** Fin du direct, ou je quitte la scène : plus une seule voix, plus une seule piste. */
    async stop(): Promise<void> {
        this.running = false;
        this.captioner?.stop();
        this.captioner = null;
        // On passe par la même file : sinon une publication encore en vol
        // pourrait aboutir APRÈS l'arrêt et laisser une piste vivante dans un
        // direct qu'on vient de quitter.
        this.syncQueue = this.syncQueue
            .then(() => Promise.all([...this.voices.keys()].map((language) => this.dropVoice(language))))
            .then(() => { /* rien à rendre */ })
            .catch(() => { /* déjà retirées */ });
        await this.syncQueue;
        this.plan = { produce: [], unserved: [], alreadySpoken: [] };
        // Les phrases dont on attendait encore le sort ne le connaîtront
        // jamais : la piste est partie. Les garder ferait grossir la mémoire
        // d'un direct long sans que rien ne les solde.
        this.pending.clear();
    }

    // ── Pistes : une par langue, créée à l'entrée dans le plan, retirée à sa sortie ──

    /**
     * Les publications se font EN PARALLÈLE, jamais l'une après l'autre :
     * en série, l'auditeur de la troisième langue attendrait que les deux
     * premières pistes soient publiées avant d'entendre quoi que ce soit.
     * Publier une piste déjà publiée est sans effet (le nom est la clé), donc
     * la parallélisation ne crée aucun doublon.
     */
    private async syncVoices(languages: string[]): Promise<void> {
        const toAdd = languages.filter((l) => !this.voices.has(l));
        const toDrop = [...this.voices.keys()].filter((l) => !languages.includes(l));
        await Promise.all([
            ...toAdd.map((l) => this.addVoice(l)),
            ...toDrop.map((l) => this.dropVoice(l)),
        ]);
    }

    private async addVoice(language: string): Promise<void> {
        let voice: InterpreterVoiceTrack | null = null;
        try {
            voice = new InterpreterVoiceTrack({
                lang: speechTag(language),
                // C'est ICI, et nulle part ailleurs, qu'on apprend le sort réel
                // d'une phrase : la piste dit quand le son commence vraiment,
                // et quand la génération a échoué.
                onPhrase: (report) => this.onPhraseOutcome(report),
            });
            const track = voice.start();
            await this.options.publishTrack(track, interpreterTrackNameForLanguage(language));
            this.voices.set(language, voice);
        } catch (err) {
            // Publication refusée (ligne pas encore connectée, navigateur trop
            // ancien) : on nettoie plutôt que de laisser un contexte audio
            // orphelin, et la langue sera retentée au prochain `refresh`.
            voice?.dispose();
            this.options.onStage?.({
                id: 'track', stage: 'failed', language, ms: 0, sinceCaptureMs: 0,
                reason: err instanceof Error ? err.message : 'publication impossible',
            });
        }
    }

    private async dropVoice(language: string): Promise<void> {
        const voice = this.voices.get(language);
        this.voices.delete(language);
        if (!voice) return;
        voice.dispose();
        try { await this.options.unpublishTrack(interpreterTrackNameForLanguage(language)); } catch { /* déjà retirée */ }
    }

    // ── Une phrase captée → autant de voix qu'il y a de langues à servir ──

    private onCaption(caption: { text: string; language: string; translated: string | null; targetLang: string | null }): void {
        const capturedAt = Date.now();
        const detected = listeningLanguageCode(caption.language);
        if (detected && detected !== this.spokenLanguage) {
            // Ma langue réelle a changé (ou vient d'être connue) : le plan
            // change avec elle — on ne traduit jamais vers la langue que je
            // parle, et une langue jusque-là inutile peut redevenir utile.
            this.spokenLanguage = detected;
            void this.refresh();
        }
        this.options.onStage?.({ id: 'stt', stage: 'transcribed', ms: 0, sinceCaptureMs: 0, chars: caption.text.length });

        // LP-7 — la parole part telle qu'elle a été dite, AVANT toute
        // traduction et sans attendre la moindre voix. C'est ce que lisent
        // ceux qui écoutent en « Original », et c'est ce qui sera gardé.
        const captionId = `c${++this.captionSeq}`;
        if (caption.text.trim()) {
            this.options.publishTranscript?.({ id: captionId, text: caption.text, language: detected ?? null });
        }

        // Découpage en phrases courtes : une phrase dite tôt vaut mieux qu'un
        // paragraphe dit tard — c'est ce qui rend la conversation vivante.
        const phrases = splitForInterpretation(caption.text);
        for (const language of this.plan.produce) {
            const voice = this.voices.get(language);
            if (!voice) continue;
            // Cadeau de la transcription : la traduction de la langue la plus
            // demandée est déjà là, sans un appel de plus.
            const free = caption.translated && listeningLanguageCode(caption.targetLang) === language
                ? caption.translated
                : null;
            void this.voiceFor(captionId, language, voice, phrases, free, capturedAt);
        }
    }

    private async voiceFor(
        captionId: string,
        language: string,
        voice: InterpreterVoiceTrack,
        phrases: string[],
        alreadyTranslated: string | null,
        capturedAt: number,
    ): Promise<void> {
        const id = `p${++this.phraseSeq}`;
        const original = phrases.join(' ');
        let text = alreadyTranslated;
        if (!text) {
            const t0 = Date.now();
            try {
                const result = await translationService.translateText({
                    text: original,
                    targetLanguage: language,
                    sourceLanguage: this.spokenLanguage,
                    context: 'live',
                });
                text = result.translatedText;
                this.options.onStage?.({
                    id, stage: 'translated', language, ms: Date.now() - t0,
                    sinceCaptureMs: Date.now() - capturedAt, chars: text.length,
                });
            } catch (err) {
                this.options.onStage?.({
                    id, stage: 'failed', language, ms: Date.now() - t0, sinceCaptureMs: Date.now() - capturedAt,
                    reason: err instanceof Error ? err.message : 'traduction indisponible',
                });
                return; // Rien à dire dans cette langue : l'auditeur garde la voix originale, jamais un silence.
            }
        } else {
            this.options.onStage?.({ id, stage: 'translated', language, ms: 0, sinceCaptureMs: Date.now() - capturedAt, chars: text.length });
        }
        if (!text.trim()) return;
        // LP-7 — la traduction part MAINTENANT, pas quand la voix aura fini.
        // L'auditeur peut donc lire la phrase pendant qu'elle se synthétise,
        // et si la synthèse échoue il l'a déjà : c'est le repli §17, obtenu
        // sans chemin d'échec dédié.
        this.options.publishTranscript?.({
            id: captionId, text: original, language: this.spokenLanguage ?? null,
            translated: text, targetLanguage: language,
        });
        // On NOTE la phrase avant de la confier à la voix : c'est la piste
        // qui dira si du son est réellement sorti.
        this.pending.set(id, { language, text, capturedAt });
        voice.speak(id, text);
    }

    /**
     * Le sort RÉEL d'une phrase, tel que la piste le rapporte.
     *
     * Avant, `voiced` était émis juste après `voice.speak()` — c'est-à-dire
     * après une simple mise en file. La latence mesurée était donc flatteuse
     * et fausse (elle ne comptait pas la synthèse), et une voix en panne
     * passait pour un succès. On attend maintenant que le son commence.
     *
     * Et quand la voix échoue alors que la traduction, elle, a réussi :
     * l'auditeur reçoit le TEXTE (§17). Il lit au lieu d'entendre, la voix
     * d'origine continue, et l'écran ne laisse jamais un silence inexpliqué.
     */
    private onPhraseOutcome(report: { id: string; status: string; reason?: string }): void {
        const entry = this.pending.get(report.id);
        if (!entry) return; // phrase d'une session précédente, ou déjà soldée
        if (report.status === 'started') {
            this.pending.delete(report.id);
            this.options.onStage?.({
                id: report.id, stage: 'voiced', language: entry.language,
                ms: Date.now() - entry.capturedAt, sinceCaptureMs: Date.now() - entry.capturedAt,
                chars: entry.text.length,
            });
            return;
        }
        if (report.status !== 'failed') return; // 'generated' / 'ended' : rien de neuf à dire
        this.pending.delete(report.id);
        // Le texte est-il DÉJÀ parti chez l'auditeur ? Il l'est dès qu'un
        // publieur est branché, puisque la traduction voyage à l'instant où
        // elle est connue (voir `voiceFor`). On ne le renvoie donc pas : ce
        // serait remettre à l'écran une phrase qu'une plus récente a peut-être
        // déjà remplacée. On se contente de nommer le demi-succès pour ce
        // qu'il est — l'auditeur lit au lieu d'entendre.
        if (this.options.publishTranscript) {
            this.options.onStage?.({
                id: report.id, stage: 'subtitled', language: entry.language,
                ms: Date.now() - entry.capturedAt, sinceCaptureMs: Date.now() - entry.capturedAt,
                chars: entry.text.length, reason: report.reason,
            });
            return;
        }
        this.options.onStage?.({
            id: report.id, stage: 'failed', language: entry.language,
            ms: Date.now() - entry.capturedAt, sinceCaptureMs: Date.now() - entry.capturedAt,
            reason: report.reason ?? 'voix indisponible',
        });
    }
}
