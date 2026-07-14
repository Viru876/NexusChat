interface LoaderProps {
  label?: string;
  size?: number;
}

export default function Loader({ label, size = 36 }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className="animate-spin rounded-full border-2 border-transparent"
        style={{
          width: size,
          height: size,
          borderTopColor: '#6366f1',
          borderRightColor: '#8b5cf6',
        }}
      />
      {label && <p className="text-sm text-text-secondary">{label}</p>}
    </div>
  );
}
