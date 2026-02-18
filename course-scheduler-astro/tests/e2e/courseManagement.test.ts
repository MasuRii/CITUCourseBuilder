import { test, expect } from '@playwright/test';

test.describe('Course Management', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page
    await page.goto('/CITUCourseBuilder/');
    // Clear localStorage to ensure a clean state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should manage courses: grouping, filtering, and deletion', async ({ page }) => {
    // 1. Import sample data
    const aimsData = [
      [
        '1',
        'CASE',
        'CS101',
        'COMPUTER SCIENCE 1',
        '3',
        'CS1-AP4',
        'M,W | 07:30AM-09:00AM | R101',
        'R101',
        '40',
        '20',
        '0',
        'No',
      ].join('\t'),
      [
        '2',
        'CASE',
        'MAT101',
        'CALCULUS 1',
        '3',
        'MAT1-AP4',
        'T,TH | 10:30AM-12:00PM | R102',
        'R102',
        '40',
        '20',
        '0',
        'No',
      ].join('\t'),
      [
        '3',
        'CCIS',
        'IT102',
        'PROGRAMMING 2',
        '3',
        'IT2-AP4',
        'M,W | 01:00PM-02:30PM | R201',
        'R201',
        '40',
        '20',
        '0',
        'No',
      ].join('\t'),
      [
        '4',
        'CCIS',
        'IT103',
        'DATA STRUCTURES',
        '3',
        'IT3-AP4',
        'T,TH | 03:00PM-04:30PM | R202',
        'R202',
        '40',
        '20',
        '0',
        'Yes',
      ].join('\t'),
    ].join('\n');

    await page.getByRole('button', { name: /Select AIMS/i }).click();
    await page.getByRole('textbox', { name: /AIMS.*data input/i }).fill(aimsData);
    await page.getByRole('button', { name: /^Import AIMS Data$/i }).click();

    // Verify all courses are imported
    const table = page.getByTestId('course-list-table');
    const tbody = table.locator('tbody');
    // DEFAULT is 'open' status filter, so IT103 (Closed) is hidden initially.
    // DEFAULT is 'subject' grouping, so we have group headers.
    // 3 courses: CS101, MAT101, IT102
    await expect(tbody.locator('tr:not(.bg-surface-tertiary\\/50)')).toHaveCount(3);

    // 2. Test Status Filtering
    // Filter by All to see everything
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await expect(tbody.locator('tr:not(.bg-surface-tertiary\\/50)')).toHaveCount(4);

    // Filter by Closed
    await page.getByRole('button', { name: 'Closed', exact: true }).click();
    // 1 course: IT103
    await expect(tbody.locator('tr:not(.bg-surface-tertiary\\/50)')).toHaveCount(1);
    await expect(table).toContainText('IT103');

    // Filter by Open
    await page.getByRole('button', { name: 'Open', exact: true }).click();
    await expect(tbody.locator('tr:not(.bg-surface-tertiary\\/50)')).toHaveCount(3);
    await expect(table).not.toContainText('IT103');

    // 3. Test Grouping
    // Reset to All to see everything for grouping tests
    await page.getByRole('button', { name: 'All', exact: true }).click();

    // Group by Subject (already is by default, but let's re-select)
    await page.locator('#grouping-mode-select').selectOption('subject');
    await expect(tbody.locator('tr.bg-surface-tertiary\\/50')).toHaveCount(4); // 4 unique subjects

    // Group by Department
    await page.locator('#grouping-mode-select').selectOption('offeringDept');
    await expect(tbody.locator('tr.bg-surface-tertiary\\/50')).toHaveCount(2); // CASE, CCIS
    // InnerText might not have spaces for margins
    await expect(table).toContainText(/CASE.*\(2 courses\)/);
    await expect(table).toContainText(/CCIS.*\(2 courses\)/);

    // 4. Test Single Deletion
    // Disable grouping for easier selection
    await page.locator('#grouping-mode-select').selectOption('none');
    // Wait for ungrouping
    await expect(tbody.locator('tr.bg-surface-tertiary\\/50')).toHaveCount(0);

    // Sort should be alphabetical if grouping is none?
    // Actually it preserves order of import if no grouping.
    const firstRow = tbody.locator('tr').first();
    await firstRow.hover();
    await firstRow.getByRole('button', { name: /Delete course/i }).click();
    // 3 courses remaining
    await expect(tbody.locator('tr')).toHaveCount(3);
    // Since we deleted the first row, we should check which one it was.
    // Original order: CS101, MAT101, IT102, IT103
    await expect(table).not.toContainText('CS101');

    // 5. Test Delete All
    await page.getByRole('button', { name: /Delete All Courses/i }).click();

    // Verify ConfirmDialog appears (role is alertdialog for danger variant)
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByRole('alertdialog')).toContainText('Delete All Courses');

    // Confirm deletion
    await page.getByRole('button', { name: /^Delete$/i }).click();

    // Verify table is empty
    // The table shows 1 row with "No courses to display"
    await expect(table.locator('tbody tr')).toHaveCount(1);
    await expect(table).toContainText('No courses to display');
  });
});
