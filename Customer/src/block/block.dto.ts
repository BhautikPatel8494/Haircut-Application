import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateBlockStylistDto {
    @IsOptional()
    @IsString()
    stylist_id: string;

    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    image: string;

    @IsOptional()
    @IsString()
    block_status: string;

    @IsOptional()
    @IsString()
    experience: string;

    @IsOptional()
    @IsString()
    item_id: string;

    @IsOptional()
    @IsString()
    status: string;
}

export class BlockUnblockStylistDto {
    @IsNotEmpty()
    @IsString()
    item_id: string;

    @IsOptional()
    @IsBoolean()
    status: boolean
}

export class BlockStylistRemoveDto {
    @IsNotEmpty()
    @IsString()
    stylist_id: string;
}