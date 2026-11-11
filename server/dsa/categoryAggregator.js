/**
 * Gom nhóm tổng chi tiêu/thu nhập theo từng danh mục bằng cấu trúc Map
 * Độ phức tạp: Thời gian O(n), Không gian O(k) với k là số danh mục
 */
export function aggregateByCategory(transactions, categoryMap = new Map()) {
  const sumMap = new Map();
  let grandTotal = 0;

  for (const tx of transactions) {
    grandTotal += tx.amount;
    const existing = sumMap.get(tx.category_id) || {
      categoryId: tx.category_id,
      total: 0,
      count: 0
    };
    existing.total += tx.amount;
    existing.count += 1;
    sumMap.set(tx.category_id, existing);
  }

  const result = [];
  for (const [categoryId, item] of sumMap.entries()) {
    const cat = categoryMap.get(categoryId) || {};
    const percentage = grandTotal > 0 ? Number(((item.total / grandTotal) * 100).toFixed(1)) : 0;
    result.push({
      categoryId,
      categoryName: cat.name || `Danh mục #${categoryId}`,
      color: cat.color || '#6B7280',
      icon: cat.icon || 'tag',
      total: item.total,
      count: item.count,
      percentage
    });
  }

  return result.sort((a, b) => b.total - a.total);
}
