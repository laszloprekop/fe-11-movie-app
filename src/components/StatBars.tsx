import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// One horizontal bar chart, one series — identity sits on the category
// axis, so no legend; values are direct-labeled at the bar ends.
type Props = {
  data: Record<string, string | number>[];
  nameKey: string;
  valueKey: string;
  // What the tooltip calls the value — user-facing text, never the raw key.
  label: string;
  max?: number;
};

export default function StatBars({ data, nameKey, valueKey, label, max }: Props) {
  return (
    // The height is computed from the row count: a percentage height inside
    // an unsized parent collapses to 0 and the chart silently disappears.
    <ResponsiveContainer width="100%" height={data.length * 36 + 16}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
        <XAxis type="number" domain={[0, max ?? 'auto']} hide />
        <YAxis
          type="category"
          dataKey={nameKey}
          width={180}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'currentColor', fontSize: 14 }}
        />
        <Tooltip />
        <Bar dataKey={valueKey} name={label} fill="#047857" barSize={14} radius={[0, 4, 4, 0]}>
          <LabelList dataKey={valueKey} position="right" fill="currentColor" fontSize={13} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
