
import empty from 'empty-folder';

export default function cleanup( directories ) {
    let targetDir = Array.isArray(directories) ? directories : [ directories ];
    for( let dir of targetDir ) {
        empty(dir, false, (o) => {});
    }
}