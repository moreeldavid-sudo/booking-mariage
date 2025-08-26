"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "lodgings"));
        const data: Lodging[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as Lodging);
        });
        setLodgings(data);
      } catch (error) {
        console.error("Erreur lors du chargement des logements :", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {lodgings.map((lodging) => (
        <LodgingCard key={lodging.id} {...lodging} />
      ))}
    </div>
  );
}
