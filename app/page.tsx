// app/page.tsx
import LodgingList from "@/components/LodgingList";

export default function Page() {
  return (
    <main className="relative">
      {/* FOND : Domaine.jpg + voile blanc */}
      <div className="fixed inset-0 -z-10">
        <div className="hero-bg h-full w-full" />
        <div className="hero-overlay h-full w-full" />
      </div>

      {/* En-tête */}
      <section className="px-4 pt-10 pb-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-[var(--font-playfair)] text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
            Réservation hébergements tente
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-700">
            Les tentes sont installées directement sur le{" "}
            <span className="font-medium text-slate-900">Domaine de Brés</span> (lieu du mariage).
          </p>

          <div className="mt-6 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        </div>
      </section>

      {/* Liste centrée */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <LodgingList />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
