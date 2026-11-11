/**
 * Module sinh dữ liệu giả lập 1 năm tài chính của 1 công nhân viên văn phòng
 * Mức lương ~18 triệu/tháng, chi tiêu thực tế, ngân sách và cảnh báo đầy đủ
 */

function getMonthsList() {
  const months = [];
  const start = new Date(2025, 10, 1); // 2025-11
  for (let i = 0; i < 12; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ str: mStr, index: i, year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return months;
}

function buildIncomeTx(monthObj, catMap) {
  const { str, month } = monthObj;
  const list = [
    { cat: catMap.salary, type: 'INCOME', amount: 18000000, date: `${str}-05`, note: `Lương chuyển khoản tháng ${month}` }
  ];
  if (month === 2) {
    list.push({ cat: catMap.bonus, type: 'INCOME', amount: 25000000, date: `${str}-10`, note: 'Thưởng Tết Nguyên Đán & KPI năm' });
  } else if (month === 7) {
    list.push({ cat: catMap.bonus, type: 'INCOME', amount: 4500000, date: `${str}-20`, note: 'Thưởng dự án giữa năm' });
  }
  return list;
}

function buildFixedExpenseTx(str, catMap) {
  return [
    { cat: catMap.home, type: 'EXPENSE', amount: 4500000, date: `${str}-06`, note: 'Tiền thuê căn hộ & phí quản lý' },
    { cat: catMap.bill, type: 'EXPENSE', amount: 1050000, date: `${str}-12`, note: 'Hóa đơn Điện, Nước & Internet cáp quang' },
    { cat: catMap.transport, type: 'EXPENSE', amount: 350000, date: `${str}-08`, note: 'Xăng xe máy & gửi xe tháng' }
  ];
}

function buildDailyExpenseTx(str, catMap, isCurrentMonth) {
  const days = isCurrentMonth ? ['02', '07', '11', '15', '19', '21'] : ['03', '08', '14', '18', '22', '27'];
  const items = [
    { cat: catMap.food, amount: 1200000, day: days[0], note: 'Đi siêu thị thực phẩm tuần 1' },
    { cat: catMap.food, amount: 1450000, day: days[1], note: 'Siêu thị thực phẩm & đồ ăn nấu tại nhà' },
    { cat: catMap.food, amount: 650000, day: days[2], note: 'Liên hoan ăn tối với nhóm đồng nghiệp' },
    { cat: catMap.food, amount: 950000, day: days[3], note: 'Ăn trưa văn phòng & cà phê nửa tháng' },
    { cat: catMap.shopping, amount: 1100000, day: days[4], note: 'Mua sắm đồ gia dụng & đồ dùng cá nhân' },
    { cat: catMap.entertainment, amount: 480000, day: days[5], note: 'Xem phim cuối tuần & cà phê bạn bè' }
  ];
  return items.map((it) => ({
    cat: it.cat,
    type: 'EXPENSE',
    amount: it.amount,
    date: `${str}-${it.day}`,
    note: it.note
  }));
}

function buildBudgets(str, catMap) {
  return [
    { cat: catMap.food, month: str, amount: 5000000 },
    { cat: catMap.home, month: str, amount: 5000000 },
    { cat: catMap.transport, month: str, amount: 1000000 },
    { cat: catMap.shopping, month: str, amount: 2000000 },
    { cat: catMap.entertainment, month: str, amount: 1500000 },
    { cat: catMap.bill, month: str, amount: 1200000 }
  ];
}

function resolveCategoryIds(db) {
  const rows = db.prepare('SELECT id, name FROM categories').all();
  const map = {};
  for (const r of rows) map[r.name] = r.id;
  return {
    food: map['Ăn uống'] || 1,
    home: map['Nhà cửa & Sinh hoạt'] || 2,
    transport: map['Đi lại & Xăng xe'] || 3,
    shopping: map['Mua sắm'] || 4,
    entertainment: map['Giải trí & Bạn bè'] || 5,
    health: map['Y tế & Sức khỏe'] || 6,
    bill: map['Hóa đơn & Tiện ích'] || 7,
    salary: map['Lương chính'] || 8,
    bonus: map['Thưởng & Làm thêm'] || 9
  };
}

export function seedOneYearMockData(db) {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM transactions').get();
  if (countRow && Number(countRow.count) > 0) return;

  const catMap = resolveCategoryIds(db);
  const months = getMonthsList();
  const insertTx = db.prepare(`
    INSERT INTO transactions (category_id, type, amount, date, note)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertBudget = db.prepare(`
    INSERT INTO budgets (category_id, month, amount)
    VALUES (?, ?, ?)
    ON CONFLICT(category_id, month) DO UPDATE SET amount = excluded.amount
  `);

  db.exec('BEGIN TRANSACTION;');
  for (const m of months) {
    const isCurrent = m.str === '2026-10';
    const txList = [
      ...buildIncomeTx(m, catMap),
      ...buildFixedExpenseTx(m.str, catMap),
      ...buildDailyExpenseTx(m.str, catMap, isCurrent)
    ];
    for (const t of txList) insertTx.run(t.cat, t.type, t.amount, t.date, t.note);
    for (const b of buildBudgets(m.str, catMap)) insertBudget.run(b.cat, b.month, b.amount);
  }
  db.exec('COMMIT;');
}
