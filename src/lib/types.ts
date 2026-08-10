export type Category = "Beer" | "Soft Drink" | "Water" | "Wine" | "Liqueurs";

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
  "Manager",
  "Bar Man",
  "Cashier",
  "Waiter",
  "Chef",
  "Sanitary",
  "Kitchen Assistant",
  "Security",
];

export const BAR_MANAGERS = ["Main Manager", "Assistant Manager"];

export interface SalaryTransaction {
  id: string;
  date: string;
  type: "payment" | "advance" | "increase";
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
  status?: "active" | "inactive";
}
