/**
 * Load-test seed: 50 users, dense friend graph, ~10k posts
 * Usage: npx tsx scripts/seed-load-test.ts
 * (requires DATABASE_URL in env — copy from .env or docker-compose)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random date in the past N days */
function randomDate(daysBack = 365): Date {
  const ms = Date.now() - Math.random() * daysBack * 86_400_000;
  return new Date(ms);
}

// ── content pools ────────────────────────────────────────────────────────────

const BIOS = [
  'Just here for the vibes.',
  'Photography enthusiast and amateur chef.',
  'Building things on the internet.',
  'Coffee first, code second.',
  'Professional overthinker.',
  'Dog parent. Bookworm. Hiker.',
  'Startup life. Zero sleep.',
  'Vintage record collector.',
  'Aspiring novelist. Actual procrastinator.',
  'Cyclist, runner, person who talks about cycling and running.',
  'Frontend dev by day, bread baker by night.',
  'Just vibing in the simulation.',
  'Local news nerd.',
  'I rate sandwiches on a 1–10 scale.',
  'Mountain person trapped in a flat city.',
];

const POST_TEMPLATES = [
  'Finally finished {thing}. Feels amazing.',
  'Does anyone else find {thing} weirdly satisfying?',
  'Hot take: {thing} is underrated.',
  'Spending the afternoon working on {thing}.',
  "Can't stop thinking about {thing}.",
  "Just discovered {thing} and now I'm obsessed.",
  "{thing} is either the best or worst idea I've ever had.",
  "Reminder that {thing} exists and it's great.",
  'Three hours deep into {thing} and no regrets.',
  'Asked for advice on {thing}. Got twelve different answers.',
  "Today's mood: {thing}.",
  'Nobody asked, but I have opinions about {thing}.',
  'Turns out {thing} is harder than it looks.',
  'Woke up thinking about {thing}. Make it make sense.',
  'The older I get the more I appreciate {thing}.',
  'Started {thing} at 9am. It is now midnight.',
  'Every time I think I understand {thing} it surprises me.',
  'Sold on {thing}. No notes.',
  'Still thinking about that {thing} from last week.',
  'One day I will have a strong opinion about {thing}. Today is not that day.',
];

const THINGS = [
  'the new coffee shop downtown',
  'refactoring legacy code',
  'a 5am run',
  'my sourdough starter',
  'the new album',
  'parallel parking',
  'async/await',
  'meal prep',
  'a book I started six months ago',
  'that one pull request',
  'the sunset yesterday',
  'my apartment rearrangement',
  'reading documentation',
  'debugging CSS',
  'my sleep schedule',
  'learning Rust',
  'the neighborhood cats',
  'a really good sandwich',
  'typing speed',
  'container orchestration',
  'the housing market',
  'growing herbs on a windowsill',
  'buying a desk plant',
  'the commute',
  'standing desks',
  'my Notion setup',
  'journaling every day',
  "the local farmer's market",
  'biking to work',
  'tab management',
];

function makePost(): string {
  const template = pick(POST_TEMPLATES);
  return template.replace('{thing}', pick(THINGS));
}

// ── usernames ─────────────────────────────────────────────────────────────────

const ADJECTIVES = [
  'happy','bright','quiet','swift','bold','calm','cool','deep',
  'wild','sage','iron','oak','pine','blue','grey','fast',
  'soft','warm','keen','lean',
];
const NOUNS = [
  'fox','crow','bear','wolf','hawk','deer','pike','lark',
  'reed','fern','mist','tide','vale','peak','storm','creek',
  'grove','ember','dusk','dawn',
];

function generateUsernames(count: number): string[] {
  const names = new Set<string>();
  let i = 0;
  while (names.size < count) {
    const adj = ADJECTIVES[i % ADJECTIVES.length];
    const noun = NOUNS[Math.floor(i / ADJECTIVES.length) % NOUNS.length];
    const suffix = Math.floor(i / (ADJECTIVES.length * NOUNS.length));
    names.add(suffix === 0 ? `${adj}_${noun}` : `${adj}_${noun}${suffix}`);
    i++;
  }
  return [...names];
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const USER_COUNT = 50;
  const TARGET_POSTS = 10_000;

  console.log('⏳ Hashing password...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Users ──────────────────────────────────────────────────────────────────
  console.log(`👤 Creating ${USER_COUNT} users...`);
  const usernames = generateUsernames(USER_COUNT);

  const users = await Promise.all(
    usernames.map((username, idx) =>
      prisma.user.upsert({
        where: { email: `${username}@loadtest.local` },
        update: {},
        create: {
          username,
          email: `${username}@loadtest.local`,
          passwordHash,
          bio: BIOS[idx % BIOS.length],
        },
      })
    )
  );

  console.log(`   ✓ ${users.length} users ready`);

  // 2. Friendships ────────────────────────────────────────────────────────────
  // Each user befriends ~12 others randomly → ~300 ACCEPTED friendships.
  // Also seed a handful of PENDING requests.
  console.log('🤝 Building friend graph...');

  const friendshipPairs = new Set<string>();
  const friendshipData: { requesterId: string; receiverId: string; status: string }[] = [];

  for (const user of users) {
    const candidates = users.filter((u) => u.id !== user.id);
    const targets = candidates.sort(() => Math.random() - 0.5).slice(0, randInt(8, 16));

    for (const target of targets) {
      const key = [user.id, target.id].sort().join(':');
      if (friendshipPairs.has(key)) continue;
      friendshipPairs.add(key);

      // ~10% stay PENDING
      const status = Math.random() < 0.1 ? 'PENDING' : 'ACCEPTED';
      friendshipData.push({ requesterId: user.id, receiverId: target.id, status });
    }
  }

  // Upsert in chunks to avoid hitting param limits
  const CHUNK = 200;
  for (let i = 0; i < friendshipData.length; i += CHUNK) {
    const chunk = friendshipData.slice(i, i + CHUNK);
    await Promise.all(
      chunk.map((f) =>
        prisma.friendship.upsert({
          where: { requesterId_receiverId: { requesterId: f.requesterId, receiverId: f.receiverId } },
          update: { status: f.status },
          create: f,
        })
      )
    );
  }

  console.log(`   ✓ ${friendshipData.length} friendships (${friendshipData.filter((f) => f.status === 'PENDING').length} pending)`);

  // 3. Posts ──────────────────────────────────────────────────────────────────
  console.log(`📝 Creating ~${TARGET_POSTS} posts...`);

  const postsPerUser = Math.ceil(TARGET_POSTS / USER_COUNT);
  let total = 0;

  for (const user of users) {
    const count = randInt(
      Math.floor(postsPerUser * 0.5),
      Math.floor(postsPerUser * 1.5)
    );

    const postBatch = Array.from({ length: count }, () => ({
      authorId: user.id,
      content: makePost(),
      type: 'TEXT' as const,
      createdAt: randomDate(365),
    }));

    // createMany in chunks of 500 to stay within Postgres param limits
    for (let i = 0; i < postBatch.length; i += 500) {
      await prisma.post.createMany({ data: postBatch.slice(i, i + 500) });
    }

    total += count;
    process.stdout.write(`\r   ${total.toLocaleString()} posts written...`);
  }

  console.log(`\n   ✓ ${total.toLocaleString()} posts created`);
  console.log('\n🌱 Load-test seed complete!');
  console.log('   All 50 users have password: password123');
  console.log('   Example logins: happy_fox@loadtest.local, bright_crow@loadtest.local');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
