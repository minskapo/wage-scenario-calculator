# 임금인상 시나리오 계산기

노동조합 임금교섭 준비용 웹 계산기입니다. 현행 임금·실수령액, 인상 시나리오 비교, 임금인상률 추이, 교섭 참고정보를 한 화면에서 확인할 수 있습니다.

## 로컬에서 미리보기

브라우저 ES 모듈은 `file://`로 열면 CORS 문제로 동작하지 않습니다. 로컬 정적 서버로 띄워서 확인하세요.

```bash
python3 -m http.server 8000
# 이후 http://localhost:8000 접속
```

## 계산 로직 테스트

```bash
npm test
```

## 배포

GitHub Pages가 저장소 루트를 정적 파일 그대로 서빙합니다. 별도 빌드 단계가 없습니다.

## 데이터 갱신

- `js/data/wage-table.js`: 직급별 임금테이블 (실제 조합 데이터로 교체 필요)
- `js/data/tax-rules.js`: 4대보험 요율, 소득세 계산 상수 (연도가 바뀌면 갱신)
- `js/data/reference-data.js`: 최저임금·물가상승률·산업평균 인상률·조합 자체 인상률 이력
- `js/data/wage-agreement-2026.js`: 참고정보 탭에 표시되는 임금협약 원문 전체 텍스트 (다른 협약으로 교체 시 이 파일만 수정)

## 실제 조합 데이터로 교체하기

1. `js/data/wage-table.js`의 `wageTable` 배열을 실제 직급별 임금테이블로 교체
   - **주의**: 모든 직급의 `items` 배열은 항목 이름(기본급/직책수당 등)의 집합이 서로 완전히 동일해야 합니다(순서는 상관없음). `js/ui/status-tab.js`와 `js/ui/scenario-tab.js`가 테이블 열 구성을 `wageTable[0].items`에서만 가져오기 때문에, 한 직급이라도 항목 이름이 다르면 화면이 깨지거나 값이 잘못 매핑됩니다.
   - 편집 후에는 `npm test`를 실행하세요. `tests/data-schema.test.mjs`가 직급 간 항목 이름 불일치를 명확한 assertion 오류로 잡아줍니다.
2. `js/data/reference-data.js`의 `unionWageHistory`를 실제 임금협약 이력으로 교체
3. 연도가 바뀌면 `js/data/reference-data.js`의 `minimumWage`/`cpi`/`industryAverageIncrease`에 새 연도 데이터 추가
4. 4대보험 요율이 바뀌면 `js/data/tax-rules.js` 갱신
5. 새 임금협약이 체결되면 `js/data/wage-agreement-2026.js`(파일명도 연도에 맞게 변경 권장)와 `js/main.js`의 import를 함께 갱신
