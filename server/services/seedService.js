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

const cover = (index) => `https://images.unsplash.com/photo-${[
  '1498050108023-c5249f4df085',
  '1516321318423-f06f85e504b3',
  '1555066931-4365d14bab8c',
  '1461749280684-dccba630e2f6',
  '1504639725590-34d0984388bd',
  '1484417894907-623942c8ee29',
  '1555949963-aa79dcee981c',
  '1515879218367-8466d910aaa4'
][index % 8]}?auto=format&fit=crop&w=1200&q=80`;

const contentFor = (title, category, index) => sanitizeContent(`
  <h2>${title}</h2>
  <p>${category} work becomes impressive when it solves a real product problem, not just when it checks a technology box. This article walks through practical decisions you can explain in code reviews, internship demos, and placement interviews.</p>
  <h3>What matters in production</h3>
  <p>Start with clear data flow, predictable APIs, accessible UI states, and measurable performance. A recruiter or senior engineer should be able to open the project and immediately understand the intent behind each screen.</p>
  <h3>Implementation checklist</h3>
  <p>Use focused components, validate inputs at the boundary, handle empty and error states, and keep the user informed during network requests. These small details make a project feel maintained instead of merely assembled.</p>
  <p>Practice note ${index + 1}: after shipping a feature, test it once as a guest, once as an authenticated user, and once on mobile. The bugs you find there are usually the ones interviewers notice first.</p>
`);

export const seedDemoContent = async ({ reset = false } = {}) => {
  if (reset) {
    await Promise.all([
      Comment.deleteMany({}),
      Like.deleteMany({}),
      Post.deleteMany({}),
      User.deleteMany({ email: /@devconnect\.demo$/ })
    ]);
  }

  const existingPublished = await Post.countDocuments({ status: 'published' });
  if (existingPublished >= 30 && !reset) {
    return {
      created: false,
      users: await User.countDocuments({ email: /@devconnect\.demo$/ }),
      posts: existingPublished,
      categories: categories.length,
      tags: tags.length
    };
  }

  const users = [];
  for (const [index, author] of authors.entries()) {
    const [name, bio] = author;
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@devconnect.demo`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        password: 'Password123!',
        bio,
        avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`,
        socialLinks: {
          linkedin: 'https://www.linkedin.com',
          github: 'https://github.com',
          twitter: 'https://twitter.com',
          portfolio: 'https://example.com'
        }
      });
    } else {
      user.name = name;
      user.bio = bio;
      user.avatar = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`;
      await user.save();
    }
    users.push(user);
  }

  const posts = [];
  for (const [index, title] of titles.entries()) {
    const category = categories[index % categories.length];
    const postTags = [tags[index % tags.length], tags[(index + 4) % tags.length], tags[(index + 8) % tags.length]];
    const content = contentFor(title, category, index);
    const existing = await Post.findOne({ title, author: users[index % users.length]._id });
    if (existing) {
      posts.push(existing);
      continue;
    }

    const post = await Post.create({
      title,
      slug: await createSlug(title),
      content,
      coverImage: cover(index),
      category,
      tags: postTags,
      author: users[index % users.length]._id,
      likes: 0,
      views: 120 + index * 23,
      status: 'published',
      readingTime: calculateReadingTime(content)
    });
    posts.push(post);
  }

  const commentTexts = [
    'This is exactly the kind of practical breakdown I needed.',
    'The checklist section is going into my project notes.',
    'Clear, useful, and easy to apply. Great write-up.'
  ];

  for (const [postIndex, post] of posts.entries()) {
    const existingComments = await Comment.countDocuments({ postId: post._id });
    if (!existingComments) {
      for (let i = 0; i < 3; i += 1) {
        await Comment.create({
          postId: post._id,
          userId: users[(postIndex + i + 1) % users.length]._id,
          comment: commentTexts[i]
        });
      }
    }

    const likeUsers = users.slice(0, (postIndex % users.length) + 1);
    for (const user of likeUsers) {
      await Like.updateOne({ postId: post._id, userId: user._id }, { postId: post._id, userId: user._id }, { upsert: true });
    }
    post.likes = await Like.countDocuments({ postId: post._id });
    await post.save();
  }

  return {
    created: true,
    users: users.length,
    posts: posts.length,
    categories: categories.length,
    tags: tags.length,
    comments: await Comment.countDocuments({ postId: { $in: posts.map((post) => post._id) } }),
    likes: await Like.countDocuments({ postId: { $in: posts.map((post) => post._id) } })
  };
};

export const demoTaxonomy = { categories, tags };
