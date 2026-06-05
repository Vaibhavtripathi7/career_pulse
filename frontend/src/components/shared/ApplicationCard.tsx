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
        <div className="card group relative p-[1px] rounded-3xl bg-gradient-to-br from-zinc-700/20 via-zinc-900/10 to-transparent transition-all duration-300 hover:border-[#00FF85]/20 hover:scale-[1.01]">
        <div className="
            absolute
            top-0
            left-8
            right-8
            h-px
            bg-gradient-to-r
            from-transparent
            via-[#00FF85]
            to-transparent
            opacity-0
            group-hover:opacity-100
            transition-all
            duration-300
          " />
        <div className="
                backdrop-blur-xl 
                bg-zinc-950/90 
                border border-white/[0.05]
                group-hover:border-[#00FF85]/40
                rounded-2xl p-5 min-h-[250px] flex flex-col justify-between
                gap-3
                transition-all duration-500
                group-hover:shadow-[0_0_25px_rgba(0,255,133,0.10)]
                group-hover:-translate-y-1
                ">  

            <div className="flex justify-between items-start">

            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-[#00FF85]/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,133,0.12)]">
              <span className="text-[#00FF85] font-bold">
            {application.companyName.charAt(0)}
          </span>
          </div>
         
        <StatusBadge status={application.status} />
        </div>
        <div className="min-w-0 mt-1">
          <h2 className="text-xl font-semibold text-white tracking-tight truncate">
            {application.companyName}
          </h2>

          <p className="text-sm text-zinc-400 mt-1 truncate">
            {application.role}
            <span className="mx-2 text-zinc-600">•</span>
            {application.workModel}
          </p>
        </div>


        <div className="mt-auto border-t border-white/[0.1]" />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-zinc-500">
            Applied on {" "}
            {new Date (
              (application as any).dateApplied || (application as any).createdAt || new Date().toISOString()
            ).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>

          <button disabled= {isUpdating} className="  px-4 py-2.5 rounded-xl
                border border-zinc-800 bg-zinc-900 
                hover:border-[#00FF85]/50
                hover:text-[#00FF85]
                transition-all duration-200 text-sm font-medium"  onClick={handleupdate}>
                    { isUpdating ? "Updating..." : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}