import ApplicationCard from '../components/shared/ApplicationCard';
import type { Application } from '../types';
import { useState, useEffect } from 'react';
import { getApplication } from '../services/api';
import api from '../services/api';


export default function App() {

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isyncing, setIsSyncing] = useState<boolean>(false);

  async function handleSync() {
      setIsSyncing(true);
      try {
          const response = await api.post('/sync');
          
          if (response.data.success) {
              const newData = await getApplication();
              setApplications(newData);
          }
      } catch (error) {
          console.error("Failed to sync emails:", error);
      } finally {
          setIsSyncing(false);
      }
  }

  useEffect(()=>{

    async function fetchApplications() {
      try {
        const data = await getApplication();
        setApplications(data);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  },[]);

  if (loading) {
    return (
      <div className="bg-gray-950 min-h-screen p-10 flex flex-col items-center pt-20 font-sans text-white">
        <h1 className="text-3xl font-bold mb-8 text-gray-100 tracking-tight">
          Career<span className="text-blue-500">Pulse</span>
        </h1>
        <p className="text-gray-400">Loading applications..</p>
      </div>
    );
  }
  return (
    <div className="bg-gray-950 min-h-screen p-10 flex flex-col items-center pt-20 font-sans text-white">
      
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-8">
    <h1 className="text-3xl font-bold text-gray-100 tracking-tight">
        Career<span className="text-blue-500">Pulse</span>
    </h1>
    
    <button 
        onClick={handleSync}
        disabled={isyncing}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center gap-2"
    >
        {isyncing ? "Syncing Gmail..." : "Sync Latest Emails"}
    </button>
    </div>
        
        <div className="grid gap-4">
          {applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
          {applications.length === 0 && (
            <p className="text-gray-400 text-center mt-10">No applications found. Start applying to see them here</p>
          ) }

        </div>
      </div>

    </div>
  );
}