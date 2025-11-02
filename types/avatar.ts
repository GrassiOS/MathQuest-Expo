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

// default avatar
export const defaultAvatar: Avatar = {
    skin_asset: 'skin01',
    eyes_asset: 'eyes01',
    clothes_asset: 'clothes01',
};

export type AvatarCategory = 'skin' | 'hair' | 'eyes' | 'mouth' | 'clothes';