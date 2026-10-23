import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './features/auth/auth.module';
import { AlertsModule } from './features/alerts/alerts.module';
import { DashboardModule } from './features/dashboard/dashboard.module';
import { IncidentsModule } from './features/incidents/incidents.module';
import { NotificationsModule } from './features/notifications/notifications.module';
import { ServicesModule } from './features/services/services.module';
import { TicketsModule } from './features/tickets/tickets.module';
import { WebhooksModule } from './features/webhooks/webhooks.module';

@Module({
  imports: [
    AuthModule,
    TicketsModule,
    ServicesModule,
    IncidentsModule,
    DashboardModule,
    NotificationsModule,
    WebhooksModule,
    AlertsModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
