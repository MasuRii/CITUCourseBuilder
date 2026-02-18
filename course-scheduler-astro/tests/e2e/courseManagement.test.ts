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
      '1\tCASE\tCS101\tCOMPUTER SCIENCE 1\t3\tCS1-AP4\tM,W | 07:30AM-09:00AM | R101\tR101\t40\t20\t0\tNo',
      '2\tCASE\tMAT101\tCALCULUS 1\t3\tMAT1-AP4\tT,TH | 10:30AM-12:00PM | R102\tR102\t40\t20\t0\tNo',
      '3\tCCIS\tIT102\tPROGRAMMING 2\t3\tIT2-AP4\tM,W | 01:00PM-02:30PM | R201\tR201\t40\t20\t0\tNo',
      '4\tCCIS\tIT103\tDATA STRUCTURES\t3\tIT3-AP4\tT,TH | 03:00PM-04:30PM | R202\tR202\t40\t20\t0\tYes',
    ].join('\n');

    await page.getByRole('button', { name: /Select AIMS/i }).click();
    await page.getByRole('textbox', { name: /AIMS.*data input/i }).fill(aimsData);
    await page.getByRole('button', { name: /^Import AIMS Data$/i }).click();

    // Verify all courses are imported
    const table = page.getByRole('table').first();
    // Rows include 4 courses
    await expect(table.locator('tbody tr:not(.bg-surface-tertiary)')).toHaveCount(4);

    // 2. Test Grouping
    // Group by Subject
    await page.locator('#grouping-mode-select').selectOption('subject');
    // Group headers have class .bg-surface-tertiary/50 (rendered as .bg-surface-tertiary in CourseTable.tsx line 789)
    // Wait for regrouping to finish (it's fast but let's be sure)
    await expect(table.locator('tbody tr.bg-surface-tertiary\\/50')).toHaveCount(4); // 4 unique subjects

    // Group by Department
    await page.locator('#grouping-mode-select').selectOption('offeringDept');
    await expect(table.locator('tbody tr.bg-surface-tertiary\\/50')).toHaveCount(2); // CASE, CCIS
    await expect(table).toContainText('CASE (2 courses)');
    await expect(table).toContainText('CCIS (2 courses)');

    // 3. Test Status Filtering
    // Filter by Open
    await page.getByRole('button', { name: 'Open', exact: true }).click();
    // IT103 is closed (Yes), others are open (No)
    // 3 courses: CS101, MAT101, IT102
    await expect(table.locator('tbody tr:not(.bg-surface-tertiary\\/50)')).toHaveCount(3);
    await expect(table).not.toContainText('IT103');

    // Filter by Closed
    await page.getByRole('button', { name: 'Closed', exact: true }).click();
    // 1 course: IT103
    await expect(table.locator('tbody tr:not(.bg-surface-tertiary\\/50)')).toHaveCount(1);
    await expect(table).toContainText('IT103');

    // Reset filter
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await expect(table.locator('tbody tr:not(.bg-surface-tertiary\\/50)')).toHaveCount(4);

    // 4. Test Single Deletion
    // Disable grouping for easier selection
    await page.locator('#grouping-mode-select').selectOption('none');
    const firstRow = table.locator('tbody tr').first();
    await firstRow.hover();
    await firstRow.getByRole('button', { name: /Delete course/i }).click();
    // 3 courses remaining
    await expect(table.locator('tbody tr')).toHaveCount(3);
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
