// @ts-check
(function () {
  const vscode = acquireVsCodeApi();

  // Elements
  const briefEl = /** @type {HTMLTextAreaElement} */ (document.getElementById('brief'));
  const forgeBtn = /** @type {HTMLButtonElement} */ (document.getElementById('forgeBtn'));
  const stopBtn = /** @type {HTMLButtonElement} */ (document.getElementById('stopBtn'));
  const loadingEl = /** @type {HTMLElement} */ (document.getElementById('loading'));
  const outputSection = /** @type {HTMLElement} */ (document.getElementById('outputSection'));
  const outputEl = /** @type {HTMLPreElement} */ (document.getElementById('output'));
  const errorMsg = /** @type {HTMLElement} */ (document.getElementById('errorMsg'));
  const copyBtn = /** @type {HTMLButtonElement} */ (document.getElementById('copyBtn'));
  const providerChip = /** @type {HTMLElement} */ (document.getElementById('providerChip'));
  const modelChip = /** @type {HTMLElement} */ (document.getElementById('modelChip'));
  const keyStatus = /** @type {HTMLElement} */ (document.getElementById('keyStatus'));
  const configLink = /** @type {HTMLAnchorElement} */ (document.getElementById('configLink'));

  let selectedMode = 'auto';
  let isForging = false;

  // Mode buttons
  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedMode = btn.getAttribute('data-mode') || 'auto';
      document.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Forge button
  forgeBtn.addEventListener('click', () => {
    const brief = briefEl.value.trim();
    if (!brief) {
      showError('Please enter a brief before forging.');
      return;
    }
    startForge(brief);
  });

  // Ctrl/Cmd+Enter shortcut
  briefEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const brief = briefEl.value.trim();
      if (brief && !isForging) startForge(brief);
    }
  });

  // Stop button
  stopBtn.addEventListener('click', () => {
    vscode.postMessage({ type: 'abort' });
  });

  // Copy button
  copyBtn.addEventListener('click', () => {
    const text = outputEl.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
      const orig = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = orig; }, 1500);
    });
  });

  // Configure link
  configLink.addEventListener('click', () => {
    vscode.postMessage({ type: 'openCommand', command: 'valerius.setApiKey' });
  });

  function startForge(brief) {
    isForging = true;
    clearError();
    outputEl.textContent = '';
    outputSection.classList.remove('visible');
    forgeBtn.disabled = true;
    loadingEl.classList.add('visible');
    stopBtn.classList.add('visible');

    vscode.postMessage({ type: 'forge', brief, mode: selectedMode });
  }

  function stopForge() {
    isForging = false;
    forgeBtn.disabled = false;
    loadingEl.classList.remove('visible');
    stopBtn.classList.remove('visible');
    if (outputEl.textContent) {
      outputSection.classList.add('visible');
    }
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add('visible');
  }

  function clearError() {
    errorMsg.textContent = '';
    errorMsg.classList.remove('visible');
  }

  // Message handler from extension host
  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.type) {
      case 'token':
        if (!outputSection.classList.contains('visible')) {
          outputSection.classList.add('visible');
        }
        outputEl.textContent += msg.text;
        // Auto-scroll to bottom
        outputEl.scrollTop = outputEl.scrollHeight;
        break;

      case 'done':
        stopForge();
        break;

      case 'error':
        stopForge();
        showError(msg.message || 'An error occurred.');
        break;

      case 'config':
        providerChip.textContent = msg.provider || '—';
        modelChip.textContent = msg.model || '—';
        keyStatus.textContent = msg.hasKey ? '🟢 Key set' : '🔴 No key set';
        break;

      case 'prefill':
        briefEl.value = msg.text || '';
        briefEl.focus();
        break;
    }
  });

  // Request config on load
  vscode.postMessage({ type: 'getConfig' });
})();
