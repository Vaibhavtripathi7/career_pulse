import { useApplications } from '../hooks/useApplications';
import ApplicationCard from '../components/shared/ApplicationCard';

export default function App() {
  const { applications, loading, error } = useApplications();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading applications</div>;

  return (
    <div className="p-6">
      {applications.map(app => (
        <ApplicationCard key={app.id} application={app} />
      ))}
    </div>
  );
}