import React, { createContext, useContext, useState, useEffect} from "react";
import { getUseProfile } from "../services/api";

interface User {

    id: string;
    name: string;
    email: string;
}

interface authcontextype { 

    user: User | null ;
    isLoading : boolean;

}

const authcontext = createContext<authcontextype | undefined>(undefined);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true); 

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const profile = await getUseProfile();
                if (profile) {
                    setUser(profile); 
                } else {
                    setUser(null); 
                }
            } catch (error) {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    return (
        <authcontext.Provider value={{ user, isLoading }}>
            {children}
        </authcontext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(authcontext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};