'use strict';

// nas DB 정보가 아닌 테스트용 DB 값을 사용해서 테스트 하세요 
/*
ALTCHA 누락·변조·재사용,
과도한 요청 크기,
보안 헤더 등을 확인합니다.
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
서버에서 챌린지를 발급받고
정상적인 ALTCHA 결과를 생성합니다.
*/
async function createValidAltchaPayload() {
  const challengeResponse =
    await request(app)
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
          .toHaveProperty('signature');
      }
    );

    test(
      'ALTCHA 값 없이 회원가입하면 거부한다',
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
        const altchaPayload =
          await createValidAltchaPayload();

        /*
        회원가입 값을 일부러 잘못 작성합니다.

        ALTCHA 통과 후 입력 검증에서 400이 발생하며
        DB 저장 단계에는 도달하지 않습니다.
        */
        const formData = {
          displayName: '',
          loginId: '',
          email: 'invalid-email',
          password: '',
          altcha: altchaPayload
        };

        const firstResponse =
          await request(app)
            .post('/auth/signup')
            .type('form')
            .send(formData);

        /*
        400:
        ALTCHA는 통과했지만 회원가입 입력값이 잘못됨
        */
        expect(firstResponse.status)
          .toBe(400);

        /*
        같은 ALTCHA 값을 다시 전송합니다.
        */
        const replayResponse =
          await request(app)
            .post('/auth/signup')
            .type('form')
            .send(formData);

        /*
        303:
        이미 사용한 ALTCHA이므로 거부됨
        */
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
        const validPayload =
          await createValidAltchaPayload();

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
        공격자가 서버 서명을 변경한 상황입니다.
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
          await request(app)
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
                tamperedPayload
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
        const response =
          await request(app)
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
              ALTCHA 결과가 아닌 임의 문자열입니다.
              */
              altcha:
                'not-valid-altcha-payload'
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
                'A'.repeat(25 * 1024),

              loginId:
                'attacktest',

              email:
                'attack@example.com',

              password:
                'Password123!',

              altcha:
                'dummy-value'
            });

        expect(response.status)
          .toBe(413);
      }
    );

    test(
      'Express 기술 정보 헤더를 숨긴다',
      async () => {
        const response =
          await request(app)
            .get('/auth/signup');

        /*
        Express 사용 여부를 노출하지 않는지 확인합니다.
        */
        expect(
          response.headers[
            'x-powered-by'
          ]
        ).toBeUndefined();

        /*
        클릭재킹 방지 헤더가 있는지 확인합니다.
        */
        expect(
          response.headers[
            'x-frame-options'
          ]
        ).toBeDefined();
      }
    );
  }
);