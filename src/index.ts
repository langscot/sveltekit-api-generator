import type { PluginOption, ResolvedConfig } from "vite"
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import generateOpenApiSchema from "./openapi/index.js";
import express from "express";
import { generateRouteMap } from "./utils/index.js";
import { RouteMap } from "./types.js";
import generateApiClient from "./codegen/index.js";

type Config = {
    /**
     * The directory where the generated API client, relative to the root of the project.
     */
    apiClientOuputDirectory: string;
    /**
     * The name of the generated API client file.
     */
    apiClientFileName: string;
}

export default function apiCodegen(pluginConfig: Config = {
    apiClientOuputDirectory: 'src/lib',
    apiClientFileName: 'api.ts'
}) {
    let routes: RouteMap;
    let config: ResolvedConfig;

    async function run(root: string) {
        const outputDirectory = path.join(root, pluginConfig.apiClientOuputDirectory);

        if (!routes) routes = generateRouteMap(root);

        const apiClientContent = await generateApiClient(routes);

        fs.writeFileSync(path.join(outputDirectory, pluginConfig.apiClientFileName), apiClientContent);

        config.logger.info('Generated API client at ' + path.join(outputDirectory, pluginConfig.apiClientFileName));
    }

    return {
        name: 'vite-plugin-sveltekit-api',
        handleHotUpdate({ file, server }) {
            if (file.endsWith('+server.ts')) {
                routes = generateRouteMap(server.config.root);
                run(server.config.root);
            }
        },
        configResolved(_config) {
            config = _config;
            run(config.root);
        },
        async configureServer({ config, middlewares }) {
            routes = generateRouteMap(config.root);

            const app = express();

            app.get('/swagger-ui.json', async (req, res) => {
                res.json(await generateOpenApiSchema(config, routes));
            })

            app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup({}, {
                swaggerOptions: {
                    url: '/swagger-ui.json'
                },
                explorer: true
            }));

            middlewares.use(app);

            config.logger.info('Swagger UI available at /swagger-ui');
        },
    } as PluginOption;
}