'use strict';

/*
테스트 실행 시 실제 NAS DB가 아니라
테스트 전용 DB 환경변수를 사용하세요.

검사 항목:
- CSRF 누락 및 정상 토큰
- ALTCHA 누락·변조·재사용
- 과도한 요청 크기
- Helmet 및 CSP 보안 헤더
- ALTCHA 외부 CSS와 Worker
- 로그인·회원가입 페이지 연결
*/

const request =
  require('supertest');

const {
  solveChallenge
} = require('altcha-lib');

const {
  deriveKey
} = require(
  'altcha-lib/algorithms/pbkdf2'
);

const app =
  require('../../src/app');

const {
  closeDatabasePool
} = require(
  '../../src/config/database'
);

/*
ALTCHA Proof-of-Work 계산 시간을 고려합니다.
*/
jest.setTimeout(60_000);

/*
모든 테스트가 끝나면 MySQL 연결 풀을 종료합니다.
*/
afterAll(async () => {
  await closeDatabasePool();
});

/*
HTML에서 CSRF 토큰을 추출합니다.

EJS에서 속성의 줄바꿈이 있어도
토큰을 찾을 수 있도록 작성했습니다.
*/
function extractCsrfToken(html) {
  const nameFirstMatch =
    html.match(
      /name=["']_csrf["'][^>]*value=["']([^"']+)["']/i
    );

  if (nameFirstMatch) {
    return nameFirstMatch[1];
  }

  const valueFirstMatch =
    html.match(
      /value=["']([^"']+)["'][^>]*name=["']_csrf["']/i
    );

  if (valueFirstMatch) {
    return valueFirstMatch[1];
  }

  throw new Error(
    'HTML에서 CSRF 토큰을 찾지 못했습니다.'
  );
}

/*
Supertest Agent를 사용하면 GET 요청에서 받은
CSRF 세션 쿠키를 이후 POST 요청에도 유지할 수 있습니다.
*/
async function createCsrfSession() {
  const agent =
    request.agent(app);

  const pageResponse =
    await agent
      .get('/auth/signup')
      .expect(200);

  const csrfToken =
    extractCsrfToken(
      pageResponse.text
    );

  return {
    agent,
    csrfToken
  };
}

/*
ALTCHA 서버에서 챌린지를 발급받고
정상적인 Proof-of-Work 결과를 계산합니다.
*/
async function createValidAltchaPayload(
  client = request(app)
) {
  const challengeResponse =
    await client
      .get('/security/bot/challenge')
      .expect(200);

  const challenge =
    challengeResponse.body;

  const solution =
    await solveChallenge({
      challenge,
      deriveKey
    });

  if (!solution) {
    throw new Error(
      'ALTCHA 챌린지 계산에 실패했습니다.'
    );
  }

  const payload = {
    challenge,
    solution
  };

  return Buffer
    .from(
      JSON.stringify(payload),
      'utf8'
    )
    .toString('base64');
}

/*
Supertest 응답 본문을 문자열로 변환합니다.
정적 JavaScript 파일 검사에 사용합니다.
*/
function getResponseText(response) {
  if (
    typeof response.text ===
    'string'
  ) {
    return response.text;
  }

  if (
    Buffer.isBuffer(response.body)
  ) {
    return response.body
      .toString('utf8');
  }

  return '';
}

describe(
  'CSRF 보안 테스트',
  () => {
    test(
      'CSRF 토큰이 없으면 회원가입 요청을 차단한다',
      async () => {
        const response =
          await request(app)
            .post('/auth/signup')
            .type('form')
            .send({
              displayName:
                '테스트 사용자',

              loginId:
                'testuser',

              email:
                'test@example.com',

              password:
                'Password123!'
            });

        expect(response.status)
          .toBe(403);
      }
    );

    test(
      '정상 CSRF 토큰은 CSRF 검사를 통과한다',
      async () => {
        const {
          agent,
          csrfToken
        } =
          await createCsrfSession();

        const response =
          await agent
            .post('/auth/signup')
            .type('form')
            .send({
              /*
              입력값을 일부러 잘못 작성합니다.

              CSRF를 통과한 뒤 입력 검증이나
              ALTCHA 검증에서 거부되게 합니다.
              */
              displayName: '',
              loginId: '',
              email:
                'invalid-email',
              password: '',
              _csrf:
                csrfToken
            });

        /*
        403이 아니라면 CSRF 검증 자체는
        정상적으로 통과한 것입니다.
        */
        expect(response.status)
          .not.toBe(403);
      }
    );
  }
);

describe(
  'ALTCHA 봇 방지 보안 테스트',
  () => {
    test(
      '새로운 챌린지를 발급한다',
      async () => {
        const response =
          await request(app)
            .get(
              '/security/bot/challenge'
            );

        expect(response.status)
          .toBe(200);

        expect(
          response.headers[
            'cache-control'
          ]
        ).toContain('no-store');

        expect(response.body)
          .toHaveProperty(
            'parameters.algorithm',
            'PBKDF2/SHA-256'
          );

        expect(response.body)
          .toHaveProperty(
            'signature'
          );
      }
    );

    test(
      '정상 CSRF가 있어도 ALTCHA 값이 없으면 거부한다',
      async () => {
        const {
          agent,
          csrfToken
        } =
          await createCsrfSession();

        const response =
          await agent
            .post('/auth/signup')
            .type('form')
            .send({
              displayName:
                '테스트 사용자',

              loginId:
                'testuser',

              email:
                'test@example.com',

              password:
                'Password123!',

              _csrf:
                csrfToken
            });

        expect(response.status)
          .toBe(303);

        expect(
          response.headers.location
        ).toBe(
          '/auth/signup?botCheck=failed'
        );
      }
    );

    test(
      '정상 ALTCHA는 통과하고 재사용은 거부한다',
      async () => {
        const {
          agent,
          csrfToken
        } =
          await createCsrfSession();

        const altchaPayload =
          await createValidAltchaPayload(
            agent
          );

        /*
        회원가입 입력값을 일부러 잘못 작성합니다.

        ALTCHA와 CSRF를 통과하면
        회원가입 입력값 검증에서 400이 발생합니다.

        따라서 실제 DB에는 사용자가 저장되지 않습니다.
        */
        const formData = {
          displayName: '',
          loginId: '',
          email:
            'invalid-email',
          password: '',

          altcha:
            altchaPayload,

          _csrf:
            csrfToken
        };

        const firstResponse =
          await agent
            .post('/auth/signup')
            .type('form')
            .send(formData);

        /*
        400:
        CSRF와 ALTCHA는 통과했지만
        회원가입 입력값이 잘못된 상태입니다.
        */
        expect(firstResponse.status)
          .toBe(400);

        /*
        이미 사용한 ALTCHA를
        같은 세션에서 다시 전송합니다.
        */
        const replayResponse =
          await agent
            .post('/auth/signup')
            .type('form')
            .send(formData);

        expect(replayResponse.status)
          .toBe(303);

        expect(
          replayResponse.headers.location
        ).toBe(
          '/auth/signup?botCheck=failed'
        );
      }
    );

    test(
      '변조된 ALTCHA 값은 거부한다',
      async () => {
        const {
          agent,
          csrfToken
        } =
          await createCsrfSession();

        const validPayload =
          await createValidAltchaPayload(
            agent
          );

        const decodedPayload =
          JSON.parse(
            Buffer
              .from(
                validPayload,
                'base64'
              )
              .toString('utf8')
          );

        /*
        공격자가 서버의 ALTCHA 서명을
        임의로 변경한 상황입니다.
        */
        decodedPayload
          .challenge
          .signature =
            'tampered-signature';

        const tamperedPayload =
          Buffer
            .from(
              JSON.stringify(
                decodedPayload
              ),
              'utf8'
            )
            .toString('base64');

        const response =
          await agent
            .post('/auth/signup')
            .type('form')
            .send({
              displayName:
                '공격 테스트',

              loginId:
                'attacktest',

              email:
                'attack@example.com',

              password:
                'Password123!',

              altcha:
                tamperedPayload,

              _csrf:
                csrfToken
            });

        expect(response.status)
          .toBe(303);

        expect(
          response.headers.location
        ).toBe(
          '/auth/signup?botCheck=failed'
        );
      }
    );

    test(
      '잘못된 형식의 ALTCHA 값은 거부한다',
      async () => {
        const {
          agent,
          csrfToken
        } =
          await createCsrfSession();

        const response =
          await agent
            .post('/auth/signup')
            .type('form')
            .send({
              displayName:
                '공격 테스트',

              loginId:
                'attacktest',

              email:
                'attack@example.com',

              password:
                'Password123!',

              /*
              정상적인 ALTCHA 결과가 아닌
              공격자가 작성한 임의 문자열입니다.
              */
              altcha:
                'not-valid-altcha-payload',

              _csrf:
                csrfToken
            });

        expect(response.status)
          .toBe(303);

        expect(
          response.headers.location
        ).toBe(
          '/auth/signup?botCheck=failed'
        );
      }
    );
  }
);

describe(
  '요청 크기 제한 테스트',
  () => {
    test(
      '20KB를 초과한 회원가입 요청을 거부한다',
      async () => {
        const response =
          await request(app)
            .post('/auth/signup')
            .type('form')
            .send({
              /*
              app.js의 20KB 제한보다
              큰 입력값을 생성합니다.
              */
              displayName:
                'A'.repeat(
                  25 * 1024
                ),

              loginId:
                'attacktest',

              email:
                'attack@example.com',

              password:
                'Password123!',

              altcha:
                'dummy-value',

              _csrf:
                'dummy-csrf-value'
            });

        expect(response.status)
          .toBe(413);
      }
    );
  }
);

describe(
  'Helmet 및 CSP 보안 헤더 테스트',
  () => {
    test(
      'Express 정보와 위험한 CSP 설정을 노출하지 않는다',
      async () => {
        const response =
          await request(app)
            .get('/auth/signup');

        expect(response.status)
          .toBe(200);

        /*
        Express 사용 여부를 노출하지 않습니다.
        */
        expect(
          response.headers[
            'x-powered-by'
          ]
        ).toBeUndefined();

        /*
        클릭재킹 방지 헤더를 확인합니다.
        */
        expect(
          response.headers[
            'x-frame-options'
          ]
        ).toBeDefined();

        const contentSecurityPolicy =
          response.headers[
            'content-security-policy'
          ];

        /*
        CSP 헤더 자체가 존재해야 합니다.
        */
        expect(contentSecurityPolicy)
          .toBeDefined();

        /*
        현재 프로젝트에서 사용하는
        엄격한 CSP 정책을 확인합니다.
        */
        expect(contentSecurityPolicy)
          .toContain(
            "script-src 'self'"
          );

        expect(contentSecurityPolicy)
          .toContain(
            "style-src 'self'"
          );

        expect(contentSecurityPolicy)
          .toContain(
            "style-src-elem 'self'"
          );

        expect(contentSecurityPolicy)
          .toContain(
            "worker-src 'self'"
          );

        expect(contentSecurityPolicy)
          .toContain(
            "manifest-src 'self'"
          );

        /*
        인라인 코드 허용이 다시 추가되면
        테스트를 실패시킵니다.
        */
        expect(contentSecurityPolicy)
          .not.toContain(
            "'unsafe-inline'"
          );

        /*
        이전에 발생한 mainifest-src
        철자 오류가 재발하지 않는지 검사합니다.
        */
        expect(contentSecurityPolicy)
          .not.toContain(
            'mainifest-src'
          );
      }
    );
  }
);

describe(
  'ALTCHA 정적 파일 테스트',
  () => {
    test(
      'CSP용 ALTCHA 파일을 정상적으로 제공한다',
      async () => {
        const staticFiles = [
          {
            url:
              '/vendor/altcha/altcha-external.js',

            contentType:
              /javascript/
          },
          {
            url:
              '/vendor/altcha/altcha.css',

            contentType:
              /text\/css/
          },
          {
            url:
              '/vendor/altcha/i18n/ko.js',

            contentType:
              /javascript/
          },
          {
            url:
              '/vendor/altcha/workers/pbkdf2.js',

            contentType:
              /javascript/
          },
          {
            url:
              '/js/altcha-setup.js',

            contentType:
              /javascript/
          },
          {
            url:
              '/js/altcha-form.js',

            contentType:
              /javascript/
          }
        ];

        for (
          const staticFile
          of staticFiles
        ) {
          const response =
            await request(app)
              .get(staticFile.url);

          expect(response.status)
            .toBe(200);

          expect(
            response.headers[
              'content-type'
            ]
          ).toMatch(
            staticFile.contentType
          );
        }
      }
    );

    test(
      'ALTCHA external 파일은 인라인 CSS를 삽입하지 않는다',
      async () => {
        const response =
          await request(app)
            .get(
              '/vendor/altcha/altcha-external.js'
            );

        expect(response.status)
          .toBe(200);

        const sourceCode =
          getResponseText(response);

        /*
        일반 ALTCHA 번들에는 injectCss가 있지만
        external 빌드에는 없어야 합니다.
        */
        expect(sourceCode)
          .not.toContain(
            'function injectCss'
          );

        expect(sourceCode)
          .not.toContain(
            'document.head.appendChild(style)'
          );
      }
    );

    test(
      'ALTCHA setup은 올바른 Worker 주소를 사용한다',
      async () => {
        const response =
          await request(app)
            .get(
              '/js/altcha-setup.js'
            );

        expect(response.status)
          .toBe(200);

        const sourceCode =
          getResponseText(response);

        expect(sourceCode)
          .toContain(
            '/vendor/altcha/altcha-external.js'
          );

        expect(sourceCode)
          .toContain(
            '/vendor/altcha/workers/pbkdf2.js'
          );
      }
    );
  }
);

describe(
  '로그인·회원가입 ALTCHA 연결 테스트',
  () => {
    test.each([
      '/auth/login',
      '/auth/signup'
    ])(
      '%s 페이지는 CSP용 ALTCHA 파일을 사용한다',
      async (pageUrl) => {
        const response =
          await request(app)
            .get(pageUrl);

        expect(response.status)
          .toBe(200);

        /*
        ALTCHA 공식 외부 CSS가
        연결되어 있어야 합니다.
        */
        expect(response.text)
          .toContain(
            '/vendor/altcha/altcha.css'
          );

        /*
        EJS에서는 setup 모듈만 불러옵니다.
        */
        expect(response.text)
          .toContain(
            '/js/altcha-setup.js'
          );

        /*
        CSS 내장형 기존 ALTCHA 번들을
        직접 호출하면 안 됩니다.
        */
        expect(response.text)
          .not.toMatch(
            /src=["']\/vendor\/altcha\/altcha\.js["']/i
          );

        /*
        엄격한 CSP를 위해 EJS 안에
        인라인 style 태그가 없어야 합니다.
        */
        expect(response.text)
          .not.toMatch(
            /<style[\s>]/i
          );
      }
    );
  }
);