/**
 * MERIDIAN RESEARCH — Form Validation & Handling
 * Contact form + Custom report request form
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- Contact Form ---
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateForm(contactForm)) {
        showFormSuccess(contactForm, 'Message envoyé ! Nous vous répondrons sous 24h.');
      }
    });
  }

  // --- Custom Request Form (Multi-step) ---
  const requestForm = document.getElementById('request-form');
  if (requestForm) {
    initMultiStepForm(requestForm);
  }
});

/**
 * Multi-step form logic
 */
function initMultiStepForm(form) {
  const steps = form.querySelectorAll('.form-step');
  const dots = form.querySelectorAll('.step-dot');
  const lines = form.querySelectorAll('.step-line');
  let currentStep = 0;

  function showStep(index) {
    steps.forEach((step, i) => {
      step.classList.toggle('is-active', i === index);
    });

    // Update progress dots
    dots.forEach((dot, i) => {
      dot.classList.remove('active', 'completed');
      if (i < index) dot.classList.add('completed');
      if (i === index) dot.classList.add('active');
    });

    // Update progress lines
    lines.forEach((line, i) => {
      line.classList.toggle('completed', i < index);
    });

    currentStep = index;
  }

  // Next buttons
  form.querySelectorAll('[data-action="next"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const currentStepEl = steps[currentStep];
      if (validateStep(currentStepEl)) {
        if (currentStep < steps.length - 1) {
          showStep(currentStep + 1);
          // Scroll to form top
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Previous buttons
  form.querySelectorAll('[data-action="prev"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep > 0) {
        showStep(currentStep - 1);
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Final submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const currentStepEl = steps[currentStep];
    if (validateStep(currentStepEl)) {
      // Show success state
      const successDiv = form.querySelector('.form-success');
      if (successDiv) {
        steps.forEach(s => s.classList.remove('is-active'));
        successDiv.style.display = 'block';
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });

  // Initialize first step
  showStep(0);
}

/**
 * Validate a single form step
 */
function validateStep(stepEl) {
  const fields = stepEl.querySelectorAll('[required]');
  let valid = true;

  fields.forEach(field => {
    const group = field.closest('.form-group');
    if (!field.value.trim()) {
      if (group) group.classList.add('has-error');
      valid = false;
    } else {
      if (group) group.classList.remove('has-error');
    }

    // Email validation
    if (field.type === 'email' && field.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        if (group) group.classList.add('has-error');
        valid = false;
      }
    }
  });

  return valid;
}

/**
 * Validate entire form
 */
function validateForm(form) {
  const fields = form.querySelectorAll('[required]');
  let valid = true;

  fields.forEach(field => {
    const group = field.closest('.form-group');
    if (!field.value.trim()) {
      if (group) group.classList.add('has-error');
      valid = false;
    } else {
      if (group) group.classList.remove('has-error');
    }

    if (field.type === 'email' && field.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        if (group) group.classList.add('has-error');
        valid = false;
      }
    }
  });

  return valid;
}

/**
 * Show success message after form submit
 */
function showFormSuccess(form, message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'form-success-banner';
  successDiv.innerHTML = `
    <div style="text-align:center; padding: var(--space-8);">
      <div style="font-size: 3rem; margin-bottom: var(--space-4);">✓</div>
      <h3 style="margin-bottom: var(--space-2); color: var(--color-success);">${message}</h3>
    </div>
  `;
  form.style.display = 'none';
  form.parentNode.insertBefore(successDiv, form.nextSibling);
}

// Auto-remove error on input
document.addEventListener('input', (e) => {
  const group = e.target.closest('.form-group');
  if (group && group.classList.contains('has-error')) {
    if (e.target.value.trim()) {
      group.classList.remove('has-error');
    }
  }
});
