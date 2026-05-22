const fs = require('fs');
const path = require('path');

// Manually load .env file
const dotenvPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(dotenvPath)) {
  const envConfig = fs.readFileSync(dotenvPath, 'utf8');
  for (const line of envConfig.split('\n')) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    const parts = trimmedLine.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Transcribed data from the April 2026 spreadsheet image
const rawData = {
  "11": 15.042,
  "12": 47.867,
  "13": 110.610,
  "14": 244.180,
  "15": 30.908,
  "16": 17.110,
  "21": 23.439,
  "22": 35.927,
  "23": 175.614,
  "24": 245.034,
  "25": 139.575,
  "26": 102.771,
  "31": 238.273,
  "32": 30.340,
  "33": 39.980,
  "34": 126.347,
  "35": 47.352,
  "36": 662.489,
  "41": 10.627,
  "42": 75.572,
  "43": 162.670,
  "44": 91.494,
  "45": 9.462,
  "46": 67.419,
  "51": 80.218,
  "52": 32.572,
  "53": 134.717,
  "54": 69.830,
  "55": 113.493,
  "56": 25.398,
  "61": 62.473,
  "62": 104.824,
  "63": 92.582,
  "64": 0.032,
  "65": 11.077,
  "66": 26.752,
  "71": 51.146,
  "72": 182.484,
  "73": 91.801,
  "74": 99.787,
  "75": 111.729,
  "76": 46.263,
  "81": 42.737,
  "82": 9.376,
  "83": 117.760,
  "84": 217.901,
  "85": 135.667,
  "86": 47.244,
  "91": 33.877,
  "92": 69.465,
  "93": 84.276,
  "94": 288.466,
  "95": 84.247,
  "96": 52.387,
  "101": 10.501,
  "102": 35.980,
  "103": 77.447,
  "104": 101.069,
  "105": 3.919,
  "106": 108.689,
  "Cozinha": 31.953
};

async function main() {
  console.log('Fetching all units from the database...');
  const units = await prisma.unit.findMany();
  console.log(`Loaded ${units.length} units.`);

  const month = 4; // April
  const year = 2026;
  const readAt = new Date('2026-04-30T12:00:00Z'); // Last day of April

  const operations = [];

  // 1. Process apartments
  for (const [aptNumber, val] of Object.entries(rawData)) {
    if (aptNumber === 'Cozinha') continue;

    // Find the unit with this number
    const unit = units.find(u => u.number === aptNumber);
    if (!unit) {
      console.warn(`WARNING: Apartment ${aptNumber} not found in database!`);
      continue;
    }

    operations.push({
      month,
      year,
      readAt,
      value: val,
      identifier: unit.id,
      unitId: unit.id
    });
  }

  // 2. Process Cozinha
  operations.push({
    month,
    year,
    readAt,
    value: rawData['Cozinha'],
    identifier: 'COZINHA',
    unitId: null
  });

  console.log(`Preparing to upsert ${operations.length} readings for Month: ${month}, Year: ${year}...`);

  // Execute in a transaction
  await prisma.$transaction(
    operations.map(op => {
      return prisma.gasReading.upsert({
        where: {
          month_year_identifier: {
            month: op.month,
            year: op.year,
            identifier: op.identifier
          }
        },
        update: {
          readAt: op.readAt,
          value: op.value,
          unitId: op.unitId
        },
        create: {
          month: op.month,
          year: op.year,
          readAt: op.readAt,
          value: op.value,
          identifier: op.identifier,
          unitId: op.unitId
        }
      });
    })
  );

  console.log('Upsert transaction completed successfully!');

  // Verify the count in the database
  const count = await prisma.gasReading.count({
    where: { month, year }
  });
  console.log(`Verified: ${count} gas readings exist for April 2026.`);
}

main()
  .catch(e => {
    console.error('Import failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
