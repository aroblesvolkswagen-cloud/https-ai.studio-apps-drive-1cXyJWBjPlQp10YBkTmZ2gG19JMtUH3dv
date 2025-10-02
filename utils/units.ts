// src/utils/units.ts (funciones puras)
export const kgToGrams = (kg: number) => kg * 1000;
export const gramsToKg = (g: number) => g / 1000;

export const perRollToPerMeter = (pricePerRoll: number, lengthMetersPerRoll?: number) => {
  if (!lengthMetersPerRoll || lengthMetersPerRoll <= 0) throw new Error('lengthMetersPerRoll requerido');
  return pricePerRoll / lengthMetersPerRoll;
};

export const perRollToPerLabel = (pricePerRoll: number, labelsPerRoll?: number) => {
  if (!labelsPerRoll || labelsPerRoll <= 0) throw new Error('labelsPerRoll requerido');
  return pricePerRoll / labelsPerRoll;
};

// coste por metro derivado del gramaje y ancho (g/m2 y mm)
export const paperCostPerMeterFromBasis = (pricePerKg: number, basis_g_m2?: number, width_mm?: number) => {
  if (!basis_g_m2 || !width_mm) throw new Error('basis_g_m2 y width_mm requeridos');
  const mass_g_per_m = basis_g_m2 * (width_mm / 1000); // g por metro lineal
  return (mass_g_per_m / 1000) * pricePerKg;
};

export const metersToLabels = (meters: number, labelsPerMeter?: number) => {
  if (!labelsPerMeter || labelsPerMeter <= 0) throw new Error('labelsPerMeter requerido');
  return meters * labelsPerMeter;
};
