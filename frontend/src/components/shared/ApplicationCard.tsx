import type { Application } from '../../types';
import StatusBadge from '../ui/StatusBadge';

export default function ApplicationCard({ application }: { application: Application }) {
    return (
        // Premium Dark Card: Deep gray background, subtle border, and a hover lift effect
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 flex flex-col items-start gap-4 transition-all duration-200 hover:-translate-y-1 hover:border-gray-700 hover:shadow-lg hover:shadow-black/50">
            
            <div className="w-full flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-gray-100 tracking-tight">
                        {application.companyName}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1 font-medium">
                        {application.role} <span className="mx-2 text-gray-700">•</span> {application.workModel}
                    </p>
                </div>
                
                {/* Moved the badge to the top right corner for a cleaner layout */}
                <StatusBadge status={application.status} />
            </div>

            <div className="w-full flex justify-between items-center mt-2 pt-4 border-t border-gray-800/50">
                <span className="text-xs text-gray-500 font-medium">
                    Applied: {new Date(application.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}
                </span>
                <button className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">
                    View Details →
                </button>
            </div>
            
        </div>
    );
}