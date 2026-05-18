'use client';

import React from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';
import { AdminSubscription } from '@/types/admin.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SubscriptionTableProps {
  data: AdminSubscription[];
}

export const SubscriptionTable: React.FC<SubscriptionTableProps> = ({ data }) => {
  const columns: ColumnDef<AdminSubscription>[] = [
    {
      accessorKey: 'razorpaySubscriptionId',
      header: 'Sub ID',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-slate-400">
          {row.getValue('razorpaySubscriptionId')}
        </span>
      ),
    },
    {
      accessorKey: 'planId',
      header: 'Plan',
      cell: ({ row }) => {
        const plan = row.getValue('planId') as any;
        return <span className="font-medium">{plan?.name || 'Unknown'}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        let variant: 'default' | 'destructive' | 'secondary' | 'outline' = 'secondary';
        
        if (status === 'active') variant = 'default';
        if (status === 'past_due' || status === 'canceled') variant = 'destructive';
        
        return (
          <Badge variant={variant} className={status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}>
            {status.toUpperCase()}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'minutesUsed',
      header: 'Minutes Used',
      cell: ({ row }) => {
        const used = row.getValue('minutesUsed') as number;
        return <span className="text-slate-300 font-mono">{used} min</span>;
      }
    },
    {
      id: 'actions',
      cell: () => {
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs h-7">Details</Button>
            <Button variant="destructive" size="sm" className="text-xs h-7">Cancel</Button>
          </div>
        );
      }
    }
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardHeader>
        <CardTitle>Active Subscriptions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="h-10 px-4 text-left align-middle font-medium text-slate-400">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-800 transition-colors hover:bg-slate-800/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center text-slate-500">
                    No active subscriptions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
