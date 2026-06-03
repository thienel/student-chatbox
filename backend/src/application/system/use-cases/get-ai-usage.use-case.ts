import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class GetAiUsageUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute() {
    const rows: Array<{ feature: string; total: string }> = await this.dataSource.query(`
      SELECT feature, SUM(count)::int AS total
      FROM ai_usage_logs
      GROUP BY feature
      ORDER BY feature
    `);

    const today = new Date().toISOString().split('T')[0];
    const todayRows: Array<{ feature: string; total: string }> = await this.dataSource.query(
      `SELECT feature, SUM(count)::int AS total
       FROM ai_usage_logs
       WHERE used_date = $1
       GROUP BY feature`,
      [today],
    );

    const toMap = (arr: typeof rows) =>
      Object.fromEntries(arr.map((r) => [r.feature, Number(r.total)]));

    return { allTime: toMap(rows), today: toMap(todayRows) };
  }
}
