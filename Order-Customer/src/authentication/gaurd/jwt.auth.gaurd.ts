import {
  BadRequestException,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Reflector } from '@nestjs/core';
// import { IS_PUBLIC_KEY } from '../gaurd/public.decoder';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
      super();
  }

  canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest();

      return super.canActivate(
          new ExecutionContextHost([request]),
      );
  }

  handleRequest(err: any, user: any) {
      if (err || !user) {
          throw err || new BadRequestException('UnAuthorized');
      }
      return user;
  }
}
