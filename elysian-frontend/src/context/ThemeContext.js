import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const darkModePreference = localStorage.getItem("dark-mode");
        if (darkModePreference === "enabled") {
            setIsDarkMode(true);
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, []);

    const enableDarkMode = () => {
        setIsDarkMode(true);
        localStorage.setItem("dark-mode", "enabled");
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    };

    const enableLightMode = () => {
        setIsDarkMode(false);
        localStorage.setItem("dark-mode", "disabled");
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, enableDarkMode, enableLightMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
