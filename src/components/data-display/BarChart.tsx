import { Box, Stack, Tooltip, Typography } from '@mui/material';

export interface BarDatum {
  key: string;
  /** Shown in the tooltip and the accessible table. */
  label: string;
  value: number;
}

/**
 * A minimal column chart for small integer series (one bar per day).
 *
 * Built from boxes instead of a charting library: the dashboard needs one
 * series with exact values, and a dependency for that would outweigh it. The
 * values are also exposed as a visually hidden table, so the chart is
 * readable with a screen reader and not only as a picture. The last bar
 * (today) carries the accent.
 */
export function BarChart({
  data, height = 96, caption, highlightLast = true,
}: {
  data: BarDatum[];
  height?: number;
  caption: string;
  highlightLast?: boolean;
}) {
  const max = Math.max(1, ...data.map((datum) => datum.value));

  return (
    <Box sx={{ position: 'relative' }}>
      <Stack
        direction="row"
        alignItems="flex-end"
        spacing="2px"
        aria-hidden
        sx={{ height, borderBottom: 1, borderColor: 'line.subtle' }}
      >
        {data.map((datum, index) => {
          const isLast = highlightLast && index === data.length - 1;
          return (
            <Tooltip key={datum.key} title={`${datum.label}: ${datum.value}`} placement="top" disableInteractive>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 3,
                  height: datum.value === 0 ? 2 : `${Math.max(6, (datum.value / max) * 100)}%`,
                  bgcolor: isLast ? 'secondary.main' : datum.value === 0 ? 'line.subtle' : 'ink.muted',
                  borderRadius: '2px 2px 0 0',
                  transition: 'background-color 140ms ease',
                  '&:hover': { bgcolor: 'ink.primary' },
                }}
              />
            </Tooltip>
          );
        })}
      </Stack>
      <Box
        component="table"
        sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}
      >
        <caption>{caption}</caption>
        <tbody>
          {data.map((datum) => (
            <tr key={datum.key}>
              <th scope="row">{datum.label}</th>
              <td>{datum.value}</td>
            </tr>
          ))}
        </tbody>
      </Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Typography variant="caption" color="ink.muted">{data[0]?.label}</Typography>
        <Typography variant="caption" color="ink.muted">{data.at(-1)?.label}</Typography>
      </Stack>
    </Box>
  );
}
