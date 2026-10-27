'use strict';

import '/vendor/altcha/altcha-external.js';
import '/vendor/altcha/i18n/ko.js';

const pbkdf2WorkerUrl = '/vendor/altcha/workers/pbkdf2.js';

function createPbkdf2Worker() {
  return new Worker(
    pbkdf2WorkerUrl,
    {
      name: 'altcha-pbkdf2-worker'
    }
  );
}

globalThis.$altcha.algorithms.set(
  'PBKDF2/SHA-256',
  createPbkdf2Worker
);

globalThis.$altcha.algorithms.set(
  'PBKDF2/SHA-384',
  createPbkdf2Worker
);

globalThis.$altcha.algorithms.set(
  'PBKDF2/SHA-512',
  createPbkdf2Worker
);

