'use client';

import { useTranslation } from "@/hooks/api";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";

export interface LeaderboardUser {
  userId: string;
  name: string;
  status: string;
  lastActivity: string;
  max1RM: number;
}

interface LiftLeaderBoardProps {
  leaderboard: LeaderboardUser[];
}

export const LiftLeaderBoard = ({ leaderboard }: LiftLeaderBoardProps) => {
  const { t } = useTranslation();

  return (
    <div className="mt-6">
      <div className="text-lg font-semibold mb-2">
        {t('tenantAdminDashboard.leaderboard', { defaultValue: 'Leaderboard' })}
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-full border border-border bg-backgroundSecondary rounded-lg">
          <TableHeader>
            <TableColumn>{t('common.rank', { defaultValue: 'Rank' })}</TableColumn>
            <TableColumn>{t('common.name', { defaultValue: 'Name' })}</TableColumn>
            <TableColumn>{t('common.max1RM', { defaultValue: 'Maximum Lifted' })}</TableColumn>
          </TableHeader>
          <TableBody>
            {leaderboard && leaderboard.length > 0 ? (
              leaderboard.map((user, idx) => (
                <TableRow key={user.userId}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.max1RM.toFixed(2)} Kgs</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3}>
                  {t('tenantAdminDashboard.noLeaderboardResults', {
                    defaultValue: 'No leaderboard data available.',
                  })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
