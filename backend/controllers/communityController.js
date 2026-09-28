const prisma = require('../config/db');

// ดึงรายการกระทู้ทั้งหมด
exports.getPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: { author: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// สร้างกระทู้ใหม่
exports.createPost = async (req, res) => {
  try {
    const { title, content, isAnonymous } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(400).json({ message: 'ไม่พบบัญชีผู้ใช้ กรุณาเข้าสู่ระบบใหม่' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(400).json({ message: 'ไม่พบบัญชีผู้ใช้ กรุณาเข้าสู่ระบบใหม่' });
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        isAnonymous: Boolean(isAnonymous),
        authorId: user.id,
      },
    });
    return res.status(201).json(post);
  } catch (error) {
    console.error('Create community post error:', error);

    if (error?.code === 'P2003') {
      return res.status(400).json({ message: 'ไม่พบบัญชีผู้ใช้ กรุณาเข้าสู่ระบบใหม่' });
    }

    return res.status(500).json({ message: 'ไม่สามารถสร้างกระทู้ได้ กรุณาลองใหม่อีกครั้ง' });
  }
};

// ดึงรายละเอียดกระทู้ + คอมเมนต์เฉพาะของกระทู้นั้นๆ
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: id },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        comments: {
          where: { postId: id },
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: 'ไม่พบกระทู้นี้' });
    }

    return res.json({ post });
  } catch (error) {
    console.error('Get post by id error:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลกระทู้' });
  }
};

// ผูกไว้ป้องกันกรณีที่ backend/routes/communityRoutes.js เรียกใช้ชื่อ getPostDetail
exports.getPostDetail = exports.getPostById;