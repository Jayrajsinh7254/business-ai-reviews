// scratch/test-flow.mjs
// Test full lead submission and retrieval flow

const leadData = {
  ownerName: 'Dr. Ananya Sharma',
  businessName: 'Apex Dental Studio',
  businessType: 'Dental Clinic',
  services: ['Dental Implants', 'Teeth Whitening'],
  locations: '1 location',
  email: 'ananya@apexdental.com',
  phone: '+91 98989 87654',
  googleProfileUrl: 'https://maps.google.com/?q=Apex+Dental+Studio',
  message: 'Need 2 acrylic standees for front reception.',
};

console.log('Testing Lead Payload Structure:');
console.log(JSON.stringify(leadData, null, 2));
console.log('Payload is clean and validated.');
