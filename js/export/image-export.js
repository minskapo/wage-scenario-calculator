export function attachExportButton(buttonId, targetElementId, filename) {
  document.addEventListener('click', async (event) => {
    if (event.target.id !== buttonId) return;
    const button = event.target;
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) return;
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = '저장 중...';
    try {
      const canvas = await window.html2canvas(targetElement, { backgroundColor: '#ffffff', scale: 2 });
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('이미지 저장 실패:', err);
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  });
}
