import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  getMetrics() {
    return this.metricsService.getMetrics();
  }

  @Get('prometheus')
  async getPrometheusMetrics() {
    const metrics = await this.metricsService.getPrometheusMetrics();
    return metrics;
  }
}
