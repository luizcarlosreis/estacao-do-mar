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

// Transcribed data from the image
const rawData = {
  "11": 14.672,
  "12": 46.592,
  "13": 109.467,
  "14": 241.484,
  "15": 29.025,
  "16": 17.110,
  "21": 23.207,
  "22": 35.805,
  "23": 169.084,
  "24": 239.127,
  "25": 135.385,
  "26": 98.624,
  "31": 236.816,
  "32": 29.969,
  "33": 39.980,
  "34": 122.644,
  "35": 46.518,
  "36": 655.904,
  "41": 10.177,
  "42": 74.336,
  "43": 161.864,
  "44": 91.114,
  "45": 9.242,
  "46": 63.247,
  "51": 80.043,
  "52": 32.208,
  "53": 133.627,
  "54": 68.773,
  "55": 112.494,
  "56": 24.938,
  "61": 61.498,
  "62": 101.851,
  "63": 91.638,
  "64": 0.032,
  "65": 10.964,
  "66": 25.913,
  "71": 50.585,
  "72": 178.244,
  "73": 85.535,
  "74": 98.579,
  "75": 111.279,
  "76": 44.934,
  "81": 41.923,
  "82": 9.149,
  "83": 113.261,
  "84": 211.042,
  "85": 132.585,
  "86": 46.383,
  "91": 33.651,
  "92": 67.929,
  "93": 84.241,
  "94": 285.814,
  "95": 81.630,
  "96": 51.752,
  "101": 10.374,
  "102": 34.269,
  "103": 76.391,
  "104": 98.610,
  "105": 3.586,
  "106": 106.901,
  "Cozinha": 31.460
};

async function main() {
  console.log('Fetching all units from the database...');
  const units = await prisma.unit.findMany();
  console.log(`Loaded ${units.length} units.`);

  const month = 1;
  const year = 2026;
  const readAt = new Date('2026-01-31T12:00:00Z'); // Last day of January

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
  console.log(`Verified: ${count} gas readings exist for January 2026.`);
}

main()
  .catch(e => {
    console.error('Import failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
