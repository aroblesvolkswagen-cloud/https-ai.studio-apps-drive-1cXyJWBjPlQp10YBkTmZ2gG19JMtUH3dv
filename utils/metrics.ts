// src/utils/metrics.ts (funciones puras)
import { Material, MaterialType, ScrapEntry, Targets, ProductionOrder } from "../types";

export type ScrapTotals = { cost: number; g: number; m: number; labels: number; unit: number };

export function aggregateScrap(
  entries: ScrapEntry[],
  filters?: { from?: string; to?: string; operatorId?: string; machineId?: string; orderId?: string; category?: MaterialType; cause?: string }
) {
  const pass = (e: ScrapEntry) => {
    if (filters?.from && e.date < filters.from) return false;
    if (filters?.to && e.date > filters.to) return false;
    if (filters?.operatorId && e.operatorId !== filters.operatorId) return false;
    if (filters?.machineId && e.machineId !== filters.machineId) return false;
    if (filters?.orderId && e.orderId !== filters.orderId) return false;
    if (filters?.category && e.category !== filters.category) return false;
    if (filters?.cause && e.cause !== filters.cause) return false;
    return true;
  };

  const totals: ScrapTotals = { cost: 0, g: 0, m: 0, labels: 0, unit: 0 };
  const byMaterialType: Record<string, ScrapTotals> = {};
  const byCause: Record<string, ScrapTotals> = {};
  const byOperator: Record<string, ScrapTotals> = {};
  const byMachine: Record<string, ScrapTotals> = {};
  const byOrder: Record<string, ScrapTotals> = {};

  const bump = (obj: Record<string, ScrapTotals>, key: string, e: ScrapEntry) => {
    if (!obj[key]) obj[key] = { cost: 0, g: 0, m: 0, labels: 0, unit: 0 };
    obj[key].cost += e.cost || 0;
    if (e.unitCaptured === 'g')      obj[key].g += e.qty;
    if (e.unitCaptured === 'm')      obj[key].m += e.qty;
    if (e.unitCaptured === 'labels') obj[key].labels += e.qty;
    if (e.unitCaptured === 'unit')   obj[key].unit += e.qty;
  };

  for (const e of entries.filter(pass)) {
    totals.cost += e.cost || 0;
    if (e.unitCaptured === 'g')      totals.g += e.qty;
    if (e.unitCaptured === 'm')      totals.m += e.qty;
    if (e.unitCaptured === 'labels') totals.labels += e.qty;
    if (e.unitCaptured === 'unit')   totals.unit += e.qty;

    bump(byMaterialType, e.category, e);
    if (e.cause)     bump(byCause, e.cause, e);
    if (e.operatorId) bump(byOperator, e.operatorId, e);
    if (e.machineId) bump(byMachine, e.machineId, e);
    if (e.orderId)   bump(byOrder, e.orderId, e);
  }

  return { totals, byMaterialType, byCause, byOperator, byMachine, byOrder };
}

export function scrapPercentByQty({ scrapQty, goodQty }: { scrapQty: number; goodQty: number }) {
  const base = goodQty + scrapQty;
  if (base <= 0) return 0;
  return Number(((scrapQty / base) * 100).toFixed(2));
}

export function scrapPercentByCost({ scrapCost, goodMaterialCost }: { scrapCost: number; goodMaterialCost: number }) {
  const base = goodMaterialCost + scrapCost;
  if (base <= 0) return 0;
  return Number(((scrapCost / base) * 100).toFixed(2));
}

// Factor de bono: 1 si <= objetivo; si excede, lineal hasta 0.
export function payoutFactor(actualPct: number, targetPct?: number) {
  if (targetPct == null || targetPct <= 0) return 1;
  if (actualPct <= targetPct) return 1;
  const exceso = actualPct - targetPct;
  const f = 1 - exceso / targetPct;
  return Math.max(0, Number(f.toFixed(3)));
}

// Busca objetivo por prioridad: byOperator > byMachine > byMaterialType > byCause > global
export function pickTarget(targets: Targets, scope: { operatorId?: string; machineId?: string; materialType?: MaterialType; cause?: string }) {
  if (scope.operatorId && targets.byOperator?.[scope.operatorId]) return targets.byOperator[scope.operatorId];
  if (scope.machineId  && targets.byMachine?.[scope.machineId])   return targets.byMachine[scope.machineId];
  if (scope.materialType && targets.byMaterialType?.[scope.materialType]) return targets.byMaterialType[scope.materialType]!;
  if (scope.cause && targets.byCause?.[scope.cause])              return targets.byCause[scope.cause];
  return targets.global || {};
}

// Reporte de cumplimiento por operador/máquina/orden/global (según filtros)
export function buildComplianceReport(params: {
  targets: Targets;
  scope: 'global' | 'operator' | 'machine' | 'order';
  entries: ScrapEntry[];
  productionOrders: ProductionOrder[];
  // identificadores para scope
  operatorId?: string;
  machineId?: string;
  orderId?: string;
  // filtros de periodo
  from?: string;
  to?: string;
}) {
  const { targets, scope, entries, productionOrders, operatorId, machineId, orderId, from, to } = params;

  // Filtra por scope:
  const orderFilter = (o: ProductionOrder) => {
      const completionDate = o.completionDate || (o.status === 'En Progreso' ? new Date().toISOString().split('T')[0] : null);
      if (from && completionDate && completionDate < from) return false;
      if (to && completionDate && completionDate > to) return false;
      if (scope === 'operator' && operatorId && o.operatorId !== operatorId) return false;
      if (scope === 'machine'  && machineId  && o.machineId  !== machineId)  return false;
      if (scope === 'order'    && orderId    && o.id    !== orderId)    return false;
      return ['Completada', 'En Progreso'].includes(o.status);
  }
  const relevantOrders = productionOrders.filter(orderFilter);
  const relevantOrderIds = new Set(relevantOrders.map(o => o.id));

  const scrapFilter = (e: ScrapEntry) => {
    if (from && e.date < from) return false;
    if (to   && e.date > to)   return false;
    if (scope === 'operator' && operatorId && e.operatorId !== operatorId) return false;
    if (scope === 'machine'  && machineId  && e.machineId  !== machineId)  return false;
    if (scope === 'order'    && orderId    && e.orderId    !== orderId)    return false;
    // Only include scrap from relevant orders (completed or in-progress within the date range)
    if (e.orderId && !relevantOrderIds.has(e.orderId)) return false;
    return true;
  };
  const scopedScrapEntries = entries.filter(scrapFilter);

  // Totales de scrap
  const { totals: scrapTotals } = aggregateScrap(scopedScrapEntries);

  // Base "buena"
  const good = relevantOrders.reduce((acc, o) => {
      acc.materialCostGood += (o.actualCost || 0) - (aggregateScrap(scopedScrapEntries, { orderId: o.id }).totals.cost);
      acc.g += o.goodQty?.g || o.quantityProduced || 0;
      acc.m += o.goodQty?.m || o.linearMetersProduced || 0;
      acc.labels += o.goodQty?.labels || o.quantityProduced || 0;
      return acc;
  }, { materialCostGood: 0, g: 0, m: 0, labels: 0 });


  // % por cantidad (si hay base good)
  const qtyPct_g      = good.g      > 0 ? scrapPercentByQty({ scrapQty: scrapTotals.g,      goodQty: good.g })      : undefined;
  const qtyPct_m      = good.m      > 0 ? scrapPercentByQty({ scrapQty: scrapTotals.m,      goodQty: good.m })      : undefined;
  const qtyPct_labels = good.labels > 0 ? scrapPercentByQty({ scrapQty: scrapTotals.labels, goodQty: good.labels }) : undefined;
  const costPct       = good.materialCostGood > 0 ? scrapPercentByCost({ scrapCost: scrapTotals.cost, goodMaterialCost: good.materialCostGood }) : undefined;

  // objetivos
  const tg = pickTarget(targets, { operatorId, machineId });

  // cumplimiento y factor de bono
  const cf_qty  = qtyPct_g ?? qtyPct_m ?? qtyPct_labels;
  const cf_payout_qty = cf_qty != null ? payoutFactor(cf_qty, tg.qtyPct) : undefined;
  const cf_payout_cost = costPct != null ? payoutFactor(costPct, tg.costPct) : undefined;

  // combinación (toma el mínimo de los disponibles)
  const factors = [cf_payout_qty, cf_payout_cost].filter((x): x is number => typeof x === 'number');
  const overallPayout = factors.length ? Math.min(...factors) : 1;

  return {
    scope,
    scrapTotals, good,
    percents: { qtyPct: cf_qty, costPct },
    targets: tg,
    payout: { qty: cf_payout_qty, cost: cf_payout_cost, overall: overallPayout }
  };
}