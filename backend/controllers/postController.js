const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ดึงกระทู้ทั้งหมด (พร้อมจำนวนไลก์และคอมเมนต์)
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: { select: { firstName: true, lastName: true } },
        _count: { select: { comments: true, likes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลกระทู้ได้' });
  }
};

// ดึงรายละเอียดกระทู้ (พร้อมคอมเมนต์ทั้งหมด)
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { firstName: true, lastName: true } },
        comments: {
          include: { author: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'asc' }
        },
        _count: { select: { likes: true } }
      }
    });
    if (!post) return res.status(404).json({ error: 'ไม่พบกระทู้' });
    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงกระทู้' });
  }
};

// สร้างกระทู้ใหม่
exports.createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const authorId = req.user.id; // ดึงจาก authMiddleware

    const newPost = await prisma.post.create({
      data: { title, content, authorId }
    });
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'ไม่สามารถสร้างกระทู้ได้' });
  }
};

// สร้างคอมเมนต์
exports.createComment = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { content } = req.body;
    const authorId = req.user.id;

    const newComment = await prisma.comment.create({
      data: { content, postId, authorId }
    });
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'ไม่สามารถคอมเมนต์ได้' });
  }
};