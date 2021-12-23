import { Controller, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { CurrentUserDto } from "../authentication/authentication.dto";
import { CurrentUser } from "../authentication/guard/user.decorator";
import { SosService } from "./sos.service";

@Controller('api')
export class SosController {
    constructor(private readonly sosService: SosService) { }

    @Post('create-sos')
    async createSos(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.sosService.createSos(user, req, res);
    }

    @Post('update-sos')
    async updateSos(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.sosService.updateSos(user, req, res);
    }

    @Post('end-sos')
    async endSos(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.sosService.endSos(user, req, res);
    }
}