/**
 * Cấu trúc dữ liệu Min-Heap tổng quát
 * Phục vụ bài toán tìm Top-K khoản chi lớn nhất với độ phức tạp O(n log k)
 */
export class MinHeap {
  constructor(comparator = (a, b) => a - b) {
    this.data = [];
    this.compare = comparator;
  }

  size() {
    return this.data.length;
  }

  peek() {
    return this.data.length > 0 ? this.data[0] : null;
  }

  push(item) {
    this.data.push(item);
    this._siftUp(this.data.length - 1);
  }

  pop() {
    if (this.data.length === 0) return null;
    const top = this.data[0];
    const bottom = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = bottom;
      this._siftDown(0);
    }
    return top;
  }

  _siftUp(index) {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.compare(this.data[current], this.data[parent]) < 0) {
        [this.data[current], this.data[parent]] = [this.data[parent], this.data[current]];
        current = parent;
      } else {
        break;
      }
    }
  }

  _siftDown(index) {
    let current = index;
    const length = this.data.length;
    while (true) {
      const left = 2 * current + 1;
      const right = 2 * current + 2;
      let smallest = current;

      if (left < length && this.compare(this.data[left], this.data[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.compare(this.data[right], this.data[smallest]) < 0) {
        smallest = right;
      }
      if (smallest !== current) {
        [this.data[current], this.data[smallest]] = [this.data[smallest], this.data[current]];
        current = smallest;
      } else {
        break;
      }
    }
  }
}

/**
 * Thuật toán lấy Top-K khoản chi lớn nhất
 * @param {Array} transactions - Danh sách giao dịch
 * @param {number} k - Số lượng cần lấy (mặc định 5)
 * @returns {Array} Top-K giao dịch có amount cao nhất, sắp xếp giảm dần
 */
export function getTopKExpenses(transactions, k = 5) {
  if (!Array.isArray(transactions) || transactions.length === 0 || k <= 0) {
    return [];
  }

  const heap = new MinHeap((a, b) => a.amount - b.amount);

  for (const tx of transactions) {
    if (tx.type !== 'EXPENSE') continue;
    if (heap.size() < k) {
      heap.push(tx);
    } else if (tx.amount > heap.peek().amount) {
      heap.pop();
      heap.push(tx);
    }
  }

  const results = [];
  while (heap.size() > 0) {
    results.push(heap.pop());
  }
  return results.reverse();
}
