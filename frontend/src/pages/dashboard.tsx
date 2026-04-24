import { useState, useEffect, useMemo } from "react";
import { useApplications } from '../hooks/useApplications';
import ApplicationCard from '../components/shared/ApplicationCard';
import StatusPieChart from '../components/dashboard/StatusPieChart';
import ActivityChart from '../components/dashboard/ActivityChart';
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

  const stats = useMemo(() => ({
    total: applications.length,
    applied: applications.filter(a => a.status?.toLowerCase() === "applied").length,
    interviewing: applications.filter(a => a.status?.toLowerCase() === "interviewing").length,
    offer: applications.filter(a => a.status?.toLowerCase() === "offer").length,
    rejected: applications.filter(a => a.status?.toLowerCase() === "rejected").length,
  }), [applications]);

  const finalApps = useMemo(() => {
    const base =
      filter === "all"
        ? applications
        : applications.filter(a => a.status?.toLowerCase() === filter);

    return base.filter(app =>
      app.companyName.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [applications, filter, debouncedSearch]);

  const activityData = useMemo(() => {
    const map: Record<string, number> = {};
    applications.forEach(app => {
      const date = new Date(app.createdAt).toLocaleDateString();
      map[date] = (map[date] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [applications]);

  const pieData = [
    { name: "Applied", value: stats.applied },
    { name: "Interviewing", value: stats.interviewing },
    { name: "Offer", value: stats.offer },
    { name: "Rejected", value: stats.rejected },
  ];

  if (loading) return <SkeletonCard />;
  if (error) return <div>Error</div>;

  return (
    <div className="p-6 space-y-6">
      <StatusPieChart data={pieData} />
      <ActivityChart data={activityData} />

      {finalApps.map(app => (
        <ApplicationCard key={app.id} application={app} />
      ))}
    </div>
  );
}