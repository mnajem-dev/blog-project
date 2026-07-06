const { getDb } = require('./database');

const categories = ['Technology', 'Science', 'Health', 'Travel', 'Food', 'Business', 'Entertainment', 'Sports', 'General', 'Education'];
const statuses = ['draft', 'published'];
const authors = ['Alice Johnson', 'Bob Smith', 'Carol White', 'David Brown', 'Eva Martinez', 'Frank Lee', 'Grace Kim', 'Henry Davis'];

const titles = [
  'The Future of Artificial Intelligence', 'Exploring the Deep Ocean', 'A Guide to Healthy Eating',
  'Top Travel Destinations for 2026', 'How to Start a Business from Scratch', 'The Science Behind Sleep',
  'Understanding Climate Change', 'Mastering Remote Work', 'The Art of Minimalism', 'Breakthroughs in Medicine',
  'Quantum Computing Explained', 'The Rise of Electric Vehicles', 'Mental Health in the Digital Age',
  'Sustainable Living Tips', 'The History of the Internet', 'Learning a New Language Fast',
  'Space Exploration Milestones', 'The Psychology of Habits', 'Investing for Beginners',
  'The World of Fermented Foods', 'Cybersecurity Best Practices', 'Yoga and Mindfulness',
  'The Power of Storytelling', 'Urban Farming Revolution', 'Blockchain Beyond Crypto',
  'The Science of Happiness', 'DIY Home Improvement', 'Wildlife Conservation Efforts',
  'Modern Architecture Trends', 'The Economics of Gaming', 'Plant-Based Diets Explained',
  'Autonomous Vehicles Update', 'Social Media and Society', 'Ancient Civilizations Revisited',
  'Renewable Energy Progress', 'The Philosophy of Time', 'Running Your First Marathon',
  'Machine Learning in Healthcare', 'The Art Market Today', 'Deep Dive into Mushrooms',
  'Robotics in Manufacturing', 'Hiking the World\'s Best Trails', 'The Gut Microbiome',
  'Financial Independence Strategies', 'Music Production Basics', 'The Power of Meditation',
  'Ocean Plastic Crisis', 'Future of Work Trends', 'Astronomy for Beginners',
  'The Science of Color', 'Microplastics and Human Health', 'Vertical Gardens at Home',
  'Decoding DNA Technology', 'The Gig Economy Explained', 'Cold Water Swimming Benefits',
  'Global Food Security', 'Digital Minimalism', 'The Future of Education',
  'Rare Diseases and Research', 'Craft Beer Revolution', 'Wearable Tech Overview',
  'The Ethics of AI', 'Solo Travel Guide', 'Nutrition Myths Busted',
  'Startup Culture Insights', 'Marine Biology Wonders', 'Intermittent Fasting Science',
  'Smart Cities of Tomorrow', 'The Psychology of Money', 'Heritage Languages',
  'Advances in 3D Printing', 'Night Sky Photography', 'The Immune System Explained',
  'Circular Economy Basics', 'The Art of Negotiation', 'Living Off Grid',
  'Coral Reef Restoration', 'Coding for Non-Programmers', 'Street Food Around the World',
  'The Science of Aging', 'Augmented Reality Applications', 'Desert Survival Skills',
  'The Book Publishing World', 'Soil Health and Agriculture', 'Understanding Inflation',
  'Wildlife Photography Tips', 'The History of Coffee', 'Biohacking Explained',
  'Ocean Acidification', 'Esports Industry Growth', 'Community Gardening',
  'Advances in Solar Power', 'The Art of Tea', 'Digital Nomad Lifestyle',
  'Brain Plasticity Research', 'The Future of Fashion', 'Permaculture Principles',
  'Synthetic Biology Frontier', 'Zero Waste Living', 'The Science of Cooking',
  'Podcasting for Beginners', 'Animal Intelligence Studies',
];

function generateContent(title, category) {
  return `# ${title}

This is an in-depth look at ${title.toLowerCase()}, covering key concepts in the field of ${category}.

## Introduction

${category} continues to evolve rapidly, and understanding ${title.toLowerCase()} is more important than ever. Whether you are a seasoned professional or just getting started, this post covers everything you need to know.

## Key Points

- The fundamentals of ${title.toLowerCase()} and why they matter
- Recent developments that are shaping the field of ${category}
- Practical tips you can apply today
- What experts are saying about the road ahead

## Deep Dive

When we examine ${title.toLowerCase()} closely, several themes emerge. First, the intersection with technology has accelerated progress significantly. Second, community involvement plays a crucial role in driving change. Finally, data-driven approaches are replacing traditional methods.

## Conclusion

${title} represents a fascinating area of ongoing discovery. Stay curious, keep learning, and share what you find with others. The future belongs to those who engage with it actively.`;
}

async function seed() {
  const db = await getDb();
  const stmt = await db.prepare(
    'INSERT INTO posts (title, content, author, category, status) VALUES (?, ?, ?, ?, ?)'
  );

  for (let i = 0; i < 100; i++) {
    const title = titles[i];
    const category = categories[i % categories.length];
    const author = authors[i % authors.length];
    const status = statuses[i % 3 === 0 ? 0 : 1];
    const content = generateContent(title, category);
    await stmt.run(title, content, author, category, status);
  }

  await stmt.finalize();
  console.log('Seeded 100 blog posts successfully.');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
