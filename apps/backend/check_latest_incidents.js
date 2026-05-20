const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, 'data-store', 'store.json');
if (!fs.existsSync(storePath)) {
  console.log('Store file does not exist.');
  process.exit(1);
}

try {
  console.log('Reading store.json...');
  const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const incidents = data.incidents || [];
  const reports = data.reports ? Object.values(data.reports) : [];
  
  console.log(`Total incidents: ${incidents.length}`);
  console.log(`Total reports: ${reports.length}`);
  
  if (incidents.length > 0) {
    console.log('\nTop 5 Latest Incidents:');
    const latestIncidents = incidents.slice(0, 5);
    latestIncidents.forEach((inc, idx) => {
      console.log(`${idx + 1}. [${inc.status}] Type: ${inc.type}, Title: "${inc.title}", Time: ${inc.timestamp || inc.createdAt}`);
    });
  }

  if (reports.length > 0) {
    console.log('\nTop 5 Latest Reports:');
    const sortedReports = reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestReports = sortedReports.slice(0, 5);
    latestReports.forEach((rep, idx) => {
      console.log(`${idx + 1}. [${rep.status}] Type: ${rep.type}, Description: "${rep.description.substring(0, 80)}...", Created: ${rep.createdAt}`);
    });
  }
} catch (err) {
  console.error('Failed to parse store.json:', err);
}
