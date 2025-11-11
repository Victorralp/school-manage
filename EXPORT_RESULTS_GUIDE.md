# Export Results Feature

## Overview
Teachers and school administrators can now export exam results in PDF and Excel formats for reporting, analysis, and record-keeping.

## Features

### PDF Export
- **Professional formatting** with school branding
- **Detailed results table** with student names, scores, and percentages
- **Color-coded status** (Pass/Fail)
- **Summary statistics** including:
  - Total submissions
  - Average score
  - Pass rate
- **Multi-page support** with page numbers
- **Automatic file naming** with date

### Excel Export
- **Two worksheets**:
  1. **Results** - Detailed data with all student information
  2. **Summary** - Key metrics and statistics
- **Formatted columns** with appropriate widths
- **Additional data** including:
  - Student email addresses
  - Time taken for each exam
  - Detailed timestamps
- **Easy to analyze** in Excel or Google Sheets

## How to Use

### For Teachers

1. **Navigate to Results Tab**
   - Go to your Teacher Dashboard
   - Click on the "Results" tab

2. **Export All Results**
   - Click "Export PDF" button to download a PDF report
   - Click "Export Excel" button to download an Excel spreadsheet

3. **Files are automatically downloaded** to your default downloads folder

### For School Administrators

The same export functionality is available in the School Dashboard with additional school-wide data.

## File Naming Convention

- **PDF**: `exam_results_YYYY-MM-DD.pdf`
- **Excel**: `exam_results_YYYY-MM-DD.xlsx`

## Data Included

### Student Information
- Student name
- Student email (Excel only)
- Exam title
- Subject

### Performance Metrics
- Raw score (e.g., 8/10)
- Percentage score
- Pass/Fail status
- Time taken (Excel only)
- Submission date and time

### Summary Statistics
- Total number of submissions
- Average score across all students
- Pass rate percentage
- Number of students who passed/failed

## Use Cases

1. **Progress Reports** - Generate reports for parent-teacher meetings
2. **Performance Analysis** - Analyze trends in Excel
3. **Record Keeping** - Maintain permanent records of exam results
4. **School Administration** - Share results with school management
5. **Accreditation** - Provide documentation for accreditation purposes

## Technical Details

### Dependencies
- `jspdf` - PDF generation
- `jspdf-autotable` - Table formatting in PDFs
- `xlsx` - Excel file generation

### Browser Compatibility
Works in all modern browsers (Chrome, Firefox, Safari, Edge)

## Future Enhancements

Potential future features:
- Export individual exam results
- Custom date range filtering
- Export to CSV format
- Email reports directly
- Scheduled automatic exports
- Custom report templates
