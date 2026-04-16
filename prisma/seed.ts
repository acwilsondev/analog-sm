import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      username: 'alice',
      email: 'alice@example.com',
      passwordHash,
      bio: 'Alice from Wonderland',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      username: 'bob',
      email: 'bob@example.com',
      passwordHash,
      bio: 'Bob the Builder',
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      username: 'charlie',
      email: 'charlie@example.com',
      passwordHash,
      bio: 'Charlie in the Chocolate Factory',
    },
  });

  // 2. Create Friendships (Alice <-> Bob, Bob <-> Charlie)
  await prisma.friendship.upsert({
    where: { requesterId_receiverId: { requesterId: alice.id, receiverId: bob.id } },
    update: { status: 'ACCEPTED' },
    create: { requesterId: alice.id, receiverId: bob.id, status: 'ACCEPTED' },
  });

  await prisma.friendship.upsert({
    where: { requesterId_receiverId: { requesterId: bob.id, receiverId: charlie.id } },
    update: { status: 'ACCEPTED' },
    create: { requesterId: bob.id, receiverId: charlie.id, status: 'ACCEPTED' },
  });

  // 3. Create Posts
  await prisma.post.createMany({
    data: [
      {
        authorId: alice.id,
        content: 'Hello everyone! This is my first post on Analog SM.',
        type: 'TEXT',
      },
      {
        authorId: bob.id,
        content: 'Building something cool today!',
        type: 'TEXT',
      },
      {
        authorId: charlie.id,
        content: 'Just found a golden ticket!',
        type: 'TEXT',
      },
    ],
  });

  console.log('🌱 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
