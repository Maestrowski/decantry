import React, { createContext, useContext, useRef, useEffect } from 'react';

const SoundContext = createContext();

export const useSound = () => {
    return useContext(SoundContext);
};

export const SoundProvider = ({ children }) => {
    const clickAudio = useRef(new Audio('/sounds/click.mp3'));
    const correctAudio = useRef(new Audio('/sounds/correct.mp3'));
    const wrongAudio = useRef(new Audio('/sounds/wrong.mp3'));
    const endGameAudio = useRef(new Audio('/sounds/endgame.mp3'));

    useEffect(() => {
        // Preload sounds
        clickAudio.current.load();
        correctAudio.current.load();
        wrongAudio.current.load();
        endGameAudio.current.load();
    }, []);

    const playClick = () => {
        clickAudio.current.currentTime = 0;
        clickAudio.current.play().catch(e => console.error("Error playing click sound:", e));
    };

    const playCorrect = () => {
        correctAudio.current.currentTime = 0;
        correctAudio.current.play().catch(e => console.error("Error playing correct sound:", e));
    };

    const playWrong = () => {
        wrongAudio.current.currentTime = 0;
        wrongAudio.current.play().catch(e => console.error("Error playing wrong sound:", e));
    };

    const playEndGame = () => {
        endGameAudio.current.currentTime = 0;
        endGameAudio.current.play().catch(e => console.error("Error playing endgame sound:", e));
    };

    const value = {
        playClick,
        playCorrect,
        playWrong,
        playEndGame
    };

    return (
        <SoundContext.Provider value={value}>
            {children}
        </SoundContext.Provider>
    );
};
