const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto'); // นำเข้าเครื่องมือสำหรับสุ่ม ID ของ Node.js
const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'กฎหมายแพ่งและพาณิชย์' },
    { name: 'กฎหมายอาญา' },
    { name: 'กฎหมายวิธีพิจารณาความ' },
    { name: 'กฎหมายมหาชนและปกครอง' },
    { name: 'กฎหมายแรงงานและภาษี' },
  ];

  for (const cat of categories) {
    // 1. ค้นหาดูก่อนว่ามีหมวดหมู่นี้ในระบบหรือยัง
    const existingCategory = await prisma.category.findFirst({
      where: { name: cat.name },
    });

    // 2. ถ้ายังไม่มี ให้สร้างใหม่โดยเพิ่ม id เข้าไป
    if (!existingCategory) {
      await prisma.category.create({
        data: {
          id: crypto.randomUUID(), // สุ่ม ID เป็น String แบบ UUID
          name: cat.name
        },
      });
      console.log(`Created category: ${cat.name}`);
    } else {
      console.log(`Category already exists: ${cat.name}`);
    }
  }

  console.log('Seeded legal categories successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });