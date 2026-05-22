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

// Transcribed data from the March 2026 spreadsheet image
const rawData = {
  "11": 14.773,
  "12": 47.425,
  "13": 109.975,
  "14": 243.533,
  "15": 29.883,
  "16": 17.110,
  "21": 23.306,
  "22": 35.877,
  "23": 173.256,
  "24": 242.468,
  "25": 138.422,
  "26": 101.384,
  "31": 237.624,
  "32": 29.969,
  "33": 39.980,
  "34": 125.250,
  "35": 46.903,
  "36": 660.565,
  "41": 10.564,
  "42": 74.692,
  "43": 162.670,
  "44": 91.224,
  "45": 9.242,
  "46": 65.759,
  "51": 80.218,
  "52": 32.320,
  "53": 134.553,
  "54": 69.371,
  "55": 113.086,
  "56": 25.203,
  "61": 62.300,
  "62": 103.543,
  "63": 92.265,
  "64": 0.032,
  "65": 11.077,
  "66": 26.749,
  "71": 51.060,
  "72": 181.335,
  "73": 89.621,
  "74": 99.325,
  "75": 111.683,
  "76": 45.695,
  "81": 42.600,
  "82": 9.376,
  "83": 116.172,
  "84": 215.531,
  "85": 134.876,
  "86": 46.896,
  "91": 33.811,
  "92": 68.765,
  "93": 84.241,
  "94": 286.893,
  "95": 83.377,
  "96": 52.244,
  "101": 10.501,
  "102": 35.980,
  "103": 77.107,
  "104": 100.185,
  "105": 3.742,
  "106": 107.860,
  "Cozinha": 31.953
};

async function main() {
  console.log('Fetching all units from the database...');
  const units = await prisma.unit.findMany();
  console.log(`Loaded ${units.length} units.`);

  const month = 3; // March
  const year = 2026;
  const readAt = new Date('2026-03-31T12:00:00Z'); // Last day of March

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
  console.log(`Verified: ${count} gas readings exist for March 2026.`);
}

main()
  .catch(e => {
    console.error('Import failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
