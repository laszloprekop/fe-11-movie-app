import { Bar, BarChart, LabelList, ResponsiveContainer, Text, Tooltip, XAxis, YAxis } from 'recharts';

// Long titles shrink to fit the label column instead of stacking four lines
// — a poor man's scale-to-fit, stepped by name length.
function FitTick({ x, y, payload }: { x?: number; y?: number; payload?: { value?: string | number } }) {
  const name = String(payload?.value ?? '');
  const fontSize = name.length > 34 ? 10 : name.length > 20 ? 12 : 14;
  return (
    <Text x={x} y={y} width={140} textAnchor="end" verticalAnchor="middle" fill="currentColor" fontSize={fontSize}>
      {name}
    </Text>
  );
}

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
          width={150}
          tickLine={false}
          axisLine={false}
          tick={<FitTick />}
        />
        <Tooltip
          contentStyle={{ background: 'var(--background)', border: '1px solid var(--accent)', borderRadius: 0 }}
          labelStyle={{ color: 'var(--foreground)' }}
          itemStyle={{ color: 'var(--accent)' }}
          cursor={{ fill: 'rgba(236, 234, 229, 0.08)' }}
        />
        {/* the faint track shows how far a full bar would reach —
            --accent (#9C8F73) at 16%, spelled as rgba for SVG fills */}
        <Bar dataKey={valueKey} name={label} fill="var(--accent)" barSize={14} background={{ fill: 'rgba(156, 143, 115, 0.16)' }}>
          <LabelList dataKey={valueKey} position="right" fill="currentColor" fontSize={13} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
