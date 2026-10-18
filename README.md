# AI·개발 용어 한입 사전

성인 비개발자를 위한 AI·개발 용어집입니다. 검색, 분야별 보기, 큰 글씨로 설명 읽기, 관련 용어 이동을 지원합니다.

## 사이트

https://sabyunrepo.github.io/ai-dev-glossary/

## 파일

- `index.html`: 용어집 화면과 인터랙션
- `styles.css`: 모바일·태블릿·데스크톱 화면에 맞춘 글자와 배치
- `terms.js`: 용어 설명, 예시, 관련 용어 연결
- `.nojekyll`: GitHub Pages가 파일을 별도 변환하지 않고 제공하도록 하는 표시 파일

## 용어 추가·수정

프로젝트 전용 스킬은 `.agents/skills/glossary-eli5/SKILL.md`에 있습니다. `AGENTS.md`가 이 스킬을 읽도록 안내하므로, 이후 용어를 추가할 때도 짧은 뜻·쉬운 비유·큰 이모지·필요한 파일 예시 형식을 따릅니다.

데이터와 관련 링크, JSON 예시는 다음 명령으로 확인합니다.

```sh
node .agents/skills/glossary-eli5/scripts/validate-glossary.mjs
```

GitHub Pages로 공개되는 사이트이므로 이 저장소와 사이트의 내용은 누구나 볼 수 있습니다.
