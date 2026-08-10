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

export const BAR_MANAGERS = ["Selam Tesfaye", "Biniam Haile", "Meron Alemu", "Yonas Bekele"];

export const initialItems: Item[] = [
  { id: "1", name: "St. George Beer", category: "Beer", qtyPerBox: 24, pricePerUnit: 90, currentBoxes: 150, minThreshold: 20 },
  { id: "2", name: "Dashen Beer", category: "Beer", qtyPerBox: 24, pricePerUnit: 90, currentBoxes: 88, minThreshold: 20 },
  { id: "3", name: "Habesha Beer", category: "Beer", qtyPerBox: 24, pricePerUnit: 85, currentBoxes: 12, minThreshold: 20 },
  { id: "4", name: "Bedele Beer", category: "Beer", qtyPerBox: 24, pricePerUnit: 80, currentBoxes: 60, minThreshold: 15 },
  { id: "5", name: "Coca Cola", category: "Soft Drink", qtyPerBox: 24, pricePerUnit: 60, currentBoxes: 45, minThreshold: 10 },
  { id: "6", name: "Pepsi", category: "Soft Drink", qtyPerBox: 24, pricePerUnit: 55, currentBoxes: 8, minThreshold: 10 },
  { id: "7", name: "Fanta Orange", category: "Soft Drink", qtyPerBox: 24, pricePerUnit: 55, currentBoxes: 30, minThreshold: 10 },
  { id: "8", name: "Sprite", category: "Soft Drink", qtyPerBox: 24, pricePerUnit: 55, currentBoxes: 22, minThreshold: 10 },
  { id: "9", name: "Ambo Water", category: "Water", qtyPerBox: 12, pricePerUnit: 25, currentBoxes: 5, minThreshold: 15 },
  { id: "10", name: "Babile Water", category: "Water", qtyPerBox: 12, pricePerUnit: 20, currentBoxes: 40, minThreshold: 15 },
  { id: "11", name: "Highland Water", category: "Water", qtyPerBox: 12, pricePerUnit: 22, currentBoxes: 55, minThreshold: 15 },
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

export type WorkRole =
  | "Manager"
  | "Bar Man"
  | "Cashier"
  | "Waiter"
  | "Chef"
  | "Sanitary"
  | "Kitchen Assistant"
  | "Security";

export const WORK_ROLES: WorkRole[] = [
  "Manager", "Bar Man", "Cashier", "Waiter", "Chef",
  "Sanitary", "Kitchen Assistant", "Security",
];

export interface SalaryTransaction {
  id: string;
  date: string;
  type: "payment" | "advance" | "deduction" | "increase";
  amount: number;
  note: string;
}

export interface Employee {
  id: string;
  name: string;
  hireDate: string;
  role: WorkRole;
  baseSalary: number;
  paidThisMonth: number;
  history: SalaryTransaction[];
  notes: string;
}

export const initialEmployees: Employee[] = [
  {
    id: "E001", name: "Tigist Bekele", hireDate: "2023-03-15", role: "Manager",
    baseSalary: 12000, paidThisMonth: 0, notes: "",
    history: [
      { id: "ST001", date: "2026-06-30", type: "payment", amount: 12000, note: "June salary" },
      { id: "ST002", date: "2026-06-10", type: "advance", amount: 3000, note: "Advance request" },
    ],
  },
  {
    id: "E002", name: "Selam Tesfaye", hireDate: "2023-06-01", role: "Bar Man",
    baseSalary: 7500, paidThisMonth: 0, notes: "",
    history: [
      { id: "ST003", date: "2026-06-30", type: "payment", amount: 7500, note: "June salary" },
    ],
  },
  {
    id: "E003", name: "Biniam Haile", hireDate: "2024-01-10", role: "Bar Man",
    baseSalary: 7200, paidThisMonth: 0, notes: "",
    history: [
      { id: "ST004", date: "2026-06-30", type: "payment", amount: 7200, note: "June salary" },
      { id: "ST005", date: "2026-07-03", type: "advance", amount: 2000, note: "Emergency advance" },
    ],
  },
  {
    id: "E004", name: "Meron Alemu", hireDate: "2023-09-20", role: "Cashier",
    baseSalary: 6500, paidThisMonth: 0, notes: "",
    history: [
      { id: "ST006", date: "2026-06-30", type: "payment", amount: 6500, note: "June salary" },
    ],
  },
  {
    id: "E005", name: "Yonas Bekele", hireDate: "2024-02-14", role: "Cashier",
    baseSalary: 6500, paidThisMonth: 0, notes: "",
    history: [],
  },
  {
    id: "E006", name: "Hana Girma", hireDate: "2022-11-05", role: "Waiter",
    baseSalary: 5000, paidThisMonth: 0, notes: "",
    history: [
      { id: "ST007", date: "2026-06-30", type: "payment", amount: 5000, note: "June salary" },
      { id: "ST008", date: "2026-06-15", type: "deduction", amount: 500, note: "Late arrival penalty" },
    ],
  },
  {
    id: "E007", name: "Dawit Tadesse", hireDate: "2023-04-18", role: "Waiter",
    baseSalary: 5000, paidThisMonth: 0, notes: "",
    history: [
      { id: "ST009", date: "2026-06-30", type: "payment", amount: 5000, note: "June salary" },
    ],
  },
  {
    id: "E008", name: "Aberash Demeke", hireDate: "2021-08-22", role: "Chef",
    baseSalary: 11000, paidThisMonth: 0, notes: "",
    history: [
      { id: "ST010", date: "2026-06-30", type: "payment", amount: 11000, note: "June salary" },
      { id: "ST011", date: "2026-05-01", type: "increase", amount: 1000, note: "Annual raise" },
    ],
  },
  {
    id: "E009", name: "Lemlem Woldemariam", hireDate: "2024-05-03", role: "Chef",
    baseSalary: 9500, paidThisMonth: 0, notes: "",
    history: [
      { id: "ST012", date: "2026-06-30", type: "payment", amount: 9500, note: "June salary" },
    ],
  },
  {
    id: "E010", name: "Tesfaye Kebede", hireDate: "2023-07-11", role: "Kitchen Assistant",
    baseSalary: 4200, paidThisMonth: 0, notes: "",
    history: [
      { id: "ST013", date: "2026-06-30", type: "payment", amount: 4200, note: "June salary" },
    ],
  },
  {
    id: "E011", name: "Almaz Hailu", hireDate: "2024-03-28", role: "Sanitary",
    baseSalary: 3800, paidThisMonth: 0, notes: "",
    history: [],
  },
  {
    id: "E012", name: "Mulugeta Assefa", hireDate: "2022-12-01", role: "Security",
    baseSalary: 5500, paidThisMonth: 0, notes: "",
    history: [
      { id: "ST014", date: "2026-06-30", type: "payment", amount: 5500, note: "June salary" },
      { id: "ST015", date: "2026-07-01", type: "advance", amount: 1500, note: "School fees advance" },
    ],
  },
  {
    id: "E013", name: "Solomon Teka", hireDate: "2023-10-15", role: "Security",
    baseSalary: 5500, paidThisMonth: 0, notes: "",
    history: [
      { id: "ST016", date: "2026-06-30", type: "payment", amount: 5500, note: "June salary" },
    ],
  },
];

export const initialStockHistory: StockHistory[] = [
  { id: "SH001", itemId: "1", date: "2026-07-05", type: "in", boxes: 50, note: "Monthly restock" },
  { id: "SH002", itemId: "2", date: "2026-07-05", type: "in", boxes: 30, note: "Monthly restock" },
  { id: "SH003", itemId: "5", date: "2026-07-06", type: "in", boxes: 20, note: "Emergency restock" },
  { id: "SH004", itemId: "9", date: "2026-07-07", type: "in", boxes: 15, note: "Weekly delivery" },
];
