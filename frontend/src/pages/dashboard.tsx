import { useState } from "react";
import { useApplications } from '../hooks/useApplications';
import ApplicationCard from '../components/shared/ApplicationCard';
import SkeletonCard from "../components/ui/SkeletonCard";

export default function App() {
  const { applications, loading, error } = useApplications();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-10 space-y-6">
        {[...Array(5)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) return <div>Error</div>;

  const filtered =
    filter === "all"
      ? applications
      : applications.filter(a => a.status === filter);

  const finalApps = filtered.filter(app =>
    app.companyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {finalApps.map(app => (
        <ApplicationCard key={app.id} application={app} />
      ))}
    </div>
  );
}