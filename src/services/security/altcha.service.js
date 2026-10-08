'use strict';

const {
  CappedMap,
  create,
  deriveHmacKeySecret,
  randomInt
} = require( 'altcha-lib/frameworks/express');

const {deriveKey} = require('altcha-lib/algorithms/pbkdf2');

const { env } = require('../../config/env');

let instancePromise;

async function buildInstance() {
  const keySecret = await deriveHmacKeySecret(env.botProtection.hmacSecret);

  return create({
    hmacSignatureSecret: env.botProtection.hmacSecret,

    hmacKeySignatureSecret: keySecret,

    createChallengeParameters: () => ({
      algorithm: 'PBKDF2/SHA-256',

      cost : 5000,

      counter: randomInt(5000, 10000),

      expiresAt: new Date(
        Date.now() + env.botProtection.expiresSeconds * 1000
      )
    }),

    deriveKey,

    // 한번 사용한 챌린지 재사용 방지
    store: new CappedMap({
      maxSize: 5000
    })
  });
}

function getInstance() {
  if (!instancePromise) {
    instancePromise = buildInstance();
  }

  return instancePromise;
}

async function challengeHandler(req, res, next) {
  try{
    if(!env.botProtection.enabled) {
      return res.status(404).json({
        message: '봇 방지 기능이 비활성화되어 있습니다.'
      });
    }

    const altcha = await getInstance();

    res.set(
      'Cache-Control',
      'no-store'
    );

    return altcha.challengeHandler(req, res, next);
  } catch (error) {
    return next(error);
  }
}

function requireBotCheck(pageName) {
  return async (req, res, next) => {
    try {
      if (!env.botProtection.enabled) {
        return next();
      }

      const altcha = await getInstance();

      const verification = altcha.middleware({
        throwOnFailure: false
      });

      return verification(req,res,
        (error) => {
          if (error) {
            return next(error);
          }

          if (!res.locals.altcha?.verified) {
            return res.redirect(
              303,
              `/auth/${pageName}` + '?botCheck=failed'
            );
          }

          return next();
        });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = {
  challengeHandler,
  requireBotCheck
};