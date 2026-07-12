export type Category = "Beer" | "Soft Drink" | "Water";

export interface Item {
  id: string;
  name: string;
  category: Category;
  qtyPerBox: number;
  pricePerUnit: number;
  currentBoxes: number;
  minThreshold: number;
}

export interface DistributionRow {
  itemId: string;
  boxes: number;
  qtyPerBox?: number;
  unitPrice?: number;
  total?: number;
}

export interface Transaction {
  id: string;
  date: string;
  barMan: string;
  rows: DistributionRow[];
  grandTotal: number;
  status: "Completed" | "Pending";
}

export interface StockHistory {
  id: string;
  itemId: string;
  date: string;
  type: "in" | "out";
  boxes: number;
  note: string;
}

export const BAR_MANAGERS = [
  "Selam Tesfaye",
  "Biniam Haile",
  "Meron Alemu",
  "Yonas Bekele",
];

export const initialItems: Item[] = [
  {
    id: "1",
    name: "St. George Beer",
    category: "Beer",
    qtyPerBox: 24,
    pricePerUnit: 90,
    currentBoxes: 150,
    minThreshold: 20,
  },
  {
    id: "2",
    name: "Dashen Beer",
    category: "Beer",
    qtyPerBox: 24,
    pricePerUnit: 90,
    currentBoxes: 88,
    minThreshold: 20,
  },
  {
    id: "3",
    name: "Habesha Beer",
    category: "Beer",
    qtyPerBox: 24,
    pricePerUnit: 85,
    currentBoxes: 12,
    minThreshold: 20,
  },
  {
    id: "4",
    name: "Bedele Beer",
    category: "Beer",
    qtyPerBox: 24,
    pricePerUnit: 80,
    currentBoxes: 60,
    minThreshold: 15,
  },
  {
    id: "5",
    name: "Coca Cola",
    category: "Soft Drink",
    qtyPerBox: 24,
    pricePerUnit: 60,
    currentBoxes: 45,
    minThreshold: 10,
  },
  {
    id: "6",
    name: "Pepsi",
    category: "Soft Drink",
    qtyPerBox: 24,
    pricePerUnit: 55,
    currentBoxes: 8,
    minThreshold: 10,
  },
  {
    id: "7",
    name: "Fanta Orange",
    category: "Soft Drink",
    qtyPerBox: 24,
    pricePerUnit: 55,
    currentBoxes: 30,
    minThreshold: 10,
  },
  {
    id: "8",
    name: "Sprite",
    category: "Soft Drink",
    qtyPerBox: 24,
    pricePerUnit: 55,
    currentBoxes: 22,
    minThreshold: 10,
  },
  {
    id: "9",
    name: "Ambo Water",
    category: "Water",
    qtyPerBox: 12,
    pricePerUnit: 25,
    currentBoxes: 5,
    minThreshold: 15,
  },
  {
    id: "10",
    name: "Babile Water",
    category: "Water",
    qtyPerBox: 12,
    pricePerUnit: 20,
    currentBoxes: 40,
    minThreshold: 15,
  },
  {
    id: "11",
    name: "Highland Water",
    category: "Water",
    qtyPerBox: 12,
    pricePerUnit: 22,
    currentBoxes: 55,
    minThreshold: 15,
  },
];

export const initialTransactions: Transaction[] = [
  {
    id: "T001",
    date: "2026-07-08",
    barMan: "Selam Tesfaye",
    rows: [
      { itemId: "1", boxes: 3 },
      { itemId: "2", boxes: 4 },
      { itemId: "5", boxes: 2 },
      { itemId: "6", boxes: 1 },
    ],
    grandTotal: 19320,
    status: "Completed",
  },
  {
    id: "T002",
    date: "2026-07-07",
    barMan: "Biniam Haile",
    rows: [
      { itemId: "1", boxes: 5 },
      { itemId: "3", boxes: 2 },
      { itemId: "9", boxes: 3 },
    ],
    grandTotal: 14460,
    status: "Completed",
  },
  {
    id: "T003",
    date: "2026-07-06",
    barMan: "Meron Alemu",
    rows: [
      { itemId: "2", boxes: 6 },
      { itemId: "5", boxes: 4 },
      { itemId: "10", boxes: 5 },
    ],
    grandTotal: 18380,
    status: "Completed",
  },
  {
    id: "T004",
    date: "2026-07-05",
    barMan: "Yonas Bekele",
    rows: [
      { itemId: "1", boxes: 4 },
      { itemId: "4", boxes: 3 },
      { itemId: "7", boxes: 2 },
      { itemId: "11", boxes: 4 },
    ],
    grandTotal: 15472,
    status: "Completed",
  },
];

export const initialStockHistory: StockHistory[] = [
  {
    id: "SH001",
    itemId: "1",
    date: "2026-07-05",
    type: "in",
    boxes: 50,
    note: "Monthly restock",
  },
  {
    id: "SH002",
    itemId: "2",
    date: "2026-07-05",
    type: "in",
    boxes: 30,
    note: "Monthly restock",
  },
  {
    id: "SH003",
    itemId: "5",
    date: "2026-07-06",
    type: "in",
    boxes: 20,
    note: "Emergency restock",
  },
  {
    id: "SH004",
    itemId: "9",
    date: "2026-07-07",
    type: "in",
    boxes: 15,
    note: "Weekly delivery",
  },
];
