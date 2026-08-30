import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

// Filet de sécurité unique, au sommet de l'arbre : sans lui, une exception non
// interceptée sur un chemin mobile-only (ou tout autre) démonte tout l'arbre
// React (comportement par défaut de createRoot) — un écran blanc silencieux,
// indiscernable d'un bug de navigation. Portée volontairement minimale : pas
// de tentative de récupération partielle, juste un repli visible et un moyen
// de recharger.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    // Le projet n'a pas de @types/react installé (aucune dépendance de dev
    // ne le fournit) : React.Component<P, S> n'expose donc pas ses membres
    // `state`/`props` génériques au vérificateur de types. Ces déclarations
    // n'ont aucun effet à l'exécution (`declare`) — elles donnent seulement
    // à TypeScript le type de ce que le composant fixe déjà réellement via
    // `super(props)` et `this.state = ...` ci-dessous.
    declare state: ErrorBoundaryState;
    declare props: Readonly<ErrorBoundaryProps>;

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('Erreur non interceptée — application arrêtée par le filet de sécurité :', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-6">
                    <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-6 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900">Une erreur est survenue</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Rien n'est perdu — un rechargement suffit généralement à repartir normalement.
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
                        >
                            <RefreshCw size={16} />
                            Recharger la page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
