export default function Login() {
    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:3000/api/auth/google';
    };

    return (
        <div className="bg-gray-950 min-h-screen flex flex-col items-center justify-center font-sans text-white">
            <h1 className="text-5xl font-bold mb-4 tracking-tight">
                Career<span className="text-blue-500">Pulse</span>
            </h1>
            <p className="text-gray-400 mb-8">Track your applications automatically</p>
            
            <button 
                onClick={handleGoogleLogin}
                className="px-6 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-3"
            >
                Continue with Google
            </button>
        </div>
    );
}