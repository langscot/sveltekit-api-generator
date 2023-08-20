export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type RouteMap = {
    [key: string]: {
        [key in Method]?: Route;
    }
}

export type Route = {
    method: Method,
    type: string,
    returnType: string,
    jsDoc?: string,
    queryParameters?: string[]
    bodyType?: string,
    urls: string[],
    path: string
}
