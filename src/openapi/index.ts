import path from 'path';
import { capitalize, generateRouteMap, getBodyTypeFromComments, getFilesOfName, getFirstSegmentBeforeParam, getOpenAPISchemaFromTSType, getQueryParameterUsageFromDeclaration, getReturnTypeFromDeclaration, getTextFromComment, getUrlsFromFileName } from "../utils/index.js"
import { Project, SyntaxKind } from 'ts-morph';
import type { Method, Route, RouteMap } from '../types.js';
import { ResolvedConfig } from 'vite';

export default async function generateOpenApiSchema(config: ResolvedConfig, routes: RouteMap) {
    const openapi = {
        openapi: '3.0.0',
        info: {
            title: 'SvelteKit API',
            version: '1.0.0',
        },
        paths: {} as Record<string, any>
    }

    // Get Route's grouped by URL
    const routesByUrl = Object.values(routes).reduce((routesByUrl, fileRoutes) => {
        Object.values(fileRoutes).forEach(route => {
            route.urls.forEach(url => {
                if (!routesByUrl[url]) routesByUrl[url] = [];
                routesByUrl[url].push(route);
            })
        })
        return routesByUrl;
    }, {} as Record<string, Route[]>)

    // Loop through each filename and generate the OpenAPI schema
    await Promise.all(Object.entries(routesByUrl).map(async ([url, routes]) => {
        openapi.paths[url] = {} as Record<string, any>;

        await Promise.all(routes.map(async route => {
            const method = route.method.toLowerCase();
            openapi.paths[url][method] = {
                tags: [capitalize(getFirstSegmentBeforeParam(url))],
                description: getTextFromComment(route.jsDoc ?? 'No description'),
                parameters: [
                    ...(route.queryParameters ?? []).map(param => ({
                        name: param,
                        in: 'query',
                        schema: {
                            type: 'string'
                        }
                    }))
                ],
                requestBody: route.bodyType ? {
                    required: true,
                    content: {
                        'application/json': {
                            schema: await getOpenAPISchemaFromTSType(route.bodyType)
                        }
                    }
                } : undefined,
                responses: {
                    // Only specify 200 response if endpoint uses json()
                    200: route.returnType ? {
                        content: {
                            'application/json': {
                                schema: await getOpenAPISchemaFromTSType(route.returnType)
                            }
                        }
                    } : undefined
                }
            };
        }));
    }));
    return openapi;
}