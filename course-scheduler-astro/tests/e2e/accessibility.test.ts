import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('CIT-U Course Builder Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/CITUCourseBuilder/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Wait for the page to be fully loaded and stable
    await page.waitForLoadState('networkidle');
    // Wait for any React hydration to complete
    await page.waitForTimeout(500);
  });

  test('should have no automatically detectable accessibility violations on the home page (empty state)', async ({
    page,
  }) => {
    // Ensure page is stable before running accessibility scan
    await page.waitForSelector('header', { state: 'visible' });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast']) // Color contrast issues tracked separately
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no automatically detectable accessibility violations when data is imported', async ({
    page,
  }) => {
    const aimsData = [
      '1\tCASE\tCS101\tCOMPUTER SCIENCE 1\t3\tCS1-AP4\tM,W | 07:30AM-09:00AM | R101\tR101\t40\t20\t0\tNo',
      '2\tCASE\tMAT101\tCALCULUS 1\t3\tMAT1-AP4\tT,TH | 10:30AM-12:00PM | R102\tR102\t40\t20\t0\tNo',
    ].join('\n');

    await page.getByRole('button', { name: /Select AIMS/i }).click();
    const textarea = page.getByRole('textbox', { name: /AIMS.*data input/i });
    await textarea.fill(aimsData);
    await page.getByRole('button', { name: /^Import AIMS Data$/i }).click();

    // Verify course table shows imported courses
    await expect(page.getByRole('table').first()).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast']) // Color contrast issues tracked separately
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no automatically detectable accessibility violations when filters are expanded', async ({
    page,
  }) => {
    // Open Course Filters
    const filtersBtn = page.getByRole('button', { name: /Course Filters/i });
    if ((await filtersBtn.getAttribute('aria-expanded')) === 'false') {
      await filtersBtn.click();
    }

    // Wait for the expanded section to be visible
    await page.waitForTimeout(300);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast']) // Color contrast issues tracked separately
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no automatically detectable accessibility violations in the confirm dialog', async ({
    page,
  }) => {
    // Import data first
    const aimsData = [
      '1\tCASE\tCS101\tCOMPUTER SCIENCE 1\t3\tCS1-AP4\tM,W | 07:30AM-09:00AM | R101\tR101\t40\t20\t0\tNo',
    ].join('\n');
    await page.getByRole('button', { name: /Select AIMS/i }).click();
    const textarea = page.getByRole('textbox', { name: /AIMS.*data input/i });
    await textarea.fill(aimsData);
    await page.getByRole('button', { name: /^Import AIMS Data$/i }).click();

    // Click Delete All
    await page.getByRole('button', { name: /Delete All Courses/i }).click();

    // Dialog should be visible
    await expect(page.getByRole('alertdialog')).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast']) // Color contrast issues tracked separately
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no automatically detectable accessibility violations with timetable visible', async ({
    page,
  }) => {
    // Import data
    const aimsData = [
      '1\tCASE\tCS101\tCOMPUTER SCIENCE 1\t3\tCS1-AP4\tM,W | 07:30AM-09:00AM | R101\tR101\t40\t20\t0\tNo',
      '2\tCASE\tMAT101\tCALCULUS 1\t3\tMAT1-AP4\tT,TH | 10:30AM-12:00PM | R102\tR102\t40\t20\t0\tNo',
    ].join('\n');
    await page.getByRole('button', { name: /Select AIMS/i }).click();
    const textarea = page.getByRole('textbox', { name: /AIMS.*data input/i });
    await textarea.fill(aimsData);
    await page.getByRole('button', { name: /^Import AIMS Data$/i }).click();

    // Generate schedule
    await page.getByRole('button', { name: /Generate Schedule/i }).click();

    // Wait for timetable to appear
    await expect(page.getByRole('heading', { name: /Weekly Timetable/i })).toBeVisible({
      timeout: 15000,
    });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'scope-attr-valid']) // Known issues tracked separately
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
