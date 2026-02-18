import { test, expect } from '@playwright/test';

test.describe('CIT-U Course Builder Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page
    await page.goto('/CITUCourseBuilder/');
    // Clear localStorage to ensure a clean state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should load the page and show the header', async ({ page }) => {
    await expect(page).toHaveTitle(/CIT-U Course Builder/);
    // Use a more specific selector
    await expect(page.locator('header h1.header-title')).toContainText('CIT-U Course Builder');
  });

  test('should complete a basic user journey', async ({ page }) => {
    // 1. Import some data
    // Using EXACT data format from integration tests
    const aimsData = [
      '1\tCASE\tCS101\tCOMPUTER SCIENCE 1\t3\tCS1-AP4\tM,W | 07:30AM-09:00AM | R101\tR101\t40\t20\t0\tNo',
      '2\tCASE\tMAT101\tCALCULUS 1\t3\tMAT1-AP4\tT,TH | 10:30AM-12:00PM | R102\tR102\t40\t20\t0\tNo',
    ].join('\n');

    // Switch to AIMS mode FIRST
    await page.getByRole('button', { name: /Select AIMS/i }).click();

    // Find textarea and fill it
    const textarea = page.getByRole('textbox', { name: /AIMS.*data input/i });
    await textarea.fill(aimsData);

    // Click Import button
    const importBtn = page.getByRole('button', { name: /^Import AIMS Data$/i });
    await importBtn.click();

    // Verify course table shows imported courses
    const table = page.getByRole('table').first();
    await expect(table).toContainText('CS101', { timeout: 10000 });
    await expect(table).toContainText('MAT101');

    // 2. Filter by a day
    // Open Course Filters
    const filtersBtn = page.getByRole('button', { name: /Course Filters/i });
    if ((await filtersBtn.getAttribute('aria-expanded')) === 'false') {
      await filtersBtn.click();
    }

    // Exclude Monday (M button)
    const monButton = page.getByTestId('day-toggle-M');
    await monButton.click();
    await expect(monButton).toHaveAttribute('aria-pressed', 'true');

    // 3. Generate a schedule
    await page.getByRole('button', { name: /Generate Schedule/i }).click();

    // 4. Verify timetable is visible and shows courses (except Monday ones)
    // Wait for Generate to finish
    await expect(page.getByRole('heading', { name: /Weekly Timetable/i })).toBeVisible({
      timeout: 15000,
    });

    // Check for MAT101 in the timetable (T-TH)
    await expect(
      page.locator('.timetable-card').filter({ hasText: 'MAT101' }).first()
    ).toBeVisible();

    // CS101 is on M-W, so it should NOT be in the generated schedule if Monday is excluded
    await expect(page.locator('.timetable-card').filter({ hasText: 'CS101' })).not.toBeVisible();

    // 5. Test Export menu in Timetable
    const exportBtn = page.getByLabel('Export timetable options');
    await exportBtn.click();

    // Check for export options in the dropdown
    // Note: They have role="menuitem"
    await expect(page.getByRole('menuitem', { name: /Export as .ics/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Export as PNG/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Export as PDF/i })).toBeVisible();
  });

  test('should toggle theme and palette', async ({ page }) => {
    const html = page.locator('html');

    // Initial theme (default is dark per BaseLayout.astro)
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Toggle theme to light
    await page.getByLabel(/Switch to light theme/i).click();
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Toggle palette
    // Cycles from original -> comfort -> space
    await page.getByLabel(/Cycle color palette/i).click();
    await expect(html).toHaveAttribute('data-palette', 'comfort');

    await page.getByLabel(/Cycle color palette/i).click();
    await expect(html).toHaveAttribute('data-palette', 'space');
  });
});
