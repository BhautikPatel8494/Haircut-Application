import { BadRequestException, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

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