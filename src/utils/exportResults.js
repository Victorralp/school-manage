/**
 * Export Results Utility
 * Handles exporting exam results to PDF and Excel formats
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export results to PDF
 * @param {Array} results - Array of result objects
 * @param {Array} students - Array of student objects
 * @param {Array} exams - Array of exam objects
 * @param {Object} schoolInfo - School information
 */
export const exportResultsToPDF = (results, students, exams, schoolInfo = {}) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Exam Results Report', 14, 20);
  
  // Add school info if available
  if (schoolInfo.name) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`School: ${schoolInfo.name}`, 14, 30);
  }
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, schoolInfo.name ? 36 : 30);
  
  // Prepare table data
  const tableData = results.map(result => {
    const student = students.find(s => s.id === result.studentId);
    const exam = exams.find(e => e.id === result.examId);
    const percentage = ((result.score / result.totalQuestions) * 100).toFixed(1);
    const status = percentage >= 50 ? 'Pass' : 'Fail';
    
    return [
      student?.name || 'Unknown',
      exam?.title || 'Unknown',
      exam?.subject || 'N/A',
      `${result.score}/${result.totalQuestions}`,
      `${percentage}%`,
      status,
      result.timestamp?.toDate().toLocaleDateString() || 'N/A'
    ];
  });
  
  // Add table
  doc.autoTable({
    startY: schoolInfo.name ? 42 : 36,
    head: [['Student', 'Exam', 'Subject', 'Score', 'Percentage', 'Status', 'Date']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 15 },
      6: { cellWidth: 25 }
    },
    didParseCell: function(data) {
      // Color code the status column
      if (data.column.index === 5 && data.section === 'body') {
        if (data.cell.text[0] === 'Pass') {
          data.cell.styles.textColor = [34, 197, 94]; // Green
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.text[0] === 'Fail') {
          data.cell.styles.textColor = [239, 68, 68]; // Red
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });
  
  // Add summary statistics
  const finalY = doc.lastAutoTable.finalY || 42;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Summary Statistics', 14, finalY + 15);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  const totalResults = results.length;
  const averageScore = totalResults > 0
    ? (results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / totalResults).toFixed(2)
    : 0;
  const passCount = results.filter(r => (r.score / r.totalQuestions) * 100 >= 50).length;
  const passRate = totalResults > 0 ? ((passCount / totalResults) * 100).toFixed(1) : 0;
  
  doc.text(`Total Submissions: ${totalResults}`, 14, finalY + 23);
  doc.text(`Average Score: ${averageScore}%`, 14, finalY + 30);
  doc.text(`Pass Rate: ${passRate}% (${passCount}/${totalResults})`, 14, finalY + 37);
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  const fileName = `exam_results_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

/**
 * Export results to Excel
 * @param {Array} results - Array of result objects
 * @param {Array} students - Array of student objects
 * @param {Array} exams - Array of exam objects
 * @param {Object} schoolInfo - School information
 */
export const exportResultsToExcel = (results, students, exams, schoolInfo = {}) => {
  // Prepare data for Excel
  const excelData = results.map(result => {
    const student = students.find(s => s.id === result.studentId);
    const exam = exams.find(e => e.id === result.examId);
    const percentage = ((result.score / result.totalQuestions) * 100).toFixed(1);
    const status = percentage >= 50 ? 'Pass' : 'Fail';
    
    return {
      'Student Name': student?.name || 'Unknown',
      'Student Email': student?.email || 'N/A',
      'Exam Title': exam?.title || 'Unknown',
      'Subject': exam?.subject || 'N/A',
      'Score': result.score,
      'Total Questions': result.totalQuestions,
      'Percentage': `${percentage}%`,
      'Status': status,
      'Time Taken (mins)': result.timeTaken ? Math.round(result.timeTaken / 60) : 'N/A',
      'Date': result.timestamp?.toDate().toLocaleDateString() || 'N/A',
      'Time': result.timestamp?.toDate().toLocaleTimeString() || 'N/A'
    };
  });
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Student Name
    { wch: 25 }, // Student Email
    { wch: 30 }, // Exam Title
    { wch: 15 }, // Subject
    { wch: 8 },  // Score
    { wch: 15 }, // Total Questions
    { wch: 12 }, // Percentage
    { wch: 10 }, // Status
    { wch: 15 }, // Time Taken
    { wch: 12 }, // Date
    { wch: 12 }  // Time
  ];
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Results');
  
  // Create summary sheet
  const totalResults = results.length;
  const averageScore = totalResults > 0
    ? (results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / totalResults).toFixed(2)
    : 0;
  const passCount = results.filter(r => (r.score / r.totalQuestions) * 100 >= 50).length;
  const passRate = totalResults > 0 ? ((passCount / totalResults) * 100).toFixed(1) : 0;
  
  const summaryData = [
    { Metric: 'School Name', Value: schoolInfo.name || 'N/A' },
    { Metric: 'Report Date', Value: new Date().toLocaleDateString() },
    { Metric: '', Value: '' },
    { Metric: 'Total Submissions', Value: totalResults },
    { Metric: 'Average Score', Value: `${averageScore}%` },
    { Metric: 'Students Passed', Value: passCount },
    { Metric: 'Students Failed', Value: totalResults - passCount },
    { Metric: 'Pass Rate', Value: `${passRate}%` }
  ];
  
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  
  // Save the Excel file
  const fileName = `exam_results_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * Export single exam results to PDF
 * @param {Object} exam - Exam object
 * @param {Array} results - Array of result objects for this exam
 * @param {Array} students - Array of student objects
 * @param {Object} schoolInfo - School information
 */
export const exportExamResultsToPDF = (exam, results, students, schoolInfo = {}) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Exam Results Report', 14, 20);
  
  // Add exam info
  doc.setFontSize(14);
  doc.text(exam.title, 14, 30);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Subject: ${exam.subject}`, 14, 38);
  doc.text(`Teacher: ${exam.teacherName || 'N/A'}`, 14, 44);
  if (schoolInfo.name) {
    doc.text(`School: ${schoolInfo.name}`, 14, 50);
  }
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, schoolInfo.name ? 56 : 50);
  
  // Prepare table data
  const tableData = results.map((result, index) => {
    const student = students.find(s => s.id === result.studentId);
    const percentage = ((result.score / result.totalQuestions) * 100).toFixed(1);
    const status = percentage >= 50 ? 'Pass' : 'Fail';
    
    return [
      index + 1,
      student?.name || 'Unknown',
      `${result.score}/${result.totalQuestions}`,
      `${percentage}%`,
      status,
      result.timestamp?.toDate().toLocaleDateString() || 'N/A'
    ];
  });
  
  // Add table
  doc.autoTable({
    startY: schoolInfo.name ? 62 : 56,
    head: [['#', 'Student Name', 'Score', 'Percentage', 'Status', 'Date']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30, halign: 'center' }
    },
    didParseCell: function(data) {
      if (data.column.index === 4 && data.section === 'body') {
        if (data.cell.text[0] === 'Pass') {
          data.cell.styles.textColor = [34, 197, 94];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.text[0] === 'Fail') {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });
  
  // Add summary
  const finalY = doc.lastAutoTable.finalY || 62;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Summary', 14, finalY + 15);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  const totalResults = results.length;
  const averageScore = totalResults > 0
    ? (results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / totalResults).toFixed(2)
    : 0;
  const passCount = results.filter(r => (r.score / r.totalQuestions) * 100 >= 50).length;
  const passRate = totalResults > 0 ? ((passCount / totalResults) * 100).toFixed(1) : 0;
  
  doc.text(`Total Submissions: ${totalResults}`, 14, finalY + 23);
  doc.text(`Average Score: ${averageScore}%`, 14, finalY + 30);
  doc.text(`Pass Rate: ${passRate}% (${passCount}/${totalResults})`, 14, finalY + 37);
  
  // Save
  const fileName = `${exam.title.replace(/[^a-z0-9]/gi, '_')}_results.pdf`;
  doc.save(fileName);
};
