import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useApplications } from "../hooks/useApplications";
import ApplicationCard from "../components/shared/ApplicationCard";
import StatusPieChart from "../components/dashboard/StatusPieChart";
import ActivityChart from "../components/dashboard/ActivityChart";
import StatCard from "../components/dashboard/StatCard";
import SkeletonCard from "../components/ui/SkeletonCard";
import AddApplicationModal from "../components/modals/AddApplicationModal";
import api from "../services/api";
import toast, { Toaster } from "react-hot-toast";

export default function Dashboard() {
  const {
    applications,
    loading,
    error,
    refetch,
    addApplication,
  } = useApplications();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [filter, setFilter] = useState("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      applied: applications.filter(a => a.status?.toLowerCase() === "applied").length,
      interviewing: applications.filter(a => a.status?.toLowerCase() === "interviewing").length,
      offer: applications.filter(a => a.status?.toLowerCase() === "offer").length,
      rejected: applications.filter(a => a.status?.toLowerCase() === "rejected").length,
    };
  }, [applications]);

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
      const date = new Date(app.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      map[date] = (map[date] || 0) + 1;
    });

    return Object.entries(map).map(([date, count]) => ({
      date,
      count,
    }));
  }, [applications]);

  const pieData = useMemo(() => [
    { name: "Applied", value: stats.applied },
    { name: "Interviewing", value: stats.interviewing },
    { name: "Offer", value: stats.offer },
    { name: "Rejected", value: stats.rejected },
  ], [stats]);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await api.post("/sync");
      await refetch();
      toast.success("Emails synced!");
    } catch {
      toast.error("Sync failed!");
    } finally {
      setIsSyncing(false);
    }
  }, [refetch]);

  const handleAdd = useCallback(async (data: any) => {
    try {
      await addApplication(data);
      toast.success("Application added!");
      setIsModalOpen(false);
    } catch {
      toast.error("Failed to add application");
    }
  }, [addApplication]);

  useEffect(() => {
    const run = async () => {
      const { animate, stagger } = await import("animejs");

      if (!listRef.current) return;

      animate(listRef.current.querySelectorAll(".app-card"), {
        opacity: [0, 1],
        translateY: [12, 0],
        delay: stagger(40),
        duration: 300,
        easing: "ease-out",
      });
    };

    run();
  }, [filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-10 space-y-6">
        {[...Array(5)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-white p-6">Something went wrong</div>;
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden p-6">
      <Toaster position="top-right" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Career<span className="text-blue-500">Pulse</span>
        </h1>

        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-white/10 rounded-lg"
          >
            + Add
          </button>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-blue-600 rounded-lg"
          >
            {isSyncing ? "Syncing..." : "Sync"}
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/10 w-full"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 bg-white/10 rounded-lg"
        >
          <option value="all">All</option>
          <option value="applied">Applied</option>
          <option value="interviewing">Interviewing</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatusPieChart data={pieData} />
            <ActivityChart data={activityData} />
          </div>

          <div ref={listRef} className="space-y-4">
            {finalApps.length > 0 ? (
              finalApps.map(app => (
                <ApplicationCard key={app.id} application={app} />
              ))
            ) : (
              <div className="text-center py-16 space-y-3">
                <div className="text-4xl">📭</div>
                <h3 className="text-lg text-gray-300">No applications yet</h3>
              </div>
            )}
          </div>

        </div>

        <div className="space-y-4">
          <StatCard label="Total" value={stats.total} color="text-white" />
          <StatCard label="Applied" value={stats.applied} color="text-blue-400" />
          <StatCard label="Interviewing" value={stats.interviewing} color="text-purple-400" />
          <StatCard label="Offers" value={stats.offer} color="text-green-400" />
          <StatCard label="Rejected" value={stats.rejected} color="text-red-400" />
        </div>

      </div>

      {isModalOpen && (
        <AddApplicationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAdd}
/>
      )}
    </div>
  );
}