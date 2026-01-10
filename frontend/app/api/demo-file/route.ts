import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  // Create demo security questionnaire
  const demoQuestions = [
    ["Category", "Question"],
    ["Access Control", "Does your organization have a formal access control policy?"],
    ["Access Control", "How are user access rights reviewed and updated?"],
    ["Access Control", "Is multi-factor authentication (MFA) required for all users?"],
    ["Data Protection", "What encryption standards are used for data at rest?"],
    ["Data Protection", "How is data classified and labeled within your organization?"],
    ["Data Protection", "Describe your data backup and recovery procedures."],
    ["Incident Response", "Do you have a documented incident response plan?"],
    ["Incident Response", "How quickly are security incidents detected and reported?"],
    ["Incident Response", "Describe your post-incident review process."],
    ["Vendor Management", "How do you assess third-party vendor security?"],
    ["Vendor Management", "Are vendors required to comply with your security policies?"],
    ["Compliance", "List all security certifications your organization holds."],
    ["Compliance", "How often are security audits conducted?"],
    ["Network Security", "Describe your network segmentation strategy."],
    ["Network Security", "How is network traffic monitored for threats?"],
    ["Network Security", "What intrusion detection/prevention systems are in place?"],
    ["Employee Training", "Is security awareness training mandatory for all employees?"],
    ["Employee Training", "How often is security training conducted?"],
    ["Physical Security", "Describe physical access controls to data centers."],
    ["Physical Security", "How are visitors managed in secure areas?"],
    ["Business Continuity", "Do you have a business continuity plan?"],
    ["Business Continuity", "How often is the disaster recovery plan tested?"],
    ["Application Security", "Describe your secure software development lifecycle."],
    ["Application Security", "How are application vulnerabilities identified and remediated?"],
    ["Logging & Monitoring", "What events are logged across your systems?"],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(demoQuestions);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Security Questions");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=demo_security_questionnaire.xlsx",
    },
  });
}
