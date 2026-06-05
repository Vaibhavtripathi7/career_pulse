interface Props {
  label: string;
  value: number;
  color: string;
}

export default function StatCard({
  label,
  value,
  color,
}: Props) {
  return (
    <div
      className="
        glass
        glow-hover
        rounded-2xl
        p-5
        transition-all
        duration-300
        group
        min-h-[120px]
        flex
        flex-col
        justify-between
        text-center
      "
    >
      <div
        className={`
          text-3xl
          md:text-4xl
          font-bold
          tracking-tight
          ${color}
        `}
      >
        {value}
      </div>

      <div>
        <p
          className="
            text-[11px]
            uppercase
            tracking-[0.18em]
            text-slate-400
            font-medium
          "
        >
          {label}
        </p>
      </div>
    </div>
  );
}