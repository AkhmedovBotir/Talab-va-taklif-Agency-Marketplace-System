import { PunktLineRequest, PunktLineRequestStatus } from '../services/api';

export type OrderLineGroup = {
  orderId: number;
  lines: PunktLineRequest[];
};

/** Bir xil buyurtma ID dagi qatorlarni bitta guruhda; yangi avval. */
export function groupLinesByOrderId(lines: PunktLineRequest[]): OrderLineGroup[] {
  const map = new Map<number, PunktLineRequest[]>();
  for (const line of lines) {
    const oid = line.orderId;
    const arr = map.get(oid) ?? [];
    arr.push(line);
    map.set(oid, arr);
  }

  const groups: OrderLineGroup[] = Array.from(map.entries()).map(([orderId, groupLines]) => ({
    orderId,
    lines: [...groupLines].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    }),
  }));

  groups.sort((a, b) => {
    const maxT = (g: OrderLineGroup) =>
      Math.max(...g.lines.map((l) => new Date(l.createdAt).getTime() || 0));
    return maxT(b) - maxT(a);
  });

  return groups;
}

/** Kartochka sarlavhasi uchun: amallar ketma-ketligiga ko‘ra eng “muhim” holat. */
export function dominantLineStatus(lines: PunktLineRequest[]): PunktLineRequestStatus {
  const priority: PunktLineRequestStatus[] = [
    'pending',
    'preparing',
    'accepted',
    'rejected',
    'delivered',
  ];
  for (const st of priority) {
    if (lines.some((l) => l.status === st)) return st;
  }
  return lines[0]?.status ?? 'pending';
}

export function sumGroupLines(lines: PunktLineRequest[]): number {
  return lines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);
}
