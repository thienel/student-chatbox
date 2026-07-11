export function isAllowedStudentEmail(email: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  
  const envDomains = process.env.ALLOWED_STUDENT_EMAIL_DOMAINS;
  const allowedDomains = envDomains 
    ? envDomains.split(',').map(d => d.trim().toLowerCase())
    : ['@student.fpt.edu.vn', '@fpt.edu.vn', '@fu.edu.vn'];
    
  return allowedDomains.some(domain => normalized.endsWith(domain));
}
