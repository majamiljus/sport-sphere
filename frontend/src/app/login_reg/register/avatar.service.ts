import {Injectable} from '@angular/core';
import {createAvatar} from '@dicebear/core';
import {personas} from '@dicebear/collection';
import {toPng} from '@dicebear/converter';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  async generate() {
    const avatar = createAvatar(personas,{seed: crypto.randomUUID(),size: 512,radius: 50});
    const png = toPng(avatar);
    const dataUri = await png.toDataUri();
    const buffer = await png.toArrayBuffer() as ArrayBuffer;
    const file = new File([buffer],'avatar.png',{type: 'image/png'});
    return {dataUri,file};
  }
}