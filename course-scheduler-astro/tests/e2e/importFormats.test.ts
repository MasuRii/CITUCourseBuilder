import { test, expect } from '@playwright/test';

test.describe('CIT-U Course Builder Import Formats', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page
    await page.goto('/CITUCourseBuilder/');
    // Clear localStorage to ensure a clean state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should import AIMS Tab-separated data', async ({ page }) => {
    const aimsData = [
      '1\tCASE\tCS101\tCOMPUTER SCIENCE 1\t3\tCS1-AP4\tM,W | 07:30AM-09:00AM | R101\tR101\t40\t20\t0\tNo',
      '2\tCASE\tMAT101\tCALCULUS 1\t3\tMAT1-AP4\tT,TH | 10:30AM-12:00PM | R102\tR102\t40\t20\t0\tNo',
    ].join('\n');

    // Switch to AIMS mode
    await page.getByRole('button', { name: /Select AIMS/i }).click();

    // Find textarea and fill it
    const textarea = page.getByRole('textbox', { name: /AIMS.*data input/i });
    await textarea.fill(aimsData);

    // Click Import button
    const importBtn = page.getByRole('button', { name: /^Import AIMS Data$/i });
    await importBtn.click();

    // Verify course table shows imported courses
    const table = page.getByRole('table').first();
    await expect(table).toContainText('CS101');
    await expect(table).toContainText('MAT101');
    await expect(table).toContainText('CS1-AP4');
    await expect(table).toContainText('MAT1-AP4');
  });

  test('should import WITS HTML Table data', async ({ page }) => {
    const htmlData = `
      <p class="MuiTypography-root MuiTypography-body1 css-15vuy4d">IT344 - Systems Administration and Maintenance (3.0 units)</p>
      <tbody class="MuiTableBody-root">
          <tr class="MuiTableRow-root">
              <td class="MuiTableCell-root">G1</td>
              <td class="MuiTableCell-root">C0</td>
              <td class="MuiTableCell-root">08:00 AM - 12:00 PM</td>
              <td class="MuiTableCell-root">WFM</td>
              <td class="MuiTableCell-root">FIELD</td>
              <td class="MuiTableCell-root">LEC</td>
              <td class="MuiTableCell-root">39/40</td>
              <td class="MuiTableCell-root">In-Person</td>
              <td class="MuiTableCell-root"></td>
              <td class="MuiTableCell-root">Open</td>
          </tr>
      </tbody>
    `;

    // Switch to WITS mode
    await page.getByRole('button', { name: /Select WITS/i }).click();

    // Find textarea and fill it
    const textarea = page.getByRole('textbox', { name: /WITS.*data input/i });
    await textarea.fill(htmlData);

    // Click Import button
    const importBtn = page.getByRole('button', { name: /^Import WITS Data$/i });
    await importBtn.click();

    // Verify course table shows imported course
    const table = page.getByRole('table').first();
    await expect(table).toContainText('IT344');
    await expect(table).toContainText('Systems Administration and Maintenance');
    await expect(table).toContainText('G1');
  });

  test('should import Compact variation data', async ({ page }) => {
    const compactData = 'G1 C0 08:00 AM - 12:00 PM WFM FIELD LEC 39/40 In-Person Open';

    // Compact is tried as a fallback in parseRawCourseData
    await page.getByRole('button', { name: /Select AIMS/i }).click();
    const textarea = page.getByRole('textbox', { name: /AIMS.*data input/i });
    await textarea.fill(compactData);
    await page.getByRole('button', { name: /^Import AIMS Data$/i }).click();

    const table = page.getByRole('table').first();
    await expect(table).toContainText('C0');
    await expect(table).toContainText('G1');
  });

  test('should import Space-separated single-line data', async ({ page }) => {
    const spaceData =
      '1 CMBA ACCTG133 Managerial Economics 3 A1-AP4 F 9:00AM-10:30AM RTL313 LEC T 9:00AM-10:30AM RTL313 LEC RTL313 48 47 0 No';

    await page.getByRole('button', { name: /Select AIMS/i }).click();
    const textarea = page.getByRole('textbox', { name: /AIMS.*data input/i });
    await textarea.fill(spaceData);
    await page.getByRole('button', { name: /^Import AIMS Data$/i }).click();

    const table = page.getByRole('table').first();
    await expect(table).toContainText('ACCTG133');
    await expect(table).toContainText('A1-AP4');
  });

  test('should handle invalid data gracefully', async ({ page }) => {
    // 1. Switch to AIMS mode
    await page.getByRole('button', { name: /Select AIMS/i }).click();

    // 2. Paste garbage data
    const textarea = page.getByRole('textbox', { name: /AIMS.*data input/i });
    await textarea.fill('this is not valid course data');

    // 3. Click Import button
    await page.getByRole('button', { name: /^Import AIMS Data$/i }).click();

    // 4. Verify error toast is shown
    // Note: The app uses a custom toast notification system with role="alert"
    const toast = page.getByRole('alert');
    await expect(toast).toContainText(/No courses found using AIMS format/i);
    await expect(toast).toHaveClass(/bg-danger/);
  });
});
