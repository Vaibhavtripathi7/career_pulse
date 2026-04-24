import { useApplications } from '../hooks/useApplications';
import ApplicationCard from '../components/shared/ApplicationCard';
import SkeletonCard from "../components/ui/SkeletonCard";

export default function App() {
  const { applications, loading, error } = useApplications();

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-10 space-y-6">
        {[...Array(5)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) return <div>Error loading applications</div>;

  return (
    <div className="p-6">
      {applications.map(app => (
        <ApplicationCard key={app.id} application={app} />
      ))}
    </div>
  );
}