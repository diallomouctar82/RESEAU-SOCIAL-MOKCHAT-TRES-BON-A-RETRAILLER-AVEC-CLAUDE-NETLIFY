import React from 'react';
import { createRoot } from 'react-dom/client';
import { ArchitecteAvatar } from '../../components/architecte/ArchitecteAvatar';
import {
    ARCHITECTE_STATE_LABEL,
    DEFAULT_ARCHITECTE_AVATAR,
    type ArchitectePresenceState,
} from '../../services/architecte/architecteAvatar';

/** Banc de rendu : monte le VRAI composant, pas une copie. Hors application. */
const ETATS: ArchitectePresenceState[] = [
    'rest', 'listening', 'thinking', 'speaking', 'success', 'error', 'fallback', 'offline',
];
const BOUCHES = [0, 0.25, 0.55, 0.85, 1];

const Banc = () => (
    <>
        <h1>Avatar vivant de l’Architecte — banc de rendu</h1>
        <p className="sub">
            Composant réel <code>ArchitecteAvatar</code>, visage par défaut <code>ArchitecteAvatarFace</code>.
            Halo, teintes et bouche produits par le code livré.
        </p>

        <h2>1 · Les 8 états de présence (taille du bouton flottant : 56 px)</h2>
        <div className="row">
            {ETATS.map((presence) => (
                <div className="cell" key={presence}>
                    <ArchitecteAvatar
                        config={DEFAULT_ARCHITECTE_AVATAR}
                        presence={presence}
                        ttsEngine={null}
                        outputLevel={0}
                        size={56}
                        actionLabel="Ouvrir"
                    />
                    <span className="cap"><b>{presence}</b>{ARCHITECTE_STATE_LABEL[presence]}</span>
                </div>
            ))}
        </div>

        <h2>2 · Synchro labiale — la bouche suit l’amplitude de la voix</h2>
        <div className="row">
            {BOUCHES.map((niveau) => (
                <div className="cell" key={niveau}>
                    <ArchitecteAvatar
                        config={DEFAULT_ARCHITECTE_AVATAR}
                        presence="speaking"
                        ttsEngine="elevenlabs"
                        outputLevel={niveau}
                        size={96}
                        actionLabel="Aperçu"
                    />
                    <span className="cap"><b>{Math.round(niveau * 100)} %</b>amplitude mesurée</span>
                </div>
            ))}
        </div>

        <h2>3 · Grande taille — le visage en détail</h2>
        <div className="row">
            <ArchitecteAvatar
                config={DEFAULT_ARCHITECTE_AVATAR}
                presence="rest" ttsEngine={null} outputLevel={0} size={200} actionLabel="Aperçu"
            />
            <ArchitecteAvatar
                config={DEFAULT_ARCHITECTE_AVATAR}
                presence="speaking" ttsEngine="elevenlabs" outputLevel={0.7} size={200} actionLabel="Aperçu"
            />
            <ArchitecteAvatar
                config={DEFAULT_ARCHITECTE_AVATAR}
                presence="listening" ttsEngine={null} outputLevel={0} size={200} actionLabel="Aperçu"
            />
        </div>
    </>
);

createRoot(document.getElementById('root')!).render(<Banc />);
