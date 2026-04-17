import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // Users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: { role: 'OWNER', username: 'alice', displayName: 'alice 🐇' },
    create: {
      username: 'alice',
      displayName: 'alice 🐇',
      email: 'alice@example.com',
      passwordHash,
      role: 'OWNER',
      bio: 'Alice from Wonderland 🐇',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      username: 'bob',
      email: 'bob@example.com',
      passwordHash,
      bio: 'Bob the Builder 🔨',
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      username: 'charlie',
      email: 'charlie@example.com',
      passwordHash,
      bio: 'Just found a golden ticket 🍫',
    },
  });

  const diana = await prisma.user.upsert({
    where: { email: 'diana@example.com' },
    update: {},
    create: {
      username: 'diana',
      email: 'diana@example.com',
      passwordHash,
      bio: 'Photographer & traveler 📷',
    },
  });

  const eve = await prisma.user.upsert({
    where: { email: 'eve@example.com' },
    update: {},
    create: {
      username: 'eve',
      email: 'eve@example.com',
      passwordHash,
      bio: 'Security researcher 🔐',
    },
  });

  // Friendships
  const friendships: [string, string][] = [
    [alice.id, bob.id],
    [alice.id, charlie.id],
    [alice.id, diana.id],
    [alice.id, eve.id],
    [bob.id, charlie.id],
    [bob.id, eve.id],
    [diana.id, eve.id],
  ];

  for (const [a, b] of friendships) {
    await prisma.friendship.upsert({
      where: { requesterId_receiverId: { requesterId: a, receiverId: b } },
      update: { status: 'ACCEPTED' },
      create: { requesterId: a, receiverId: b, status: 'ACCEPTED' },
    });
  }


  // Posts — enough to trigger pagination (> 20)
  const posts = [
    { authorId: alice.id, content: 'Just set up this instance — welcome everyone! 🎉' },
    { authorId: alice.id, content: 'Pro tip: you can upload photos when creating a post. Try it out!' },
    { authorId: alice.id, content: 'Moderation tools are live. Let\'s keep this place kind.' },
    { authorId: alice.id, content: 'Good morning from Wonderland ☀️' },
    { authorId: bob.id,   content: 'Building something cool today. Updates soon!' },
    { authorId: bob.id,   content: 'Finally fixed that bug that\'s been haunting me for three days 🐛' },
    { authorId: bob.id,   content: 'Who else codes better with lo-fi beats on?' },
    { authorId: bob.id,   content: 'Shipped a new feature. Feels good 🚀' },
    { authorId: bob.id,   content: 'Coffee count: 4. Lines written: 12. Perfectly balanced.' },
    { authorId: charlie.id, content: 'Just found a golden ticket! 🎫' },
    { authorId: charlie.id, content: 'The chocolate river is real, I promise.' },
    { authorId: charlie.id, content: 'Unpopular opinion: dark chocolate > milk chocolate' },
    { authorId: charlie.id, content: 'Reading a good book this weekend. Highly recommend taking a break from screens.' },
    { authorId: diana.id, content: 'Uploaded a new batch of travel shots 📷 Lisbon was gorgeous.' },
    { authorId: diana.id, content: 'Golden hour hits different when you\'re on a hilltop.' },
    { authorId: diana.id, content: 'Gear question: mirrorless or DSLR in 2024? Fight me.' },
    { authorId: diana.id, content: 'Just got back from a week offline. Highly recommend.' },
    { authorId: diana.id, content: 'Learning film photography. The grain is everything.' },
    { authorId: eve.id,   content: 'Interesting CVE dropped today. Patch your deps, folks.' },
    { authorId: eve.id,   content: 'CTF write-up incoming. Took me 6 hours but worth it.' },
    { authorId: eve.id,   content: 'Hot take: dependency audits should be part of every PR review.' },
    { authorId: eve.id,   content: 'Finally got my home lab set up. Time to break things responsibly.' },
    { authorId: alice.id, content: 'Dark mode is now available — check the toggle in the top nav!' },
    { authorId: bob.id,   content: 'Weekend project: built a tiny CLI tool in Rust. First time touching the language.' },
    { authorId: charlie.id, content: 'Tried baking sourdough for the first time. Results: chaotic but edible.' },
    { authorId: diana.id, content: 'Morning walk shots — fog rolling over the hills at 6am is unreal.' },
    { authorId: eve.id,   content: 'Reminder: rotate your API keys. Yes, those ones you set up two years ago.' },
    { authorId: alice.id, content: 'Happy Friday everyone. What is everyone up to this weekend?' },
    { authorId: bob.id,   content: 'Anyone else read the new WASM proposal? Wild stuff.' },
    { authorId: charlie.id, content: 'Currently re-reading a classic. Some books just hit different the second time.' },
    { authorId: diana.id, content: 'New camera lens arrived. The bokeh is absolutely criminal.' },
    { authorId: eve.id,   content: 'Gave a lightning talk at the local sec meetup tonight. Great crowd.' },
    { authorId: alice.id, content: 'Reminder that the instance rules are in the about page. Be excellent to each other.' },
  ];

  // Remove any duplicate/reverse friendship rows before re-seeding
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: eve.id, receiverId: alice.id },
      ],
    },
  });

  // Delete existing posts to avoid duplicates on re-seed
  await prisma.post.deleteMany({
    where: { authorId: { in: [alice.id, bob.id, charlie.id, diana.id, eve.id] } },
  });

  for (const post of posts) {
    await prisma.post.create({ data: { ...post, type: 'TEXT' } });
  }

  console.log('Seeded: 5 users, 7 friendships, 38 posts');
  console.log('  alice@example.com  — OWNER');
  console.log('  bob@example.com    — USER');
  console.log('  charlie@example.com — USER');
  console.log('  diana@example.com  — USER');
  console.log('  eve@example.com    — USER');
  console.log('  password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
