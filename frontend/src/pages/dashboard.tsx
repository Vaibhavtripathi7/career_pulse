import { useState, useEffect, useMemo } from "react";
import { useApplications } from '../hooks/useApplications';
import ApplicationCard from '../components/shared/ApplicationCard';
import SkeletonCard from "../components/ui/SkeletonCard";

export default function App() {
  const { applications, loading, error } = useApplications();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const finalApps = useMemo(() => {
    const base =
      filter === "all"
        ? applications
        : applications.filter(a => a.status?.toLowerCase() === filter);

    return base.filter(app =>
      app.companyName.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [applications, filter, debouncedSearch]);

  if (loading) return <SkeletonCard />;
  if (error) return <div>Error</div>;

  return (
    <div className="p-6 space-y-4">
      <input value={search} onChange={(e) => setSearch(e.target.value)} />

      {finalApps.map(app => (
        <ApplicationCard key={app.id} application={app} />
      ))}
    </div>
  );
}