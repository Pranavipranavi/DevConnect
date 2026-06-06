import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from 'recharts';

const tooltipStyle = {
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  boxShadow: '0 18px 60px rgba(15, 23, 42, 0.08)'
};

export default function DashboardCharts({ posts = [] }) {
  const topPosts = posts.slice(0, 6).map((post) => ({
    name: post.title.length > 18 ? `${post.title.slice(0, 18)}...` : post.title,
    views: post.views || 0,
    likes: post.likes || 0
  })).reverse();

  const trend = posts.slice(0, 8).map((post, index) => ({
    name: `Post ${index + 1}`,
    views: post.views || 0,
    likes: post.likes || 0
  })).reverse();

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="surface p-5">
        <div className="mb-4">
          <p className="eyebrow">Performance</p>
          <h2 className="mt-1 text-xl font-black">Views by article</h2>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topPosts}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} height={54} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="views" fill="#38BDF8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface p-5">
        <div className="mb-4">
          <p className="eyebrow">Engagement</p>
          <h2 className="mt-1 text-xl font-black">Likes and reads trend</h2>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="views" stroke="#38BDF8" fill="url(#viewsGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="likes" stroke="#F9A8D4" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
