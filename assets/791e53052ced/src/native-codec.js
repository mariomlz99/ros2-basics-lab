import {unzlibSync,strFromU8} from 'fflate';
export function decodeNativeText(encoded){return strFromU8(unzlibSync(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))));}
