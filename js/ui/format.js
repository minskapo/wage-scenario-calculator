export function formatWon(amount) {
  return Math.round(amount).toLocaleString('ko-KR') + '원';
}

// 직접 입력 가능한 금액 입력칸(예: 인상액, 인상 후 연 임금)에 쓰는 천단위 콤마 포맷터입니다.
// <input type="number">는 콤마를 표시할 수 없으므로 이 값을 쓰는 입력칸은 type="text"여야 합니다.
export function formatNumberInput(value) {
  return Math.round(value).toLocaleString('ko-KR');
}

export function parseNumberInput(value) {
  const digitsOnly = String(value).replace(/[^0-9-]/g, '');
  return Number(digitsOnly) || 0;
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
