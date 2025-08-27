import Image from "next/image";
import LodgingList from "../components/LodgingList";

export default function Page() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative h-72 md:h-96">
          <Image
            src="/tipi.jpg"
            alt="Hébergements"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-white text-3xl md:text-5xl font-bold drop-shadow">
              Réservations Hébergements
            </h1>
          </div>
        </div>
      </section>

      {/* Liste */}
      <section className="container mx-auto p-6">
        <LodgingList />
      </section>
    </main>
  );
}
