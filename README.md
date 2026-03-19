# Side Hustle Matcher MVP

Practical multi-step quiz app that recommends side hustles based on what a 9-to-5 worker can realistically do now.

Built with:
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Local TypeScript data files only (no database)

## Product logic

The engine follows five stages:
1. Normalize user profile (role family, industry, tasks, tools, outputs, constraints, preference style)
2. Convert answers to transferable skill tags
3. Filter by hard constraints (hours, budget, call availability, delivery mode, regulation)
4. Score eligible hustles using weighted fit + friction penalties
5. Explain top recommendations with practical next offers and steps

Scoring location: `src/lib/scoring.ts`

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Main routes

- `/` landing page
- `/quiz` 15-question flow (one question per screen)
- `/results` top 3 matches + alternatives + poor-fit warning

## File structure

```text
src/
  app/
    globals.css
    layout.tsx
    page.tsx
    quiz/page.tsx
    results/page.tsx
  components/
    quiz/
      answer-chips.tsx
      progress-bar.tsx
      quiz-step.tsx
    results/
      result-card.tsx
      top-match-compare.tsx
  data/
    exampleUser.ts
    questions.ts
    roleFamilies.ts
    sideHustles.ts
  lib/
    quiz-storage.ts
    recommendation-explanations.ts
    scoring.ts
    types.ts
```

## Editing the engine

### Add or edit quiz questions
- File: `src/data/questions.ts`
- Add options or tune question limits (`minSelections`, `maxSelections`)

### Add or edit role families
- File: `src/data/roleFamilies.ts`
- Update default skill priors per role family

### Add or edit side hustles
- File: `src/data/sideHustles.ts`
- Each side hustle includes:
  - `requiredSkills`, `preferredSkills`, `roleAffinity`
  - `startupCostBand`, `weeklyHoursMin/Max`, `onlineOffline`
  - `callIntensity`, `salesIntensity`, `regulatoryFriction`
  - `scalability`, `timeToFirstIncome`
  - `reasonsToRecommend`, `firstOfferExamples`, `firstWeekSteps`, `bestForYouIf`, `watchOutFor`

### Tune scoring weights and penalties
- File: `src/lib/scoring.ts`
- Weighting is intentionally explicit for easy tuning:
  - skill match
  - preference fit
  - constraint fit
  - scalability fit
  - time-to-cash fit
  - friction penalties (cost/schedule/regulation/sales/calls/mode/conflict)

## Example answer set and score walkthrough

Example user is stored in `src/data/exampleUser.ts`.

Profile summary:
- Role family: Project management
- Focus tasks: project delivery, SOPs, process design, stakeholder communication
- Constraints: 7 hrs/week, low budget, limited calls, online-only, low regulatory tolerance
- Goal: predictable extra income

Engine function:
- `scoreExampleScenario()` in `src/lib/scoring.ts`

The `/results` page includes a "Scoring engine example" table that shows top 5 scores and breakdown columns:
- skill match
- preference fit
- constraint fit
- friction penalty

## Notes

- No external APIs or database yet; all data is local and editable.
- Quiz answers are stored in browser localStorage (`side_hustle_matcher_answers_v1`).
- This MVP is production-minded in structure, but designed for rapid iteration of the recommendation engine.
