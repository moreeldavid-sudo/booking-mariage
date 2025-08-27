// lib/types.ts
export type Lodging = {
  id: string;
  type: string;
  title: string;
  totalUnits: number;
  unitCapacity: number;
  reservedUnits: number;
  note?: string;
};
