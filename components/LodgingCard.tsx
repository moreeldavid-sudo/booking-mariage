import Image from "next/image";

type Lodging = {
  id: string;
  title: string;
  note?: string;
  totalUnits: number;
  reservedUnits: number;
  unitCapacity: number;
  type: string;
};

type LodgingCardProps = {
  lodging: Lodging;
};

export default function LodgingCard({ lodging }: LodgingCardProps) {
  const available = Math.max(lodging.totalUnits - lodging.reservedUnits, 0);

  return (
    <article className="card overflow-hidden">
      {/* Image */}
      <div className="relative w-full h-44">
        <Image
          src="/tipi.jpg"
          alt={lodging.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Contenu */}
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold">{lodging.title}</h3>
        {lodging.note ? (
          <p className="text-sm text-gray-600">{lodging.note}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="badge bg-gray-100 text-gray-700">{lodging.type}</span>
          <span className="badge bg-emerald-100 text-emerald-700">
            {available} / {lodging.totalUnits} dispo
          </span>
          <span className="badge bg-indigo-100 text-indigo-700">
            {lodging.unitCapacity} pers/unité
          </span>
        </div>

        <button className="btn-primary w-full mt-2">
          Voir / Réserver
        </button>
      </div>
    </article>
  );
}
