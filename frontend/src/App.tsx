import ApplicationCard from './components/shared/ApplicationCard';
import type { Application } from './types';

export default function App() {
  const dummyApp: Application = {
    id: "123",
    companyName: "Google",
    role: "Frontend Engineer",
    status: "Interviewing",
    workModel: "Hybrid",
    createdAt: new Date().toISOString()
  };

  return (
    <div className="bg-gray-950 min-h-screen p-10 flex flex-col items-center pt-20 font-sans text-white">
      
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-gray-100 tracking-tight">
          Career<span className="text-blue-500">Pulse</span>
        </h1>
        
        <div className="grid gap-4">
            <ApplicationCard application={dummyApp} />
        </div>
      </div>

    </div>
  );
}