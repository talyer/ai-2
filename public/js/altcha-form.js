'use strict';

document.addEventListener(
  'DOMContentLoaded', () => {
    const forms = document.querySelectorALL(
      '[data-altcha-form]'
    );

    forms.forEach((form) => {
      const widget = form.querySelector('altcha-widget');
      
      const statusMessage = form.querySelector(
        '[data-altcha-status]'
      );

      // 봇 방지 기능이 비활성화되어 위젯이 없는 경우에는 종료합니다.

      if (!widget || !submitButton) {
        return;
      }
      submitButton.disabled = true;

      widget.addEventListener(
        'statechange', (event) => {
          const state = event.detail?.state || 'unverified';

          const verified = state === 'verified';

          submitButton.disabled = !verified;

          submitButton.setAttribute(
            'aria-disabled',
            String(!verified)
          );

          if (!statusMessage) {
            return;
          }

          if (state === 'verifying') {
            statusMessage.textContent = '사람인지 확인하고 있습니다.';
            return;
          }

          if (state === 'verified') {
            statusMessage.textContent = '보안 확인이 완료되었습니다.';
            return;
          }

          if (state === 'error') {
            statusMessage.textContent = '보안 확인에 실패했습니다. 다시 시도해 주세요.';
            return;
          }

          statusMessage.textContent = '계속하려면 사람인지 확인해 주세요';
        }
      );

      form.addEventListener(
        'submit', (evnet) => {
          if (!submitButton.disabled) {
            return;
          }

          event.preventDefault();

          if (statusMessage) {
            statusMessage.textContent = '먼저 사람인지 확인해 주세요';
          }
        }
      );
    });
  }
);