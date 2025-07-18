// FormFix – Vanilla JS SDK for Friction Detection
(function() {
  // Utility: Generate a random session/user ID (for demo, not persistent)
  function getSessionId() {
    if (!window.__formfix_session_id) {
      window.__formfix_session_id = 'ffx_' + Math.random().toString(36).slice(2);
    }
    return window.__formfix_session_id;
  }

  // Utility: Debounce
  function debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // Main tracker
  function trackFormFriction(form) {
    const fields = form.querySelectorAll('input, textarea, select');
    let formStarted = false;
    let formSubmitted = false;

    fields.forEach(field => {
      let startTime = null;
      let hesitationRecorded = false;
      let backspaceCount = 0;
      let hoverStart = null;
      let totalHover = 0;
      let clickTimestamps = [];
      let lastInputTime = null;
      let charCount = 0;
      let typingIntervals = [];
      let focusCount = 0;
      let lastTypingRate = null;
      let pasteCount = 0;

      // Hesitation time
      field.addEventListener('focus', () => {
        startTime = Date.now();
        hesitationRecorded = false;
        focusCount++;
        reportMetric('field_focus', field, { focusCount });
        formStarted = true;
      });
      field.addEventListener('input', e => {
        if (!hesitationRecorded && startTime) {
          const hesitation = Date.now() - startTime;
          hesitationRecorded = true;
          reportMetric('hesitation', field, { hesitation });
        }
        // Typing rate
        const now = Date.now();
        if (lastInputTime) {
          const interval = now - lastInputTime;
          typingIntervals.push(interval);
          // Calculate chars/sec for this interval
          if (interval > 0) {
            const rate = 1000 / interval;
            lastTypingRate = rate;
            reportMetric('typing_rate', field, { rate });
          }
        }
        lastInputTime = now;
        // Char count and correction rate
        if (e.inputType === 'deleteContentBackward') {
          backspaceCount++;
          reportMetric('backspace', field, { backspaceCount });
        } else if (e.inputType === 'insertText' || e.inputType === 'insertFromPaste') {
          charCount++;
        }
        // Correction rate
        if (charCount > 0) {
          const correctionRate = backspaceCount / charCount;
          reportMetric('correction_rate', field, { correctionRate });
        }
        // Typing speed drop-off detection (if last 3 intervals are much slower than previous 3)
        if (typingIntervals.length >= 6) {
          const prevAvg = (typingIntervals.slice(-6, -3).reduce((a, b) => a + b, 0) / 3);
          const currAvg = (typingIntervals.slice(-3).reduce((a, b) => a + b, 0) / 3);
          if (prevAvg && currAvg && currAvg > prevAvg * 1.7) { // 70% slower
            reportMetric('typing_speed_dropoff', field, { prevAvg, currAvg });
          }
        }
      });
      // Paste detection
      field.addEventListener('paste', () => {
        pasteCount++;
        reportMetric('paste', field, { pasteCount });
      });
      // Hover tracking
      field.addEventListener('mouseover', () => {
        hoverStart = Date.now();
      });
      field.addEventListener('mouseout', () => {
        if (hoverStart) {
          totalHover += Date.now() - hoverStart;
          reportMetric('hover', field, { totalHover });
          hoverStart = null;
        }
      });
      // Rage-click detection
      field.addEventListener('click', () => {
        const now = Date.now();
        clickTimestamps.push(now);
        // Keep only last 1s
        clickTimestamps = clickTimestamps.filter(ts => now - ts < 1000);
        if (clickTimestamps.length >= 3) {
          reportMetric('rage_click', field, { count: clickTimestamps.length });
        }
      });
      // On blur, send summary
      field.addEventListener('blur', () => {
        reportMetric('field_blur', field, {
          totalHover,
          backspaceCount,
          charCount,
          correctionRate: charCount > 0 ? backspaceCount / charCount : 0,
          focusCount,
          pasteCount
        });
        // Reset for next focus
        startTime = null;
        hesitationRecorded = false;
        backspaceCount = 0;
        totalHover = 0;
        hoverStart = null;
        clickTimestamps = [];
        lastInputTime = null;
        charCount = 0;
        typingIntervals = [];
        lastTypingRate = null;
        pasteCount = 0;
      });
    });

    // Detect form submission
    form.addEventListener('submit', (e) => {
      formSubmitted = true;
      reportMetric('form_submit', form, { submittedAt: Date.now() });
    });

    // Also detect button clicks that might submit the form
    const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]');
    submitButtons.forEach(button => {
      button.addEventListener('click', () => {
        formSubmitted = true;
        reportMetric('form_submit', form, { submittedAt: Date.now(), trigger: 'button_click' });
      });
    });

    // Detect abandonment (beforeunload)
    window.addEventListener('beforeunload', function handleAbandon() {
      if (formStarted && !formSubmitted) {
        reportMetric('form_abandon', form, { abandonedAt: Date.now() });
      }
    });
  }

  // Report anonymized metric (now POSTs to backend, logs to console as fallback)
  function reportMetric(type, field, data) {
    const label = field.getAttribute('aria-label') || field.getAttribute('placeholder') || field.name || field.id || 'unknown';
    const payload = {
      sessionId: getSessionId(),
      form: field.form ? field.form.getAttribute('id') || field.form.getAttribute('name') || 'unknown' : 'unknown',
      field: label,
      type,
      data,
      ts: Date.now()
    };
    // Send to backend
    fetch('http://localhost:3000/api/formfix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    }).then(() => {
      // Optionally, do nothing or log success
    }).catch(err => {
      // Fallback: log to console if POST fails
      console.log('[FormFix Metric]', payload, '(POST failed)', err);
    });
  }

  // Auto-initialize on all forms
  function initFormFix() {
    document.querySelectorAll('form').forEach(trackFormFriction);
  }

  // Expose for manual use
  window.FormFix = {
    init: initFormFix,
    trackFormFriction
  };

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormFix);
  } else {
    initFormFix();
  }
})(); 