export function attachExportButton(button, targetElement, filename) {
  button.addEventListener('click', async () => {
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = '저장 중...';
    try {
      const canvas = await window.html2canvas(targetElement, { backgroundColor: '#ffffff', scale: 2 });
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  });
}
