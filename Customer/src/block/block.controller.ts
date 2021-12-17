import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { CurrentUser } from "../authentication/guard/user.decorator";
import { BlockService } from "./block.service";
import { BlockStylistRemoveDto, BlockUnblockStylistDto, CreateBlockStylistDto } from "./block.dto";
import { CurrentUserDto } from "../authentication/authentication.dto";

@Controller('api')
export class BlockController {
    constructor(private readonly blockService: BlockService) { }

    @Post('block-stylist')
    async blockStylist(@CurrentUser() user: CurrentUserDto, @Body() blockStylistBody: CreateBlockStylistDto, @Res() res: Response) {
        return await this.blockService.blockStylist(user, blockStylistBody, res);
    }

    @Get('list-block-stylist')
    async listBlockStylist(@CurrentUser() user: CurrentUserDto, @Req() filterBody: Request, @Res() res: Response) {
        return await this.blockService.listBlockStylist(user, filterBody, res);
    }

    @Post('block-unblock-stylist')
    async blockUnlockStylist(@CurrentUser() user: CurrentUserDto, @Body() blockStylistBody: BlockUnblockStylistDto, @Res() res: Response) {
        return await this.blockService.blockUnlockStylist(user, blockStylistBody, res);
    }

    @Post('remove-from-blocked-list')
    async removeFromBlockedList(@CurrentUser() user: CurrentUserDto, @Body() blockStylistBody: BlockStylistRemoveDto, @Res() res: Response) {
        return await this.blockService.removeFromBlockedList(user, blockStylistBody, res);
    }
}