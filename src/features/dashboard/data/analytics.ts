export type SessionsPoint = {
  day: string;
  sessions: number;
  users: number;
};

export const sessionsOverTime: readonly SessionsPoint[] = [
  { day: "Oct 20", sessions: 2420, users: 1820 },
  { day: "Oct 21", sessions: 2640, users: 1910 },
  { day: "Oct 22", sessions: 2510, users: 1880 },
  { day: "Oct 23", sessions: 2820, users: 2050 },
  { day: "Oct 24", sessions: 3120, users: 2210 },
  { day: "Oct 25", sessions: 3340, users: 2340 },
  { day: "Oct 26", sessions: 3010, users: 2180 },
  { day: "Oct 27", sessions: 2940, users: 2060 },
  { day: "Oct 28", sessions: 3260, users: 2310 },
  { day: "Oct 29", sessions: 3480, users: 2420 },
  { day: "Oct 30", sessions: 3210, users: 2280 },
  { day: "Oct 31", sessions: 3640, users: 2510 },
  { day: "Nov 1", sessions: 3910, users: 2680 },
  { day: "Nov 2", sessions: 3720, users: 2560 },
  { day: "Nov 3", sessions: 3540, users: 2450 },
  { day: "Nov 4", sessions: 3820, users: 2610 },
  { day: "Nov 5", sessions: 4120, users: 2820 },
  { day: "Nov 6", sessions: 4380, users: 2940 },
  { day: "Nov 7", sessions: 4210, users: 2860 },
  { day: "Nov 8", sessions: 4060, users: 2790 },
  { day: "Nov 9", sessions: 4290, users: 2920 },
  { day: "Nov 10", sessions: 4510, users: 3080 },
  { day: "Nov 11", sessions: 4720, users: 3220 },
  { day: "Nov 12", sessions: 4480, users: 3070 },
  { day: "Nov 13", sessions: 4650, users: 3160 },
  { day: "Nov 14", sessions: 4890, users: 3310 },
  { day: "Nov 15", sessions: 5120, users: 3460 },
  { day: "Nov 16", sessions: 5340, users: 3590 },
  { day: "Nov 17", sessions: 5090, users: 3450 },
  { day: "Nov 18", sessions: 5410, users: 3620 },
];

export type SparklinePoint = { value: number };

export const sessionsSparkline: readonly SparklinePoint[] = [
  { value: 62000 },
  { value: 65800 },
  { value: 63500 },
  { value: 68200 },
  { value: 71500 },
  { value: 69400 },
  { value: 74200 },
  { value: 77900 },
  { value: 75800 },
  { value: 80100 },
  { value: 82600 },
  { value: 84210 },
];

export const usersSparkline: readonly SparklinePoint[] = [
  { value: 38200 },
  { value: 39400 },
  { value: 40100 },
  { value: 41800 },
  { value: 42600 },
  { value: 43900 },
  { value: 44500 },
  { value: 45300 },
  { value: 45900 },
  { value: 46400 },
  { value: 46900 },
  { value: 47382 },
];

export const bounceSparkline: readonly SparklinePoint[] = [
  { value: 45.1 },
  { value: 44.8 },
  { value: 44.2 },
  { value: 43.9 },
  { value: 43.5 },
  { value: 43.2 },
  { value: 42.8 },
  { value: 42.4 },
  { value: 42.1 },
  { value: 41.8 },
  { value: 41.5 },
  { value: 41.3 },
];

export const durationSparkline: readonly SparklinePoint[] = [
  { value: 180 },
  { value: 188 },
  { value: 192 },
  { value: 196 },
  { value: 199 },
  { value: 202 },
  { value: 205 },
  { value: 209 },
  { value: 213 },
  { value: 217 },
  { value: 220 },
  { value: 222 },
];

export type DeviceDatum = {
  name: string;
  value: number;
};

export const deviceBreakdown: readonly DeviceDatum[] = [
  { name: "Mobile", value: 52340 },
  { name: "Desktop", value: 27180 },
  { name: "Tablet", value: 4690 },
];

export type ChannelDatum = {
  channel: string;
  sessions: number;
};

export const channelBreakdown: readonly ChannelDatum[] = [
  { channel: "Organic Search", sessions: 28450 },
  { channel: "Direct", sessions: 18230 },
  { channel: "Social", sessions: 14120 },
  { channel: "Referral", sessions: 9860 },
  { channel: "Paid Search", sessions: 7540 },
  { channel: "Email", sessions: 4200 },
  { channel: "Display Ads", sessions: 3180 },
  { channel: "Affiliate", sessions: 2240 },
  { channel: "Video", sessions: 1890 },
  { channel: "Newsletter", sessions: 1120 },
];

export type TopPage = {
  avgTimeSeconds: number;
  bounceRate: number;
  id: string;
  path: string;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  views: number;
};

export const topPages: readonly TopPage[] = [
  { avgTimeSeconds: 284, bounceRate: 32.4, id: "p1", path: "/", trend: "up", trendValue: "12.4%", views: 18420 },
  { avgTimeSeconds: 198, bounceRate: 44.8, id: "p2", path: "/pricing", trend: "up", trendValue: "8.2%", views: 9840 },
  { avgTimeSeconds: 412, bounceRate: 28.1, id: "p3", path: "/blog/intro-to-pro", trend: "up", trendValue: "21.6%", views: 7210 },
  { avgTimeSeconds: 158, bounceRate: 52.3, id: "p4", path: "/signup", trend: "down", trendValue: "3.1%", views: 6520 },
  { avgTimeSeconds: 326, bounceRate: 34.7, id: "p5", path: "/docs/getting-started", trend: "up", trendValue: "15.0%", views: 5890 },
  { avgTimeSeconds: 267, bounceRate: 38.2, id: "p6", path: "/changelog", trend: "neutral", trendValue: "0.4%", views: 4230 },
];
