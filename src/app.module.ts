import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as controllers from '@controllers';
import * as services from '@services';
import configuration from '@config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          uri: configService.get<string>('database.mongoUri'),
        };
      },
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [].concat(Object.values(controllers)),
  providers: [].concat(Object.values(services)),
})
export class AppModule {}
