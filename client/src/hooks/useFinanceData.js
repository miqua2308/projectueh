import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { getCurrentMonth, getToday } from '../utils/formatters.js';

const LOCAL_STORAGE_KEY = 'smartfinance_react_storage_v1';

function getRelativeDate(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DEFAULT_SUBSCRIPTIONS = [
  { id: 1, name: 'Gemini Pro', price: 249000, cycle: 'MONTHLY', nextDate: getRelativeDate(2), status: 'ACTIVE' },
  { id: 2, name: 'Shopee VIP', price: 49000, cycle: 'MONTHLY', nextDate: getRelativeDate(14), status: 'ACTIVE' },
  { id: 3, name: 'YouTube Premium', price: 79000, cycle: 'MONTHLY', nextDate: getRelativeDate(3), status: 'ACTIVE' },
  { id: 4, name: 'Spotify Individual', price: 59000, cycle: 'MONTHLY', nextDate: getRelativeDate(21), status: 'ACTIVE' }
];

const DEFAULT_GOALS = [
  { id: 1, name: 'Quỹ Khẩn Cấp (6 Tháng)', current: 45000000, target: 60000000, color: '#0284c7' },
  { id: 2, name: 'Du Lịch Mùa Thu', current: 12500000, target: 15000000, color: '#0ea5e9' },
  { id: 3, name: 'Tích Lũy Đầu Tư ETF', current: 35000000, target: 50000000, color: '#059669' }
];

export function useFinanceData() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netBalance: 0, savingsRate: 0 });
  const [prevSummary, setPrevSummary] = useState({ totalIncome: 0, totalExpense: 0, netBalance: 0, savingsRate: 0 });
  const [breakdown, setBreakdown] = useState([]);
  const [trend, setTrend] = useState([]);
  const [topExpenses, setTopExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Gamified Pet & Subscriptions state (persisted with try/catch)
  const [pet, setPet] = useState(() => {
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_pet`);
      return raw ? JSON.parse(raw) : { xp: 450, level: 2 };
    } catch {
      return { xp: 450, level: 2 };
    }
  });

  const [subscriptions, setSubscriptions] = useState(() => {
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_subs`);
      return raw ? JSON.parse(raw) : DEFAULT_SUBSCRIPTIONS;
    } catch {
      return DEFAULT_SUBSCRIPTIONS;
    }
  });

  const [goals, setGoals] = useState(() => {
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_goals`);
      return raw ? JSON.parse(raw) : DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  });

  // Save pet to storage
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_pet`, JSON.stringify(pet));
    } catch (e) {
      console.warn('Không thể lưu pet vào localStorage:', e);
    }
  }, [pet]);

  // Save subs to storage
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_subs`, JSON.stringify(subscriptions));
    } catch (e) {
      console.warn('Không thể lưu subscriptions vào localStorage:', e);
    }
  }, [subscriptions]);

  // Save goals to storage
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_goals`, JSON.stringify(goals));
    } catch (e) {
      console.warn('Không thể lưu goals vào localStorage:', e);
    }
  }, [goals]);

  // Calculate previous month string
  const [curY, curM] = month.split('-').map(Number);
  const prevMonthStr = `${new Date(curY, curM - 2, 1).getFullYear()}-${String(new Date(curY, curM - 2, 1).getMonth() + 1).padStart(2, '0')}`;

  const loadBaseData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catRes, sumRes, prevSumRes, breakRes, trendRes, topRes, txRes, bRes] = await Promise.all([
        api.getCategories().catch(() => []),
        api.getSummary(month).catch(() => ({ totalIncome: 0, totalExpense: 0, netBalance: 0, savingsRate: 0 })),
        api.getSummary(prevMonthStr).catch(() => ({ totalIncome: 0, totalExpense: 0, netBalance: 0, savingsRate: 0 })),
        api.getCategoryBreakdown(month).catch(() => []),
        api.getMonthlyTrend(6).catch(() => []),
        api.getTopExpenses(month, 5).catch(() => []),
        api.getTransactions({ month }).catch(() => []),
        api.getBudgets(month).catch(() => [])
      ]);

      setCategories(catRes);
      setSummary(sumRes);
      setPrevSummary(prevSumRes);
      setBreakdown(breakRes);
      setTrend(trendRes);
      setTopExpenses(topRes);
      setTransactions(txRes);
      setBudgets(bRes);
    } catch (err) {
      console.error('Lỗi tải dữ liệu tài chính:', err);
    } finally {
      setIsLoading(false);
    }
  }, [month, prevMonthStr]);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  // Pet Actions
  const addPetXp = (amount) => {
    setPet((prev) => ({
      ...prev,
      xp: (prev.xp || 0) + amount
    }));
  };

  // Subscription Actions
  const addSubscription = (newSub) => {
    setSubscriptions((prev) => [...prev, newSub]);
    addPetXp(20);
  };

  const updateSubscription = (updatedSub) => {
    setSubscriptions((prev) => prev.map((s) => (s.id === updatedSub.id ? updatedSub : s)));
  };

  const deleteSubscription = (id) => {
    if (!window.confirm('Xác nhận xóa gói gia hạn này?')) return;
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  const renewSubscription = (id) => {
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const curDate = new Date(s.nextDate);
        if (s.cycle === 'YEARLY') {
          curDate.setFullYear(curDate.getFullYear() + 1);
        } else {
          curDate.setMonth(curDate.getMonth() + 1);
        }
        const newDate = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, '0')}-${String(curDate.getDate()).padStart(2, '0')}`;
        return { ...s, nextDate: newDate, status: 'ACTIVE' };
      })
    );
    window.alert('Đã gia hạn thành công thêm 1 chu kỳ!');
  };

  // Goals Actions
  const addGoal = (newGoal) => {
    setGoals((prev) => [...prev, newGoal]);
    addPetXp(50);
  };

  const depositGoal = (goalId, amount) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, current: g.current + amount } : g))
    );
    addPetXp(50);
  };

  return {
    month,
    setMonth,
    categories,
    summary,
    prevSummary,
    breakdown,
    trend,
    topExpenses,
    transactions,
    setTransactions,
    budgets,
    alert,
    setAlert,
    pet,
    addPetXp,
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    renewSubscription,
    goals,
    addGoal,
    depositGoal,
    isLoading,
    refreshData: loadBaseData
  };
}
