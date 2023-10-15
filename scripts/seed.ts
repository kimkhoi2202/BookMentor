const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function main() {
  try {
    await db.category.createMany({
      data: [
        { name: 'Personal Development and Mindset' },
        { name: 'Negotiation and Communication' },
        { name: 'Financial Literacy and Success' },
        { name: 'Well-being and Life Balance' },
        { name: 'Literature Works' },
      ],
    });
  } catch (error) {
    console.error('Error seeding default categories:', error);
  } finally {
    await db.$disconnect();
  }
}

main();
