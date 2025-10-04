export interface VesselClass {
  name: string;
  dwtMin: number;
  dwtMax: number;
  loa: string;
  beam: string;
  draft: string;
}

export const vesselClasses: VesselClass[] = [
  { name: "Handysize", dwtMin: 10000, dwtMax: 40000, loa: "~180m", beam: "~25m", draft: "~10m" },
  { name: "Supramax", dwtMin: 40001, dwtMax: 60000, loa: "~200m", beam: "~32m", draft: "~12m" },
  { name: "Panamax", dwtMin: 60001, dwtMax: 82000, loa: "~230m", beam: "~32m", draft: "~13m" },
  { name: "Kamsarmax", dwtMin: 82001, dwtMax: 85000, loa: "~230m", beam: "~32m", draft: "~14m" },
  { name: "Post-Panamax", dwtMin: 85001, dwtMax: 120000, loa: "~275m", beam: "~38m", draft: "~15m" },
  { name: "Capesize", dwtMin: 120001, dwtMax: 200000, loa: "~290m", beam: "~45m", draft: "~17m" },
];
