import { createContext, useContext, useEffect, useState } from 'react';

const TelegramContext = createContext(null);

export function TelegramProvider({ children }) {
    const [webApp, setWebApp] = useState(null);
    const [user, setUser] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [isTelegram, setIsTelegram] = useState(false);

    useEffect(() => {
        // Check if running inside Telegram
        const tg = window.Telegram?.WebApp;

        if (tg) {
            setWebApp(tg);
            setIsTelegram(true);

            // Initialize the WebApp
            tg.ready();
            tg.expand(); // Expand to full height

            // Get user data from Telegram
            if (tg.initDataUnsafe?.user) {
                const tgUser = tg.initDataUnsafe.user;
                setUser({
                    id: `tg_${tgUser.id}`,
                    telegramId: tgUser.id,
                    firstName: tgUser.first_name,
                    lastName: tgUser.last_name || '',
                    username: tgUser.username || '',
                    photoUrl: tgUser.photo_url,
                    languageCode: tgUser.language_code,
                });
            }

            // Apply Telegram theme
            document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
            document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#FF6B9D');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');

            // Listen for theme changes
            tg.onEvent('themeChanged', () => {
                document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
                document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
            });
        }

        setIsReady(true);
    }, []);

    // Telegram-specific methods
    const showAlert = (message) => {
        if (webApp) {
            webApp.showAlert(message);
        } else {
            alert(message);
        }
    };

    const showConfirm = (message, callback) => {
        if (webApp) {
            webApp.showConfirm(message, callback);
        } else {
            const result = confirm(message);
            callback(result);
        }
    };

    const hapticFeedback = (type = 'impact') => {
        if (webApp?.HapticFeedback) {
            switch (type) {
                case 'impact':
                    webApp.HapticFeedback.impactOccurred('medium');
                    break;
                case 'notification':
                    webApp.HapticFeedback.notificationOccurred('success');
                    break;
                case 'selection':
                    webApp.HapticFeedback.selectionChanged();
                    break;
            }
        }
    };

    const setMainButton = (text, onClick, isVisible = true) => {
        if (webApp?.MainButton) {
            webApp.MainButton.text = text;
            webApp.MainButton.onClick(onClick);
            if (isVisible) {
                webApp.MainButton.show();
            } else {
                webApp.MainButton.hide();
            }
        }
    };

    const hideMainButton = () => {
        if (webApp?.MainButton) {
            webApp.MainButton.hide();
        }
    };

    const setBackButton = (onClick, isVisible = true) => {
        if (webApp?.BackButton) {
            if (isVisible) {
                webApp.BackButton.show();
                webApp.BackButton.onClick(onClick);
            } else {
                webApp.BackButton.hide();
            }
        }
    };

    const close = () => {
        if (webApp) {
            webApp.close();
        }
    };

    return (
        <TelegramContext.Provider value={{
            webApp,
            user,
            isReady,
            isTelegram,
            showAlert,
            showConfirm,
            hapticFeedback,
            setMainButton,
            hideMainButton,
            setBackButton,
            close,
        }}>
            {children}
        </TelegramContext.Provider>
    );
}

export function useTelegram() {
    const context = useContext(TelegramContext);
    if (!context) {
        throw new Error('useTelegram must be used within TelegramProvider');
    }
    return context;
}
