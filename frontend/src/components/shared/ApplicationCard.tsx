import { updateApplicationStatus } from "../../services/api";
import type { Application } from "../../types";
import StatusBadge from "../ui/StatusBadge";
import { useState } from "react";

export default function ApplicationCard({
  application : initialApplication,
}: {
  application: Application;
}) {

  const [application, setApplication] = useState<Application>(initialApplication);
  const [isUpdating, setIsupdating] = useState(false);

  const handleupdate = async () => {

    const newStatus = window.prompt(" Enter new status:", application.status);
  
    if (!newStatus || newStatus === application.status) return ;
    try {
      setIsupdating(true);
      await updateApplicationStatus(application.id, newStatus);

      setApplication(prev => ({...prev, status: newStatus}));

    } catch (error) {
      console.error("failed to update status", error);
      alert("failed to update status, pls try again!")
    } finally {
       setIsupdating(false);
    }
  }
  return (
    <div className="card group relative p-[1px] rounded-2xl bg-gradient-to-b from-gray-700/40 to-transparent transition-all duration-300 hover:from-blue-500/30 hover:scale-[1.01]">
      
    <div className="
            backdrop-blur-xl 
            bg-white/[0.04] 
            border border-white/[0.08]
            rounded-2xl p-6 flex flex-col gap-5
            transition-all duration-500
            group-hover:shadow-[0_20px_60px_rgba(59,130,246,0.15)]
            group-hover:-translate-y-1
            ">        
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white tracking-tight truncate">
              {application.companyName}
            </h2>

            <p className="text-sm text-gray-400 mt-1 truncate">
              {application.role}
              <span className="mx-2 text-gray-600">•</span>
              {application.workModel}
            </p>
          </div>

          <StatusBadge status={application.status} />
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Applied on {" "}
            {new Date (
              (application as any).dateApplied || (application as any).createdAt || new Date().toISOString()
            ).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>

          <button disabled= {isUpdating} className="  px-4 py-2 rounded-lg 
                bg-white/[0.06] 
                border border-white/[0.08]
                hover:bg-white/[0.12]
                active:scale-95
                transition-all duration-200" onClick={handleupdate}>
                    { isUpdating ? "Updating..." : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}