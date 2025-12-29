import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

// ============ User Store ============
interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  subscription?: string;
}

interface UserStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
  logout: async () => {
    await SecureStore.deleteItemAsync('authToken');
    set({ user: null, isAuthenticated: false });
  },
}));

// ============ Expenses Store ============
interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  createdAt: string;
}

interface ExpensesStore {
  expenses: Expense[];
  totalExpenses: number;
  isLoading: boolean;
  loading: boolean;
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useExpensesStore = create<ExpensesStore>((set) => ({
  expenses: [],
  totalExpenses: 0,
  isLoading: false,
  loading: false,
  setExpenses: (expenses) =>
    set({
      expenses,
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    }),
  addExpense: (expense) =>
    set((state) => ({
      expenses: [expense, ...state.expenses],
      totalExpenses: state.totalExpenses + expense.amount,
    })),
  updateExpense: (id, data) =>
    set((state) => ({
      expenses: state.expenses.map((e) =>
        e.id === id ? { ...e, ...data } : e
      ),
    })),
  deleteExpense: (id) =>
    set((state) => {
      const expense = state.expenses.find((e) => e.id === id);
      return {
        expenses: state.expenses.filter((e) => e.id !== id),
        totalExpenses: state.totalExpenses - (expense?.amount || 0),
      };
    }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// ============ Income Store ============
interface Income {
  id: string;
  amount: number;
  source: string;
  description?: string;
  date: string;
}

interface IncomeStore {
  incomes: Income[];
  totalIncome: number;
  isLoading: boolean;
  loading: boolean;
  setIncomes: (incomes: Income[]) => void;
  addIncome: (income: Income) => void;
  deleteIncome: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useIncomeStore = create<IncomeStore>((set) => ({
  incomes: [],
  totalIncome: 0,
  isLoading: false,
  loading: false,
  setIncomes: (incomes) =>
    set({
      incomes,
      totalIncome: incomes.reduce((sum, i) => sum + i.amount, 0),
    }),
  addIncome: (income) =>
    set((state) => ({
      incomes: [income, ...state.incomes],
      totalIncome: state.totalIncome + income.amount,
    })),
  deleteIncome: (id) =>
    set((state) => {
      const income = state.incomes.find((i) => i.id === id);
      return {
        incomes: state.incomes.filter((i) => i.id !== id),
        totalIncome: state.totalIncome - (income?.amount || 0),
      };
    }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// ============ Goals Store ============
interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon?: string;
}

interface GoalsStore {
  goals: Goal[];
  isLoading: boolean;
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useGoalsStore = create<GoalsStore>((set) => ({
  goals: [],
  isLoading: false,
  setGoals: (goals) => set({ goals }),
  addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
  updateGoal: (id, data) =>
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...data } : g)),
    })),
  deleteGoal: (id) =>
    set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
}));

// ============ Loans Store ============
interface Loan {
  id: string;
  name: string;
  type: string;
  lender?: string;
  totalAmount: number;
  paidAmount: number;
  monthlyPayment: number;
  remainingAmount: number;
  nextPaymentDate?: string;
  status: string;
}

interface LoansStore {
  loans: Loan[];
  totalRemaining: number;
  isLoading: boolean;
  setLoans: (loans: Loan[]) => void;
  addLoan: (loan: Loan) => void;
  updateLoan: (id: string, data: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useLoansStore = create<LoansStore>((set) => ({
  loans: [],
  totalRemaining: 0,
  isLoading: false,
  setLoans: (loans) =>
    set({
      loans,
      totalRemaining: loans.reduce((sum, l) => sum + l.remainingAmount, 0),
    }),
  addLoan: (loan) =>
    set((state) => ({
      loans: [...state.loans, loan],
      totalRemaining: state.totalRemaining + loan.remainingAmount,
    })),
  updateLoan: (id, data) =>
    set((state) => ({
      loans: state.loans.map((l) => (l.id === id ? { ...l, ...data } : l)),
    })),
  deleteLoan: (id) =>
    set((state) => {
      const loan = state.loans.find((l) => l.id === id);
      return {
        loans: state.loans.filter((l) => l.id !== id),
        totalRemaining: state.totalRemaining - (loan?.remainingAmount || 0),
      };
    }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// ============ Alerts Store ============
interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  createdAt: string;
}

interface AlertsStore {
  alerts: Alert[];
  unreadCount: number;
  setAlerts: (alerts: Alert[]) => void;
  dismissAlert: (id: string) => void;
}

export const useAlertsStore = create<AlertsStore>((set) => ({
  alerts: [],
  unreadCount: 0,
  setAlerts: (alerts) => set({ alerts, unreadCount: alerts.length }),
  dismissAlert: (id) =>
    set((state) => {
      const newAlerts = state.alerts.filter((a) => a.id !== id);
      return { alerts: newAlerts, unreadCount: newAlerts.length };
    }),
}));
