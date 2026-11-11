/**
 * Tìm chỉ số phần tử đầu tiên thỏa mãn date >= targetDate
 * Độ phức tạp O(log n)
 */
export function findLowerBound(sortedList, targetDate) {
  let left = 0;
  let right = sortedList.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (sortedList[mid].date >= targetDate) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }
  return left;
}

/**
 * Tìm chỉ số phần tử đầu tiên thỏa mãn date > targetDate
 * Độ phức tạp O(log n)
 */
export function findUpperBound(sortedList, targetDate) {
  let left = 0;
  let right = sortedList.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (sortedList[mid].date > targetDate) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }
  return left;
}

/**
 * Lọc danh sách giao dịch theo khoảng ngày bằng Binary Search
 * Yêu cầu: sortedTransactions đã được sắp xếp tăng dần theo date
 * Độ phức tạp: O(log n + m) với m là số phần tử trong khoảng
 */
export function filterByDateRange(sortedTransactions, startDate, endDate) {
  if (!Array.isArray(sortedTransactions) || sortedTransactions.length === 0) {
    return [];
  }
  if (!startDate && !endDate) return sortedTransactions.slice();

  const startIdx = startDate ? findLowerBound(sortedTransactions, startDate) : 0;
  const endIdx = endDate ? findUpperBound(sortedTransactions, endDate) : sortedTransactions.length;

  if (startIdx >= endIdx) return [];
  return sortedTransactions.slice(startIdx, endIdx);
}
