import { test, expect, type Page } from '@playwright/test';

test.describe('CIT-U Course Builder Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page
    await page.goto('/CITUCourseBuilder/');
    // Clear localStorage to ensure a clean state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  const aimsData = [
    '1\tCASE\tCS101\tCOMPUTER SCIENCE 1\t3\tCS1-AP4\tM,W | 07:30AM-09:00AM | R101\tR101\t40\t20\t0\tNo',
    '2\tCASE\tMAT101\tCALCULUS 1\t3\tMAT1-AP4\tT,TH | 10:30AM-12:00PM | R102\tR102\t40\t20\t0\tNo',
    '3\tCASE\tPHY101\tPHYSICS 1\t4\tPHY1-AP4\tF | 01:00PM-05:00PM | R103\tR103\t40\t20\t0\tNo',
  ].join('\n');

  async function importData(page: Page) {
    await page.getByRole('button', { name: /Select AIMS/i }).click();
    const textarea = page.getByRole('textbox', { name: /AIMS.*data input/i });
    await textarea.fill(aimsData);
    await page.getByRole('button', { name: /^Import AIMS Data$/i }).click();
    await expect(page.getByRole('table').first()).toContainText('CS101');
  }

  test('Home page - Empty state - Light theme', async ({ page }) => {
    await page.getByLabel(/Switch to light theme/i).click();
    await expect(page).toHaveScreenshot('home-empty-light.png');
  });

  test('Home page - Empty state - Dark theme', async ({ page }) => {
    // Default is dark
    await expect(page).toHaveScreenshot('home-empty-dark.png');
  });

  test('Home page - With courses - Light theme', async ({ page }) => {
    await page.getByLabel(/Switch to light theme/i).click();
    await importData(page);
    await expect(page).toHaveScreenshot('home-courses-light.png');
  });

  test('Home page - With courses - Dark theme', async ({ page }) => {
    await importData(page);
    await expect(page).toHaveScreenshot('home-courses-dark.png');
  });

  test('Home page - With schedule - Light theme', async ({ page }) => {
    await page.getByLabel(/Switch to light theme/i).click();
    await importData(page);
    await page.getByRole('button', { name: /Generate Schedule/i }).click();
    await expect(page.getByRole('heading', { name: /Weekly Timetable/i })).toBeVisible();
    await expect(page).toHaveScreenshot('home-schedule-light.png');
  });

  test('Home page - With schedule - Dark theme', async ({ page }) => {
    await importData(page);
    await page.getByRole('button', { name: /Generate Schedule/i }).click();
    await expect(page.getByRole('heading', { name: /Weekly Timetable/i })).toBeVisible();
    await expect(page).toHaveScreenshot('home-schedule-dark.png');
  });

  test('Confirm Dialog - Visible - Danger variant', async ({ page }) => {
    await importData(page);
    // Click Delete All button to trigger confirm dialog
    await page.getByRole('button', { name: /Delete All Courses/i }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByText('Delete All Courses?')).toBeVisible();
    await expect(page).toHaveScreenshot('confirm-dialog-danger.png');
  });

  test('Time Filter - Expanded with ranges', async ({ page }) => {
    const filtersBtn = page.getByRole('button', { name: /Course Filters/i });
    if ((await filtersBtn.getAttribute('aria-expanded')) === 'false') {
      await filtersBtn.click();
    }
    // Add a time range
    await page.getByRole('button', { name: /Add Time Range/i }).click();
    await expect(page).toHaveScreenshot('time-filter-expanded.png');
  });

  test('Course Table - Grouped by Subject', async ({ page }) => {
    await importData(page);
    await page.getByLabel(/Group by:/i).selectOption('subject');
    await expect(page).toHaveScreenshot('course-table-grouped.png');
  });

  test('Course Table - Filtered by Status', async ({ page }) => {
    await importData(page);
    await page.getByRole('button', { name: /Closed/i }).click();
    await expect(page).toHaveScreenshot('course-table-filtered.png');
  });

  test('Home page - Space palette', async ({ page }) => {
    // Cycle to Comfort then Space
    await page.getByLabel(/Cycle color palette/i).click();
    await page.getByLabel(/Cycle color palette/i).click();
    await expect(page.locator('html')).toHaveAttribute('data-palette', 'space');
    await expect(page).toHaveScreenshot('home-space-palette.png');
  });

  test('Home page - Comfort palette', async ({ page }) => {
    // Cycle to Comfort
    await page.getByLabel(/Cycle color palette/i).click();
    await expect(page.locator('html')).toHaveAttribute('data-palette', 'comfort');
    await expect(page).toHaveScreenshot('home-comfort-palette.png');
  });
});
