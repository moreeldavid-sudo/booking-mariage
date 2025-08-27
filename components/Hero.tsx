// components/Hero.tsx
import React from "react";

export default function Hero() {
  return (
    <section className="relative h-[360px] sm:h-[480px] lg:h-[560px] overflow-hidden rounded-2xl shadow-sm border border-gray-100">
      {/* Image de fond */}
      <img
        src="/tipi.jpg"
        alt="Tipi au crépuscule"
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />

      {/* Voile en dégradé */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Texte */}
      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-bold text-white drop-shadow">
            Réservations Hébergements
          </h1>
          <p className="mt-3 sm:mt-4 text-white/90 text-base sm:text-lg">
            Choisissez votre tipi ou hébergement — et réservez en un clin d’œil.
          </p>

          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-3">
            <a
              href="#lodgings"
              className="btn-primary px-4 py-2 sm:px-5 sm:py-2.5"
            >
              Voir les hébergements
            </a>
            <a
              href="#infos"
              className="inline-flex items-center rounded-lg px-4 py-2 sm:px-5 sm:py-2.5 bg-white/90 hover:bg-white text-gray-900 transition"
            >
              Infos pratiques
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
