echo "
⚠️  E2E tests require a separate runner (pnpm test:e2e).
    pnpm test only runs unit + integration suites (17 tests).

    To run E2E:
      pnpm build && node --import tsx tests/e2e/run.ts
"