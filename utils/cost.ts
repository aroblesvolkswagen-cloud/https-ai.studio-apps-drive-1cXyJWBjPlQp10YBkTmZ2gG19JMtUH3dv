// src/utils/cost.ts (funciones puras)
import { Material, OrderMaterialUsage, RoutingOperation, RateTables, Uom, Tooling, ProductionOrder, ScrapEntry } from "../types";
import { perRollToPerLabel, perRollToPerMeter } from "./units";

const incompatible = () => { throw new Error('Unidad incompatible con pricing.mode'); };

export function unitCostCompatible(unit: Uom, material: Material): number {
  const p = material.pricing;
  switch (p.mode) {
    case 'per_g':   return p.price;
    case 'per_kg':  return p.price / 1000;           // costo por gramo
    case 'per_m':   if (unit === 'm')    return p.price; incompatible();
    case 'per_unit':if (unit === 'unit') return p.price; incompatible();
    case 'per_roll':
      if (unit === 'm' && p.lengthMetersPerRoll)      return perRollToPerMeter(p.price, p.lengthMetersPerRoll);
      if (unit === 'labels' && p.labelsPerRoll) return perRollToPerLabel(p.price, p.labelsPerRoll);
      incompatible();
    case 'per_h':   if (unit === 'h')   return p.price; incompatible();
    case 'per_kWh': if (unit === 'kWh') return p.price; incompatible();
    default: return 0;
  }
}

export function orderMaterialCost(usage: OrderMaterialUsage, material: Material): number {
  return usage.qty * unitCostCompatible(usage.unit, material);
}

export function routingCost(op: RoutingOperation, rates: RateTables): number {
  const hours = (op.setupTime_h || 0) + (op.runTime_h || 0);
  const labor   = hours * (rates.laborRates[op.operatorCategory || 'default'] || 0);
  const machine = hours * (rates.machineRates[op.machineId] || 0);
  // Energía opcional: añade si tienes kWh/h por máquina
  return labor + machine;
}

export function toolingAmortizationCost(tools: Tooling[] = [], order: ProductionOrder): number {
  let total = 0;
  for (const t of tools) {
    if (!t.amortizationUnits || t.amortizationUnits <= 0) continue;
    if (t.unit === 'labels') {
      const used = order.labelsActual ?? order.labelsPlanned ?? 0;
      total += (t.purchaseCost / t.amortizationUnits) * used;
    } else if (t.unit === 'm') {
      const used = order.metersActual ?? order.metersPlanned ?? 0;
      total += (t.purchaseCost / t.amortizationUnits) * used;
    }
  }
  return total;
}

export function overheadCost(order: ProductionOrder, rates: RateTables): number {
  const hours = (order.routing || []).reduce((acc, op) => acc + (op.setupTime_h || 0) + (op.runTime_h || 0), 0);
  return (rates.overheadPerOrder || 0) + hours * (rates.overheadPerHour || 0);
}

export function realScrapCostForOrder(orderId: string, scrapEntries: ScrapEntry[]): number {
  return scrapEntries.filter(s => s.orderId === orderId).reduce((acc, s) => acc + (s.cost || 0), 0);
}

export function orderTotalCost(order: ProductionOrder, materials: Material[], rates: RateTables, scrapEntries: ScrapEntry[]): number {
  const materialsCost = (order.materials || []).reduce((acc, u) => {
    const m = materials.find(x => x.id === u.materialId);
    if (!m) return acc;
    try { return acc + orderMaterialCost(u, m); } catch { return acc; }
  }, 0);

  const inksCost = (order.inks || []).reduce((acc, ink) => {
      // The cost is derived from the calculated consumption and its price per gram.
      // This ensures that even mixed inks with a derived pricePerGram are costed.
      return acc + (ink.consumption * ink.pricePerGram);
  }, 0);

  const routingC  = (order.routing || []).reduce((a, op) => a + routingCost(op, rates), 0);
  const toolingC  = toolingAmortizationCost(order.tooling, order);
  const overheadC = overheadCost(order, rates);
  const scrapReal = order.id ? realScrapCostForOrder(order.id, scrapEntries) : 0;

  const total = materialsCost + inksCost + routingC + toolingC + overheadC + scrapReal;
  return Number(total.toFixed(2));
}

export function scrapCost(entry: Partial<ScrapEntry>, material: Material): number {
    if (!entry.qty || !entry.unitCaptured) return 0;
    return Number((entry.qty * unitCostCompatible(entry.unitCaptured, material)).toFixed(4));
}

// Variancia de orden (target vs real)
export function orderVariance(order: ProductionOrder) {
  const target = order.targetCost ?? 0;
  const actual = order.actualCost ?? 0;
  const variance = Number((actual - target).toFixed(2));
  const variancePct = target > 0 ? Number(((variance / target) * 100).toFixed(2)) : 0;
  return { target, actual, variance, variancePct };
}