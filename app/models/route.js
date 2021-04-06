
export function Route(method, url, handlers) {

    if( Object.values(Methods).indexOf(method) === -1 ) {
        throw new Error(`Méthode de route "${method}" non autorisée.`);
    }

    return {
        method   : method,
        url      : url,
        handlers : handlers,
    }
}

export const Methods = {
    GET  : 'get',
    POST : 'post',
};