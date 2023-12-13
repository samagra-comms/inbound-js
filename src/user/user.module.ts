import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [UserService],
  imports: [HttpModule],
  exports: [UserService]
})
export class UserModule {}
