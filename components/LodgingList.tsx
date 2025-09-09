import LodgingCardMin from "./LodgingCard.min";

export default function LodgingList({ lodgings }: { lodgings: any[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {lodgings.map((l) => (
        <LodgingCard key={l.id} {...l} />
      ))}
    </div>
  );
}
