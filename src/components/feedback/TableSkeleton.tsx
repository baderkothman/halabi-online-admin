import { Skeleton, TableBody, TableCell, TableRow } from '@mui/material';

/**
 * Placeholder rows matching the real table's density, so the layout does not
 * jump when data arrives. Rendered inside an existing `<Table>` — the header is
 * already correct and does not need to be faked.
 */
export function TableSkeleton({ rows = 8, columns }: { rows?: number; columns: number }) {
  return (
    <TableBody>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }, (_, columnIndex) => (
            <TableCell key={columnIndex}>
              {/* Varying widths read as content rather than as a loading bar. */}
              <Skeleton width={columnIndex === 0 ? '60%' : `${45 + ((rowIndex + columnIndex) % 4) * 12}%`} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
