/* ==========================================================================
   SCHOOL CONFIGURATION
   Everything school-specific that the admissions portal shows lives here.
   To present the portal for another school, edit this object only.
   (The homepage still has its copy in index.html; it can adopt this later.)
   ========================================================================== */
window.SCHOOL_CONFIG = {
  name: 'MC Royal Schools',
  shortName: 'MC Royal',
  motto: 'Excellence Through Learning',
  logo: '/assets/images/logo.png',
  logoAlt: 'MC Royal Schools logo',
  websiteUrl: '/',

  colors: {
    primary: '#6B3E8C',   // Royal Purple
    secondary: '#8663A6', // Heritage Violet
    soft: '#F8F4FC',      // Soft Lavender
    ink: '#0F172A',       // Deep Slate
    muted: '#475569',     // Muted Slate
    accent: '#C99738'     // Regal Gold (use sparingly)
  },

  admissions: {
    session: '2026 / 2027 Academic Session',
    levels: ['Nursery', 'Primary', 'College'],
    estimatedTime: '10–15 minutes',
    // Demo reference format: PREFIX-YEAR-0001
    referencePrefix: 'MCR',
    referenceYear: 2026,
    // Landing image (an existing project photograph)
    image: '/assets/images/admissions-arrival.jpg',
    imageAlt: 'Students walking across the school forecourt toward the entrance',

    classGroups: [
      { label: 'Nursery', options: ['Nursery 1', 'Nursery 2'] },
      { label: 'Primary', options: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'] },
      { label: 'College', options: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'] }
    ],
    entryTerms: [
      '2026 / 2027 — First Term',
      '2026 / 2027 — Second Term',
      '2026 / 2027 — Third Term'
    ],
    relationships: ['Mother', 'Father', 'Legal Guardian', 'Grandparent', 'Other Relative'],
    documents: [
      { key: 'passport', title: 'Passport Photograph', description: 'A recent, clear photograph of the student against a plain background.', accept: '.jpg,.jpeg,.png', types: 'JPG or PNG' },
      { key: 'birthCertificate', title: 'Birth Certificate', description: 'A scan or clear photo of the student’s birth certificate.', accept: '.pdf,.jpg,.jpeg,.png', types: 'PDF, JPG or PNG' },
      { key: 'previousResult', title: 'Previous School Result', description: 'The student’s most recent report card or result sheet.', accept: '.pdf,.jpg,.jpeg,.png', types: 'PDF, JPG or PNG' },
      { key: 'other', title: 'Other Supporting Document', description: 'Anything else you would like the admissions team to see.', accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', types: 'PDF, image or Word document' }
    ],
    maxFileSizeMB: 5,
    storageKey: 'school-demo-admissions'
  }
};
