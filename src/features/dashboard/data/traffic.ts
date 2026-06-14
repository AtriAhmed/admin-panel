export type TrafficPoint = {
  month: string;
  organic: number;
  paidAds: number;
};

export const trafficData: readonly TrafficPoint[] = [
  { month: "Jan", organic: 8000, paidAds: 3200 },
  { month: "Feb", organic: 11000, paidAds: 4200 },
  { month: "Mar", organic: 9500, paidAds: 5100 },
  { month: "Apr", organic: 14500, paidAds: 6200 },
  { month: "May", organic: 13200, paidAds: 7900 },
  { month: "Jun", organic: 17800, paidAds: 9400 },
  { month: "Jul", organic: 16500, paidAds: 8700 },
  { month: "Aug", organic: 19800, paidAds: 11100 },
  { month: "Sep", organic: 18400, paidAds: 10300 },
  { month: "Oct", organic: 21200, paidAds: 12600 },
  { month: "Nov", organic: 22100, paidAds: 13400 },
  { month: "Dec", organic: 23800, paidAds: 14200 },
];
