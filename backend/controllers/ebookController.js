const prisma = require('../config/db');

// 1. ดึงรายการหนังสือทั้งหมด (พร้อมระบบค้นหา)
exports.getEbooks = async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId.trim() : '';
    const ebooks = await prisma.ebook.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        ...(search ? {
          OR: [
            { title: { contains: search } },
            { author: { contains: search } },
            { Category: { name: { contains: search } } },
          ],
        } : {}),
      },
      include: { Category: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(ebooks.map(ebook => ({
      ...ebook,
      authorName: ebook.author,
      pdfUrl: ebook.fileUrl,
      category: ebook.Category?.name ?? null,
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. ดึงรายการหมวดหมู่หนังสือ
exports.getCategories = async (req, res) => {
  try {
    if (prisma.category) {
      const categories = await prisma.category.findMany();
      return res.json(categories);
    }
    const ebooks = await prisma.ebook.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    const categories = ebooks.map(b => b.category).filter(Boolean);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. ดึงรายละเอียดหนังสือรายเล่ม
// 3. ดึงรายละเอียดหนังสือรายเล่ม
exports.getEbookDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ebook = await prisma.ebook.findUnique({
      where: {
        id: id // 🟢 ใช้ id เป็น String ตรงๆ ตามประเภทข้อมูลใน Prisma Schema
      }
    });

    if (!ebook) {
      return res.status(404).json({ message: 'ไม่พบหนังสือเล่มนี้' });
    }

    res.json(ebook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. ดึงรายการหนังสือเล่มโปรดของผู้ใช้
exports.getFavorites = async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.userId },
      include: { ebook: true }
    });
    res.json(favorites.map(f => f.ebook));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. เพิ่ม/ลบ หนังสือเล่มโปรด
exports.toggleFavorite = async (req, res) => {
  try {
    const { ebookId } = req.params;
    const existing = await prisma.favorite.findUnique({
      where: { userId_ebookId: { userId: req.user.userId, ebookId } }
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      res.json({ message: 'Removed from favorites', isFavorite: false });
    } else {
      await prisma.favorite.create({
        data: { userId: req.user.userId, ebookId }
      });
      res.json({ message: 'Added to favorites', isFavorite: true });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createEbook = async (req, res) => {
  try {
    // 🟢 เปลี่ยนจากรับค่า category เป็น categoryId
    const { title, authorName, author, categoryId, description, price, isFree } = req.body;

    const coverFile = req.files && req.files['cover'] ? req.files['cover'][0] : null;
    const pdfFile = req.files && req.files['pdf'] ? req.files['pdf'][0] : null;

    const coverUrl = coverFile ? `/uploads/ebooks/covers/${coverFile.filename}` : '';
    const fileUrl = pdfFile ? `/uploads/ebooks/pdfs/${pdfFile.filename}` : '';

    const newEbook = await prisma.ebook.create({
      data: {
        title,
        author: authorName || author || '',
        // 🟢 categoryId เป็น String ตาม ID ของหมวดหมู่ในฐานข้อมูล
        categoryId: categoryId || undefined,
        description: description || '',
        coverUrl,
        fileUrl,
        price: price ? parseFloat(price) : 0,
        isFree: isFree === 'true' || isFree === true,
      }
    });

    res.status(201).json(newEbook);
  } catch (error) {
    console.error('Create Ebook Error:', error);
    res.status(500).json({ error: error.message });
  }
};