# altcha.test.js 는 Supertest으로 보안 기능이 정상 작동하는지 확인하는 안전망입니다.
npm run test:security ==> Supertest만 실행
npm test 전체 테스트 실행
1. ALTCHA 없이 요청하면 차단되는지
2. 정상 ALTCHA는 한 번만 사용되는지
3. 같은 값을 재사용하면 차단되는지
4. Express 기술 정보가 노출되지 않는지

# -----------------------------------------------


| 도구 | 역할 | 적용 시점 |
|---|---|---|
| Supertest | ALTCHA 누락·재사용, 인증 실패, 보안 헤더 등을 코드로 확인 | 지금 |
| OWASP ZAP | SQL Injection, XSS, 인증 우회 등을 웹 요청으로 스캔 | 쇼핑몰 기능 완성 후 |
| k6 또는 Artillery | 로그인 반복 요청, 봇 요청, Rate Limit 부하 테스트 | ALTCHA·로그인 완성 후 |
| Promptfoo 또는 Garak | 리뷰 AI·SOC AI의 프롬프트 인젝션 테스트 | AI 연동 후 |
| ART | 직접 만든 머신러닝 모델의 적대적 공격 테스트 | 별도 ML 모델이 있을 때만 |