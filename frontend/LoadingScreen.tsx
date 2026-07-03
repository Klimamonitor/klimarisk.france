import React from 'react';
import useLanguageStore from './src/hooks/useLanguageStore'; // 🎯 AJOUTÉ : Ajuste le chemin selon ton architecture si besoin

const animationStyles = `
@keyframes loading {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0); }
  100% { transform: translateX(100%); }
}
`;

interface LoadingScreenProps {
    message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
    // 🎯 AJOUTÉ : Utilisation de la fonction de traduction de ton store
    const l = useLanguageStore((state) => state.l);

    // Définition des textes traduits par défaut
    const defaultTitle = l({ fr: "Chargement de la carte...", en: "Loading Map..." });
    const defaultMessage = l({
        fr: "Calcul du risque climatique pour les 34 000 communes françaises...",
        en: "Calculating climate risk for the 34,000 French municipalities..."
    });

    return (
        <div style={styles.container}>
            <style>{animationStyles}</style>

            <div style={styles.card}>
                {/* 🎯 TRADUIT : Titre réactif */}
                <h2 style={styles.title}>{defaultTitle}</h2>
                {/* 🎯 TRADUIT : Utilise la prop message reçue (déjà traduite par le parent) ou le message par défaut */}
                <p style={styles.subtitle}>{message || defaultMessage}</p>
                <div style={styles.progressContainer}>
                    <div style={styles.progressBar} />
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        backgroundColor: '#ffffff',
        fontFamily: 'sans-serif',
        zIndex: 9999,
    },
    card: {
        textAlign: 'center' as const,
        color: '#ffffff',
    },
    title: {
        fontSize: '1.5rem',
        marginBottom: '0.5rem',
        color: '#040404',
        fontWeight: 600,
    },
    subtitle: {
        fontSize: '0.9rem',
        color: '#040404',
        marginBottom: '1.5rem',
    },
    progressContainer: {
        width: '300px',
        height: '6px',
        backgroundColor: '#ffedd5',
        borderRadius: '3px',
        overflow: 'hidden',
        margin: '0 auto',
    },
    progressBar: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f97316',
        borderRadius: '3px',
        animation: 'loading 2s infinite ease-in-out',
    },
};

export default LoadingScreen;