export type Avatar = {
    skin_asset: string;
    hair_asset?: string; //can be null
    eyes_asset: string; 
    mouth_asset?: string; //can be null
    clothes_asset: string;
};

export type AvatarAssets = {
    skin: { [key: string]: any };
    hair: { [key: string]: any };
    eyes: { [key: string]: any };
    mouth: { [key: string]: any };
    clothes: { [key: string]: any };
};

export type AvatarCategory = 'skin' | 'hair' | 'eyes' | 'mouth' | 'clothes';