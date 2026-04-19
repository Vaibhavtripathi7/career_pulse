import StatusBadge from './components/ui/StatusBadge';

export default function App() {
  return (
    <div className="p-10 flex flex-col gap-4 items-start bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">UI Component Test</h1>
      
      {/* Testing our new dictionary logic! */}
      <StatusBadge status="Applied" />
      <StatusBadge status="Interviewing" />
      <StatusBadge status="Offer" />
      <StatusBadge status="Rejected" />
      <StatusBadge status="Ghosted" /> {/* Testing the fallback! */}
    </div>
  )
}