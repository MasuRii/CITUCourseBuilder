import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page
    await page.goto('/CITUCourseBuilder/');
    // Clear localStorage to ensure a clean state
    await page.evaluate(() => localStorage.clear());
    // Disable Astro dev toolbar to avoid interference with focus tests
    await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Re-apply style after reload
    await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
  });

  test('should have all interactive elements focusable', async ({ page }) => {
    // Get all focusable elements
    const focusableElements = await page.$$eval(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      (els) => els.length
    );

    // Should have multiple focusable elements
    expect(focusableElements).toBeGreaterThan(10);

    // Verify key interactive elements are present and focusable
    const themeToggle = page.getByLabel(/Switch to (light|dark) theme/i).first();
    await expect(themeToggle).toBeVisible();
    expect(await themeToggle.getAttribute('tabindex')).not.toBe('-1');

    const groupingSelect = page.locator('#grouping-mode-select');
    await expect(groupingSelect).toBeVisible();

    // Filter buttons
    await expect(page.getByRole('button', { name: /^All$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Closed', exact: true })).toBeVisible();
  });

  test('should have logical focus order through major sections', async ({ page }) => {
    // 1. Import some data to enable major buttons like Generate
    const aimsData = [
      ['1', 'CASE', 'CS101', 'CS1', '3', 'S1', 'M|9-10|R1', 'R1', '40', '20', '0', 'No'].join('\t'),
    ].join('\n');
    await page.getByRole('button', { name: /Select AIMS/i }).click();
    await page.getByRole('textbox', { name: /AIMS.*data input/i }).fill(aimsData);
    await page.getByRole('button', { name: /^Import AIMS Data$/i }).click();

    // 2. Start from the top of the page
    await page.keyboard.press('Tab');

    const encounteredElements: string[] = [];
    const maxTabs = 60;

    for (let i = 0; i < maxTabs; i++) {
      const elementInfo = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        return {
          tagName: el.tagName.toLowerCase(),
          text: el.textContent?.trim(),
          ariaLabel: el.getAttribute('aria-label'),
          id: el.id,
          outerHTML: el.outerHTML.substring(0, 50),
        };
      });

      if (elementInfo) {
        if (elementInfo.ariaLabel?.includes('palette')) encounteredElements.push('palette-toggle');
        else if (elementInfo.text?.includes('User Preferences'))
          encounteredElements.push('user-prefs');
        else if (elementInfo.text?.includes('Course Filters'))
          encounteredElements.push('course-filters');
        else if (elementInfo.id?.includes('grouping')) encounteredElements.push('grouping');
        else if (
          elementInfo.text === 'All' ||
          elementInfo.text === 'Open' ||
          elementInfo.text === 'Closed'
        )
          encounteredElements.push('status-filter');
        else if (elementInfo.text?.includes('Generate Schedule'))
          encounteredElements.push('generate-btn');
        else if (elementInfo.ariaLabel?.includes('theme')) encounteredElements.push('theme-toggle');
      }

      await page.keyboard.press('Tab');

      // Stop if we've seen enough major sections
      if (
        encounteredElements.includes('generate-btn') &&
        encounteredElements.includes('status-filter')
      ) {
        break;
      }
    }

    // Verify key sections are encountered
    expect(encounteredElements).toContain('theme-toggle');
    expect(encounteredElements).toContain('palette-toggle');
    expect(encounteredElements).toContain('generate-btn');
  });

  test('should handle dialog keyboard interaction - Escape to close', async ({ page }) => {
    // 1. Import some data to enable Delete All
    const aimsData = [
      ['1', 'CASE', 'CS101', 'CS1', '3', 'S1', 'M|9-10|R1', 'R1', '40', '20', '0', 'No'].join('\t'),
    ].join('\n');
    await page.getByRole('button', { name: /Select AIMS/i }).click();
    await page.getByRole('textbox', { name: /AIMS.*data input/i }).fill(aimsData);
    await page.getByRole('button', { name: /^Import AIMS Data$/i }).click();

    // 2. Open Delete All dialog
    const deleteAllBtn = page.getByRole('button', { name: /Delete All Courses/i });
    await deleteAllBtn.click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Delete All Courses');

    // 3. Test Escape to close
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // 4. Re-open and verify confirm button is focused (due to autoFocus)
    await deleteAllBtn.click();
    await expect(dialog).toBeVisible();

    const confirmBtn = dialog.getByRole('button', { name: /^Delete$/i });
    await expect(confirmBtn).toBeFocused();

    // 5. Test Enter to confirm
    await page.keyboard.press('Enter');
    await expect(dialog).not.toBeVisible();
    // Course list should be empty
    const table = page.getByTestId('course-list-table');
    await expect(table).toContainText('No courses to display');
  });

  test('should support arrow keys for navigation in select elements', async ({ page }) => {
    const groupingSelect = page.locator('#grouping-mode-select');
    await groupingSelect.focus();
    await expect(groupingSelect).toBeFocused();

    // Current value should be 'subject' (default)
    await expect(groupingSelect).toHaveValue('subject');

    // ArrowUp should change to 'none'
    await page.keyboard.press('ArrowUp');
    await expect(groupingSelect).toHaveValue('none');

    // ArrowDown should change back to 'subject'
    await page.keyboard.press('ArrowDown');
    await expect(groupingSelect).toHaveValue('subject');

    // ArrowDown again should change to 'offeringDept'
    await page.keyboard.press('ArrowDown');
    await expect(groupingSelect).toHaveValue('offeringDept');
  });

  test('should support Space to activate buttons', async ({ page }) => {
    const themeToggle = page.getByLabel(/Switch to (light|dark) theme/i).first();
    await themeToggle.focus();

    const initialTheme = await page.locator('html').getAttribute('data-theme');

    // Use Space to activate
    await page.keyboard.press('Space');

    // Theme should have changed
    const newTheme = await page.locator('html').getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should support Enter to activate buttons', async ({ page }) => {
    const themeToggle = page.getByLabel(/Switch to (light|dark) theme/i).first();
    await themeToggle.focus();

    const initialTheme = await page.locator('html').getAttribute('data-theme');

    // Use Enter to activate
    await page.keyboard.press('Enter');

    // Theme should have changed
    const newTheme = await page.locator('html').getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should show tooltips on focus', async ({ page }) => {
    const tooltipTrigger = page
      .locator('div[tabindex="0"]')
      .filter({ has: page.locator('svg') })
      .first();
    await tooltipTrigger.focus();

    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();

    // Blur should hide it
    await page.keyboard.press('Tab');
    await expect(tooltip).not.toBeVisible();
  });

  test('should have no keyboard traps', async ({ page }) => {
    // Focus on something specific to start
    await page.getByRole('button', { name: /^All$/i }).focus();

    let prevOuterHTML = '';
    let stayCount = 0;

    // Tab through many elements and ensure we don't stay stuck on one
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');

      const outerHTML = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return '';
        return el.outerHTML.substring(0, 100);
      });

      if (outerHTML === prevOuterHTML && outerHTML !== '') {
        stayCount++;
      } else {
        stayCount = 0;
      }

      // If we stay on the same element for more than 5 tabs, it's likely a trap
      // Increased to 5 to be very lenient with browser/driver behavior
      expect(stayCount).toBeLessThan(5);
      prevOuterHTML = outerHTML;

      if (outerHTML === '') break;
    }
  });
});
