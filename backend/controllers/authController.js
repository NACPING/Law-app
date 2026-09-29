const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// สมัครสมาชิก (Register)
exports.register = async (req, res) => {
  try {
    const { idCardOrPass, idCard, firstName, lastName, email, password, phone, dob, dateOfBirth } = req.body;
    const cardVal = idCard || idCardOrPass; // รองรับทั้งสองชื่อ
    const dobVal = dateOfBirth || dob;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { idCard: cardVal }
        ]
      }
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or ID/Passport already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        idCard: cardVal,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        dateOfBirth: dobVal ? new Date(dobVal) : null,
      }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'supersecretkey_lawapp_2026',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registered successfully',
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// เข้าสู่ระบบ (Login)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'supersecretkey_lawapp_2026',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ดึงข้อมูลผู้ใช้ปัจจุบัน (Get Profile /me)
exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        posts: true,
        lawyerRequests: true,
        favorites: {
          include: {
            ebook: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, ...profile } = user;
    return res.json(profile);
  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMe = async (req, res) => {
  const { firstName, lastName, phone } = req.body || {};

  if (
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    (phone !== null && typeof phone !== 'string')
  ) {
    return res.status(400).json({ message: 'ข้อมูลโปรไฟล์ไม่ถูกต้อง' });
  }

  const normalizedFirstName = firstName.trim();
  if (!normalizedFirstName) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อ' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        firstName: normalizedFirstName,
        lastName: lastName.trim(),
        phone: typeof phone === 'string' ? phone.trim() || null : null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
      },
    });

    return res.json(user);
  } catch (error) {
    console.error('Update user profile error:', error);
    return res.status(500).json({ message: 'ไม่สามารถอัปเดตข้อมูลโปรไฟล์ได้' });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
    }

    const userId = req.user.userId;
    // สร้าง path รูปภาพสำหรับอ้างอิง
    const avatarUrl = `/uploads/${req.file.filename}`;

    // อัปเดตข้อมูล avatarUrl ลงใน Database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    return res.json({
      message: 'อัปโหลดรูปโปรไฟล์สำเร็จ',
      avatarUrl: updatedUser.avatarUrl,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' });
  }
};