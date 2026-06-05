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
      const rawDate = (app as any).dateApplied || app.createdAt || new Date().toISOString();
      const date = new Date(rawDate).toLocaleDateString("en-US", {
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
    <div className="noise relative min-h-screen overflow-hidden text-white">
      <Toaster position="top-right" />
    <div className="max-w-[1500px] mx-auto px-6 py-6">
      <div className="mb-8">

        <div className="flex items-center justify-between mb-4">

          <h1 className="text-3xl font-bold tracking-tight">
            Career<span className="bg-gradient-to-r from-[#00FF85] to-[#6fffe9] bg-clip-text text-transparent">Pulse</span>
          </h1>

        </div>



        <div className="flex flex-col lg:flex-row gap-3">

          {/* Search */}

          <div className="flex-1">

            <input
              placeholder="Search applications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full
                px-4
                py-3
                rounded-xl
                bg-white/[0.04]
                border
                border-white/[0.06]
                outline-none
                hover:border-[#00FF85]/30
                focus:shadow-[0_0_12px_rgba(0,255,133,0.08)]
                transition-all
              "
            />

              </div>

          {/* Controls */}

              <div className="flex gap-3">

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="
                    px-5
                    py-3
                    rounded-xl
                    glass
                    font-semibold
                    hover:border-[#00FF85]/30
                    transition-all
                  "
                >
                  + Add
                </button>

                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="
                    px-5
                    py-3
                    rounded-xl
                    bg-[#00FF85]
                    hover:shadow-[0_0_20px_rgba(0,255,133,0.25)]
                    text-black
                    font-semibold
                    hover:bg-blue-500
                    transition-all duration-300
                    "
                >
                  {isSyncing ? "Syncing..." : "Sync"}
                </button>

              </div>

          </div>
        </div>
      
        <section className="mb-10">
            <div className="mb-4">
          <h2
            className="
              text-xl
              font-semibold
              text-slate-200
              gap-6
            "
          >
            Overview
          </h2>
          <p className="text-sm text-zinc-500"> Track applications, interviews and offers</p>
            </div>
          
            <div
              className="
                rounded-3xl
                border border-white/[0.06]
                bg-zinc-950/70
                backdrop-blur-xl
                p-6
                shadow-[0_0_40px_rgba(0,0,0,0.35)]
              "
            >

              <div
                className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4"
              >

                <StatCard
                  label="Total"
                  value={stats.total}
                  color="text-white"
                />

                <StatCard
                  label="Applied"
                  value={stats.applied}
                  color="text-blue-400"
                />

                <StatCard
                  label="Interviewing"
                  value={stats.interviewing}
                  color="text-purple-400"
                />

                <StatCard
                  label="Offers"
                  value={stats.offer}
                  color="text-amber-400"
                />

                <StatCard
                  label="Rejected"
                  value={stats.rejected}
                  color="text-rose-400"
                />

              </div>

              {/* PIE */}
              <div className="border-t border-white/[0.2] my-8" />

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
                <StatusPieChart data={pieData} />
              
                <ActivityChart data={activityData} />

              </div>

              {/* ACTIVITY */}

            </div>


        </section>


            <section>

          <div
            className="
              flex
              items-center
              justify-between
              mb-4
            "
          >

            <h2
              className="
                text-xl
                font-semibold
                text-slate-200
              "
            >
              Recent Applications
            </h2>

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="
                    px-2
                    py-2
                    rounded-xl
                    bg-zinc-950
                    border
                    border-white/[0.06]
                    hover:border-[#00FF85]/30
                    cursor-pointer
                  "
                >
                  <option value="all">All</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
            </div>


            <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
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
            </section>

              {isModalOpen && (
                <AddApplicationModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  onAdd={handleAdd}
        />
              )}
            </div>
    </div>
  );
}