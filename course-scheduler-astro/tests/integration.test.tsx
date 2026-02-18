/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '@/components/App';

// Mock html-to-image and jspdf as they are not needed for integration tests
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,test'),
}));

vi.mock('jspdf', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      addImage: vi.fn(),
      save: vi.fn(),
      setFontSize: vi.fn(),
      text: vi.fn(),
    })),
  };
});

describe('App Integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the main app components', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /Import Your Schedule/i })).toBeInTheDocument();
    expect(screen.getByText(/User Preferences/i)).toBeInTheDocument();
    expect(screen.getByText(/Course Filters/i)).toBeInTheDocument();
  });

  it('handles the full data import and interaction flow', async () => {
    render(<App />);

    // Switch to AIMS mode
    fireEvent.click(screen.getByRole('button', { name: /select aims/i }));
    const aimsTextarea = screen.getByRole('textbox', { name: /AIMS \(Legacy\) data input/i });
    const importButton = screen.getByRole('button', { name: /^Import AIMS Data$/i });

    // Valid AIMS data
    const aimsData =
      '1\tCASE\tCS101\tCOMPUTER SCIENCE 1\t3\tCS1-AP4\tM-W 7:30AM-9:00AM R101\tR101\t40\t20\t0\tNo';
    fireEvent.change(aimsTextarea, { target: { value: aimsData } });
    fireEvent.click(importButton);

    // Verify import success
    expect(await screen.findByText(/Successfully imported 1 courses/i)).toBeInTheDocument();

    // Check in table specifically
    const table = screen.getByRole('table');
    expect(table).toHaveTextContent(/CS101/i);

    // Test locking
    const lockButton = screen.getByTitle(/Lock Course/i);
    fireEvent.click(lockButton);

    // Timetable heading should appear
    expect(await screen.findByRole('heading', { name: /^Weekly Timetable$/i })).toBeInTheDocument();
    expect(screen.getByTitle(/Unlock Course/i)).toBeInTheDocument();

    // Clear textarea to avoid ambiguous matches later
    fireEvent.change(aimsTextarea, { target: { value: '' } });

    // Test deletion
    const deleteButton = screen.getByLabelText(/delete course/i);
    fireEvent.click(deleteButton);

    // Verify deletion from table
    await waitFor(() => {
      expect(table).not.toHaveTextContent(/CS101/i);
    });
  });

  it('shows error state when import fails', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /select aims/i }));
    const aimsTextarea = screen.getByRole('textbox', { name: /AIMS \(Legacy\) data input/i });
    const importButton = screen.getByRole('button', { name: /^Import AIMS Data$/i });

    fireEvent.change(aimsTextarea, { target: { value: 'invalid' } });
    fireEvent.click(importButton);

    expect(await screen.findByText(/No courses found using AIMS format/i)).toBeInTheDocument();
  });

  it('handles schedule generation flow', async () => {
    render(<App />);

    const aimsData =
      '1\tCASE\tCS101\tCOMPUTER SCIENCE 1\t3\tCS1-AP4\tM-W 7:30AM-9:00AM R101\tR101\t40\t20\t0\tNo\n' +
      '2\tCASE\tMAT101\tCALCULUS 1\t3\tMAT1-AP4\tT-TH 10:30AM-12:00PM R102\tR102\t40\t20\t0\tNo';

    fireEvent.click(screen.getByRole('button', { name: /select aims/i }));
    const aimsTextarea = screen.getByRole('textbox', { name: /AIMS \(Legacy\) data input/i });
    fireEvent.change(aimsTextarea, { target: { value: aimsData } });
    fireEvent.click(screen.getByRole('button', { name: /^Import AIMS Data$/i }));

    expect(await screen.findByText(/Successfully imported 2 courses/i)).toBeInTheDocument();

    const generateButton = screen.getByRole('button', { name: /Generate Schedule/i });
    fireEvent.click(generateButton);

    // Wait for generation to finish and timetable to appear
    expect(await screen.findByText(/Generated schedule #1 with 2 courses/i)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /^Weekly Timetable$/i })).toBeInTheDocument();

    // Check for entries in the document (one in table, at least one in timetable)
    const courseEntries = screen.getAllByText(/CS101/i);
    expect(courseEntries.length).toBeGreaterThan(1);
  }, 10000);
});
