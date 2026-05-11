const form = document.getElementById('shortenForm');
const urlInput = document.getElementById('urlInput');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('span');
const spinner = document.getElementById('spinner');
const errorMsg = document.getElementById('errorMsg');
const resultArea = document.getElementById('resultArea');
const shortUrlEl = document.getElementById('shortUrl');
const copyBtn = document.getElementById('copyBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const url = urlInput.value.trim();
  if (!url) return;

  // Reset states
  errorMsg.classList.remove('show');
  resultArea.classList.add('hidden');
  
  // Loading state
  btnText.classList.add('hidden');
  spinner.classList.add('show');
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    // Success state
    shortUrlEl.href = data.short_url;
    shortUrlEl.textContent = data.short_url;
    resultArea.classList.remove('hidden');
    urlInput.value = '';

  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.classList.add('show');
  } finally {
    // Reset button
    btnText.classList.remove('hidden');
    spinner.classList.remove('show');
    submitBtn.disabled = false;
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(shortUrlEl.textContent);
    
    // Change icon to pulse/check to indicate success
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>';
    
    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy', err);
  }
});
