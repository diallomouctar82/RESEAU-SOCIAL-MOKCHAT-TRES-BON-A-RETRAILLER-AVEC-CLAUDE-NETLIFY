import React from 'react';
import { createRoot } from 'react-dom/client';
import { ArchitecteFloatingBar } from '../../components/architecte/ArchitecteFloatingBar';
import type { UserProfile } from '../../types';

/**
 * BANC DE PREUVE — la sculpture vivante de l'Architecte dans une page qui
 * ressemble à l'application (fond, texte), sans compte ni réseau : le
 * profil est celui d'un banc, les capacités qui touchent la base ne sont
 * pas enregistrées (identifiant vide). Ce qui est montré est le composant
 * réel, à sa vraie place, à sa vraie taille.
 */
const profil = {
    id: '',
    name: 'Banc de preuve',
    privacySettings: { architecte: { displayName: 'Mamadou' } },
} as unknown as UserProfile;

function Banc() {
    return (
        <>
            <div className="fond">
                <h1>MokNet — page d'application (banc)</h1>
                <p>
                    Par défaut, seul l'avatar flottant est visible, en bas à droite, détouré, sans cadre ni page autour.
                    Au clic, il s'anime, parle (modèle validé par la Direction) et ouvre sa barre de communication.
                </p>
                <div className="carte">
                    <p>Contenu de l'application — la sculpture ne le masque pas.</p>
                </div>
            </div>
            <ArchitecteFloatingBar userProfile={profil} onNavigate={() => {}} onUpdateProfile={async () => true} openSignal={0} />
        </>
    );
}

createRoot(document.getElementById('root')!).render(<Banc />);
