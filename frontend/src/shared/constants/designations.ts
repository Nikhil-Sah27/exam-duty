export const DESIGNATIONS = [
  "HOD/Dean",
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Other",
] as const;

export type Designation = (typeof DESIGNATIONS)[number];

export const DESIGNATION_OPTIONS = [
  { value: "", label: "Select designation..." },
  ...DESIGNATIONS.map((d) => ({ value: d, label: d })),
];
