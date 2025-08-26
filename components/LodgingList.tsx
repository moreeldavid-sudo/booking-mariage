"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import LodgingCard from "./LodgingCard";

interface Lodging {
  id: string;
  title: string;
  note?: string;
  totalUnits: number;
  reservedUnits: number;
  unitCapacity: number;
}

export default function LodgingList() {
  const [lodgings, setLodgings] = useState<Lodging[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "lodgings"), (snap) => {
      const data: Lodging[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...(d.data() as any) }));
      setLodgings(data);
    });
    return () => unsub();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {lodgings.map((lodging) => (
        <LodgingCard key={lodging.id} {...lodging} />
      ))}
    </div>
  );
}
