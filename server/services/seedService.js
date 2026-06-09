import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { calculateReadingTime } from '../utils/readingTime.js';
import { sanitizeContent } from '../utils/sanitizeContent.js';
import { createSlug } from '../utils/slug.js';

const categories = [
  'React',
  'Node.js',
  'TypeScript',
  'MongoDB',
  'System Design',
  'JavaScript',
  'DSA',
  'AI Tools',
  'Cybersecurity',
  'Cloud Computing'
];

const tags = [
  'frontend',
  'backend',
  'typescript',
  'architecture',
  'algorithms',
  'performance',
  'apis',
  'security',
  'cloud',
  'authentication',
  'database',
  'ui-ux',
  'clean-code',
  'deployment',
  'automation'
];

const authors = [
  ['Aarav Mehta', 'Frontend engineer writing about polished React interfaces.'],
  ['Nisha Rao', 'Backend developer focused on APIs, security, and scalable data models.'],
  ['Kabir Sethi', 'Full-stack mentor sharing practical MERN project patterns.'],
  ['Ira Kapoor', 'Product-minded engineer exploring developer experience.'],
  ['Dev Patel', 'Cloud and DevOps learner turning deployment notes into guides.'],
  ['Meera Shah', 'UI engineer obsessed with accessible, fast web apps.'],
  ['Rohan Iyer', 'Security-aware JavaScript developer and interview coach.'],
  ['Tara Singh', 'Technical writer simplifying system design for beginners.']
];

const titles = [
  'Building React Interfaces That Stay Fast Under Real Data',
  'Designing Node.js APIs That Are Easy to Test and Extend',
  'TypeScript Patterns That Make Frontend Refactors Safer',
  'MongoDB Indexing Strategies for High-Traffic Blog Platforms',
  'System Design Notes for a Scalable Developer Publishing App',
  'Modern JavaScript Practices That Improve Code Reviews',
  'DSA Patterns Every Placement Candidate Should Recognize',
  'AI Tools That Help Developers Ship Without Losing Craft',
  'Cybersecurity Basics for JWT and OAuth Applications',
  'Cloud Computing Decisions for Deploying MERN Projects',
  'React State Management Lessons From a Real Dashboard',
  'Node.js Middleware Patterns for Production Express Apps',
  'How TypeScript Helps Prevent API Contract Drift',
  'Modeling Comments, Likes, and Bookmarks in MongoDB',
  'Designing Feed Queries for Search, Tags, and Popularity',
  'JavaScript Performance Wins for Content-Heavy Pages',
  'DSA Interview Prep: Sliding Window and Two Pointer Patterns',
  'Using AI Coding Assistants Responsibly in Team Projects',
  'Threat Modeling a Full-Stack Authentication Flow',
  'Vercel, Render, and Atlas: A Practical Cloud Deployment Guide',
  'React Component Architecture for Portfolio-Grade Projects',
  'Writing Clean Node.js Controllers With Async Error Handling',
  'Type-Safe Form Validation From UI to Backend',
  'MongoDB Aggregations for Dashboard Analytics',
  'System Design Tradeoffs in Read-Heavy Applications',
  'JavaScript Debugging Techniques for Network Failures',
  'DSA to Development: Turning Algorithms Into Better APIs',
  'Security Headers Every Express App Should Enable',
  'Cloudinary Uploads, CDN Caching, and Image Performance',
  'How to Present a Full-Stack Project in Interviews'
];

const svgDataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const avatarFor = (name) => svgDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="80" fill="#0f172a"/>
    <circle cx="124" cy="36" r="36" fill="#38bdf8" opacity=".82"/>
    <circle cx="32" cy="130" r="44" fill="#f472b6" opacity=".7"/>
    <text x="80" y="94" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="800" fill="#fff">${name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</text>
  </svg>
`);

const cover = (index) => {
  const palettes = [
    ['#0f172a', '#38bdf8', '#f472b6'],
    ['#111827', '#22c55e', '#60a5fa'],
    ['#18181b', '#f97316', '#a78bfa'],
    ['#172554', '#14b8a6', '#facc15']
  ];
  const [bg, accent, secondary] = palettes[index % palettes.length];
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
      <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="#020617"/></linearGradient></defs>
      <rect width="1200" height="675" fill="url(#g)"/>
      <circle cx="${240 + (index % 4) * 90}" cy="160" r="160" fill="${accent}" opacity=".72"/>
      <circle cx="${850 - (index % 3) * 80}" cy="480" r="210" fill="${secondary}" opacity=".56"/>
      <path d="M120 505 C 310 400, 430 580, 610 470 S 910 300, 1080 410" fill="none" stroke="#fff" stroke-width="18" opacity=".18"/>
      <text x="90" y="560" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#fff">DevConnect</text>
    </svg>
  `);
};

const contentFor = (title, category, index) => sanitizeContent(`
  <h2>${title}</h2>
  <p>${category} work becomes impressive when it solves a real product problem, not just when it checks a technology box. This article walks through practical decisions you can explain in code reviews, internship demos, and placement interviews.</p>
  <h3>What matters in production</h3>
  <p>Start with clear data flow, predictable APIs, accessible UI states, and measurable performance. A recruiter or senior engineer should be able to open the project and immediately understand the intent behind each screen.</p>
  <h3>Implementation checklist</h3>
  <p>Use focused components, validate inputs at the boundary, handle empty and error states, and keep the user informed during network requests. These small details make a project feel maintained instead of merely assembled.</p>
  <p>Practice note ${index + 1}: after shipping a feature, test it once as a guest, once as an authenticated user, and once on mobile. The bugs you find there are usually the ones interviewers notice first.</p>
`);

const findOrCreateDemoUser = async ({ name, bio, email }) => {
  let user = await User.findOne({ email });
  if (user) {
    user.name = name;
    user.bio = bio;
    user.avatar = avatarFor(name);
    user.socialLinks = {
      linkedin: 'https://www.linkedin.com',
      github: 'https://github.com',
      twitter: 'https://twitter.com',
      portfolio: 'https://example.com'
    };
    await user.save();
    return { user, created: false };
  }

  try {
    user = await User.create({
      name,
      email,
      password: 'Password123!',
      bio,
      avatar: avatarFor(name),
      socialLinks: {
        linkedin: 'https://www.linkedin.com',
        github: 'https://github.com',
        twitter: 'https://twitter.com',
        portfolio: 'https://example.com'
      }
    });
    return { user, created: true };
  } catch (error) {
    if (error.code !== 11000) throw error;
    user = await User.findOne({ email });
    if (!user) throw error;
    return { user, created: false };
  }
};

const findOrCreateDemoPost = async ({ title, author, category, postTags, content, index }) => {
  let post = await Post.findOne({ title, author: author._id });
  if (post) return { post, created: false };

  try {
    post = await Post.create({
      title,
      slug: await createSlug(title),
      content,
      coverImage: cover(index),
      category,
      tags: postTags,
      author: author._id,
      likes: 0,
      views: 120 + index * 23,
      status: 'published',
      readingTime: calculateReadingTime(content)
    });
    return { post, created: true };
  } catch (error) {
    if (error.code !== 11000) throw error;
    post = await Post.findOne({ title, author: author._id });
    if (!post) throw error;
    return { post, created: false };
  }
};

export const seedDemoContent = async ({ reset = false } = {}) => {
  if (reset) {
    await Promise.all([
      Comment.deleteMany({}),
      Like.deleteMany({}),
      Post.deleteMany({}),
      User.deleteMany({ email: /@devconnect\.demo$/ })
    ]);
  }

  const users = [];
  let createdUsers = 0;
  for (const [index, author] of authors.entries()) {
    const [name, bio] = author;
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@devconnect.demo`;
    const { user, created } = await findOrCreateDemoUser({ name, bio, email, index });
    if (created) createdUsers += 1;
    users.push(user);
  }

  const posts = [];
  let createdPosts = 0;
  let createdComments = 0;
  let createdLikes = 0;
  for (const [index, title] of titles.entries()) {
    const category = categories[index % categories.length];
    const postTags = [tags[index % tags.length], tags[(index + 4) % tags.length], tags[(index + 8) % tags.length]];
    const content = contentFor(title, category, index);
    const { post, created } = await findOrCreateDemoPost({
      title,
      author: users[index % users.length],
      category,
      postTags,
      content,
      index
    });
    if (created) createdPosts += 1;
    posts.push(post);
  }

  const commentTexts = [
    'This is exactly the kind of practical breakdown I needed.',
    'The checklist section is going into my project notes.',
    'Clear, useful, and easy to apply. Great write-up.'
  ];

  for (const [postIndex, post] of posts.entries()) {
    for (let i = 0; i < 3; i += 1) {
      const commentPayload = {
        postId: post._id,
        userId: users[(postIndex + i + 1) % users.length]._id,
        comment: commentTexts[i]
      };
      const existingComment = await Comment.findOne(commentPayload);
      if (!existingComment) {
        await Comment.create({
          ...commentPayload
        });
        createdComments += 1;
      }
    }

    const likeUsers = users.slice(0, (postIndex % users.length) + 1);
    for (const user of likeUsers) {
      const likeResult = await Like.updateOne(
        { postId: post._id, userId: user._id },
        { postId: post._id, userId: user._id },
        { upsert: true }
      );
      if (likeResult.upsertedCount) createdLikes += 1;
    }
    post.likes = await Like.countDocuments({ postId: post._id });
    await post.save();
  }

  const created = createdUsers + createdPosts + createdComments + createdLikes > 0;

  return {
    created,
    createdUsers,
    createdPosts,
    createdComments,
    createdLikes,
    users: users.length,
    posts: posts.length,
    categories: categories.length,
    tags: tags.length,
    comments: await Comment.countDocuments({ postId: { $in: posts.map((post) => post._id) } }),
    likes: await Like.countDocuments({ postId: { $in: posts.map((post) => post._id) } })
  };
};

export const demoTaxonomy = { categories, tags };
