export default function StatusBadge({ status }: { status: string }) {
    
    const colorMap: Record<string, string> = {
        "Applied": "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        "Interviewing": "bg-purple-500/10 text-purple-400 border border-purple-500/20",
        "Offer": "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        "Rejected": "bg-red-500/10 text-red-400 border border-red-500/20",
    };

    const badgeColor = colorMap[status] || "bg-gray-500/10 text-gray-400 border border-gray-500/20";

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide ${badgeColor}`}>
            {status}
        </span>
    );
}