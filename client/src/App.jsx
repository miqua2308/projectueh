import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinanceData } from './hooks/useFinanceData.js';
import { api } from './services/api.js';
import { Header } from './components/Header.jsx';
import { AlertBanner } from './components/AlertBanner.jsx';
import { SummaryCards } from './components/SummaryCards.jsx';
import {
  MonthlyGroupedBarChart,
  TrendAndForecastLineChart,
  CategoryDonutChart,
  MonthlyStackedCategoryChart,
  CumulativeCashflowAreaChart,
  BudgetUsageProgressList
} from './components/Charts.jsx';
import { TransactionList } from './components/TransactionList.jsx';
import { TransactionModal } from './components/TransactionModal.jsx';
import { BudgetList } from './components/BudgetList.jsx';
import { BudgetModal } from './components/BudgetModal.jsx';
import { AiSuggestions } from './components/AiSuggestions.jsx';
import { SavingsPet } from './components/SavingsPet.jsx';
import { FloatingPet } from './components/FloatingPet.jsx';
import { LoginScreen } from './components/LoginScreen.jsx';
import { BuildSequence } from './components/BuildSequence.jsx';
import { ReplayIntroButton } from './components/ReplayIntroButton.jsx';
import { getPetStage, usePetAnimation } from './pet/petController.js';
import { SubscriptionManager } from './components/SubscriptionManager.jsx';
import { DashboardSkeleton, ListSkeleton } from './components/Skeletons.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lỗi giao diện (ErrorBoundary):', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface, #ffffff)', borderRadius: '12px', border: '1px solid var(--border, #e2e8f0)', margin: '2rem auto', maxWidth: '600px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ color: '#e11d48', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 700 }}>⚠️ Đã xảy ra lỗi giao diện</h2>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            {this.state.error?.message || 'Có lỗi không mong muốn đã xảy ra.'}
          </p>
          <button
            className="btn"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          >
            🔄 Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const TABS = [
  { id: 'dashboard', label: 'Tổng quan' },
  { id: 'transactions', label: 'Giao dịch' },
  { id: 'budgets', label: 'Hạn mức' },
  { id: 'pet', label: 'Nuôi pet' },
  { id: 'subscriptions', label: 'Gói gia hạn' },
  { id: 'ai', label: 'AI & Dự báo' }
];

function NavTabBar({ activeTab, onTabSelect, txCount, budgetCount, petLevel, urgentSubCount }) {
  const extra = {
    transactions: <span className="tab-count num-tabular">{txCount}</span>,
    budgets: <span className="tab-count num-tabular">{budgetCount}</span>,
    pet: <span className="tab-count pixel-font" style={{ fontSize: '0.95rem' }}>LV.{petLevel}</span>,
    subscriptions: urgentSubCount > 0 ? <span className="badge-alert-pill">{urgentSubCount}</span> : null
  };
  return (
    <nav className="nav-tabs" aria-label="Điều hướng chính">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
          aria-current={activeTab === t.id ? 'page' : undefined}
          onClick={(e) => {
            onTabSelect(t.id);
            // Mobile: thanh tab cuộn ngang – đưa tab vừa chọn vào giữa để luôn thấy
            e.currentTarget.scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'smooth' });
          }}
        >
          {activeTab === t.id && (
            <motion.span
              layoutId="tab-indicator"
              className="tab-indicator"
              transition={{ type: 'spring', stiffness: 520, damping: 40 }}
            />
          )}
          <span className="tab-label">{t.label}{extra[t.id]}</span>
        </button>
      ))}
    </nav>
  );
}

function DashboardViewImpl({ month, summary, prevSummary, breakdown, trend, budgets, onOpenAdd, onOpenBudget }) {
  const [curY, curM] = month.split('-').map(Number);
  const numDays = new Date(curY, curM, 0).getDate();

  const expenseCategories = breakdown.map((b) => ({ id: b.categoryId, name: b.categoryName, color: b.color }));
  const stackedDatasets = expenseCategories.map((cat) => ({
    label: cat.name,
    backgroundColor: cat.color || '#0284c7',
    data: trend.map((t) => Math.round(t.expense * (breakdown.find((b) => b.categoryId === cat.id)?.percentage || 15) / 100))
  }));

  const forecastData = [];
  if (trend.length >= 2) {
    const expenses = trend.map((t) => t.expense);
    const n = expenses.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i; sumY += expenses[i]; sumXY += i * expenses[i]; sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
    const intercept = (sumY - slope * sumX) / n;

    for (let k = 1; k <= 3; k++) {
      const fDate = new Date(curY, curM - 1 + k, 1);
      const mStr = `${fDate.getFullYear()}-${String(fDate.getMonth() + 1).padStart(2, '0')}`;
      forecastData.push({
        month: mStr,
        predictedExpense: Math.max(0, Math.round(intercept + slope * (n - 1 + k)))
      });
    }
  }

  return (
    <div className="dashboard-stack">
      <SummaryCards summary={summary} prevSummary={prevSummary} daysInMonth={numDays} />

      <div className="hero-bento-banner" style={{ marginBottom: '0.9rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="dash-title">Báo cáo tài chính tháng {month}</h3>
            <span className="dash-sub">
              Giám sát hạn mức danh mục, xu hướng thu chi và dự báo kinh tế
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-sm" onClick={onOpenAdd}>+ Ghi Khoản Chi</button>
            <button className="btn btn-secondary btn-sm" onClick={onOpenBudget}>+ Đặt Ngân Sách</button>
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="metric-card">
          <div className="metric-eyebrow">
            <span>Thu vs chi theo tháng</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>6 tháng gần nhất</span>
          </div>
          <MonthlyGroupedBarChart trend={trend} />
        </div>

        <div className="metric-card">
          <div className="metric-eyebrow">
            <span>Xu hướng & dự báo 3 tháng</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ocean-600)', fontWeight: 600 }}>Nét đứt: Dự báo AI</span>
          </div>
          <TrendAndForecastLineChart trend={trend} forecast={forecastData} />
        </div>
      </div>

      <div className="chart-grid">
        <div className="metric-card">
          <div className="metric-eyebrow">
            <span>Cơ cấu chi theo danh mục · {month}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tỷ trọng chi tiêu</span>
          </div>
          <CategoryDonutChart breakdown={breakdown} />
        </div>

        <div className="metric-card">
          <div className="metric-eyebrow">
            <span>Chi theo danh mục qua các tháng</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phân bổ chi tiết</span>
          </div>
          <MonthlyStackedCategoryChart stackedData={{ months: trend.map((t) => t.month), datasets: stackedDatasets }} />
        </div>
      </div>

      <div className="chart-grid">
        <div className="metric-card">
          <div className="metric-eyebrow">
            <span>Dòng tiền ròng tích lũy</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-income)', fontWeight: 600 }}>Tăng trưởng tài sản</span>
          </div>
          <CumulativeCashflowAreaChart trend={trend} />
        </div>

        <div className="metric-card">
          <div className="metric-eyebrow">
            <span>Mức dùng hạn mức từng danh mục</span>
            <button className="btn-link" onClick={onOpenBudget} style={{ fontSize: '0.75rem', color: 'var(--ocean-600)' }}>
              Cài đặt
            </button>
          </div>
          <BudgetUsageProgressList budgets={budgets} />
        </div>
      </div>
    </div>
  );
}

const DashboardView = memo(DashboardViewImpl);

function useAppActions(data, playPet = () => {}) {
  const handleCreateTx = async (txData) => {
    try {
      const res = await api.createTransaction(txData);
      if (res.alert?.triggered) data.setAlert(res.alert);
      if (txData.type === 'INCOME') playPet('eat'); // ghi nhận tiền vào -> pet "ăn"
      data.addPetXp(txData.type === 'INCOME' ? 30 : 10);
      data.refreshData();
    } catch (e) {
      window.alert(e.message);
    }
  };

  const handleDeleteTx = async (id) => {
    if (!window.confirm('Xác nhận xóa giao dịch này?')) return;
    try {
      await api.deleteTransaction(id);
      data.refreshData();
    } catch (e) {
      window.alert(e.message);
    }
  };

  const handleSetBudget = async (bData) => {
    try {
      await api.setBudget(bData);
      data.addPetXp(50);
      data.refreshData();
    } catch (e) {
      window.alert(e.message);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Xác nhận xóa hạn mức này?')) return;
    try {
      await api.deleteBudget(id);
      data.refreshData();
    } catch (e) {
      window.alert(e.message);
    }
  };

  return { handleCreateTx, handleDeleteTx, handleSetBudget, handleDeleteBudget };
}

const AUTH_KEY = 'smartfinance_session_v1';
const PET_VISIBLE_KEY = 'smartfinance_floating_pet_visible';

function readStorage(store, key, fallback) {
  try {
    const raw = store.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(store, key, value) {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Không thể lưu trạng thái:', e);
  }
}

/** login -> building (con trỏ AI dựng web) -> app */
export function App() {
  const [phase, setPhase] = useState(() => (readStorage(sessionStorage, AUTH_KEY, false) ? 'app' : 'login'));
  const [theme, setTheme] = useState(() => readStorage(localStorage, 'smartfinance_theme', 'light'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    writeStorage(localStorage, 'smartfinance_theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const handleLogin = () => {
    writeStorage(sessionStorage, AUTH_KEY, true);
    setPhase('building');
  };
  const handleLogout = () => {
    writeStorage(sessionStorage, AUTH_KEY, false);
    setPhase('login');
  };

  return (
    <ErrorBoundary>
      {phase !== 'login' && (
        <MainApp
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
          onReplayIntro={() => setPhase('building')}
          revealed={phase === 'app'}
        />
      )}
      <AnimatePresence>
        {phase === 'login' && (
          <LoginScreen key="login" onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />
        )}
      </AnimatePresence>
      {phase === 'building' && <BuildSequence onDone={() => setPhase('app')} />}
    </ErrorBoundary>
  );
}

function MainApp({ theme, onToggleTheme, onLogout, onReplayIntro, revealed }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isFloatingPetEnabled, setIsFloatingPetEnabled] = useState(
    () => readStorage(localStorage, PET_VISIBLE_KEY, true) !== false
  );

  const data = useFinanceData();
  const openTxModal = useCallback(() => setIsTxModalOpen(true), []);
  const openBudgetModal = useCallback(() => setIsBudgetModalOpen(true), []);

  const currentStage = getPetStage(data.pet?.xp || 0);
  const hasExceededBudget = data.budgets.some((b) => b.status === 'EXCEEDED_100');
  const isSad = hasExceededBudget || data.summary.netBalance < 0;

  // Một bộ điều khiển hoạt ảnh dùng chung cho pet trong tab và pet nổi
  const petAnim = usePetAnimation({ stage: currentStage.level, isSad });
  const actions = useAppActions(data, petAnim.play);

  const toggleFloatingPet = (val) => {
    setIsFloatingPetEnabled((prev) => {
      const next = typeof val === 'boolean' ? val : !prev;
      writeStorage(localStorage, PET_VISIBLE_KEY, next);
      return next;
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const urgentSubCount = data.subscriptions.filter((s) => {
    if (s.status !== 'ACTIVE') return false;
    const diff = Math.ceil((new Date(s.nextDate) - today) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 3;
  }).length;

  return (
    <motion.div
      className="app-container"
      initial={false}
      animate={revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.985 }}
      transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
    >
      <Header
        currentMonth={data.month}
        onMonthChange={data.setMonth}
        netBalance={data.summary.netBalance}
        theme={theme}
        onToggleTheme={onToggleTheme}
        isPetEnabled={isFloatingPetEnabled}
        onTogglePet={toggleFloatingPet}
        onLogout={onLogout}
      />

      <AlertBanner alert={data.alert} onClose={() => data.setAlert(null)} />

      <AnimatePresence>
        {urgentSubCount > 0 && activeTab !== 'subscriptions' && (
          <motion.div
            className="banner-alert danger"
            style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <span style={{ fontSize: '0.825rem' }}>
              <strong>Gia hạn định kỳ:</strong> Bạn có {urgentSubCount} gói dịch vụ cần thanh toán trong 3 ngày tới.
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('subscriptions')}>
              Xem ngay
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <NavTabBar
        activeTab={activeTab}
        onTabSelect={setActiveTab}
        txCount={data.transactions.length}
        budgetCount={data.budgets.length}
        petLevel={currentStage.level}
        urgentSubCount={urgentSubCount}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
        >
          {activeTab === 'dashboard' && (
            data.isLoading ? (
              <DashboardSkeleton />
            ) : (
              <DashboardView
                month={data.month}
                summary={data.summary}
                prevSummary={data.prevSummary}
                breakdown={data.breakdown}
                trend={data.trend}
                budgets={data.budgets}
                onOpenAdd={openTxModal}
                onOpenBudget={openBudgetModal}
              />
            )
          )}

          {activeTab === 'transactions' && (
            data.isLoading ? <ListSkeleton label="Đang tải giao dịch" /> : <TransactionList
              transactions={data.transactions}
              categories={data.categories}
              onFilterChange={async (f) => data.setTransactions(await api.getTransactions({ month: data.month, ...f }))}
              onDelete={actions.handleDeleteTx}
              onOpenAddModal={() => setIsTxModalOpen(true)}
            />
          )}

          {activeTab === 'budgets' && (
            data.isLoading ? <ListSkeleton rows={4} label="Đang tải hạn mức" /> : <BudgetList
              budgets={data.budgets}
              month={data.month}
              onOpenModal={() => setIsBudgetModalOpen(true)}
              onDelete={actions.handleDeleteBudget}
            />
          )}

          {activeTab === 'pet' && (
            <SavingsPet
              pet={data.pet}
              petAnim={petAnim}
              onAddXp={data.addPetXp}
              budgets={data.budgets}
              netBalance={data.summary.netBalance}
              month={data.month}
              goals={data.goals}
              onAddGoal={data.addGoal}
              onDepositGoal={data.depositGoal}
              isFloatingPetEnabled={isFloatingPetEnabled}
              onToggleFloatingPet={toggleFloatingPet}
            />
          )}

          {activeTab === 'subscriptions' && (
            <SubscriptionManager
              subscriptions={data.subscriptions}
              onAddSub={data.addSubscription}
              onUpdateSub={data.updateSubscription}
              onDeleteSub={data.deleteSubscription}
              onRenewSub={data.renewSubscription}
            />
          )}

          {activeTab === 'ai' && (
            <AiSuggestions
              trend={data.trend}
              transactions={data.transactions}
              budgets={data.budgets}
              month={data.month}
              subscriptions={data.subscriptions}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <ReplayIntroButton isVisible={revealed} onClick={onReplayIntro} />

      <FloatingPet
        petAnim={petAnim}
        budgets={data.budgets}
        subscriptions={data.subscriptions}
        isVisible={isFloatingPetEnabled && revealed}
        activeTab={activeTab}
      />

      <TransactionModal
        categories={data.categories}
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={actions.handleCreateTx}
      />
      <BudgetModal
        categories={data.categories}
        month={data.month}
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={actions.handleSetBudget}
      />
    </motion.div>
  );
}
