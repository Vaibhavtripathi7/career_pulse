const status: Array<string> = ["Applied", "Interviewing", "Offer", "Rejected"]
console.log(status)

export default function StatusBadge({status}: {status: string}){

    const colorMap: Record<string, string> = {
        "Applied": "bg-blue-100 text-blue-800",
        "Interviewing": "bg-purple-100 text-purple-800",
        "Offer": "bg-green-100 text-green-800",
        "Rejected": "bg-red-100 text-red-800",
    }
    const badgeColor = colorMap[status] || "bg-gray-100 text-gray-800";
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${badgeColor}`}>
            {status}
        </span>
    )
}