interface Props {
  label: string;
  value: number;
  color: string;
}

export default function StatCard({ label, value, color }: Props) {
  return (
    <div className="p-[1px] rounded-xl bg-gradient-to-b from-gray-700/40 to-transparent">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-xl p-4 flex flex-col gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-black/40">
        
        <span className="text-xs text-gray-400 font-medium">
          {label}
        </span>

        <span className={`text-2xl font-semibold tracking-tight ${color}`}>
          {value}
        </span>

      </div>
    </div>
  );
}