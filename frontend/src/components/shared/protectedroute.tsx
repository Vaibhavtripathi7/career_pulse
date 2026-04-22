import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/authcontext'; 

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="bg-gray-950 min-h-screen flex items-center justify-center text-white">
                <p className="text-gray-400">Verifying session...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}