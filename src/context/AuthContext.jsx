import { createContext, useContext, useState, useEffect } from 'react';
import { bloggers, getBloggerByEmail } from '../data/bloggers';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Check for saved session
        const savedUser = localStorage.getItem('mixit_user');
        const savedAdmin = localStorage.getItem('mixit_admin');

        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        if (savedAdmin) {
            setIsAdmin(true);
        }
        setIsLoading(false);
    }, []);

    const login = async (email, password) => {
        // Mock authentication
        const blogger = getBloggerByEmail(email);

        if (blogger && blogger.password === password) {
            setUser(blogger);
            localStorage.setItem('mixit_user', JSON.stringify(blogger));
            return { success: true };
        }

        return { success: false, error: 'Неверный email или пароль' };
    };

    const adminLogin = async (email, password) => {
        // Mock admin auth
        if (email === 'admin@mixit.ru' && password === 'admin123') {
            setIsAdmin(true);
            localStorage.setItem('mixit_admin', 'true');
            return { success: true };
        }
        return { success: false, error: 'Неверные данные администратора' };
    };

    const register = async (userData) => {
        // Mock registration - in real app would call API
        const newUser = {
            id: Date.now(),
            ...userData,
            level: 'beginner',
            points: 0,
            totalCollaborations: 0,
            successfulCollaborations: 0,
            registeredAt: new Date().toISOString(),
            achievements: [],
            socialAccounts: userData.instagram ? [{
                platform: 'instagram',
                username: userData.instagram.replace('https://instagram.com/', '').replace('@', ''),
                url: userData.instagram,
                followers: Math.floor(Math.random() * 15000) + 1000,
                avgLikes: Math.floor(Math.random() * 500) + 100,
                avgComments: Math.floor(Math.random() * 50) + 10,
                er: (Math.random() * 3 + 2).toFixed(2),
                postsPerWeek: Math.floor(Math.random() * 5) + 1,
                verified: false,
            }] : [],
        };

        setUser(newUser);
        localStorage.setItem('mixit_user', JSON.stringify(newUser));
        return { success: true, user: newUser };
    };

    const logout = () => {
        setUser(null);
        setIsAdmin(false);
        localStorage.removeItem('mixit_user');
        localStorage.removeItem('mixit_admin');
    };

    const updateUser = (updates) => {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('mixit_user', JSON.stringify(updatedUser));
    };

    const telegramLogin = (tgUser) => {
        // Create or restore user from Telegram data
        const storedTgUser = localStorage.getItem(`mixit_tg_${tgUser.telegramId}`);

        if (storedTgUser) {
            const parsedUser = JSON.parse(storedTgUser);
            setUser(parsedUser);
            localStorage.setItem('mixit_user', JSON.stringify(parsedUser));
            return { success: true, user: parsedUser };
        }

        // Create new user from Telegram data
        const newUser = {
            id: tgUser.id,
            telegramId: tgUser.telegramId,
            firstName: tgUser.firstName,
            lastName: tgUser.lastName || '',
            username: tgUser.username || '',
            avatar: tgUser.photoUrl,
            level: 'beginner',
            points: 0,
            totalCollaborations: 0,
            successfulCollaborations: 0,
            registeredAt: new Date().toISOString(),
            achievements: [],
            socialAccounts: [],
        };

        setUser(newUser);
        localStorage.setItem('mixit_user', JSON.stringify(newUser));
        localStorage.setItem(`mixit_tg_${tgUser.telegramId}`, JSON.stringify(newUser));
        return { success: true, user: newUser };
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAdmin,
            isLoading,
            login,
            adminLogin,
            register,
            logout,
            updateUser,
            telegramLogin,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
