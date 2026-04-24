export default function SkeletonCard() {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 animate-pulse space-y-4">
      
      <div className="h-4 bg-gray-800 rounded w-1/3"></div>

      <div className="h-3 bg-gray-800 rounded w-1/2"></div>

      <div className="h-3 bg-gray-800 rounded w-1/4"></div>

    </div>
  );
}