import { test, expect } from '@playwright/test';

/**
 * Screen Reader Compatibility Tests
 *
 * Verifies programmatic accessibility features required for screen readers:
 * - ARIA live regions for dynamic content
 * - Correct ARIA roles and labels
 * - Accessible names for interactive elements
 * - Modal dialog accessibility
 */

test.describe('Screen Reader Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and disable Astro dev toolbar
    await page.goto('/CITUCourseBuilder/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
    await page.waitForLoadState('networkidle');
  });

  test('should have aria-live regions for dynamic content', async ({ page }) => {
    // Check ToastContainer aria-live regions
    const textarea = page.getByRole('textbox', { name: /data input/i });
    await textarea.fill('invalid data');

    // Ensure button is enabled and click it
    const importBtn = page.getByTestId('import-button');
    await importBtn.click();

    // The toast should have role="alert" and aria-live="polite"
    const toast = page.getByRole('alert').first();
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute('aria-live', 'polite');
    await expect(toast).toHaveAttribute('aria-atomic', 'true');

    // Status message in RawDataInput should have aria-live="polite"
    const statusMessage = page.locator('#status-message');
    await expect(statusMessage).toHaveAttribute('aria-live', 'polite');
  });

  test('should have appropriate labels for interactive elements', async ({ page }) => {
    // Theme toggle
    const themeToggle = page.getByLabel(/Switch to (Dark|Light) Mode/i);
    await expect(themeToggle).toBeVisible();

    // Palette cycle
    const paletteToggle = page.getByLabel(/Cycle Palette/i);
    await expect(paletteToggle).toBeVisible();

    // Header Home link
    const homeLink = page.getByLabel('CIT-U Course Builder - Home');
    await expect(homeLink).toBeVisible();

    // Import mode toggles
    const witsToggle = page.getByLabel('Select WITS (New) import mode');
    const aimsToggle = page.getByLabel('Select AIMS (Legacy) import mode');
    await expect(witsToggle).toBeVisible();
    await expect(aimsToggle).toBeVisible();
    await expect(witsToggle).toHaveAttribute('aria-pressed', 'true');

    // Textarea label
    const textarea = page.getByLabel(/WITS.*data input/i);
    await expect(textarea).toBeVisible();
  });

  test('should have accessible labels for day filters', async ({ page }) => {
    // Expand Course Filters
    const filtersHeader = page.getByRole('button', { name: 'Course Filters' });
    await filtersHeader.click();

    // Check day toggles
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of days) {
      const toggle = page.getByLabel(new RegExp(`Exclude ${day}`, 'i'));
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    }
  });

  test('should have correct ARIA roles for dialogs', async ({ page }) => {
    // Trigger Delete All Courses dialog
    const aimsData =
      '1\tDEPT\tCS101\tTitle\t3\tSEC1\tM,W | 08:00AM-09:00AM | ROOM1\tROOM1\t40\t10\t0\tNo';
    await page.getByRole('button', { name: /Select AIMS/i }).click();
    const textarea = page.getByRole('textbox', { name: /AIMS.*data input/i });
    await textarea.fill(aimsData);

    const importBtn = page.getByTestId('import-button');
    await importBtn.click();

    // Wait for data to be in table
    await expect(page.getByRole('cell', { name: 'CS101', exact: true })).toBeVisible();

    const deleteAllBtn = page.getByRole('button', { name: /Delete All Courses/i });
    await deleteAllBtn.click();

    // ConfirmDialog should have role="alertdialog" because it's a destructive action
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
    await expect(dialog).toHaveAttribute('aria-describedby', 'confirm-dialog-description');

    // Title and description should be linked
    const title = page.locator('#confirm-dialog-title');
    const description = page.locator('#confirm-dialog-description');
    await expect(title).toContainText('Delete All Courses');
    await expect(description).toContainText(/Delete ALL courses/i);
  });

  test('should have descriptive labels for timetable cards', async ({ page }) => {
    // Import and lock a course
    const aimsData =
      '1\tDEPT\tCS101\tTitle\t3\tSEC1\tM,W | 08:00AM-09:00AM | ROOM1\tROOM1\t40\t10\t0\tNo';
    await page.getByRole('button', { name: /Select AIMS/i }).click();
    const textarea = page.getByRole('textbox', { name: /AIMS.*data input/i });
    await textarea.fill(aimsData);

    const importBtn = page.getByTestId('import-button');
    await importBtn.click();

    // Wait for data to be in table
    await expect(page.getByRole('cell', { name: 'CS101', exact: true })).toBeVisible();

    const lockBtn = page.getByRole('button', { name: 'Lock', exact: true });
    await lockBtn.click();

    // Ensure timetable view is shown (App.tsx sets showTimetable to true on lock)
    const timetableSection = page.getByTestId('timetable-section');
    await expect(timetableSection).toBeVisible();

    // Scroll to section to trigger client:visible hydration
    await timetableSection.scrollIntoViewIfNeeded();

    // Timetable table should have label
    const table = page.getByRole('table', { name: 'Weekly timetable of locked courses' });
    await expect(table).toBeVisible({ timeout: 15000 });

    // Course card in timetable should have descriptive label
    // Wait for the card specifically
    const courseCard = page.locator('.timetable-card').first();
    await expect(courseCard).toBeVisible({ timeout: 10000 });
    await expect(courseCard).toHaveAttribute('aria-label', /Locked course: CS101/);
    await expect(courseCard).toHaveAttribute('aria-label', /section SEC1/);
    await expect(courseCard).toHaveAttribute('aria-label', /room ROOM1/);
    await expect(courseCard).toHaveAttribute('aria-label', /from 08:00 to 09:00/);
  });

  test('should avoid confusing announcements with hidden elements', async ({ page }) => {
    // Decorative icons should have aria-hidden="true"
    const icons = await page.locator('svg[aria-hidden="true"]').count();
    expect(icons).toBeGreaterThan(5);

    // Decorative background circles in Header should be hidden
    const decoration = page.locator('.header-bg-decoration');
    await expect(decoration).toHaveAttribute('aria-hidden', 'true');
  });
});
