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

// Transcribed data from the February image
const rawData = {
  "11": 14.672,
  "12": 46.928,
  "13": 109.574,
  "14": 242.669,
  "15": 29.365,
  "16": 17.110,
  "21": 23.242,
  "22": 35.835,
  "23": 170.998,
  "24": 241.207,
  "25": 137.027,
  "26": 99.715,
  "31": 237.624,
  "32": 29.969,
  "33": 39.980,
  "34": 123.928,
  "35": 46.881,
  "36": 657.293,
  "41": 10.468,
  "42": 74.515,
  "43": 161.952,
  "44": 91.224,
  "45": 9.242,
  "46": 64.551,
  "51": 80.218,
  "52": 32.250,
  "53": 134.337,
  "54": 69.150,
  "55": 112.728,
  "56": 24.975,
  "61": 62.204,
  "62": 102.583,
  "63": 92.117,
  "64": 0.032,
  "65": 11.077,
  "66": 26.581,
  "71": 50.825,
  "72": 179.775,
  "73": 87.426,
  "74": 98.800,
  "75": 111.403,
  "76": 45.410,
  "81": 42.494,
  "82": 9.286,
  "83": 114.395,
  "84": 213.041,
  "85": 133.708,
  "86": 46.865,
  "91": 33.811,
  "92": 68.228,
  "93": 84.241,
  "94": 286.691,
  "95": 82.543,
  "96": 51.828,
  "101": 10.450,
  "102": 35.980,
  "103": 77.025,
  "104": 99.635,
  "105": 3.624,
  "106": 107.703,
  "Cozinha": 31.802
};

async function main() {
  console.log('Fetching all units from the database...');
  const units = await prisma.unit.findMany();
  console.log(`Loaded ${units.length} units.`);

  const month = 2; // February
  const year = 2026;
  const readAt = new Date('2026-02-28T12:00:00Z'); // Last day of February

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
  console.log(`Verified: ${count} gas readings exist for February 2026.`);
}

main()
  .catch(e => {
    console.error('Import failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
